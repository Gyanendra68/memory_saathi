/**
 * server/translation.js
 * Robust translation wrapper with automatic fallback (Google Translate + MyMemory)
 */

const https = require("https");

const LANG_MAP = {
  en: "en",
  as: "as",
  mni: "mni-Mtei",
  kha: "kha",
  miz: "lus"
};

const MAX_TEXT_LENGTH = 2000;
const REQUEST_TIMEOUT_MS = 8000;

// Helper function to make HTTPS requests safely
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0 (MemorySaathi/1.0)" } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Status code ${res.statusCode}`));
            return;
          }
          resolve(data);
        });
      }
    );
    req.on("error", (err) => reject(err));
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error("Request timed out"));
    });
  });
}

async function callGoogleTranslate(text, sourceLang, targetLang) {
  // 1. Pehle Google Translate try karein
  try {
    const qs = new URLSearchParams({
      client: "gtx",
      sl: sourceLang,
      tl: targetLang,
      dt: "t",
      q: text
    });
    const url = `https://translate.googleapis.com/translate_a/single?${qs.toString()}`;
    const data = await fetchUrl(url);
    const parsed = JSON.parse(data);
    const translated = (parsed[0] || []).map((segment) => segment[0]).join("");
    if (translated && translated.trim()) return translated;
  } catch (err) {
    console.warn("Google Translate failed, switching to fallback API...", err.message);
  }

  // 2. Fallback: MyMemory Translation API (Vercel par Assamese ke liye best reliable backup)
  try {
    const myMemoryLangMap = { as: "as", en: "en", "mni-Mtei": "mni", kha: "kha", lus: "miz" };
    const sl = myMemoryLangMap[sourceLang] || sourceLang;
    const tl = myMemoryLangMap[targetLang] || targetLang;

    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${tl}`;
    const data = await fetchUrl(myMemoryUrl);
    const parsed = JSON.parse(data);
    if (parsed && parsed.responseData && parsed.responseData.translatedText) {
      return parsed.responseData.translatedText;
    }
  } catch (fallbackErr) {
    console.error("Fallback translation engine also failed:", fallbackErr.message);
  }

  throw new Error("All translation engines failed");
}

async function translateText(text, sourceLanguage, targetLanguage) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("text is required");
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
  }
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  const sl = LANG_MAP[sourceLanguage];
  const tl = LANG_MAP[targetLanguage];
  if (!sl) throw new Error(`Unsupported source language: ${sourceLanguage}`);
  if (!tl) throw new Error(`Unsupported target language: ${targetLanguage}`);

  return callGoogleTranslate(text, sl, tl);
}

module.exports = { translateText, LANG_MAP, MAX_TEXT_LENGTH };