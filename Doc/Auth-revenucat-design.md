Life in the UK App – Auth & In-App Purchase Workflow

(React Native + Firebase + RevenueCat + Google Sign-In)

Scope: Product/technical design only. No code. This is a Markdown spec that you can drop into your repo as AUTH_AND_IAP_WORKFLOW.md.

⸻

1. Context & Goals

App stack
	•	Frontend: React Native (New Architecture)
	•	Backend / Cloud:
	•	Firebase (Auth, Firestore/RTDB, Crashlytics, Remote Config / dynamic content)
	•	RevenueCat (In-app purchases & subscriptions for iOS + Android)
	•	Auth methods to support
	•	Anonymous usage (no login, no email)
	•	Email + password (Firebase Auth)
	•	Google Sign-In (Firebase Auth with Google provider)
	•	Monetization
	•	Free content: some exams + sample book chapters
	•	Paid content behind RevenueCat paywall (subscriptions / in-app purchases)

High-level goals
	1.	Optional accounts
	•	User can fully use the app anonymously, including purchasing via RevenueCat.
	•	Accounts (email or Google) are recommended, not required.
	2.	Stable identity for purchases
	•	If user logs in (email or Google), all purchases should follow their account across:
	•	Devices
	•	Re-installs
	•	If user stays anonymous, RevenueCat + Store account should still recover purchases (via “Restore Purchases”).
	3.	Tight integration: Firebase Auth ↔ RevenueCat
	•	Each authenticated user should map to a stable appUserID in RevenueCat (preferably Firebase UID).
	•	Anonymous user uses RevenueCat anonymous ID, which can later be linked/merged when the user creates an account.
	4.	Correct handling of login / logout
	•	Login: sync user identity to RevenueCat, fetch entitlements, update paywall UI.
	•	Logout: log out from Firebase, reset RevenueCat to anonymous, clear cached user state and entitlements.
	5.	Modern UX
	•	Clear flows for:
	•	Sign up (email or Google)
	•	Login (email or Google)
	•	Logout
	•	Forgot password (email users)
	•	Restore purchases
	•	Transparent error messages and recovery paths.

⸻

2. Core Concepts & IDs

2.1 User Types
	1.	Anonymous user
	•	No Firebase account.
	•	No email/Google identity.
	•	RevenueCat uses an anonymous user ID (auto-generated).
	•	User can:
	•	Use free content.
	•	Purchase subscription via app store (through RevenueCat).
	•	Purchases are tied to:
	•	RevenueCat anonymous ID
	•	Underlying Apple/Google Store account.
	2.	Registered (Email + Password) user
	•	Firebase Auth user with email + password.
	•	Stable ID: firebaseUid.
	•	RevenueCat appUserID = firebaseUid.
	•	Can use same account on multiple devices.
	3.	Registered (Google) user
	•	Firebase Auth user with Google provider.
	•	Still has a firebaseUid.
	•	RevenueCat appUserID = firebaseUid.
	•	Same behavior as email user, different sign-in method.

2.2 ID Mapping
	•	Firebase:
	•	firebaseUid – primary stable user ID for all authenticated users (email or Google).
	•	RevenueCat:
	•	appUserID – identity for entitlements and purchases.
	•	For anonymous users: RevenueCat auto-creates an anonymous user ID.
	•	For logged-in users: set appUserID = firebaseUid.

Key principle:

There should be at most one canonical ID per logged-in user across Firebase & RevenueCat: the firebaseUid.

2.3 Local State (Client)

Locally the app should keep (in Redux or similar):
	•	authState:
	•	status: anonymous | authenticated | loading
	•	authProvider: none | email | google
	•	firebaseUid (if auth’d)
	•	email (if available)
	•	displayName / photoURL (if available)
	•	subscriptionState:
	•	status: none | active | expired | billingIssue | unknown
	•	productId
	•	renewalType: auto-renewing | non-renewing
	•	expiresAt
	•	source: revenuecat
	•	uiState:
	•	Flags for showing paywall, “restore purchases” success / failure, etc.

⸻

3. Main Screens & UX Elements

3.1 Login / Account Screen

This screen is not mandatory for usage but provides account options.

Elements:
	•	App logo + description (“Sync your progress and purchases across devices”).
	•	Buttons:
	•	“Continue without an account” (anonymous)
	•	“Continue with Google”
	•	Email form:
	•	Email input
	•	Password input
	•	Login button
	•	“Create an account” link
	•	“Forgot password?” link
	•	Optional: small line of text:
	•	“You can always continue without an account. Purchases are linked to your App Store / Google Play account.”

3.2 Paywall Screen
	•	Shows:
	•	What’s locked (full book, 40+ exams, flashcards, etc.)
	•	Subscription/products (e.g., Monthly, Yearly).
	•	Buttons:
	•	“Continue” / “Subscribe”
	•	“Restore purchases”
	•	“Maybe later” or close (if not hard-locked).
	•	Account hint:
	•	If anonymous: “For best experience, create an account so you can access your purchase on other devices.”

