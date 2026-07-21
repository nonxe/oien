const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const isFromMe = config.MODE !== "public";

/**
 * Maiko AI Chatbot Plugin for OIEN bot.
 * API Endpoint: https://tdoqjbentujzffjzxndo.supabase.co/functions/v1/ai
 * 
 * Usage:
 *   .maiko <your question/message>
 *   Reply to any message with .maiko to ask about it.
 */
Module(
  {
    pattern: "maiko ?(.*)",
    fromMe: isFromMe,
    desc: "Chat with Maiko AI chatbot.",
    usage: ".maiko <your message>",
    use: "tools",
  },
  async (message, match) => {
    let prompt = (match[1] || "").trim();

    // If no prompt was provided, try to extract text from a replied message
    if (!prompt && message.reply_message && message.reply_message.text) {
      prompt = message.reply_message.text;
    }

    if (!prompt) {
      return await message.sendReply(
        `*Maiko ❄️ AI Chatbot*\n\n` +
        `*Usage:* \`.maiko <your message>\`\n` +
        `_Or reply to a message with \`.maiko\` to query it._\n\n` +
        `_Example: .maiko who is Maiko?_`
      );
    }

    try {
      // React with typing/thinking emoji
      await message.react("🧠");
    } catch (_) {}

    try {
      const response = await axios.post(
        "https://tdoqjbentujzffjzxndo.supabase.co/functions/v1/ai",
        { prompt: prompt },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 20000, // 20 seconds timeout
        }
      );

      if (response.data && response.data.reply) {
        const replyText = response.data.reply;
        await message.sendReply(`❄️ *Maiko:* ${replyText}`);
        
        try {
          await message.react("✅");
        } catch (_) {}
      } else {
        throw new Error("Invalid response format from Maiko API");
      }
    } catch (error) {
      console.error("Maiko API Error:", error.message);
      
      try {
        await message.react("❌");
      } catch (_) {}
      
      await message.sendReply(
        `❌ *Maiko AI Error!*\n_Unable to get response from the server._\n_Details: ${error.message}_`
      );
    }
  }
);
