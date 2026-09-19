/**
 * server/translation-cache.js
 * -----------------------------------------------------------------------
 * Persistent, server-side translation cache so the same English string
 * is never sent to the translation engine twice, even across restarts
 * or different users' browsers.
 *
 * Stored as its own JSON file (data/translation-cache.json), next to the
 * existing data/db.json, using the same fs-based read/write pattern
 * already used in server.js. Kept separate from db.json on purpose: the
 * cache can grow to thousands of small entries as new games are added,
 * and that growth shouldn't touch users/sessions/reminders data.
 *
 * Cache key shape matches the one described in the project spec:
 *   "en:as:Remember the cards and find the matching pair." -> "...translation..."
 */

const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "data", "translation-cache.json");
const MAX_ENTRIES = 5000; // bounded so the file can't grow without limit

function readCache() {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({}, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch (err) {
    console.error("Translation cache file was unreadable, starting fresh:", err.message);
    return {};
  }
}

function writeCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function cacheKey(sourceLanguage, targetLanguage, text) {
  return `${sourceLanguage}:${targetLanguage}:${text}`;
}

/** Returns the cached translation string, or null if not cached. */
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
    // Simple FIFO eviction (insertion order) so the cache file stays bounded.
    keys.slice(0, keys.length - MAX_ENTRIES).forEach((k) => delete cache[k]);
  }
  writeCache(cache);
}

module.exports = { getCachedTranslation, setCachedTranslation, CACHE_FILE };