⸻

4. High-Level Flows

We’ll document the flows, then provide some Mermaid diagrams.

4.1 App Launch
	1.	App starts.
	2.	Initialize Firebase.
	3.	Attach Firebase Auth listener:
	•	If user is already authenticated (from previous session):
	•	Get firebaseUid.
	•	Set authState.status = authenticated.
	•	Else:
	•	authState.status = anonymous.
	4.	Initialize RevenueCat:
	•	If authenticated:
	•	Configure with appUserID = firebaseUid.
	•	If anonymous:
	•	Configure with no explicit appUserID → RevenueCat uses anonymous ID.
	5.	Fetch RevenueCat entitlements:
	•	Update subscriptionState from entitlements.
	6.	UI shows appropriate access:
	•	Free content + locked premium content if no active subscription.
	•	Full access if subscription is active.

⸻

4.2 Anonymous Usage Flow

Scenario: User opens the app and skips login.
	1.	App starts → no Auth user → anonymous state.
	2.	RevenueCat initialized as anonymous.
	3.	User can:
	•	Use free exams/book samples.
	•	Open paywall and subscribe.

Purchases as anonymous:
	•	When user purchases:
	•	RevenueCat associates purchase with:
	•	Anonymous ID
	•	Underlying Store account (Apple/Google).
	•	On reinstall:
	•	As long as same Store account is used:
	•	“Restore Purchases” will recover entitlements.

⸻

4.3 Register / Login with Email + Password

4.3.1 New account (email sign-up)
Flow:
	1.	User opens Login screen → taps “Create an account”.
	2.	Inputs email + password → taps “Create account”.
	3.	App calls Firebase createUserWithEmailAndPassword.
	4.	On success:
	•	Get firebaseUid.
	•	If user had existing anonymous RevenueCat ID with active purchases:
	•	Call RevenueCat logIn(firebaseUid) to transfer entitlements to this ID.
	•	If no prior purchases:
	•	Just set appUserID = firebaseUid.
	5.	Fetch entitlements again from RevenueCat.
	6.	Update local authState & subscriptionState.
	7.	Show success message:
	•	“Account created. Your purchases are now linked to your account.”

4.3.2 Existing user login (email)
	1.	User enters email + password → taps “Login”.
	2.	Firebase signInWithEmailAndPassword.
	3.	On success:
	•	Get firebaseUid.
	•	Call RevenueCat logIn(firebaseUid):
	•	RevenueCat merges any anonymous purchases into this user if needed.
	•	Fetch entitlements.
	•	Update local states & UI.

Edge case:
	•	If RevenueCat returns “User already logged in”:
	•	Just proceed, ensure entitlements are refreshed.
	•	If network/auth error from Firebase:
	•	Show user-friendly errors:
	•	Invalid password:
“The email or password is incorrect. Please try again.”
	•	Network error:
“We couldn’t connect. Please check your internet connection and try again.”

⸻

4.4 Login with Google

Conceptually similar to email login, but with Google provider.

Flow:
	1.	User taps “Continue with Google”.
	2.	App opens Google Sign-In UI:
	•	User selects Google account.
	3.	App receives Google token and passes it to Firebase GoogleAuthProvider.
	4.	Firebase signs in user and returns:
	•	firebaseUid
	•	Email
	•	Display name, photo (optional)
	5.	App calls RevenueCat logIn(firebaseUid).
	6.	Fetch entitlements from RevenueCat.
	7.	Update local state & UI.

Considerations:
	•	If user previously used email/password with the same email:
	•	Firebase may link identities or require explicit account linking; define product behavior:
	•	For this app, simplest approach:
	•	If Google sign-in succeeds and returns same firebaseUid, continue normally.
	•	If Firebase indicates conflict, present UX:
	•	“An account with this email already exists. Please log in using email and password, then you can link your Google account from settings.” (optional feature for later).
	•	Error messages:
	•	User cancels Google selection:
	•	“Sign-in cancelled” (just show toast, do nothing).
	•	Network errors:
	•	“We couldn’t reach Google. Please check your connection and try again.”

⸻

4.5 Linking Anonymous Purchases After Login

Key requirement: A user might buy subscription anonymously, then later create an account.

Design:
	•	Always call RevenueCat logIn(firebaseUid) after a successful login/registration.
	•	RevenueCat is designed to:
	•	Merge anonymous entitlements with the new appUserID.
	•	After this merge:
	•	The user’s purchases are now associated with their account.
	•	The app should:
	•	Fetch entitlements after logIn.
	•	If an active subscription is detected:
	•	Show a one-time message:
	•	“We found your previous purchase and linked it to your account.”

⸻

