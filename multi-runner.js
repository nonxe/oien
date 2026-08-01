const fs = require("fs");
const { spawn } = require("child_process");

async function startBotRunner() {
  let sessionConfig = null;
  try {
    if (fs.existsSync("./sessions.json")) {
      const content = fs.readFileSync("./sessions.json", "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        sessionConfig = parsed[0] || null;
      } else {
        sessionConfig = parsed;
      }
    }
  } catch (e) {
    console.error("Error reading sessions.json:", e);
  }

  const sessionId = sessionConfig?.sessionId || process.env.SESSION || "RGNK~4IqF0mP6";
  const botName = sessionConfig?.botName || process.env.BOT_NAME || "OIEN BOT";
  const sudo = sessionConfig?.sudo || process.env.SUDO || "";
  const mode = sessionConfig?.mode || process.env.MODE || "public";

  // Write config.env for index.js
  const envContent = `SESSION=${sessionId}
BOT_NAME=${botName}
MODE=${mode}
SUDO=${sudo}
PORT=3000
LOG_LEVEL=silent
TZ=Asia/Kolkata
`;

  try {
    fs.writeFileSync("./config.env", envContent, "utf-8");
    console.log("Updated config.env with session ID successfully.");
  } catch (e) {
    console.error("Failed to write config.env:", e.message);
  }

  console.log("==========================================");
  console.log("Starting OIEN WhatsApp Bot Process");
  console.log("Bot Name:", botName);
  console.log("Session ID:", sessionId.slice(0, 14) + "...");
  console.log("Mode:", mode);
  console.log("==========================================");

  const env = {
    ...process.env,
    SESSION: sessionId,
    BOT_NAME: botName,
    MODE: mode,
    SUDO: sudo,
  };

  const child = spawn("node", ["index.js"], { env, stdio: "inherit" });
  await new Promise((resolve) => child.on("exit", resolve));
}

startBotRunner();
