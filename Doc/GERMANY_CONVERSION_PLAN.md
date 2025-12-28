# Germany Einburgerungstest 2023 - Conversion Plan

This document is the step-by-step migration guide to rebrand the existing "Life in the UK" codebase into the Germany citizenship test app while keeping the UI and architecture unchanged (except removing the Book feature). It separates Codebase, Firebase, and Other/Store tasks for easier tracking.

## 0) App Identity (Inputs)

Use these values consistently across code, Firebase, and store consoles.

- App Name (display): Einbürgerungstest
- App Name (internal): Einburgerungstest
- Package Name (Android): com.eywasoft.einburgerungs
- Bundle ID (iOS): org.eywasoft.einburgerungs
- Apple App ID: 1609773387
- iOS Version: 2.0.0
- Android Version: 1.0.0
- Default UI Language: de
- Support Email: support@eywasoft.co.uk
- Privacy/Terms URLs: same as existing app
- Monetization: Monthly 4.99, Lifetime 17.99 (new RevenueCat products)

## 1) Codebase Changes (Local Repo)

### 1.1 Rebrand app identifiers and names

1) Update app identity files:
   - `app.json` -> `name` (internal) and `displayName` (visible)
   - `package.json` -> `name`
2) Android:
   - `android/app/build.gradle` -> `namespace` and `applicationId`
   - `android/app/src/main/res/values/strings.xml` -> `app_name`
   - `android/settings.gradle` -> `rootProject.name`
   - Package folders and class declarations under `android/app/src/main/java/`
3) iOS:
   - `ios/LifeInTheUK/Info.plist` -> `CFBundleDisplayName`
   - `ios/LifeInTheUK.xcodeproj/project.pbxproj` -> `PRODUCT_BUNDLE_IDENTIFIER`, `MARKETING_VERSION`, `PRODUCT_NAME`
   - `ios/LifeInTheUK/LaunchScreen.storyboard` -> app title text
4) App config:
   - `src/config/appConfig.ts` -> bundle IDs, app store ID, support email, privacy/terms URLs

### 1.2 Remove Book feature (no book in Germany app)

1) Remove Book screens, navigation, and related services:
   - Remove Book screens/components and routes from navigation.
   - Remove book-specific progress logic and book data references.
2) Remove Book-related assets:
   - Remove `src/assets/content/bookContent.*.json` and chapter lists.
3) Update paywall feature list:
   - Remove book-related items from `src/components/common/PaywallModal.tsx`.

### 1.3 Default language to German

1) Update localization defaults:
   - `src/localization/i18n.ts` -> `lng` and `fallbackLng` to `de`
   - `src/providers/LocalizationProvider.tsx` -> default language `de`
2) Ensure UI label:
   - `settings.appLanguage` -> "Language"

### 1.4 Exam rules and question data (Germany-specific)

The JSON schema stays the same; only the content/rules change.

1) Update local exam definitions:
   - `src/data/exam/normalized/exams.json`
   - Use Germany rules: questions per exam, time limits, pass mark, count of exams, free vs paid.
2) Replace question datasets:
   - `src/data/exam/normalized/allChaptersData.normalized.json`
   - `src/data/exam/normalized/mockExam.en.json`
   - `src/data/exam/normalized/questionsByChapter.en.json`
3) Update UI copy that references counts/duration:
   - Check `src/localization/languages/*.json` for hardcoded "24 questions", "45 minutes", etc.

### 1.5 Firebase Storage image base URL

1) Ensure the image downloader uses the active Firebase bucket:
   - `src/services/FirebaseImageService.ts` should read the bucket from Firebase config rather than a hardcoded URL.

### 1.6 Optional: Rename iOS project/target

Not required for functionality but can reduce confusion:
   - Rename Xcode project/target from `LifeInTheUK` to `Einburgerungstest`
   - Update `ios/Podfile` target name if you rename the target

## 2) Firebase Changes (New Project)

### 2.1 Create a new Firebase project

1) Firebase Console -> Create project.
2) Add iOS app:
   - Bundle ID: `org.eywasoft.einburgerungs`
   - Download `GoogleService-Info.plist`
3) Add Android app:
   - Package name: `com.eywasoft.einburgerungs`
   - Download `google-services.json`

### 2.2 Replace Firebase config files in the repo

1) iOS:
   - Replace `ios/GoogleService-Info.plist` with the new one.
   - Update `ios/LifeInTheUK/Info.plist` -> `CFBundleURLSchemes` to the new `REVERSED_CLIENT_ID` from GoogleService-Info.plist.
2) Android:
   - Replace `android/app/google-services.json`.

### 2.3 Enable Firebase Authentication

1) Firebase Console -> Authentication -> Sign-in methods:
   - Email/Password
   - Google
2) For Google Sign-In:
   - Set OAuth consent screen in Google Cloud Console.
   - Add iOS and Android SHA keys (debug + release).
