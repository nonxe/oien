const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");
const isPrivateMode = config.MODE !== "public";

const lyrics = `[Verse 1]
Bekarov tizrach hashemesh
Neda yamim yafim me'eleh
Ha-lev nilcham be-deagot
Kulam yachzeru habayta
Nehakeh lahem lemata
Halevai neda besorot tovot 🇮🇱

[Pre-Chorus]
Ki am hanetzach le'olam lo mefached
Afilu kshe kashe lir'ot
Kulam beyachad, af echad po lo boded
She-yisrefu ha-milchamot 🇮🇱

[Chorus]
Am Yisrael chai 🇮🇱
Im lo nishkach tamid lihiyot me'uchadim
Am Yisrael chai 🇮🇱
Ba'aliyot, ba'yeridot, gam basha'ot ha'chi kashot
Ha-Kadosh Baruch Hu shomer aleinu
Az mi yachol aleinu? 🇮🇱
Ki ein lanu od medina
Ta'aseh shalom beineinu
Shmor al yeladeinu
Ki lo avda ha-emunah 🇮🇱
Oh-oh-oh-oh-oh-oh-oh
Oh-oh-oh-oh-oh-oh-oh
Am Yisrael, Am Yisrael chai 🇮🇱
Oh-oh-oh-oh-oh-oh-oh
Oh-oh-oh-oh-oh-oh-oh
Am Yisrael chai 🇮🇱



[Verse 2]
Ho artzi nachalatenu
Lo tipol ka'et ruchenu
Misaviv barzel shel charavot
Ve-yonah tifros knafayim
Ha-tikvah bat shnot alpayim
Od netze lashir ba'rechovot 🇮🇱

[Pre-Chorus]
Ki am hanetzach le'olam lo mefached
Afilu kshe kashe lir'ot
Kulam beyachad, af echad po lo boded
She-yisrefu ha-milchamot 🇮🇱

[Chorus]
Am Yisrael chai 🇮🇱
Im lo nishkach tamid lihiyot me'uchadim
Am Yisrael chai 🇮🇱
Ba'aliyot, ba'yeridot, gam basha'ot ha'chi kashot
Ha-Kadosh Baruch Hu shomer aleinu
Az mi yachol aleinu? 🇮🇱
Ki ein lanu od medina
Ta'aseh shalom beineinu
Shmor al yeladeinu
Ki lo avda ha-emunah 🇮🇱
Ha-Kadosh Baruch Hu shomer aleinu
Az mi yachol aleinu? 🇮🇱
Ki ein lanu od medina
Ta'aseh shalom beineinu
Shmor al yeladeinu
Ki lo avda ha-emunah 🇮🇱
Oh-oh-oh-oh-oh-oh-oh
Oh-oh-oh-oh-oh-oh-oh
Am Yisrael, Am Yisrael chai 🇮🇱
Oh-oh-oh-oh-oh-oh-oh
Oh-oh-oh-oh-oh-oh-oh
Am Yisrael chai 🇮🇱`;

Module(
  {
    pattern: "loveisrael",
    fromMe: isPrivateMode,
    desc: "Sends a video about Israel with lyrics.",
    use: "utility",
  },
  async (message, match) => {
    try {
      await message.sendReply("_Downloading video (~95MB). Please wait, this may take a moment..._");

      console.log("[LoveIsrael] Starting download from catbox...");
      const response = await axios({
        method: "get",
        url: "https://files.catbox.moe/s6mzcv.mp4",
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        timeout: 120000 // 2 minutes timeout for large file
      });

      console.log(`[LoveIsrael] Download complete. Size: ${(response.data.length / 1024 / 1024).toFixed(2)} MB`);
      const videoBuffer = Buffer.from(response.data);

      await message.sendReply("_Uploading video to WhatsApp..._");
      
      await message.sendMessage(
        videoBuffer,
        "video",
        {
          caption: lyrics,
          quoted: message.data,
        }
      );
      
      console.log("[LoveIsrael] Video sent successfully.");
    } catch (error) {
      console.error("Error in loveisrael command:", error);
      await message.sendReply(`_Failed to send the Israel video: ${error.message}_`);
    }
  }
);
