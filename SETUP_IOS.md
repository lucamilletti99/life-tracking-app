# iOS Setup Guide

All the code changes are done. These are the one-time terminal steps to complete
the Capacitor iOS setup on your Mac.

## Prerequisites
- Node.js (already installed)
- Xcode (install from the App Store if not already installed)
- CocoaPods: `sudo gem install cocoapods`

---

## Step 1 — Install the new packages

```bash
cd ~/Desktop/personal_projects/life-tracking-app
npm install
```

This installs the Capacitor packages added to `package.json`:
`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/browser`,
`@capacitor/push-notifications`.

---

## Step 2 — Initialise the iOS project

```bash
npx cap add ios
```

This creates the `ios/` folder (an Xcode project) in your repo. Commit it — it's
part of your codebase now.

---

## Step 3 — Build and run in the simulator

```bash
npm run build:ios    # next build → cap copy → cap sync
npm run open:ios     # opens Xcode
```

In Xcode: select an iPhone simulator from the device menu, then hit ▶ Run.
You should see your app launch in the iOS Simulator.

---

## Step 4 — Configure Supabase for the deep-link redirect

In your Supabase dashboard → **Authentication → URL Configuration**:

1. Add `com.lucamilletti.trackr://auth/callback` to the **Redirect URLs** list.
2. This is the custom URL scheme the app uses so Safari hands control back
   after Google OAuth completes.

---

## Step 5 — Register the URL scheme in Xcode

Capacitor usually does this automatically when you run `cap sync`, but verify:

1. Open `ios/App/App.xcodeproj` in Xcode.
2. Select the **App** target → **Info** tab → **URL Types**.
3. Confirm there is an entry with **URL Schemes** = `com.lucamilletti.trackr`.
   If not, add it manually.

---

## Everyday build workflow

```bash
# After any code change, rebuild and push to the simulator:
npm run build:ios
npx cap run ios
```

---

## When you're ready for TestFlight / App Store

1. Get an Apple Developer account at https://developer.apple.com ($99/year).
2. In Xcode: set your Team under **Signing & Capabilities**.
3. Create an App ID `com.lucamilletti.trackr` in the Apple Developer Portal.
4. Archive the app: **Product → Archive**.
5. Upload via Xcode Organizer or `xcrun altool`.
6. Go to https://appstoreconnect.apple.com and distribute via TestFlight.

---

## Push Notifications (when ready)

1. Create an APNs Auth Key in Apple Developer Portal → **Keys**.
2. Add it in Supabase Dashboard → **Edge Functions → Push** or your notification
   provider (e.g. OneSignal).
3. The `@capacitor/push-notifications` plugin is already installed and configured
   in `capacitor.config.ts` — just add the permission request to your app startup.