3) Update app config:
   - `src/config/appConfig.ts` -> `WEB_CLIENT_ID` (from Firebase web config / Google Sign-In config).

### 2.4 Firestore setup (progress, support, rating)

Firestore collections used in code:
   - `users/{uid}/progress/exam`
   - `users/{uid}/examAttempts`
   - `users/{uid}/examInProgress`
   - `supportTickets` (create-only)
   - `ratingFeedback` (create-only)
   - `mail` (email queue used by support/feedback)

Ensure Firestore rules allow:
   - Authenticated users to read/write their own `users/{uid}/**`
   - Create-only for `supportTickets`, `ratingFeedback`, `mail`

### 2.5 Firebase Storage setup (dynamic content)

Storage folders (root):

```
config/
content/
exam/
```

Public read access for:
   - `config/manifest.json`
   - `config/languages.json`
   - `config/exams.json`
   - `content/home.json`
   - `content/privacy_policy/privacy_policy_{lang}.json`
   - `exam/translations/allChaptersData.{lang}.json`
   - `exam/mockExam/mockExam.{lang}.json`
   - `exam/chapterName/questionsByChapter.{lang}.json`

No public writes (upload via Firebase Console).

### 2.6 Dynamic Content Versioning

Use the manifest-driven update strategy:
1) Update a content JSON locally.
2) Bump the relevant module version in `firebase_config/manifest.json`.
3) Upload the JSON to Storage.
4) Upload the updated manifest to Storage.

## 3) RevenueCat (RNCat) Changes

### 3.1 Create a new RevenueCat project

1) Add iOS app (bundle ID: `org.eywasoft.einburgerungs`).
2) Add Android app (package: `com.eywasoft.einburgerungs`).
3) Entitlement:
   - `pro_access` (same as existing app).
4) Offering:
   - Identifier: `default`

### 3.2 Create new products (new IDs)

Choose NEW product IDs (do not reuse Life in the UK IDs). Example format:

- Monthly: `de_einburgerung_monthly_v1`
- Lifetime: `de_einburgerung_lifetime_v1`

Set prices:
   - Monthly: 4.99
   - Lifetime: 17.99

Attach both products to `pro_access` entitlement and the `default` offering.

### 3.3 App Store Connect setup

1) Create a new app with:
   - Bundle ID: `org.eywasoft.einburgerungs`
   - Name: Einbürgerungstest
   - Primary language: German
2) Create a new subscription group and products matching your new IDs.
3) Upload screenshots for each product (required or IAP API can fail silently).

### 3.4 Google Play Console setup

1) Create the new app with package: `com.eywasoft.einburgerungs`.
2) Configure monetization and merchant profile.
3) Create:
   - Subscription product (monthly)
   - Managed product (lifetime)
4) Add internal testing, testers, and upload a release build.

### 3.5 Update app keys

Store RevenueCat API keys in `.env` (not in git):

```
APPLE_API_KEY=rc_...
GOOGLE_API_KEY=rc_...
```

The app reads them via `@env` in `src/services/PurchaseService.ts`.

## 4) Dynamic Content Migration (Germany Data)

### 4.1 Local JSON preparation

Prepare Germany exam JSONs with the SAME schema:

- `allChaptersData.de.json` (or `allChaptersData.{lang}.json`)
- `mockExam.de.json`
- `questionsByChapter.de.json`

### 4.2 Upload flow

1) Upload new question files to Firebase Storage:
   - `exam/translations/`
   - `exam/mockExam/`
   - `exam/chapterName/`
2) Update `firebase_config/languages.json` versions for `de` (and others).
3) Bump `languages` version in `firebase_config/manifest.json`.
4) Upload updated `languages.json` + `manifest.json`.

### 4.3 Update exams manifest

1) Update `firebase_config/exams.json` with Germany rules.
2) Bump `exams` version in `firebase_config/manifest.json`.
3) Upload updated `exams.json` + `manifest.json`.

### 4.4 Update static screens (privacy, home)

1) Update:
   - `firebase_config/home.json`
   - `firebase_config/privacy_policy_en.json` and other languages
2) Bump `home` / `privacy` module versions in `firebase_config/manifest.json`.
3) Upload to Firebase Storage.

## 5) Other Changes (Store + Assets)

1) App icons and splash:
   - Update Android adaptive icons and iOS asset catalogs when ready.
2) App Store / Play Store listings:
   - App name, description, keywords, screenshots
   - Privacy policy URL and support email
3) Analytics / Crashlytics (optional):
   - If enabled, ensure data collection settings are updated in Firebase.

## 6) QA Checklist

1) Firebase Auth:
   - Anonymous sign-in works
   - Email sign-up/login works
   - Google Sign-In works
2) RevenueCat:
   - Paywall loads offerings
   - Purchase/restore works
3) Dynamic Content:
   - Home content refresh works
   - Exams update after manifest bump
4) Exams:
   - Germany rules (duration/pass mark/question count) reflect UI and scoring
5) No Book entry:
   - Tabs/Settings/Progress show no book section

