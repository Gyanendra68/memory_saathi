/**
 * server/translation.js
 * -----------------------------------------------------------------------
 * Thin, isolated wrapper around a free machine-translation engine.
 *
 * translateText(text, sourceLanguage, targetLanguage) is the ONLY thing
 * the rest of the app depends on. If a different engine is ever needed
 * (e.g. a paid API key becomes available later), only this file changes.
 *
 * Engine used: Google Translate's public web endpoint
 * (translate.googleapis.com/translate_a/single). It requires no API key
 * and no billing account, which is why it was chosen for this SIH demo.
 * It is the same endpoint used by many open-source "free Google Translate"
 * libraries. Being an unofficial/undocumented endpoint, Google could
 * change or rate-limit it without notice -- see README "Limitations".
 *
 * Language support was verified (not assumed) against Google's published
 * supported-language list before choosing this engine:
 *   - Assamese (as)              -- added May 2022
 *   - Mizo (lus)                 -- added May 2022
 *   - Meiteilon / Manipuri (mni-Mtei) -- added May 2022
 *   - Khasi (kha)                -- added June 2024
 * All four, plus English, are confirmed supported.
 */

const https = require("https");

// MemorySaathi's internal language codes (used in localStorage, the
// settings dropdown and window.I18N) -> Google Translate's codes.
const LANG_MAP = {
  en: "en",
  as: "as",
  mni: "mni-Mtei",
  kha: "kha",
  miz: "lus"
};

const MAX_TEXT_LENGTH = 2000;
const REQUEST_TIMEOUT_MS = 8000;

function callGoogleTranslate(text, sourceLang, targetLang) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams({
      client: "gtx",
      sl: sourceLang,
      tl: targetLang,
      dt: "t",
      q: text
    });
    const url = `https://translate.googleapis.com/translate_a/single?${qs.toString()}`;

    const req = https.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0 (MemorySaathi/1.0)" } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Translation engine responded with status ${res.statusCode}`));
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const translated = (parsed[0] || []).map((segment) => segment[0]).join("");
            resolve(translated);
          } catch (err) {
            reject(new Error("Could not parse translation engine response"));
          }
        });
      }
    );
    req.on("error", (err) => reject(err));
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error("Translation engine request timed out"));
    });
  });
}

/**
 * Translate `text` from `sourceLanguage` to `targetLanguage`, both given
 * as MemorySaathi internal codes ("en", "as", "mni", "kha", "miz").
 * Throws on failure -- callers are expected to catch and fall back to the
 * original text (see server.js POST /api/translate).
 */
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
