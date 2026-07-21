const { Module } = require("../main");
const config = require("../config");

const isFromMe = config.MODE !== "public";

/**
 * FakePoll command — sends a WhatsApp poll with custom/fake vote counts.
 *
 * Usage:
 *   .fakepoll Question|Option 1|Option 2|Option 3
 *   .fakepoll Question|Option A:30|Option B:15|Option C:55   (with vote counts)
 *
 * Notes:
 * - Question and at least 2 options are required.
 * - Vote counts are optional. If omitted, random counts (1–50) are used.
 * - Votes are "fake" — they appear in the poll UI via pollResult proto message.
 * - Group use recommended (owner/admin level).
 */
Module(
  {
    pattern: "fakepoll ?(.*)",
    fromMe: true, // Owner-only by default for safety
    desc: "Create a fake WhatsApp poll with custom vote counts.",
    usage: ".fakepoll Question|Option1:votes|Option2:votes|...",
    use: "tools",
  },
  async (message, match) => {
    const input = (match[1] || "").trim();

    if (!input) {
      return await message.sendReply(
        `*📊 FakePoll — Custom Poll Creator*\n\n` +
        `*Usage:*\n` +
        `\`.fakepoll Question|Option 1|Option 2|Option 3\`\n\n` +
        `*With custom vote counts:*\n` +
        `\`.fakepoll Best OS?|Windows:25|MacOS:15|Linux:45|Android:20\`\n\n` +
        `_Vote counts after \`:' are optional. Random counts used if omitted._`
      );
    }

    const parts = input.split("|").map((p) => p.trim()).filter(Boolean);

    if (parts.length < 3) {
      return await message.sendReply(
        `_⚠️ Please provide a question and at least 2 options separated by \`|\`._\n` +
        `_Example: \`.fakepoll Who wins?|Team A|Team B\`_`
      );
    }

    const question = parts[0];
    const optionNames = [];
    const voteCounts = [];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes(":")) {
        const colonIdx = part.lastIndexOf(":");
        const optName = part.substring(0, colonIdx).trim();
        const voteStr = part.substring(colonIdx + 1).trim();
        const votes = parseInt(voteStr);
        optionNames.push(optName);
        voteCounts.push(isNaN(votes) || votes < 0 ? Math.floor(Math.random() * 50) + 1 : votes);
      } else {
        optionNames.push(part);
        voteCounts.push(Math.floor(Math.random() * 50) + 1);
      }
    }

    if (optionNames.length < 2) {
      return await message.sendReply(
        `_⚠️ Please provide at least 2 valid options._`
      );
    }

    // Format votes as [[optionName, count], ...]
    const formattedVotes = optionNames.map((name, i) => [name, voteCounts[i]]);

    try {
      // Send using Baileys pollResult proto message
      await message.client.sendMessage(message.jid, {
        pollResult: {
          name: question,
          votes: formattedVotes,
        },
      });
    } catch (err) {
      console.error("FakePoll error:", err.message);
      // Fallback: send as a formatted text poll if pollResult is unsupported
      const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
      let pollText = `📊 *${question}*\n\n`;
      optionNames.forEach((opt, i) => {
        const count = voteCounts[i];
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
        pollText += `${bar} *${pct}%* — ${opt} (${count} votes)\n`;
      });
      pollText += `\n_Total: ${totalVotes} votes_`;
      await message.sendReply(pollText);
    }
  }
);