4.6 Logout Flow

User logs out from the app.

Steps:
	1.	From Account / Settings → user taps “Logout”.
	2.	Confirm dialog:
	•	“Are you sure you want to log out? You will keep your purchase, but you’ll need to sign in again to sync across devices.”
	3.	On confirmation:
	1.	Call Firebase signOut().
	2.	Call RevenueCat to switch to anonymous:
	•	Use logOut() / re-configure RevenueCat without appUserID so it returns to an anonymous user.
	3.	Clear local authState (set to anonymous).
	4.	Clear user-specific data in local cache (saved progress, favourites, etc. if they are user-bound).
	5.	Fetch entitlements for the anonymous state:
	•	This will represent whatever RevenueCat associates with that anonymous identity & Store account.

Important:

Do NOT remove or invalidate the underlying app store subscription itself. Subscriptions are managed by Apple/Google; we only change which user ID sees them.

⸻

4.7 Purchase Flow (From Paywall)
	1.	User (anonymous or logged-in) opens paywall.
	2.	App calls RevenueCat to fetch offerings and products.
	3.	User selects a subscription and taps “Continue” / “Subscribe”.
	4.	RevenueCat SDK:
	•	Presents native App Store / Google Play purchase dialog.
	5.	On successful purchase:
	•	RevenueCat validates with App Store / Google Play.
	•	RevenueCat updates entitlements.
	•	App listens to purchase completion callback.
	6.	App:
	•	Fetches latest entitlements.
	•	If subscription is active:
	•	subscriptionState.status = active.
	•	Unlock premium content immediately.
	•	Show success message:
	•	“Subscription activated! All premium content is now unlocked.”

Edge cases:
	•	User cancels purchase:
	•	Show: “Purchase cancelled. You can try again at any time.”
	•	Store error:
	•	“We couldn’t complete the purchase. Please try again or contact support.”

⸻

4.8 Restore Purchases Flow

This is crucial for:
	•	Re-installs.
	•	Device changes.
	•	Anonymous users who don’t want to log in.

Flow:
	1.	User taps “Restore purchases” (on paywall / settings).
	2.	App calls RevenueCat restorePurchases() / equivalent.
	3.	RevenueCat:
	•	Contacts App Store / Google Play.
	•	Rebuilds entitlements for the current user (anonymous or logged-in).
	4.	App:
	•	Fetches latest entitlements.
	•	If active subscription found:
	•	Show: “Your purchases have been restored.”
	•	Update subscriptionState and unlock content.
	•	If nothing found:
	•	Show: “We couldn’t find any active purchases for this account/store. Make sure you are signed into the correct App Store / Google Play account.”

⸻

4.9 Forgot Password (Email Users)
	1.	On Login screen → user taps “Forgot password?”.
	2.	Enter email → tap “Reset password”.
	3.	App calls Firebase sendPasswordResetEmail.
	4.	On success:
	•	Show: “We’ve sent a password reset link to [email]. Please check your inbox.”
	5.	On error:
	•	If user not found:
	•	“We couldn’t find an account with this email. Please check and try again.”
	•	If network:
	•	“We couldn’t connect. Please check your internet connection and try again.”

⸻

4.10 Account Deletion (Future Enhancement – Optional)

If you later implement “Delete My Account”:
	•	Confirm twice:
“This will delete your account and all related data in this app. It will not cancel your subscription. You can manage your subscription from the App Store / Google Play.”
	•	Steps:
	1.	Delete user data in Firestore.
	2.	Optionally, call RevenueCat to anonymize / dissociate user (keeping entitlements per store rules but removing personal info).
	3.	Firebase deleteUser.
	4.	Sign out and reset to anonymous.

⸻

5. State & Cache Consistency

5.1 When to Refresh RevenueCat Entitlements

The app should refresh entitlements in these moments:
	•	On app launch (after auth initialization).
	•	After successful login / logout.
	•	After purchase flow completes.
	•	After restore purchases completes.
	•	After app returns from background (optional, or periodically if session long).

5.2 Local Caching
	•	Use RevenueCat’s built-in caching; avoid building your own subscription cache logic.
	•	Local Redux/state is mostly a view over RevenueCat’s state:
	•	On update, overwrite from RevenueCat data.
	•	For remote features that depend on subscription on the server side (e.g., you want to validate on your own backend later):
	•	You may store a snapshot of subscription status in Firestore but always treat RevenueCat as source of truth.

⸻

6. Error Handling & UX Copy

