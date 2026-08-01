const fs = require("fs");
const { spawn } = require("child_process");

async function runSession() {
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

  console.log(`==========================================`);
  console.log(`Starting OIEN WhatsApp Bot Session`);
  console.log(`Bot Name: ${botName}`);
  console.log(`Session ID: ${sessionId.slice(0, 14)}...`);
  console.log(`Mode: ${mode}`);
  console.log(`==========================================`);

  const env = {
    ...process.env,
    SESSION: sessionId,
    BOT_NAME: botName,
    MODE: mode,
    SUDO: sudo,
  };

  const child = spawn("npm", ["start"], { env, stdio: "inherit" });
  await new Promise((resolve) => child.on("exit", resolve));
}

runSession();
