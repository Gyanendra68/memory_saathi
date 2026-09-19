/* ==========================================================================
   MemorySaathi i18n + automatic translation layer
   ==========================================================================
   Design goals (see README "Adding a new game" section for the full guide):

   1. Existing hand-written translations (below, in window.I18N) are NEVER
      overwritten and are always used first -> zero behaviour change for
      every t("key") call that already exists in the app today.

   2. For any NEW key that is not in the static dictionary, t(key, english)
      automatically fetches a machine translation from the backend
      (POST /api/translate), caches it (localStorage + server-side), and
      patches it into the page once it arrives. Until it arrives, the
      English fallback text is shown -- the UI never blocks or breaks.

   3. Everything is wrapped in try/catch. If translation is unavailable
      (offline, backend down, language unsupported) the English fallback
      simply stays on screen.
   ========================================================================== */

window.I18N = {
en:{welcome:"Welcome to MemorySaathi",games:"Cognitive Games",reminders:"Reminders",dashboard:"Caregiver Dashboard",settings:"Settings",play:"Play",back:"Back",difficulty:"Difficulty",offline:"Offline mode",online:"Online",start:"Start Game",submit:"Submit",score:"Score",accuracy:"Accuracy",sessions:"Sessions"},
as:{welcome:"MemorySaathi লৈ স্বাগতম",games:"জ্ঞানীয় খেল",reminders:"স্মৰণিকা",dashboard:"Caregiver Dashboard",settings:"ছেটিংছ",play:"খেলক",back:"পিছলৈ",difficulty:"কঠিনতা",offline:"অফলাইন মোড",online:"অনলাইন",start:"খেল আৰম্ভ কৰক",submit:"জমা দিয়ক",score:"স্ক'ৰ",accuracy:"সঠিকতা",sessions:"অধিবেশন"},
mni:{welcome:"MemorySaathi-gi swagat",games:"Cognitive Games",reminders:"Reminders",dashboard:"Caregiver Dashboard",settings:"Settings",play:"Play",back:"Back",difficulty:"Difficulty",offline:"Offline mode",online:"Online",start:"Start Game",submit:"Submit",score:"Score",accuracy:"Accuracy",sessions:"Sessions"},
kha:{welcome:"Pdiang sngewbha sha MemorySaathi",games:"Ki jingïalehkai",reminders:"Ki jingkynmaw",dashboard:"Caregiver Dashboard",settings:"Settings",play:"Play",back:"Back",difficulty:"Difficulty",offline:"Offline mode",online:"Online",start:"Start Game",submit:"Submit",score:"Score",accuracy:"Accuracy",sessions:"Sessions"},
miz:{welcome:"MemorySaathi-ah lo lutuk",games:"Cognitive Games",reminders:"Reminders",dashboard:"Caregiver Dashboard",settings:"Settings",play:"Play",back:"Back",difficulty:"Difficulty",offline:"Offline mode",online:"Online",start:"Start Game",submit:"Submit",score:"Score",accuracy:"Accuracy",sessions:"Sessions"}
};

