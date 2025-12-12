# Authentication & Monetization Implementation Status Report

**Date:** December 06, 2025
**Version:** 1.0
**Status:** Partially Complete / Testing Required

---

## 1. Executive Summary
We have successfully implemented the core infrastructure for a **Freemium** model with **Google Sign-In** and **RevenueCat** integration. The app supports "Guest First" access, locking content (Exams 6+, Book Chapter 2+) behind a Paywall. However, the "Account Linking" flow (logging out and logging back in with the same Google account) still has edge cases causing UI synchronization issues.

---

## 2. Completed Implementations

### A. Monetization (RevenueCat)
*   **SDK:** Integrated `react-native-purchases` (v5+).
*   **Configuration:** Securely loaded API keys via `.env`.
*   **Paywall UI:** Created `PaywallModal` with dynamic pricing and Apple-compliant legal footer.
*   **Locking Logic:**
    *   **Exams:** Locked indices >= 5.
    *   **Book:** Locked indices > 0.
    *   **Home Screen:** Shortcuts and Carousel items obey lock status.
*   **Native:** iOS `Podfile` and Android `Manifest` updated.

### B. Authentication (Firebase + Google)
*   **SDK:** Integrated `@react-native-firebase/auth` and `@react-native-google-signin/google-signin` (v16).
*   **Guest Mode:** App logs in anonymously on launch (`signInAnonymously`).
*   **Google Sign-In:**
    *   Configured `GoogleService-Info.plist` (iOS) and `Web Client ID`.
    *   Implemented `AuthService.ts` to handle token exchange.
    *   **Linking:** Connects Google Credential to current Anonymous User.
*   **State Management:** Refactored `userSlice` (Redux) to listen to `onAuthStateChanged`.

### C. User Interface
*   **Settings Screen:** Dynamic UI showing "Link Account" vs "Logged In as [Email]".
*   **Login Screen:** Restored navigation, added Back button, added Google Sign-In button.

---

## 3. Known Issues & "To-Do" List

### Critical Bugs (Blocking Release)
1.  **Re-Login Flow:** When a user logs out and tries to log back in with the *same* Google account:
    *   **Expected:** Seamless switch to the existing account.
    *   **Actual:** Sometimes the UI does not update, or navigation hangs. The logic in `AuthService` attempts to handle `credential-already-in-use` by switching to `signInWithCredential`, but this flow needs rigorous testing on physical devices.
2.  **Apple Sign-In:** Currently a placeholder button ("Coming Soon"). **Mandatory for App Store submission.**

### Technical Debt
1.  **Android Setup:** The `google-services.json` and SHA-1 fingerprint setup in Firebase Console is only partially verified for the Debug keystore. Release keystore setup is required for production.
2.  **RevenueCat <-> Firebase Sync:** We push Email/Name to RevenueCat, but we do not strictly enforce a 1:1 mapping of User IDs. This is acceptable for v1 but might cause data fragmentation if users switch devices often.

---

## 4. Security & Configuration Audit

### RevenueCat
*   [x] **API Keys:** Stored in `.env` (Safe).
*   [x] **Shared Secret:** Configured in RevenueCat Dashboard (Safe).
*   [x] **Paid Apps Agreement:** **CRITICAL.** Must be "Active" in App Store Connect for real payments to work.

### Google Cloud / Firebase
*   [ ] **OAuth Consent Screen:** App Name is currently "Project 482...". **MUST** be renamed to "Life in the UK" in Google Cloud Console to look professional.
*   [ ] **iOS Client ID:** We are using the `...ck0dkar...` ID. Ensure this *never* gets deleted from Google Cloud Console or sign-in will break.

---

## 5. Next Steps for Developer

### Before Writing Code:
1.  **Rename App in Google Console:** Fix the "Project 123 wants to access your account" message.
2.  **Check "Paid Apps" Agreement:** Verify it is Green/Active in App Store Connect.

### Code Tasks:
1.  **Implement Apple Sign-In:** Install `@invertase/react-native-apple-authentication` and wire it up in `AuthService`.
2.  **Debug Re-Login:** Add `console.log` extensively in `AuthService.ts` inside the `catch` block for `credential-already-in-use` to see exactly why the UI fails to update.
3.  **Test Android:** Run `yarn android` and verify the flow on an Emulator.

### Testing Plan (Physical Device):
1.  **Clean Install.**
2.  **Browse:** Verify locks on Exam 6.
3.  **Paywall:** Verify prices load (requires "Paid Apps" Active).
4.  **Sign In:** Link Google Account A.
5.  **Sign Out.**
6.  **Sign In:** Link Google Account A *again*. (This is the failure point to check).

---

**Documentation Location:** `Doc/AUTH_AND_IAP_STATUS.md`
