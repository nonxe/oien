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
      // React with heart emoji to show active processing
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

      const axiosHeaders = {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        responseType: "arraybuffer",
        timeout: 20000,
      };

      // Download Male Image Buffer
      const maleRes = await axios.get(male, axiosHeaders);
      const maleBuffer = Buffer.from(maleRes.data, "binary");

      // Download Female Image Buffer
      const femaleRes = await axios.get(female, axiosHeaders);
      const femaleBuffer = Buffer.from(femaleRes.data, "binary");

      // Send Male Profile Picture
      await message.sendMessage(
        maleBuffer,
        "image",
        {
          caption: "🧑 *Male Profile Picture*",
          quoted: message.data
        }
      );

      // Send Female Profile Picture
      await message.sendMessage(
        femaleBuffer,
        "image",
        {
          caption: "👧 *Female Profile Picture*",
          quoted: message.data
        }
      );

      // React with success emoji
      try {
        await message.react("✅");
      } catch (_) {}

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
