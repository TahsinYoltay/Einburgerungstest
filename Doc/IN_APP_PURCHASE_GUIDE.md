# In-App Purchase (IAP) Integration Guide - Life in the UK (v2.0)

**Date:** December 06, 2025
**Version:** 2.0
**Author:** Gemini Agent

---

## 1. Executive Summary

This document details the technical implementation of the monetization system for the "Life in the UK" mobile application (v2.0).

**Core Strategy:**
*   **Model:** Freemium.
*   **Restrictions:**
    *   **Exams:** First 5 exams are FREE. Exams 6+ are LOCKED.
    *   **Book:** Chapter 1 is FREE. Chapters 2+ are LOCKED.
*   **Access:** Users unlock full access via a Monthly Subscription or a Lifetime One-Time Purchase.
*   **Infrastructure:** We use **RevenueCat** as the backend "source of truth" to handle cross-platform receipt validation, subscription status, and grandfathering of legacy users.

---

## 2. Technology Stack

*   **SDK:** `react-native-purchases` (RevenueCat SDK).
*   **State Management:** Redux Toolkit (for UI state) + RevenueCat CustomerInfo (for entitlement state).
*   **Authentication:** Firebase Authentication (Anonymous Login + Account Linking).
*   **Environment Variables:** `react-native-dotenv` for securing API Keys.

---

## 3. RevenueCat Configuration (The Backend)

RevenueCat acts as the bridge between Apple/Google and our App.

### 3.1 Project Settings
*   **Project Name:** Life in the UK (`org.eywasoft.LIF`)
*   **API Keys:** Loaded via `.env` file (`APPLE_API_KEY`, `GOOGLE_API_KEY`).

### 3.2 Entitlements (Permissions)
This is the "Key" that the app looks for to decide if content is unlocked.

| Entitlement ID | Description | Logic |
| :--- | :--- | :--- |
| **`pro_access`** | Full App Access | If `customerInfo.entitlements.active['pro_access']` is true, the user is PRO. |

### 3.3 Offerings (The Paywall)
This defines what products are shown on the Paywall screen.

*   **Offering Identifier:** `default`
*   **Packages:**
    1.  **`Monthly`** -> Linked to `uk_life_monthly_v2`
    2.  **`Lifetime`** -> Linked to `uk_life_lifetime_v2`

---

## 4. App Store Connect (iOS) Setup

We created a *new* set of products for v2.0 to separate them from the legacy v1.0 products.

### 4.1 Subscription Group
*   **Name:** `Life in the UK - V2 Pricing`
*   **Purpose:** Isolates new pricing from old legacy subscriptions.

### 4.2 Product IDs (Must match RevenueCat)

| Product ID | Type | Price | Description |
| :--- | :--- | :--- | :--- |
| **`uk_life_monthly_v2`** | Auto-Renewable Subscription | £4.99 / mo | "Premium Monthly Access" |
| **`uk_life_lifetime_v2`** | Non-Consumable | £19.99 | "Lifetime Full Access" |

**Important:**
*   The **"Paid Apps Agreement"** in App Store Connect must be **Active**.
*   Screenshots must be uploaded for each product in App Store Connect for review, or the API will fail silently.

---

## 5. Google Play Console (Android) Setup

Unlike iOS, **Google Play Billing requires the app to be installed from Google Play** (Internal Testing / Internal App Sharing) to reliably return product details. If you run `yarn android` (debug APK), the paywall will often show **no packages** even if the code is correct.

### 5.1 Prerequisites (Must Match the App)

1. **Android package name** must match:
   - **`applicationId`** in `android/app/build.gradle` (currently `com.eywasoft.lifeintheuk`)
2. **Product IDs** (recommended to keep identical to iOS):
   - `uk_life_monthly_v2` (subscription)
   - `uk_life_lifetime_v2` (one-time)

### 5.2 Google Play Console → Monetization Setup

1. **Complete Play Console payments setup**
   - Ensure your payments/merchant profile is created and monetization is enabled.
2. **Create the subscription**
   - Go to **Monetize → Products → Subscriptions**
   - Create subscription ID: `uk_life_monthly_v2`
   - Create a **Base plan** (monthly), set price, and activate it
3. **Create the one-time (lifetime) product**
   - Go to **Monetize → Products → In-app products**
   - Create product ID: `uk_life_lifetime_v2`
   - Type: **Managed product** (non-consumable), set price, and activate it

### 5.3 Testing Accounts (Required)

1. Add your testers under **Setup → License testing**
2. Add those same testers to your **Internal testing** track testers list
3. On the device/emulator, sign into Google Play with that tester account

### 5.4 Upload a Build (Internal Testing)

Google Play Billing testing requires a Play-distributed build.

1. Create an **upload keystore** (one-time)
   - Generate a keystore (example):
     - `keytool -genkeypair -v -storetype JKS -keystore android/app/upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000`
   - Keep this file safe. Do **not** commit it.