6.1 Categories of Errors
	1.	Network issues
	•	No internet / timeout.
	•	Handling:
	•	Show simple messages:
	•	“We couldn’t connect. Please check your internet connection and try again.”
	•	Provide a retry button.
	2.	Auth errors
	•	Invalid email / password.
	•	Email already in use.
	•	User not found.
	•	Provider errors (Google cancelled).
	•	Messaging:
	•	“The email or password is incorrect.”
	•	“This email is already registered. Try logging in instead.”
	•	“We couldn’t find an account with this email.”
	3.	RevenueCat / Store errors
	•	Purchase cancelled:
	•	“Purchase cancelled. No changes were made.”
	•	Billing issues / declined:
	•	“Your payment method was declined. Please check your App Store / Google Play payment settings.”
	•	Restore finds no purchases:
	•	“No active purchases were found for this App Store / Google Play account.”
	4.	Consistency issues
	•	Unexpected mismatch between Firebase UID and RevenueCat appUserID (rare):
	•	Attempt to re-logIn to RevenueCat with current firebaseUid.
	•	If failure persists:
	•	Show generic error:
	•	“We’re having trouble syncing your subscription. Please try again later or contact support.”

⸻

7. Security & Privacy Considerations (Non-Coding)
	•	Do not store raw passwords locally.
	•	Limit local storage to:
	•	Access tokens handled by Firebase SDK.
	•	Minimal user profile details (email, display name).
	•	Ensure:
	•	Logout clears any user-specific local data (bookmarks, progress) if they are tied to identity.
	•	For crash logs:
	•	Attach firebaseUid / appUserID as user ID to Crashlytics (anonymized if necessary).
	•	Show a simple privacy note:
	•	“We use Firebase and RevenueCat to manage your account and subscriptions. Your purchases are securely processed by the App Store / Google Play.”

⸻

8. Example Sequence Diagrams (Mermaid)

You can paste these into GitHub / tools that support Mermaid.

8.1 App Launch & Entitlement Fetch

sequenceDiagram
    participant User
    participant App
    participant Firebase
    participant RevenueCat

    User->>App: Launch app
    App->>Firebase: Initialize & check current user
    Firebase-->>App: returns user (authenticated or null)

    alt Authenticated
        App->>App: authState = authenticated (firebaseUid)
        App->>RevenueCat: configure(appUserID = firebaseUid)
    else Anonymous
        App->>App: authState = anonymous
        App->>RevenueCat: configure(anonymous)
    end

    App->>RevenueCat: getEntitlements()
    RevenueCat-->>App: entitlements (active / none)
    App->>App: Update subscriptionState & UI

8.2 Login with Google and Link Purchases

sequenceDiagram
    participant User
    participant App
    participant Google
    participant Firebase
    participant RevenueCat

    User->>App: Tap "Continue with Google"
    App->>Google: Open Google Sign-In
    Google-->>App: Google auth token
    App->>Firebase: Sign in with Google token
    Firebase-->>App: firebaseUid

    App->>RevenueCat: logIn(firebaseUid)
    RevenueCat-->>App: success + entitlements updated

    App->>RevenueCat: getEntitlements()
    RevenueCat-->>App: active subscription / none

    App->>App: Update authState & subscriptionState
    App-->>User: Show logged-in UI & unlocked content if active

8.3 Logout and Reset to Anonymous

sequenceDiagram
    participant User
    participant App
    participant Firebase
    participant RevenueCat

    User->>App: Tap "Logout"
    App->>User: Confirm dialog
    User-->>App: Confirm

    App->>Firebase: signOut()
    Firebase-->>App: success

    App->>RevenueCat: logOut() / reconfigure anonymous
    RevenueCat-->>App: success

    App->>RevenueCat: getEntitlements()
    RevenueCat-->>App: anonymous entitlements (probably none)

    App->>App: authState = anonymous, subscriptionState updated
    App-->>User: Show anonymous UI (free + paywall)


⸻

9. Summary of Product Requirements (Checklist)

Auth
	•	Support anonymous usage by default.
	•	Support email + password registration & login via Firebase.
	•	Support Google Sign-In via Firebase provider.
	•	Implement forgot password flow for email users.
	•	Maintain firebaseUid as canonical user ID.
	•	Allow logout with confirmation.

RevenueCat Integration
	•	Use RevenueCat anonymous ID for non-logged-in users.
	•	Use firebaseUid as appUserID for logged-in users.
	•	Always call logIn(firebaseUid) after successful login/registration.
	•	Call RevenueCat logOut() or equivalent on app logout.
	•	Implement purchase flow from paywall.
	•	Implement “Restore purchases” button and flow.

State & UI
	•	Store authState and subscriptionState in global state (e.g., Redux).
	•	Refresh entitlements on:
	•	App launch
	•	Login / logout
	•	Purchase completion
	•	Restore purchases
	•	Lock/unlock content based on subscriptionState.status.
	•	Provide clear copy for errors and confirmations.

Future (optional)
	•	Account deletion flow.
	•	Settings screen to show current plan, renewal date, manage subscription (deep link to App Store / Google Play subscription settings).
	•	Linking multiple providers (email + Google) to same Firebase account.

⸻