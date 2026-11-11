# Simple Pong Games — Android setup

This repository packages the existing HTML Pong game as an Android app using Capacitor. The game source remains `index_Version4.html`; the build script copies it to Capacitor's configured web assets directory (`www/index.html`).

## Requirements

- Node.js LTS and npm
- Android Studio with the Android SDK installed
- A computer able to run Android Studio (the Android project is generated locally)

## Create and run the Android project

From the repository root, run:

```bash
npm install
npm run build
npm run android:add
npm run android:sync
npm run android:open
```

Android Studio opens the generated `android/` project. Run it on an emulator or connected Android device from Android Studio.

The `android:add` step only needs to be run once. For later game changes, run:

```bash
npm run android:sync
```

Then rebuild/run the app from Android Studio.

## Google Play release

In Android Studio, create a signed Android App Bundle (`.aab`) using **Build → Generate Signed Bundle / APK… → Android App Bundle**. Keep the signing key private and backed up. Upload the resulting bundle through your Google Play Console account and complete the store listing and release requirements there.

The configured application ID is `com.changyeelim.simpleponggames`. Choose your final unique application ID before publishing; changing it after publishing creates a different Play Store app. Google Play requirements can change, so check the current Play Console guidance before release.
