const { Module } = require("../main");
const { upscaleImage } = require("./utils/upscale");
const config = require("../config");

const isFromMe = config.MODE !== "public";

/**
 * Helper: extract image buffer from a quoted reply message.
 * Supports image and sticker messages.
 * Uses OIEN's reply_message boolean flags (.image, .sticker) and download("buffer") API.
 */
async function getImageBufferFromReply(message) {
  const reply = message.reply_message;
  if (!reply) return null;

  // Only process images or stickers
  if (!reply.image && !reply.sticker) return null;

  try {
    const buffer = await reply.download("buffer");
    return Buffer.isBuffer(buffer) ? buffer : null;
  } catch (e) {
    console.error("Upscale: Failed to download reply media:", e.message);
    return null;
  }
}

Module(
  {
    pattern: "upscale ?(.*)",
    fromMe: isFromMe,
    desc: "AI image upscaler — enlarge an image 2x or 4x using AI. Reply to an image/sticker or pass a URL.",
    usage: ".upscale [2|4] or reply to image",
    use: "tools",
  },
  async (message, match) => {
    const arg = (match[1] || "").trim();

    // Parse scale factor from argument (default 2)
    let scale = 2;
    let urlInput = null;

    const parts = arg.split(/\s+/);
    for (const part of parts) {
      if (part === "2" || part === "4") {
        scale = parseInt(part);
      } else if (/^https?:\/\//i.test(part)) {
        urlInput = part;
      }
    }

    // Validate scale
    if (scale !== 2 && scale !== 4) scale = 2;

    let imageBuffer = null;

    // Priority 1: replied image/sticker
    if (message.reply_message) {
      imageBuffer = await getImageBufferFromReply(message);
    }

    // Priority 2: URL argument
    if (!imageBuffer && urlInput) {
      // Will be passed directly as URL to upscaleImage
      imageBuffer = urlInput; // string URL accepted by upscaleImage
    }

    if (!imageBuffer) {
      return await message.sendReply(
        `*🖼️ Upscale — AI Image Enhancer*\n\n` +
        `Reply to an image or sticker, or provide a URL:\n` +
        `\`\`.upscale\`\` — 2x upscale (reply to image)\n` +
        `\`\`.upscale 4\`\` — 4x upscale (reply to image)\n` +
        `\`\`.upscale https://...\`\` — URL upscale\n\n` +
        `_Powered by iloveimg.com AI_`
      );
    }

    const processingMsg = await message.sendReply(
      `_⏳ Upscaling image ${scale}x... Please wait, this may take 10–30 seconds._`
    );

    try {
      const upscaled = await upscaleImage(imageBuffer, scale);

      await message.sendMessage(upscaled, "image", {
        caption: `✅ *Image Upscaled ${scale}x!*\n_Powered by iloveimg.com AI_`,
        quoted: message.data,
      });

      // Try to delete the "processing" message
      try {
        await message.edit("✅ Done!", message.jid, processingMsg.key);
      } catch (_) {}
    } catch (err) {
      console.error("Upscale command error:", err.message);
      await message.sendReply(
        `❌ *Upscale failed!*\n_Error: ${err.message}_\n\n_Please try again or use a different image._`
      );
    }
  }
);

Module(
  {
    pattern: "hdr ?(.*)",
    fromMe: isFromMe,
    desc: "AI image enhancer (alias for upscale). Reply to an image/sticker.",
    usage: ".hdr [2|4] or reply to image",
    use: "tools",
    excludeFromCommands: true, // shows only in tools section, not duplicated in list
  },
  async (message, match) => {
    // Redirect to upscale logic by triggering module directly
    const arg = (match[1] || "").trim();
    let scale = 2;
    let urlInput = null;

    const parts = arg.split(/\s+/);
    for (const part of parts) {
      if (part === "2" || part === "4") scale = parseInt(part);
      else if (/^https?:\/\//i.test(part)) urlInput = part;
    }
    if (scale !== 2 && scale !== 4) scale = 2;

    let imageBuffer = null;
    if (message.reply_message) {
      imageBuffer = await getImageBufferFromReply(message);
    }
    if (!imageBuffer && urlInput) imageBuffer = urlInput;

    if (!imageBuffer) {
      return await message.sendReply(
        `_Reply to an image/sticker to enhance it, or provide a URL._\n_Example: \`.hdr 4\` (reply to image for 4x)_`
      );
    }

    const processingMsg = await message.sendReply(
      `_⏳ Enhancing image ${scale}x... Please wait._`
    );

    try {
      const upscaled = await upscaleImage(imageBuffer, scale);
      await message.sendMessage(upscaled, "image", {
        caption: `✨ *Image Enhanced ${scale}x!*\n_Powered by iloveimg.com AI_`,
        quoted: message.data,
      });
      try {
        await message.edit("✅ Done!", message.jid, processingMsg.key);
      } catch (_) {}
    } catch (err) {
      console.error("HDR command error:", err.message);
      await message.sendReply(`❌ Enhancement failed: _${err.message}_`);
    }
  }
);
