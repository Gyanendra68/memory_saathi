# MemorySaathi — SIH 2026 Prototype

Node.js + Express + Vanilla JS prototype for:
**AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER)**

## Run in VS Code
1. Install Node.js LTS.
2. Extract this ZIP.
3. Open the folder in VS Code.
4. Open Terminal.
5. Run:
   `npm install`
6. Run:
   `npm start`
7. Open `http://localhost:3000`

### Demo
- Elderly: select **Elderly User**, PIN `demo123`
- Caregiver: select **Caregiver**, PIN `demo123`

## Included
- Connect Cards memory game
- Face Recognizing demo game using fictional/demo identities
- Connect the Sequence
- Memory Association
- Per-game performance logging
- Offline session queue + automatic sync when connection returns
- Reminders
- Caregiver dashboard
- English + Assamese + Manipuri + Khasi + Mizo language architecture
- Voice-ready architecture
- Large controls / high contrast / no stressful countdown
- Local JSON persistence in `data/db.json` for easy zero-config demo

## Adaptive difficulty
This prototype records accuracy, score, difficulty and session history. The UI is structured so a hybrid rule/ML personalizer can recommend the next level. For a hackathon production build, the next step is to add a small explainable model over these user-generated telemetry features. The system must not be presented as a dementia diagnostic or treatment tool.

## Privacy
Demo data is stored locally. Do not put real patient-identifying information into this prototype without implementing appropriate authentication, encryption, consent, access control and applicable legal/privacy requirements.

## Important
This is a hackathon prototype, not a medical device or clinical assessment.
## Login fix
The local database directory is now created automatically on first run, so the demo login works even when the ZIP is extracted into a fresh folder.

Demo credentials:
- Elderly User → `demo123`
- Caregiver → `demo123`

## Automatic multilingual translation

MemorySaathi ships with five languages (English, Assamese, Manipuri,
Khasi, Mizo) and a translation layer that means **you never have to
hand-write five translations for a new game.**

### How it works

1. `public/js/i18n.js` still exposes the original, hand-authored
   `window.I18N` dictionary and `t(key)` you already had — every
   existing call in the app keeps working exactly as before.
2. `t(key, englishFallback, vars?)` now checks, in order:
   1. **Static dictionary** — if `key` is one of the hand-translated
      keys (`welcome`, `games`, `play`, ...), that translation is
      returned immediately, unchanged.
   2. **Local cache** (`localStorage`) — if this exact English string
      has already been translated into the current language, the
      cached translation is returned immediately.
   3. **Backend auto-translation** — otherwise, the English
      `englishFallback` is shown right away (so the UI never blocks
      or shows a blank/broken string), and a background request is
      sent to `POST /api/translate`. When the translation comes
      back it is cached (both in `localStorage` and on the server)
      and swapped into the page in place.
3. The server endpoint `POST /api/translate` (added to the existing
   `server.js`, all previous routes untouched) calls
   `server/translation.js`, which is an isolated
   `translateText(text, sourceLanguage, targetLanguage)` function
   wrapping Google Translate's free, keyless web endpoint. Results
   are cached to `data/translation-cache.json` via
   `server/translation-cache.js`, so the same sentence is never
   translated twice — by anyone, on any device.
4. If translation fails for any reason (offline, engine down,
   language unsupported), the original English text is kept on
   screen and the real error is only logged server-side — the game
   itself never breaks.

### Adding a new game — you only ever write English

```js
// public/js/games/myNewGame.js
window.GameMyNewGame = {
  start() {
    const area = document.getElementById("gameArea");
    area.innerHTML = `
      <h3>${t("games.myNewGame.title", "Memory Challenge")}</h3>
      <p>${t("games.myNewGame.instructions",
              "Remember the cards and find the matching pair.")}</p>
      <button id="mn-start" class="btn-large">
        ${t("start", "Start Game")}
      </button>
    `;
    // ...game logic unchanged...
  }
};
```

That's it — no `assamese.json`, `manipuri.json`, `khasi.json` or
`mizo.json` to create. The first time a user views this game in, say,
Khasi, the English fallback shows instantly while the real
translation is fetched in the background and cached; every user
after that gets it instantly from cache.

### Dynamic text (scores, counters, etc.)

Wrap the changing part in `{curlyBraces}` and pass a `vars` object.
The `{var}` token is protected before the text is sent to the
translation engine (so the engine only ever translates the fixed
words around it) and substituted back in afterwards:

```js
area.innerHTML = t(
  "games.myNewGame.roundOf",
  "Round {current} of {total}",
  { current: 3, total: 10 }
);
```

### Backend API

```
POST /api/translate
Content-Type: application/json

{ "text": "Remember the cards and find the matching pair.",
  "sourceLanguage": "en",
  "targetLanguage": "as" }
```

First request (not cached yet):
```json
{ "translatedText": "...", "sourceLanguage": "en", "targetLanguage": "as", "cached": false }
```

Second, identical request:
```json
{ "translatedText": "...", "sourceLanguage": "en", "targetLanguage": "as", "cached": true }
```

Internal language codes (used everywhere in the app, e.g.
`localStorage.getItem("lang")`) and their mapping to the translation
engine's codes, defined in `server/translation.js`:

| MemorySaathi code | Language           | Engine code |
|---|---|---|
| `en`  | English             | `en` |
| `as`  | Assamese            | `as` |
| `mni` | Manipuri (Meitei)   | `mni-Mtei` |
| `kha` | Khasi               | `kha` |
| `miz` | Mizo                | `lus` |

### Environment variables
None required. The translation endpoint needs no API key.

### Limitations (discovered while building this)
- The engine is Google Translate's free, unofficial web endpoint
  (`translate.googleapis.com/translate_a/single`) — chosen because it
  is the only genuinely free option that actually supports Assamese,
  Manipuri, Khasi and Mizo (verified against Google's published
  language list; a self-hosted engine like LibreTranslate does **not**
  support these languages). Being unofficial, Google could change or
  throttle it without notice — if that ever happens, only
  `server/translation.js` needs to change, since the rest of the app
  only calls `translateText()`.
- Translation quality for Khasi, Manipuri and Mizo is generally lower
  than for widely-used languages, since less training data exists for
  these languages — this is a limitation of the underlying engine, not
  of this integration.
- `POST /api/translate` is capped at 2000 characters per request and
  60 requests/minute/IP to prevent abuse.
- Translations are cached per exact English string. Changing the
  English fallback text for a key (even fixing a typo) is treated as
  new text and will be translated again on next use.
