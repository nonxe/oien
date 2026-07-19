# ‧₊˚ ☁️⋅♡ OIEN🪐 — Sweet Themed WhatsApp Bot ♡⋅☁️ ࣪ ִֶָ☾.
<p align="center">
  <b>⊹܀˙ ♰ OIEN🪐 WhatsApp Bot with Glassmorphism Localhost Dashboard ♰ ⊹܀˙</b>
</p>

---

## 🪐 Overview
**OIEN🪐** is a beautifully themed, high-performance, multi-device WhatsApp bot built on Baileys. It features a fully interactive, sweet-themed localhost web dashboard to monitor bot status, manage variables in real time, view command documentation, and trigger system reboots easily!

## 🦢 Features
- **🍬 Sweet Swan Theme** — Beautifully stylized bot replies and menus with `‧₊˚ ☁️⋅♡𓂃`, `🦢`, `🪐`, `ᯓ★` and more.
- **🌐 Web Dashboard** — A gorgeous glassmorphic web dashboard hosted at `http://localhost:3000` to edit all configuration parameters dynamically.
- **💾 SQLite DB Persistence** — Variables edited via the dashboard are automatically saved to `bot.db` and persist across restarts.
- **⚡ Lightweight & Fast** — Built directly on `@whiskeysockets/baileys` with minimal overhead.
- **📦 Large Feature Set** — Media downloaders (YouTube, Socials), conversion tools (Sticker, PDF), warning systems, group management, chatbot, and much more.

---

## 💻 Localhost Hosting Guide

Follow these steps to host **OIEN🪐** on your local machine:

### 1. Prerequisites
Before starting, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (Version 20 or higher)
- [Git](https://git-scm.com/)
- [FFmpeg](https://ffmpeg.org/) (Ensure it is added to your system's PATH)

### 2. Clone the Repository
Clone the repository using git:
```bash
git clone https://github.com/nonxe/oien.git
cd oien
```

### 3. Install Dependencies
Install all package dependencies locally:
```bash
npm install
```

### 4. Configure Your Bot
1. Copy the template configuration file:
   ```bash
   cp config.env.example config.env
   ```
2. Open `config.env` in a text editor.
3. Obtain your WhatsApp session ID using a session generator.
4. Set the `SESSION` variable in `config.env`:
   ```env
   SESSION=RGNK~your_session_string_here
   ```

### 5. Start the Bot
Run the start command:
```bash
npm start
```

Once initialized, you will see a console message indicating:
```text
🪐 OIEN🪐 v6.2.30 🪐
- Configured sessions: RGNK~your_session
- Database initialized
- Bot initialization complete.

🪐 OIEN🪐 Dashboard is running at http://localhost:3000
```

### 6. Manage via Web Dashboard
Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

From this glassmorphic panel, you can:
- **📊 Status**: Monitor uptime, platform, and connection status of WhatsApp accounts.
- **⚙️ Variables**: Toggle auto features (like auto-read, auto-typing, always online) and modify bot configurations (like BOT_NAME, ALIVE messages, bad words, welcome templates) without editing files or restarting manually.
- **📦 Commands**: View full documentation of all bot commands.
- **ᯓ★ Reboot**: Restart the bot process with a single click.

---

## ⚙️ Configuration Variables Reference
Here are some key variables you can configure via `config.env` or directly through the Web Dashboard:

| Variable | Default | Description |
|---|---|---|
| `SESSION` | `(required)` | Your WhatsApp session string (e.g. `RGNK~...`) |
| `BOT_NAME` | `OIEN🪐` | The display name of the bot |
| `MODE` | `private` | Bot availability: `public` (anyone can use) or `private` (only owner/sudo can use) |
| `HANDLERS` | `.,` | Command prefixes (e.g. starting commands with `.` or `,`) |
| `SUDO` | `""` | Phone numbers of users with owner permissions (comma-separated, without country code suffixes) |
| `READ_MESSAGES` | `false` | Automatically read all incoming messages |
| `READ_COMMAND` | `true` | Automatically read command messages |
| `AUTO_READ_STATUS` | `false` | Automatically view WhatsApp status updates |
| `ALWAYS_ONLINE` | `false` | Display your account as "always online" |
| `ANTI_DELETE` | `false` | Keep and notify deleted messages in chats |
| `PM_ANTISPAM` | `false` | Prevent spamming in Private Messages |

---

## 📂 File Structure
```text
oien/
├── dashboard/        # Dashboard frontend (HTML, CSS, JS) and server API
│   ├── server.js     # API endpoints and Express app
│   └── public/       # Client-side static assets (Sweet theme)
├── core/             # Bot core (Connection logic, session store, message parser)
├── plugins/          # Command modules and functionality
├── config.js         # Configuration loader & proxy
├── config.env        # Local configuration file (ignored in git)
├── index.js          # Main entry point
└── package.json      # Dependencies and scripts
```

---

## ⚠️ Legal Notice
Use this software at your own risk. This bot uses unofficial WhatsApp API methods and is not affiliated, authorized, maintained, sponsored, or endorsed by WhatsApp or any of its affiliates.
- WhatsApp is a registered trademark of WhatsApp Inc.
- This codebase is powered by the [Baileys Library](https://github.com/WhiskeySockets/Baileys).

---
<p align="center">
  <b>— ᨳଓ Developed for nonxe/oien >⩊<.ᐟ 🪐 ࣪ ִֶָ☾.࣪࿐</b>
</p>
