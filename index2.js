import http from "http";
import { URL } from "url";

async function getMp3StreamTitle(streamingUrl) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(streamingUrl);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      port: parsedUrl.port || 80,
      headers: {
        "Icy-MetaData": 1,
        "User-Agent": "Mozilla/5.0",
      },
    };

    const req = http.get(options, (res) => {
      const icyMetaInt = parseInt(res.headers["icy-metaint"]);
      if (!icyMetaInt) return reject("No icy-metaint found");

      let audioData = Buffer.alloc(0);
      let metaDataRead = false;

      res.on("data", (chunk) => {
        audioData = Buffer.concat([audioData, chunk]);

        if (!metaDataRead && audioData.length >= icyMetaInt + 1) {
          const metadataLength = audioData[icyMetaInt] * 16;
          if (audioData.length >= icyMetaInt + 1 + metadataLength) {
            const metadata = audioData
              .slice(icyMetaInt + 1, icyMetaInt + 1 + metadataLength)
              .toString();
            const match = /StreamTitle='([^']*)'/.exec(metadata);
            const title = match ? match[1] : "Unknown";
            metaDataRead = true;
            res.destroy();
            resolve(title);
          }
        }
      });
    });

    req.on("error", reject);
  });
}

// Пример вызова
getMp3StreamTitle("https://anime.stream.laut.fm/anime")
  .then(console.log)
  .catch(console.error);
