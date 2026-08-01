const fs = require("fs");
const { spawn } = require("child_process");

async function runAllSessions() {
  let sessions = [];
  try {
    if (fs.existsSync("./sessions.json")) {
      const content = fs.readFileSync("./sessions.json", "utf-8");
      sessions = JSON.parse(content);
    }
  } catch (e) {
    console.error("Error reading sessions.json:", e);
  }

  if (!Array.isArray(sessions) || sessions.length === 0) {
    const defaultSession = process.env.SESSION || "RGNK~4IqF0mP6";
    sessions = [
      {
        id: "default",
        sessionId: defaultSession,
        botName: process.env.BOT_NAME || "OIEN BOT",
        sudo: process.env.SUDO || "",
        mode: process.env.MODE || "public",
        status: "active",
      },
    ];
  }

  const activeSessions = sessions.filter((s) => s.status !== "inactive" && s.sessionId);
  console.log(`Starting ${activeSessions.length} WhatsApp Bot Sessions...`);

  if (activeSessions.length === 0) {
    console.log("No active sessions found in sessions.json.");
    return;
  }

  const processes = [];
  for (const s of activeSessions) {
    console.log(`Starting bot session: ${s.botName || s.id} [${s.sessionId.slice(0, 12)}...]`);
    const env = {
      ...process.env,
      SESSION: s.sessionId,
      BOT_NAME: s.botName || "OIEN BOT",
      MODE: s.mode || "public",
      SUDO: s.sudo || process.env.SUDO || "",
    };

    const child = spawn("npm", ["start"], { env, stdio: "inherit" });
    processes.push(child);
  }

  await Promise.all(processes.map((p) => new Promise((resolve) => p.on("exit", resolve))));
}

runAllSessions();
