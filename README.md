# Simple Pong Games — Android setup

The current game is `index_Version7.html`, packaged for Android with Capacitor. The build script copies it to `www/index.html`; previous versions are retained for reference.

## Requirements

- Node.js LTS and npm
- Android Studio with the Android SDK installed

## Create and run the Android project

From the repository root, run:

```bash
npm install
npm run build
npm run android:add
npm run android:sync
npm run android:open
```

Run `android:add` only once. To sync later updates:

```bash
npm run android:sync
```

Then run the app from Android Studio on an emulator or connected Android device.

## Game features

- **Adventure:** Four themed maps with obstacles; clearing a map unlocks the next one.
- **Boss Battle:** The large boss paddle has a fixed height and independently follows the ball each active frame, including during serves.
- **Pause:** Use the Pause button or Escape; resume or restart the current match from the pause panel. The app pauses automatically when sent to the background.
- **Settings:** Select the arcade or calm procedural music, turn music off, adjust music volume, and toggle sound effects.
- **Shop and coins:** Earn coins from victories and use them to buy/equip paddle colors. Coins, owned skins, and map unlocks are saved locally on the device.
- **Trophy Tournament and Power-Up modes** remain available.

Audio is synthesized and starts after user interaction, as required by mobile browsers.
