# Android Release Automation (Closed Testing + Production)

This document replaces the manual `keystore.properties` flow for release signing. Release signing now reads from environment variables or Gradle properties and is designed for one-command builds.

## 1) One-Time Setup (Secure Signing)

### A) Generate or rotate your upload keystore

If you do not have an upload keystore yet:

```
keytool -genkeypair -v -storetype JKS \
  -keystore android/app/upload.keystore \
  -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep this keystore private. Do not commit it.

If you need to rotate the upload key:
1. Play Console -> App integrity -> Request upload key reset
2. Generate a new keystore (command above)
3. Update your local secrets (next section)
4. Upload a new AAB signed with the new upload key

### B) Store secrets locally (recommended)

Copy the example file and fill in your real values:

```
cp android/keystore.env.example android/keystore.env
chmod 600 android/keystore.env
```

Fill in:
- `ANDROID_KEYSTORE_PATH`: Path relative to `android/` (example: `app/upload.keystore`) or an absolute path
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password
- `ANDROID_KEY_ALIAS`: Key alias (example: `upload`)
- `ANDROID_KEY_PASSWORD`: Key password (can be the same as keystore password)

Optional (overrides the version in `android/app/build.gradle`):
- `ANDROID_VERSION_CODE`
- `ANDROID_VERSION_NAME`

Alternative (more secure for CI): set the same keys in `~/.gradle/gradle.properties`
or your CI secret manager. The build reads from environment or Gradle properties.

### C) What each value means

- `ANDROID_KEYSTORE_PASSWORD`: password that protects the keystore file
- `ANDROID_KEY_PASSWORD`: password for the specific key inside the keystore
- `ANDROID_KEY_ALIAS`: name of the key entry (the alias used during `keytool` creation)

You can confirm values with:
```
keytool -list -v -keystore android/app/upload.keystore
```

## 2) One-Command Builds

Closed testing build:

```
./scripts/android/build-closed-testing.sh
```

Production build:

```
./scripts/android/build-production.sh
```

Both scripts produce:
`android/app/build/outputs/bundle/release/app-release.aab`

## 3) Closed Testing Setup (Play Console)

1. Play Console -> Testing -> Closed testing -> Create release
2. Upload `app-release.aab`
3. Add testers (email list or Google Group)
4. Start rollout to Closed testing
5. Share the opt-in link and install from Play Store

For billing tests:
- Add the same account under Play Console -> Setup -> License testing
- Use the tester account on the device

## 4) Firebase (Required for Release Builds)

When distributing via Play Store, your APK is signed by the **App signing key**
from Play Console (not the upload key).

Update Firebase:
1. Play Console -> App integrity -> App signing key -> copy SHA-1 and SHA-256
2. Firebase Console -> Project settings -> Your apps -> Android
3. Add SHA-1 and SHA-256 fingerprints
4. Download the updated `google-services.json`
5. Replace `android/app/google-services.json`

This is required for Google Sign-In and any Firebase auth features to work in release builds.

## 5) RevenueCat (No Signing Changes Required)

Release signing does not change RevenueCat, but ensure:
- Package name matches `com.eywasoft.lifeintheuk`
- Products are Active in Play Console
- App installed from Play Store (Closed testing or Production)

## 6) Security Checklist (Android)

- Do not commit `android/keystore.env` or `android/app/upload.keystore`
- Keep `android/keystore.properties` free of secrets (deprecated for signing)
- `android:allowBackup="false"` is already set (good)
- `android:usesCleartextTraffic="true"` exists only in debug manifest (good)
- Review storage permissions if they are not strictly needed on Android 13+

## 7) Troubleshooting

Missing signing variables:
- Ensure `android/keystore.env` exists and is populated
- Or export the variables in your shell

Firebase auth fails on release:
- Add Play App Signing SHA-1/SHA-256 to Firebase and re-download `google-services.json`