(function () {
  "use strict";

  // Internal language codes used across MemorySaathi (localStorage "lang",
  // the <select id="lang"> in Settings, window.I18N above) mapped 1:1 to
  // the backend / translation-engine codes. Keep this list in sync with
  // server/translation.js's LANG_MAP.
  var SUPPORTED_LANGS = ["en", "as", "mni", "kha", "miz"];

  var CACHE_KEY = "memorysaathi_translation_cache";
  var MAX_CACHE_ENTRIES = 400;

  function currentLang() {
    try { return localStorage.getItem("lang") || "en"; }
    catch (e) { return "en"; }
  }

  function loadCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveCache(cache) {
    try {
      var keys = Object.keys(cache);
      if (keys.length > MAX_CACHE_ENTRIES) {
        // Cheap FIFO pruning so the cache never grows without bound.
        keys.slice(0, keys.length - MAX_CACHE_ENTRIES).forEach(function (k) { delete cache[k]; });
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) { /* storage full/unavailable: cache just won't persist */ }
  }

  function cacheKey(lang, text) { return lang + ":" + text; }

  function getCached(lang, text) {
    var cache = loadCache();
    var k = cacheKey(lang, text);
    return Object.prototype.hasOwnProperty.call(cache, k) ? cache[k] : null;
  }

  function setCached(lang, text, translated) {
    var cache = loadCache();
    cache[cacheKey(lang, text)] = translated;
    saveCache(cache);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // --- Dynamic-text placeholder protection --------------------------------
  // "Your score is {score}" must survive a round trip through the
  // translation engine with {score} intact, and variables are only
  // substituted in AFTER translation.
  function protect(text) {
    var tokens = [];
    var protectedText = String(text).replace(/\{([^{}]+)\}/g, function (m, name) {
      var idx = tokens.length;
      tokens.push(name);
      return "%%" + idx + "%%";
    });
    return { protectedText: protectedText, tokens: tokens };
  }

  function restore(text, tokens) {
    return tokens.reduce(function (acc, name, idx) {
      return acc.split("%%" + idx + "%%").join("{" + name + "}");
    }, text);
  }

  function applyVars(text, vars) {
    if (!vars) return text;
    return Object.keys(vars).reduce(function (acc, name) {
      return acc.split("{" + name + "}").join(vars[name]);
    }, text);
  }

  // --- Backend call, with request de-duplication ---------------------------
  var pending = {};

  function requestTranslation(sourceText, targetLang) {
    var key = targetLang + ":" + sourceText;
    if (pending[key]) return pending[key];

    var protectedForm = protect(sourceText);

    pending[key] = fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: protectedForm.protectedText,
        sourceLanguage: "en",
        targetLanguage: targetLang
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Translation request failed: " + r.status);
        return r.json();
      })
      .then(function (data) {
        var translated = restore(data.translatedText || sourceText, protectedForm.tokens);
        setCached(targetLang, sourceText, translated);
        return translated;
      })
      .catch(function (err) {
        console.error("MemorySaathi translation error:", err && err.message);
        return sourceText; // Fall back to English rather than break the page.
      })
      .finally(function () { delete pending[key]; });

    return pending[key];
  }

  var uid = 0;
  function nextId() { uid += 1; return "i18n_auto_" + uid; }

  function patchWhenReady(id, sourceText, targetLang, vars) {
    requestTranslation(sourceText, targetLang).then(function (translated) {
      // Only touch the DOM if the user hasn't switched language meanwhile.
      if (currentLang() !== targetLang) return;
      var nodes = document.querySelectorAll('[data-i18n-id="' + id + '"]');
      nodes.forEach(function (el) { el.textContent = applyVars(translated, vars); });
    });
  }

  /**
   * t(key, fallbackText, vars?)
   *
   * - key: dictionary key, e.g. "games.sequence.instructions"
   * - fallbackText: the English source text (required for any key that is
   *   not already in window.I18N, i.e. every new game's strings)
   * - vars: optional {name: value} map substituted into "{name}" tokens
   *   AFTER translation, so dynamic values are never sent to the
   *   translation engine.
   *
   * Returns an HTML string safe to interpolate into a template literal.
   */
  window.t = function (key, fallbackText, vars) {
    var lang = currentLang();
    var dict = window.I18N[lang] || window.I18N.en;

    // 1) Existing, hand-authored translation -> unchanged, synchronous.
    if (dict && Object.prototype.hasOwnProperty.call(dict, key)) {
      return applyVars(dict[key], vars);
    }

    var englishDict = window.I18N.en || {};
    var sourceText = fallbackText || (Object.prototype.hasOwnProperty.call(englishDict, key) ? englishDict[key] : key);

    // 2) English selected -> nothing to translate.
    if (lang === "en" || SUPPORTED_LANGS.indexOf(lang) === -1) {
      return applyVars(sourceText, vars);
    }

    // 3) Already-cached machine translation.
    var cached = getCached(lang, sourceText);
    if (cached !== null) {
      return applyVars(cached, vars);
    }

    // 4) Not cached yet: show English now, fetch + cache + patch in place.
    var id = nextId();
    patchWhenReady(id, sourceText, lang, vars);
    return '<span data-i18n-id="' + id + '">' + escapeHtml(applyVars(sourceText, vars)) + "</span>";
  };

  /**
   * tAttr(key, fallbackText, vars?)
   * Same lookup order as t(), but returns a plain string (no HTML wrapper)
   * for use inside HTML attributes (placeholder=, aria-label=, title=...),
   * where a <span> can't be injected. A pending translation still warms
   * the cache in the background for next time; the attribute itself just
   * shows the best value available right now.
   */
  window.tAttr = function (key, fallbackText, vars) {
    var lang = currentLang();
    var dict = window.I18N[lang] || window.I18N.en;
    if (dict && Object.prototype.hasOwnProperty.call(dict, key)) {
      return applyVars(dict[key], vars);
    }
    var englishDict = window.I18N.en || {};
    var sourceText = fallbackText || (Object.prototype.hasOwnProperty.call(englishDict, key) ? englishDict[key] : key);
    if (lang === "en" || SUPPORTED_LANGS.indexOf(lang) === -1) {
      return applyVars(sourceText, vars);
    }
    var cached = getCached(lang, sourceText);
    if (cached !== null) return applyVars(cached, vars);
    requestTranslation(sourceText, lang); // warm the cache for next render
    return applyVars(sourceText, vars);
  };
})();
