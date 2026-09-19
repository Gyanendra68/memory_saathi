/**
 * server/translation-cache.js
 * Vercel-compatible translation cache (handles read-only file systems)
 */

const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "data", "translation-cache.json");
const MAX_ENTRIES = 5000;

// In-memory fallback for Vercel serverless environment
const memoryCache = {};
const isVercel = Boolean(process.env.VERCEL);

function readCache() {
  if (isVercel) return memoryCache;
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    if (!fs.existsSync(CACHE_FILE)) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch (err) {
    console.error("Translation cache file unreadable, using memory:", err.message);
    return memoryCache;
  }
}

function writeCache(cache) {
  if (isVercel) {
    Object.assign(memoryCache, cache);
    return;
  }
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error("Failed to write translation cache file:", err.message);
  }
}

function cacheKey(sourceLanguage, targetLanguage, text) {
  return `${sourceLanguage}:${targetLanguage}:${text}`;
}

function getCachedTranslation(sourceLanguage, targetLanguage, text) {
  const cache = readCache();
  const key = cacheKey(sourceLanguage, targetLanguage, text);
  return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : null;
}

function setCachedTranslation(sourceLanguage, targetLanguage, text, translatedText) {
  const cache = readCache();
  const key = cacheKey(sourceLanguage, targetLanguage, text);
  cache[key] = translatedText;

  const keys = Object.keys(cache);
  if (keys.length > MAX_ENTRIES) {
    keys.slice(0, keys.length - MAX_ENTRIES).forEach((k) => delete cache[k]);
  }
  writeCache(cache);
}

module.exports = { getCachedTranslation, setCachedTranslation, CACHE_FILE };