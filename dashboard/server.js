const express = require('express');
const path = require('path');
const config = require('../config');
const { BotVariable } = require('../core/database');
const { commands } = require('../main');

let botManagerInstance = null;

const router = express.Router();

// Helper to format uptime
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? `${d}d ` : "";
  const hDisplay = h > 0 ? `${h}h ` : "";
  const mDisplay = m > 0 ? `${m}m ` : "";
  const sDisplay = `${s}s`;
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

// Get all config variables
router.get('/config', async (req, res) => {
  try {
    const allConfig = config.toJSON();
    const responseData = {};

    const booleanKeys = [
      ...(config.settingsMenu ? config.settingsMenu.map((item) => item.env_var) : []),
      "MANGLISH_CHATBOT",
      "ALWAYS_ONLINE",
      "READ_MESSAGES",
      "READ_COMMAND",
      "AUTO_READ_STATUS",
      "ADMIN_ACCESS",
      "MULTI_HANDLERS",
      "REJECT_CALLS",
      "PMB_VAR",
      "DIS_PM",
      "DISABLE_START_MESSAGE",
      "ANTI_DELETE",
      "CMD_REACTION"
    ];

    for (const [key, value] of Object.entries(allConfig)) {
      // Exclude internal keys
      if (['logger', 'sequelize', 'settingsMenu', 'MAX_RECONNECT_ATTEMPTS', 'VERSION', 'PLATFORM', 'isHeroku', 'isKoyeb', 'isVPS', 'isRailway', 'ACR_A', 'ACR_S', 'IMGBB_KEY', 'SESSION'].includes(key)) {
        continue;
      }
      
      const isBool = booleanKeys.includes(key) || typeof value === 'boolean' || ['true', 'false'].includes(String(value).toLowerCase());
      
      responseData[key] = {
        value: value,
        source: config.getSource(key),
        isBoolean: isBool
      };
    }

    // Explicitly add SESSION raw string
    let rawSession = '';
    const dbSessionVar = await BotVariable.findOne({ where: { key: 'SESSION' } });
    if (dbSessionVar) {
      rawSession = dbSessionVar.value;
    } else {
      rawSession = process.env.SESSION || process.env.SESSION_ID || '';
    }
    responseData['SESSION'] = {
      value: rawSession,
      source: dbSessionVar ? 'database' : (process.env.SESSION || process.env.SESSION_ID ? 'environment' : 'config'),
      isBoolean: false
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a config variable
router.post('/config', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const booleanKeys = [
      ...(config.settingsMenu ? config.settingsMenu.map((item) => item.env_var) : []),
      "MANGLISH_CHATBOT",
      "ALWAYS_ONLINE",
      "READ_MESSAGES",
      "READ_COMMAND",
      "AUTO_READ_STATUS",
      "ADMIN_ACCESS",
      "MULTI_HANDLERS",
      "REJECT_CALLS",
      "PMB_VAR",
      "DIS_PM",
      "DISABLE_START_MESSAGE",
      "ANTI_DELETE",
      "CMD_REACTION"
    ];

    let finalValue = value;
    if (booleanKeys.includes(key)) {
      finalValue = value === true || value === 'true' || value === 'on';
    }

    // Update in-memory config proxy
    config[key] = finalValue;

    // Save to database
    await BotVariable.upsert({
      key: key,
      value: String(value)
    });

    if (key === 'SESSION' && botManagerInstance) {
      const val = String(value);
      const newSessions = val.split(",").map((s) => s.includes("~") ? s.split("~")[1].trim() : s.trim()).filter(Boolean);
      
      // 1. Disconnect removed sessions
      for (const [sessionId, bot] of botManagerInstance.bots.entries()) {
        if (!newSessions.includes(sessionId)) {
          console.log(`[Dashboard] Dynamically disconnecting removed session: ${sessionId}`);
          try {
            bot.disconnect(false);
            botManagerInstance.bots.delete(sessionId);
          } catch (err) {
            console.error(`[Dashboard] Error disconnecting session ${sessionId}:`, err);
          }
        }
      }

      // 2. Initialize newly added sessions
      const { WhatsAppBot } = require('../core/bot');
      for (const sessionId of newSessions) {
        if (!botManagerInstance.bots.has(sessionId)) {
          console.log(`[Dashboard] Dynamically initializing added session: ${sessionId}`);
          (async () => {
            try {
              const bot = new WhatsAppBot(sessionId);
              await bot.initialize();
              if (bot.sock) {
                botManagerInstance.bots.set(sessionId, bot);
                console.log(`[Dashboard] Successfully initialized bot for session: ${sessionId}`);
              }
            } catch (err) {
              console.error(`[Dashboard] Failed to dynamically initialize session ${sessionId}:`, err);
            }
          })();
        }
      }
    }

    res.json({ success: true, key, value: finalValue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bot status
router.get('/status', (req, res) => {
  try {
    const activeBots = [];
    if (botManagerInstance && botManagerInstance.bots) {
      for (const [sessionId, bot] of botManagerInstance.bots.entries()) {
        activeBots.push({
          sessionId,
          connected: bot.sock && bot.sock.user ? true : false,
          user: bot.sock && bot.sock.user ? bot.sock.user.name || bot.sock.user.id.split(':')[0] : null
        });
      }
    }

    res.json({
      botName: config.BOT_NAME || "OIEN🪐",
      uptime: formatUptime(process.uptime()),
      platform: config.PLATFORM || process.platform,
      configuredSessions: config.SESSION || [],
      activeBots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get loaded plugins and commands
router.get('/plugins', (req, res) => {
  try {
    const list = commands.map(cmd => ({
      pattern: cmd.pattern ? cmd.pattern.toString().replace(/^\^\(\?:([^)]+)\)\??/, '$1') : 'Event Handler',
      desc: cmd.desc || 'No description provided.',
      usage: cmd.usage || '',
      fromMe: cmd.fromMe
    }));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restart the bot
router.post('/restart', (req, res) => {
  res.json({ success: true, message: 'Bot process is exiting. If running via PM2/Nodemon, it will restart automatically.' });
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

function startDashboard(botManager) {
  botManagerInstance = botManager;
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // API Routes
  app.use('/api', router);

  // Serve static files
  app.use(express.static(path.join(__dirname, 'public')));

  // Fallback to index.html for SPA behavior
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`\n🪐 OIEN🪐 Dashboard is running at http://localhost:${PORT}`);
  });
}

module.exports = { startDashboard };
