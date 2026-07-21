/**
 * Image Upscaler Utility
 * Uses iloveimg.com public API to upscale images 2x or 4x via AI.
 * No API key required — scrapes taskId and Bearer token from the page.
 *
 * Ported from Guru322/GURU-Ai and adapted for CommonJS (OIEN bot).
 */

const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Fetches taskId and Bearer JWT token from iloveimg.com upscale page.
 * @returns {Promise<{taskId: string, token: string}>}
 */
async function getUpscaleTaskIdAndToken() {
  const url = "https://www.iloveimg.com/upscale-image";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok)
    throw new Error(`Failed to fetch upscale page: ${res.status}`);

  const html = await res.text();

  const taskIdMatch = html.match(
    /ilovepdfConfig\.taskId\s*=\s*['"]([^'"]+)['"]/
  );
  if (!taskIdMatch) throw new Error("taskId not found in iloveimg page");
  const taskId = taskIdMatch[1];

  // Token is embedded in a JSON config object on the page
  const tokenMatch = html.match(/"token"\s*:\s*['"]([^'"]+)['"]/);
  if (!tokenMatch) throw new Error("token not found in iloveimg page");
  const token = tokenMatch[1];

  return { taskId, token };
}

/**
 * Uploads an image buffer to iloveimg.com server.
 * @param {Buffer} imageBuffer - Image data
 * @param {string} extension - File extension (jpg/png/webp)
 * @param {string} taskId
 * @param {string} jwt - Bearer token
 * @returns {Promise<string>} server_filename
 */
async function uploadBufferToServer(imageBuffer, extension, taskId, jwt) {
  const tmpFilePath = path.join(os.tmpdir(), `iloveimg_${Date.now()}.${extension}`);
  await fs.promises.writeFile(tmpFilePath, imageBuffer);

  try {
    const stats = await fs.promises.stat(tmpFilePath);
    const fileStream = fs.createReadStream(tmpFilePath);
    const filename = path.basename(tmpFilePath);
    const contentType = extension === "png" ? "image/png" : "image/jpeg";

    const form = new FormData();
    form.append("name", filename);
    form.append("chunk", "0");
    form.append("chunks", "1");
    form.append("task", taskId);
    form.append("preview", "1");
    form.append("pdfinfo", "0");
    form.append("pdfforms", "0");
    form.append("pdfresetforms", "0");
    form.append("v", "web.0");
    form.append("file", fileStream, {
      filename,
      contentType,
      knownLength: stats.size,
    });

    const headers = {
      authorization: `Bearer ${jwt}`,
      accept: "application/json",
      Origin: "https://www.iloveimg.com",
      Referer: "https://www.iloveimg.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ...form.getHeaders(),
    };

    const uploadRes = await fetch("https://api1g.iloveimg.com/v1/upload", {
      method: "POST",
      headers,
      body: form,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Upload failed: ${uploadRes.status} - ${err}`);
    }

    const json = await uploadRes.json();
    if (!json.server_filename)
      throw new Error("server_filename not returned from upload API");
    return json.server_filename;
  } finally {
    fs.promises.unlink(tmpFilePath).catch(() => {});
  }
}

/**
 * Downloads an image from a URL and uploads it to iloveimg.
 * @param {string} imageUrl
 * @param {string} taskId
 * @param {string} jwt
 * @returns {Promise<string>} server_filename
 */
async function downloadAndUpload(imageUrl, taskId, jwt) {
  const res = await fetch(imageUrl);
  if (!res.ok)
    throw new Error(`Failed to download image from URL: ${res.status}`);

  const buffer = await res.buffer();
  const contentType = res.headers.get("content-type") || "";
  const extension = contentType.includes("png") ? "png" : "jpg";

  return uploadBufferToServer(buffer, extension, taskId, jwt);
}

/**
 * Main export: upscale an image by 2x or 4x.
 * Accepts either a Buffer (direct image data) or a URL string.
 *
 * @param {Buffer|string} input - Image buffer or URL
 * @param {number} scale - 2 or 4
 * @returns {Promise<Buffer>} - Upscaled image buffer
 */
async function upscaleImage(input, scale = 2) {
  const { taskId, token } = await getUpscaleTaskIdAndToken();

  let serverFilename;
  if (Buffer.isBuffer(input)) {
    // Determine extension from buffer magic bytes
    let extension = "jpg";
    if (input[0] === 0x89 && input[1] === 0x50) extension = "png"; // PNG magic
    serverFilename = await uploadBufferToServer(input, extension, taskId, token);
  } else if (typeof input === "string" && /^https?:\/\//i.test(input)) {
    serverFilename = await downloadAndUpload(input, taskId, token);
  } else {
    throw new Error("Input must be a Buffer or a valid HTTP URL string");
  }

  const form = new FormData();
  form.append("task", taskId);
  form.append("server_filename", serverFilename);
  form.append("scale", String(scale));

  const res = await fetch("https://api1g.iloveimg.com/v1/upscale", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
      Origin: "https://www.iloveimg.com",
      Referer: "https://www.iloveimg.com/",
    },
    body: form,
  });

  if (!res.ok) throw new Error(`Upscale processing failed: ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await res.json();
    throw new Error(`API returned JSON error: ${JSON.stringify(json)}`);
  }

  return res.buffer();
}

module.exports = { upscaleImage };
