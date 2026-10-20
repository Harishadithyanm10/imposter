# Imposter on Android and iOS (Capacitor)

The same React app now also runs as a native Android and iOS app using [Capacitor](https://capacitorjs.com).
Game logic, Firebase (Authentication + Firestore) and the free Spark plan are unchanged. Nothing else is needed on the server.

## Build in the cloud with GitHub Actions (no Android Studio, no Xcode)

Three workflows in `.github/workflows/` build the apps on GitHub's servers. You only need a GitHub account.

| Workflow | What it does | Runs |
|---|---|---|
| **Build Android** | tests, builds the web app, produces an installable `.apk` (and a `.aab` for Google Play) | on every push to `main`, on version tags (`v1.0.0` also makes a GitHub Release), or by hand |
| **Build iOS** | builds the iOS app (simulator check, unsigned `.ipa`, or signed `.ipa` / TestFlight) | by hand only (macOS minutes cost 10x on private repositories) |
| **Create Android keystore (one time)** | creates the signing key for Android | by hand, once, **private repositories only** |

### Step 1: put the project on GitHub
Create a **private** repository and upload the whole project (the `android/` and `ios/` folders included).

### Step 2: add your secrets
GitHub repository > **Settings > Secrets and variables > Actions > New repository secret**.
The Firebase values are the same ones as in your `.env.local`.

| Secret | Needed for | Value |
|---|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID` | **both (required)** | from Firebase > Project settings > Your apps > Web app |
| `VITE_PUBLIC_URL` | both (optional) | your website address, used in invite links, e.g. `https://your-site.netlify.app` |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Android signed build (recommended) | made by the keystore workflow, see below |
| `GOOGLE_SERVICES_JSON_BASE64` | Android Google sign-in | `google-services.json` from Firebase, base64 encoded |
| `IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64` | iOS Google sign-in | `GoogleService-Info.plist` from Firebase, base64 encoded |
| `IOS_CERT_P12_BASE64`, `IOS_CERT_PASSWORD`, `IOS_PROFILE_BASE64` | iOS **signed** build | Apple Distribution certificate (.p12) and provisioning profile, base64 encoded |
| `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY` | iOS TestFlight upload (optional) | App Store Connect API key (the `.p8` file's text) |

How to base64 encode a file:
* Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("file")) | Set-Clipboard`
* Mac: `base64 -i file | pbcopy`    Linux: `base64 -w0 file`

### Android: from zero to an installed app
1. **Quick test (only the Firebase secrets):** Actions tab > **Build Android** > Run workflow. When it finishes, open the run, download the **imposter-android** artifact, unzip it, send the `.apk` to your phone and install it (allow "install unknown apps").
   This debug-signed build changes its signature every run, so **Continue with Google will not work** yet. Email sign-in does.
2. **Stable signed build (needed for Google sign-in and Google Play):**
   1. Actions > **Create Android keystore (one time)** > Run workflow. Open the finished run: the summary shows the **SHA-1**. Download the `android-keystore` artifact.
   2. Add the four `ANDROID_KEYSTORE_*` / `ANDROID_KEY_*` secrets from the artifact (`secrets-to-copy.txt` and `ANDROID_KEYSTORE_BASE64.txt`), then **delete the run and the artifact**. Keep a private copy of that keystore forever: you need the same key for every update on Google Play.
      (If your repository is public the workflow refuses to run. Create the keystore on your own computer with `keytool` instead.)
   3. Firebase > Project settings > **Add app > Android**, package name = `appId` from `capacitor.config.json` (default `com.imposter.game`). Paste the SHA-1. Make sure **Google** sign-in is enabled. Download `google-services.json` and add it as the `GOOGLE_SERVICES_JSON_BASE64` secret.
   4. Run **Build Android** again. The artifact now has a signed `imposter-android.apk` and `imposter-android.aab`.
3. **Google Play:** upload the `.aab` in Play Console (one-time US$25 developer fee). Also add the SHA-1 that Play shows under *App signing* to your Firebase Android app.

### iOS: what is and is not possible
* **simulator-check** (free, no secrets except Firebase): proves the app compiles. It cannot be installed on a real iPhone.
* **unsigned-ipa**: an unsigned `.ipa` that tools such as Sideloadly can sign with a free Apple ID (expires after 7 days; Google sign-in will not work because the bundle id changes).
* **signed-ipa** (needs the paid **Apple Developer Program**, US$99/year): a real build for TestFlight, the App Store or registered devices. You need:
  1. An App ID with your bundle id (`appId`) at developer.apple.com, and an **Apple Distribution** certificate. You can create the certificate without a Mac using OpenSSL:
     ```bash
     openssl genrsa -out ios.key 2048
     openssl req -new -key ios.key -out ios.csr -subj "/CN=Your Name/emailAddress=you@example.com/C=US"
     # developer.apple.com > Certificates > + > Apple Distribution: upload ios.csr, download distribution.cer
     openssl x509 -inform DER -in distribution.cer -out distribution.pem
     openssl pkcs12 -export -legacy -inkey ios.key -in distribution.pem -out cert.p12 -password pass:CHOOSE_A_PASSWORD
     ```
     (drop `-legacy` if your OpenSSL is older than 3). Base64 the `.p12` into `IOS_CERT_P12_BASE64` and the password into `IOS_CERT_PASSWORD`.
  2. A **provisioning profile** for that App ID and certificate (type *App Store* for TestFlight / App Store, or *Ad Hoc* for registered devices). Base64 the downloaded `.mobileprovision` into `IOS_PROFILE_BASE64`.
  3. For Google sign-in: Firebase > **Add app > iOS** with the same bundle id, download `GoogleService-Info.plist` into `IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64`. The workflow adds it to the app and fills in the URL scheme for you.
  4. Actions > **Build iOS** > Run workflow > *signed-ipa*. For TestFlight pick *app-store-connect*, tick *upload_testflight* and add the three `APPSTORE_*` secrets (App Store Connect > Users and Access > Integrations > Keys).
* Apple requires apps that offer Google sign-in to also offer **Sign in with Apple** (App Store guideline 4.8). It is not built in yet.

### Troubleshooting
* **Blank screen in the app:** the `VITE_FIREBASE_*` secrets are missing or wrong (the workflow stops early if they are empty).
* **"Continue with Google" fails:** the SHA-1 in Firebase must be the one of the key that signed the APK, and `google-services.json` must be downloaded **after** adding it.
* **Change the app id:** edit `appId` in `capacitor.config.json` before publishing. The workflows apply it to the Android and iOS builds automatically.
* Version numbers come from `package.json` (`version`) and the workflow run number, so every build is uniquely numbered.
* These workflows were written to follow the current Capacitor and GitHub runner setups but have not been run for you yet. If a step fails, the log names the step, so send me that error.

---

## Build on your own computer instead (optional)

## What you need

* Node 22+ and `npm install` (already done if the web app runs)
* **Android:** a current Android Studio (any OS)
* **iOS:** a Mac with a current Xcode (Apple only allows iOS builds on macOS)

## 1. Configure

1. Copy `.env.example` to `.env.local` and fill in the Firebase web values (same as the website).
2. Set `VITE_PUBLIC_URL` to your deployed website address (for example `https://your-site.netlify.app`).
   Inside the apps the page address is `capacitor://localhost`, so invite links use this address instead.
3. Optional: change `appId` (`com.imposter.game`) in `capacitor.config.json` **before you publish**, then also change
   `applicationId` in `android/app/build.gradle` and the Bundle Identifier in Xcode (App target > Signing & Capabilities).

## 2. Run it

```bash
npm install
npm run android      # builds the web app, syncs it, opens Android Studio  (press Run)
npm run ios          # builds, syncs, opens Xcode  (choose a simulator or your iPhone, press Run)
```

After any code change run `npm run build:mobile` (build + sync) and press Run again.
Email and password sign-in works immediately. **Google sign-in needs step 3.**

## 3. Google sign-in on phones (one-time)

Google does not allow sign-in inside an embedded web page, so the apps use the native Google account picker.

**Android**
1. Firebase console > Project settings > Your apps > **Add app > Android**. Package name = your `appId`.
2. Add your SHA-1: in a terminal run `cd android && ./gradlew signingReport` and copy the SHA-1 of the `debug` variant
   (add the release / Play App Signing SHA-1 later when you publish).
3. Authentication > Sign-in method: make sure **Google** is enabled.
4. Download **google-services.json** (download it again after adding the SHA-1) and put it in `android/app/`.

**iOS**
1. Firebase console > Project settings > **Add app > iOS**. Bundle ID = your `appId`.
2. Download **GoogleService-Info.plist** and drag it into Xcode (App > App folder, tick "Copy items" and the App target).
3. Open `ios/App/App/Info.plist` and replace `REPLACE_WITH_REVERSED_CLIENT_ID` (inside `com.googleusercontent.apps....`)
   with the `REVERSED_CLIENT_ID` value from that plist. Keep the full text `com.googleusercontent.apps.XXXX`.

Then run `npm run build:mobile` again.

## 4. Publish

* **Google Play:** Android Studio > Build > Generate Signed App Bundle. Add the release SHA-1 to Firebase.
* **App Store:** Xcode > Product > Archive. Apple requires apps that offer Google sign-in to also offer **Sign in with Apple**
  (App Store guideline 4.8) and an in-app **account deletion** option (already included). Add Sign in with Apple before submitting,
  or remove the Google button on iOS.
* Icons and splash screens were generated from `assets/`. Replace the PNGs there and run `npm run icons` to regenerate them.

## Previewing the phone-app look in a browser

The app interface (welcome screen, tab bar, app home, loader) is used automatically inside the Android and iOS apps.
To preview it in any browser, open your site with `?app=1` added (for example `http://localhost:5173/?app=1`) and use the phone view in
the developer tools. Add `?app=0` to switch it off again.

## What changed for the apps

* `capacitor.config.json`, `android/`, `ios/`, `assets/`: the native projects and their config.
* `src/native.js`: platform helpers (back button, system bars, splash, native share sheet, public invite address).
* Auth: native Google sign-in feeds the normal Firebase JS SDK. Email sign-in, Firestore and all game logic are unchanged.
* Screens respect the notch, status bar and home bar (safe areas), and the keyboard resizes the page.
* Not included: push notifications and deep links (opening `/join/CODE` links straight in the app). Players enter the 6-character code.
