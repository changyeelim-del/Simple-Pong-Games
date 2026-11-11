# Simple Pong Games — Android setup

The game is built from `index_Version7.html` and packaged for Android with Capacitor. The build script copies it to `www/index.html` and injects room-code multiplayer from `scripts/multiplayer.js`. Previous game versions are retained for reference.

## Requirements and Android build

- Node.js LTS and npm
- Android Studio with the Android SDK installed
- A Firebase project for online multiplayer (free Spark plan is sufficient for initial testing)

From the repository root:

```bash
npm install
npm run build
npm run android:add
npm run android:sync
npm run android:open
```

Run `android:add` only once. To sync later updates, run `npm run android:sync`, then run the app from Android Studio on an emulator or connected Android device.

## Set up room-code multiplayer with Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Project settings → General**, add a **Web app** and copy its Firebase configuration.
3. In **Authentication → Sign-in method**, enable **Anonymous** sign-in.
4. Create a **Realtime Database**. Copy its database URL (for example, `https://YOUR_PROJECT-default-rtdb.REGION.firebasedatabase.app`).
5. Replace the placeholder values in `firebase-config.js` with the Web app config, including the correct `databaseURL`.
6. In Realtime Database **Rules**, publish the contents of `database.rules.json` from this repository. Do not use open/test rules in a released app.
7. Run `npm run build` and `npm run android:sync`, then reinstall/run the Android app. Both players need an internet connection and a build with the same Firebase project config.

Firebase web configuration is client-visible by design; do not treat its API key as a password. The anonymous sign-in requirement and database rules limit room access. Review your Firebase usage and quota before a public launch.

In the game, tap **Online Multiplayer**. One player creates a room and shares the displayed 8-character code; the other enters that code and taps **Join room**. The host controls the left paddle, the joining player controls the right paddle, and the first player to five points wins. The match simulation is host-authoritative; both devices need a live connection.

## Existing modes and features

- Adventure maps, Boss Battle, Trophy Tournament, and Power-Up mode.
- Pause menu and settings for procedural music and sound effects.
- Coin shop, paddle colors, and local map unlock progress.
