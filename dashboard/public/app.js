document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // State Management
  let allConfigs = {};
  let currentCategory = 'all';
  let searchQuery = '';
  let allCommands = [];

  // API Calls
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      
      document.getElementById('stat-uptime').textContent = data.uptime;
      document.getElementById('stat-platform').textContent = data.platform;
      
      // Update bot name in title/header dynamically if modified
      if (data.botName) {
        document.querySelector('.header-logo h1').innerHTML = `${data.botName}`;
      }

      // Populate sessions
      const container = document.getElementById('sessions-container');
      container.innerHTML = '';

      if (data.configuredSessions.length === 0) {
        container.innerHTML = '<p class="loading-placeholder">No WhatsApp sessions configured in config.env or environment variables.</p>';
      } else {
        data.configuredSessions.forEach(sessId => {
          const activeSess = data.activeBots.find(b => b.sessionId === sessId);
          const isConnected = activeSess ? activeSess.connected : false;
          const userStr = activeSess && activeSess.user ? ` (${activeSess.user})` : '';

          const box = document.createElement('div');
          box.className = 'session-box';
          box.innerHTML = `
            <div class="session-id">📁 ${sessId}</div>
            <div class="session-status ${isConnected ? 'connected' : 'disconnected'}">
              <span>${isConnected ? '● Connected' : '○ Disconnected'}</span>${userStr}
            </div>
          `;
          container.appendChild(box);
        });
      }
    } catch (err) {
      console.error(err);
      document.getElementById('stat-uptime').textContent = 'Error';
    }
  }

  async function fetchConfig() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Failed to fetch config variables');
      allConfigs = await res.json();
      renderConfigGrid();
    } catch (err) {
      showToast('Error loading configuration variables', 'error');
      document.getElementById('config-grid').innerHTML = `<p class="loading-placeholder" style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  }

  async function fetchPlugins() {
    try {
      const res = await fetch('/api/plugins');
      if (!res.ok) throw new Error('Failed to fetch plugins');
      allCommands = await res.json();
      
      document.getElementById('commands-count').textContent = `${allCommands.length} Commands`;
      renderPluginsTable();
    } catch (err) {
      showToast('Error loading plugins list', 'error');
    }
  }

  async function updateVariable(key, value) {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) throw new Error('Failed to update setting');
      const data = await res.json();
      
      // Update local state
      allConfigs[key].value = data.value;
      allConfigs[key].source = 'database'; // Since it got saved to DB
      
      // Re-render only that card if possible, or just refresh the source badge
      const card = document.querySelector(`[data-key="${key}"]`);
      if (card) {
        const badge = card.querySelector('.config-source-badge');
        badge.className = 'config-source-badge source-database';
        badge.textContent = 'database';
      }

      showToast(`Successfully saved ${key}!`, 'success');
      
      // If we modified bot name, let's trigger a status update to sync header
      if (key === 'BOT_NAME') {
        fetchStatus();
      }
    } catch (err) {
      showToast(`Failed to update ${key}: ${err.message}`, 'error');
    }
  }

  // Categorize variables for filtering
  function getCategory(key) {
    const k = key.toUpperCase();
    const identityKeys = ['SESSION', 'BOT_NAME', 'BOT_INFO', 'STICKER_DATA', 'STICKER_PACK', 'STICKER_AUTHOR', 'OWNER_NAME', 'OWNER_NUMBER', 'SUPPORT_GROUP', 'VERSION'];
    const featureKeys = ['READ_MESSAGES', 'READ_COMMAND', 'AUTO_READ_STATUS', 'ALWAYS_ONLINE', 'CMD_REACTION', 'AUTO_BIO', 'AUTO_TYPING', 'AUTO_RECORDING', 'AUTO_REACT', 'AUTO_STATUS_SEEN'];
    const securityKeys = ['PM_ANTISPAM', 'PMB_VAR', 'DIS_PM', 'ANTI_BOT', 'ANTI_DELETE', 'REJECT_CALLS', 'ANTILINK', 'ANTIBADWORD', 'ANTISPAM_COUNT', 'WARN', 'ALLOWED', 'NOT_ALLOWED', 'BLOCK_CHAT', 'ALLOWED_CALLS', 'BAD_WORDS'];
    const replyKeys = ['ALIVE', 'ALIVE_MSG', 'ALIVE_IMG', 'PMB', 'WELCOME_MSG', 'GOODBYE_MSG', 'AUTOMUTE_MSG', 'AUTOUNMUTE_MSG', 'CALL_REJECT_MESSAGE'];
    
    if (identityKeys.includes(k)) return 'identity';
    if (featureKeys.includes(k)) return 'features';
    if (securityKeys.includes(k)) return 'security';
    if (replyKeys.includes(k)) return 'messages';
    return 'advanced';
  }

  // Render Grid
  function renderConfigGrid() {
    const grid = document.getElementById('config-grid');
    grid.innerHTML = '';

    const filteredKeys = Object.keys(allConfigs).filter(key => {
      // Category filter
      if (currentCategory !== 'all' && getCategory(key) !== currentCategory) {
        return false;
      }
      // Search filter
      if (searchQuery && !key.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    }).sort();

    if (filteredKeys.length === 0) {
      grid.innerHTML = '<p class="loading-placeholder">No matching variables found.</p>';
      return;
    }

    filteredKeys.forEach(key => {
      const item = allConfigs[key];
      const card = document.createElement('div');
      card.className = 'config-card';
      card.setAttribute('data-key', key);

      // Header part
      const header = `
        <div class="config-header">
          <div class="config-title-group">
            <span class="config-title">${key}</span>
            <span class="config-source-badge source-${item.source}">${item.source}</span>
          </div>
        </div>
      `;

      // Input field or toggle switch
      let controlHtml = '';
      if (item.isBoolean) {
        const checked = (item.value === true || item.value === 'true' || item.value === 'on');
        controlHtml = `
          <div class="switch-wrapper">
            <span class="switch-label">${checked ? 'Enabled' : 'Disabled'}</span>
            <label class="switch">
              <input type="checkbox" class="config-checkbox" ${checked ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        `;
      } else {
        controlHtml = `
          <div class="config-input-wrapper">
            <input type="text" class="config-input" value="${escapeHtml(String(item.value || ''))}">
            <button class="save-config-btn" title="Save changes">💾</button>
          </div>
        `;
      }

      card.innerHTML = header + controlHtml;

      // Event listeners for saving
      if (item.isBoolean) {
        const checkbox = card.querySelector('.config-checkbox');
        const label = card.querySelector('.switch-label');
        checkbox.addEventListener('change', (e) => {
          const val = e.target.checked;
          label.textContent = val ? 'Enabled' : 'Disabled';
          updateVariable(key, val);
        });
      } else {
        const input = card.querySelector('.config-input');
        const btn = card.querySelector('.save-config-btn');
        
        btn.addEventListener('click', () => {
          updateVariable(key, input.value);
        });

        // Save on enter key press
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            updateVariable(key, input.value);
          }
        });
      }

      grid.appendChild(card);
    });
  }

  // Render commands table
  function renderPluginsTable() {
    const tbody = document.getElementById('plugins-tbody');
    tbody.innerHTML = '';

    const filterVal = document.getElementById('plugin-search-input').value.toLowerCase();
    
    const filteredCmds = allCommands.filter(cmd => {
      return cmd.pattern.toLowerCase().includes(filterVal) || cmd.desc.toLowerCase().includes(filterVal);
    });

    if (filteredCmds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No commands found.</td></tr>';
      return;
    }

    filteredCmds.forEach(cmd => {
      const tr = document.createElement('tr');
      
      const permClass = cmd.fromMe ? 'perm-owner' : 'perm-public';
      const permText = cmd.fromMe ? 'Owner Only' : 'Public';

      tr.innerHTML = `
        <td><monospace>${escapeHtml(cmd.pattern)}</monospace></td>
        <td>${escapeHtml(cmd.desc)}</td>
        <td><span style="opacity: 0.8; font-family: monospace;">${escapeHtml(cmd.usage)}</span></td>
        <td><span class="permission-badge ${permClass}">${permText}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Toast System
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✨' : '⚠️';
    toast.innerHTML = `
      <span class="toast-icon-${type}">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Search and Category inputs
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderConfigGrid();
  });

  const catBtns = document.querySelectorAll('.cat-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderConfigGrid();
    });
  });

  const pluginSearch = document.getElementById('plugin-search-input');
  pluginSearch.addEventListener('input', renderPluginsTable);

  // Restart Bot Action
  const restartBtn = document.getElementById('restart-btn');
  restartBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reboot the bot?')) return;
    
    try {
      showToast('Sending reboot command...', 'success');
      const res = await fetch('/api/restart', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to restart');
      
      restartBtn.disabled = true;
      restartBtn.textContent = 'Rebooting...';
      
      showToast('Bot process stopped. Reconnecting in 5 seconds...', 'success');
      
      // Poll server status after 5s until it comes back online
      setTimeout(() => {
        const interval = setInterval(async () => {
          try {
            const check = await fetch('/api/status');
            if (check.ok) {
              clearInterval(interval);
              showToast('Bot is back online!', 'success');
              restartBtn.disabled = false;
              restartBtn.innerHTML = '<span>Reboot Bot</span> <span class="btn-icon">ᯓ★</span>';
              fetchStatus();
              fetchConfig();
            }
          } catch(e) {}
        }, 2000);
      }, 5000);
    } catch(err) {
      showToast(`Error rebooting: ${err.message}`, 'error');
    }
  });

  // Utility to escape HTML strings
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initial loads
  fetchStatus();
  fetchConfig();
  fetchPlugins();

  // Status Polling every 10s
  setInterval(fetchStatus, 10000);
});
