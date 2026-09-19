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
