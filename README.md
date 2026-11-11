# Simple Pong Games — Android setup

This repository packages the HTML Pong game as an Android app using Capacitor. The current game is `index_Version5.html`, featuring Adventure maps, Trophy Tournament, and Power-Up modes. The build script copies it to Capacitor's web assets directory (`www/index.html`). `index_Version4.html` is retained as the earlier version.

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

Run `android:add` only once. For later game changes, run:

```bash
npm run android:sync
```

Then run the app from Android Studio on an emulator or connected Android device.

## Game modes

- **Adventure:** Choose a starting map and win across four themed maps. Each map has distinctive colors and center bumpers; bumpers move on the Lava Rift and Cosmic Core maps.
- **Trophy Tournament:** Win three rounds, with the computer getting harder each round.
- **Power-Up:** Collect temporary paddle grow, opponent shrink, and opponent slow effects.

## Google Play release

In Android Studio, create a signed Android App Bundle (`.aab`) using **Build → Generate Signed Bundle / APK… → Android App Bundle**. Keep the signing key private and backed up. Upload the bundle through your Google Play Console account and complete the store listing and release requirements there.

The configured application ID is `com.changyeelim.simpleponggames`. Choose your final unique application ID before publishing; changing it after publishing creates a different Play Store app. Google Play requirements can change, so check the current Play Console guidance before release.