2. Create `android/keystore.env` (one-time)
   - Copy `android/keystore.env.example` → `android/keystore.env`
   - Fill in your keystore path + passwords (this file is gitignored)
   - See `Doc/ANDROID_RELEASE_AUTOMATION.md` for the secure setup
3. Build a release AAB (one command):
   - `./scripts/android/build-closed-testing.sh`
4. Upload the AAB to **Release → Testing → Internal testing**
5. Publish the Internal Testing release
6. Install the app using the Internal Testing link (or Internal App Sharing)

### 5.5 RevenueCat Dashboard (Android)

1. Add your **Android app** inside the same RevenueCat project
   - Package name must match Play Console + `applicationId` (`com.eywasoft.lifeintheuk`)
2. Configure **Google Play credentials**
   - Add a dedicated **Service Account JSON key** in RevenueCat (do not ship this in the app)
   - Grant that service account Play Console access with least-privilege permissions needed for subscriptions/products
3. Add **Play Store products** in RevenueCat
   - `uk_life_monthly_v2` (subscription)
   - `uk_life_lifetime_v2` (in-app product)
4. Attach both products to entitlement **`pro_access`**
5. Ensure offering **`default`** is **Current** and contains packages:
   - Monthly → `uk_life_monthly_v2`
   - Lifetime → `uk_life_lifetime_v2`

### 5.6 Common Android Pitfalls

- **Paywall shows no packages** → App not installed from Google Play (Internal Testing/Internal App Sharing) or products are not Active.
- **Products exist but still missing** → Product IDs don’t match, or the Play Console app package name doesn’t match `applicationId`.
- **Purchase succeeds but entitlement missing** → Products not attached to `pro_access`, or you’re using a different RevenueCat project/API key on Android.
- **RevenueCat: “Could not validate subscriptions API permissions”** → In Google Cloud enable **Google Play Android Developer API** (Android Publisher), link the same Cloud project in **Play Console → Setup → API access**, then grant the service account access to the app with permissions to view/manage subscriptions/orders; wait a few minutes and re-validate.

---

## 6. Technical Implementation (The Code)

### 6.1 Service Layer: `src/services/PurchaseService.ts`
This singleton class wraps the RevenueCat SDK.

*   **`configure()`**: Initializes the SDK with the API Key from `.env`.
*   **`checkProStatus()`**: Returns `true` if `pro_access` is active.
*   **`getOfferings()`**: Fetches the `default` offering to display on the Paywall.
*   **`purchasePackage(pack)`**: Initiates the native payment flow.
*   **`restorePurchases()`**: Re-syncs receipts (critical for reinstallations).

### 6.2 The Paywall: `src/components/common/PaywallModal.tsx`
A reusable modal component.
*   **Trigger:** Shown when a user clicks a locked item.
*   **Dynamic UI:** Fetches title/price strings directly from RevenueCat (which gets them from Apple).
*   **Compliance:** Includes a mandatory Legal Footer (Terms, Privacy, Renewal Logic) to satisfy App Store Review Guidelines.

### 6.3 Locking Logic

**A. Exams (`ExamListScreen.tsx`)**
```typescript
// Logic: First 5 exams (Index 0-4) are FREE.
const isLocked = index >= 5 && !isPro;
```
*   Locked exams show a lock icon and reduced opacity.
*   Clicking a locked exam opens `PaywallModal`.

**B. Book (`BookScreen.tsx`)**
```typescript
// Logic: Chapter 1 (Index 0) is FREE.
const isLocked = index > 0 && !isPro;
```
*   Locked chapters show a lock icon.

### 6.4 Authentication Integration
*   **Guest Mode:** The app uses `signInAnonymously` on launch.
*   **RevenueCat Identity:** The Firebase User ID is *not* currently set as the RevenueCat App User ID (to keep it simple). We rely on RevenueCat's anonymous IDs initially.
*   **Future:** When "Account Linking" is implemented, we will call `Purchases.logIn(firebaseUid)` to merge the anonymous history with the signed-in user.

---

## 7. Troubleshooting Guide

**Issue: Infinite Loading Spinner on Paywall**
*   **Cause 1:** "Paid Apps Agreement" in App Store Connect is not Green/Active.
*   **Cause 2:** Product status is `MISSING_METADATA` (Upload a screenshot in App Store Connect!).
*   **Cause 3:** Testing on a Physical Device without a valid Sandbox Account.
*   **Solution:** Test on iOS Simulator first. If it works there, the Code is correct, and the issue is Apple Configuration.

**Issue: "Invalid API Key"**
*   **Cause:** `.env` file is missing or not picked up.
*   **Solution:** Run `yarn start --reset-cache`.

**Issue: Old Users Lost Access**
*   **Check:** Ensure the **Legacy Product IDs** (v1.0) are attached to the `pro_access` entitlement in RevenueCat. This "grandfathers" them in automatically.
