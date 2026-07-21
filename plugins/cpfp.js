const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const isFromMe = config.MODE !== "public";

/**
 * Couple Profile Picture Plugin for OIEN bot.
 * API Endpoint: https://apis.davidcyril.name.ng/couplepp
 * 
 * Usage:
 *   .cpfp
 *   Returns matching profile pictures for couples (Male & Female).
 */
Module(
  {
    pattern: "cpfp ?(.*)",
    fromMe: isFromMe,
    desc: "Get random matching couple profile pictures.",
    usage: ".cpfp",
    use: "tools",
  },
  async (message, match) => {
    try {
      // React with heart/love emoji
      try {
        await message.react("❤️");
      } catch (_) {}

      const response = await axios.get("https://apis.davidcyril.name.ng/couplepp", { timeout: 25000 });

      if (!response.data || response.data.success !== true) {
        throw new Error("Invalid response or success flag is false");
      }

      const { male, female } = response.data;

      if (!male || !female) {
        throw new Error("Missing male or female image URL in response");
      }

      // Send Male Profile Picture
      await message.sendMessage(
        { url: male },
        "image",
        {
          caption: "🧑 *Male Profile Picture*",
          quoted: message.data
        }
      );

      // Send Female Profile Picture
      await message.sendMessage(
        { url: female },
        "image",
        {
          caption: "👧 *Female Profile Picture*",
          quoted: message.data
        }
      );

    } catch (error) {
      console.error("CPFP Command Error:", error.message);
      try {
        await message.react("❌");
      } catch (_) {}
      await message.sendReply(
        `❌ *Failed to fetch couple profile pictures!*\n_Error: ${error.message}_`
      );
    }
  }
);
