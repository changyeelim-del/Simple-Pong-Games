# Simple Pong Games — Android setup

The current game is `index_Version6.html`, packaged for Android with Capacitor. The build script copies it to `www/index.html`. Earlier game versions are retained for reference.

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

Run `android:add` only once. For later game updates:

```bash
npm run android:sync
```

Then run the app from Android Studio on an emulator or connected Android device.

## Game features

- **Adventure:** Four themed maps with obstacles. Clearing a map unlocks the next one.
- **Boss Battle:** Challenge the faster, oversized boss paddle.
- **Trophy Tournament:** Win three progressively harder rounds.
- **Power-Up:** Paddle growth, opponent shrink, and opponent slow pickups.
- **Shop and coins:** Earn coins from victories and use them to buy/equip paddle colors. Coins, owned skins, and map unlocks are saved locally on the device.
- **Audio:** Procedural sound effects and a simple synthesized background melody. Audio starts after the player interacts with the game, as required by mobile browsers.

## Google Play release

In Android Studio, create a signed Android App Bundle (`.aab`) using **Build → Generate Signed Bundle / APK… → Android App Bundle**. Keep the signing key private and backed up. Upload the bundle through Google Play Console and complete the store listing and release requirements there.

The configured application ID is `com.changyeelim.simpleponggames`. Choose your final unique application ID before publishing; changing it after publishing creates a different Play Store app. Check current Play Console requirements before release.
