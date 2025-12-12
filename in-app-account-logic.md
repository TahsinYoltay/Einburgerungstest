Nice, this is exactly the point where things can get messy if you don’t think through all the combinations up front. Let’s treat this like a product spec for your “identity + subscription” model.

I’ll structure it as a business logic matrix: all possible user journeys (anonymous vs account, before/after purchase, switching, reinstall, devices, etc.) and what the app should do / show in each case.

You can copy-paste this into a file like BUSINESS_LOGIC_AUTH_IAP.md.

⸻

0. Assumptions (how your app works today)

Let’s define the base rules I’ll use:
	1.	Firebase Auth
	•	On first open you create an anonymous Firebase user (isAnonymous = true).
	•	That user has a stable firebaseUid.
	•	When a user later signs up with email/Google, you link that anonymous user to the new credential (recommended), so the firebaseUid stays the same.
	•	If you don’t link (you create a new user), we’ll cover that as a separate, “migration” case.
	2.	RevenueCat
	•	You always set appUserID = firebaseUid (anonymous or not).
	•	So one logical identity = one Firebase UID = one RevenueCat customer.
	•	Entitlements/subscriptions are attached to that appUserID.
	3.	Account types
	•	Anonymous: Firebase isAnonymous = true, no email/password, no Google.
	•	Registered – Email: Firebase isAnonymous = false, email/password.
	•	Registered – Google: Firebase isAnonymous = false, Google provider.
	4.	Business rules
	•	No account is required to:
	•	Use the app
	•	Buy a subscription
	•	Creating an account is recommended for:
	•	Sync across devices
	•	Cross-platform convenience

⸻

1. Global Business Rules

Before we list scenarios, here are the global decisions you should stick to:

1.1 Identity and Subscription Rules
	•	Rule 1 – Single source of truth
	•	Subscription status comes only from RevenueCat entitlements.
	•	Rule 2 – One subscription = one logical identity
	•	Each subscription is attached to a single appUserID (which maps to one logical user).
	•	You never try to “copy” entitlements between users; you move/merge via linking / same UID.
	•	Rule 3 – Upgrade path
	•	If a user has a subscription as anonymous and later creates an account, that subscription must follow them with zero extra user steps (no “buy again” or “restore” needed).
	•	Rule 4 – Logout ≠ cancel subscription
	•	Logging out only changes which user is currently active.
	•	It never cancels the app store subscription.
	•	Rule 5 – Restore is last resort
	•	“Restore purchases” is for:
	•	Reinstalls
	•	New device
	•	Cases where entitlement is not visible but user insists they have paid
	•	You do not force users to hit restore in normal flows when you can handle it automatically.

⸻

2. Scenario Matrix – High Level

We’ll go through:
	1.	Anonymous, no purchase
	2.	Anonymous, purchases subscription
	3.	Anonymous, purchases, then creates account (email/Google)
	4.	User creates account first, then purchases
	5.	User with account + subscription logs out
	6.	User logs into another account (account switching)
	7.	Reinstall / new device
	8.	Cross-platform usage (iOS ↔ Android)
	9.	Subscription cancel / expiry and re-purchase
	10.	“We broke the rule” case (new UID instead of linked) – migration business logic

For each I’ll say:
	•	State (before)
	•	User action
	•	What happens technically (conceptually)
	•	What user should see

⸻

3. Detailed Scenarios

3.1 Scenario A – Anonymous, No Purchase

State
	•	Firebase: anonymous firebaseUid
	•	RevenueCat: appUserID = firebaseUid, no entitlements.

User action
	•	Use free exams, browse app, maybe open paywall.

Business logic
	•	User can:
	•	Always access free content.
	•	See paywall for locked content.
	•	No prompts to create account unless you want gentle upsell like:
	•	“Create a free account to sync your progress across devices” (optional).

What user sees
	•	Free content works.
	•	Premium content is locked with a clear paywall.
	•	“Continue without account” is always available.

⸻

3.2 Scenario B – Anonymous, Buys Subscription, Stays Anonymous

State (before purchase)
	•	Firebase: anonymous firebaseUid.
	•	RevenueCat: appUserID = same firebaseUid, no entitlements.

User action
	•	Opens paywall → taps “Subscribe” → completes purchase.

Business logic
	•	After purchase:
	•	RevenueCat marks subscription active for appUserID = firebaseUid.
	•	App receives entitlements and sets hasActiveSubscription = true.

What user sees
	•	Paywall disappears, premium content unlocked.
	•	Small banner/toast:
	•	“Subscription activated! All premium content is now unlocked.”
	•	Optional suggestion (non-blocking):
	•	On success: “Want to keep your purchase safe across devices? Create a free account.”
	•	But do not force them.

⸻

3.3 Scenario C – Anonymous Buys Subscription, THEN Creates Account

This is the tricky one and also the most important.

C1. Ideal implementation (linking Firebase anonymous user)
State (before creating account)
	•	Firebase: anonymous firebaseUid A, subscription exists on firebaseUid A.
	•	RevenueCat: appUserID = A, entitlements active.

User action
	•	Navigates to account area → taps “Create account” (email or Google).
	•	Completes sign up.

Technical business logic
	•	You link the anonymous user to the new credential:
	•	The underlying firebaseUid remains A (exact same ID).
	•	Because firebaseUid is the same:
	•	RevenueCat appUserID is unchanged.
	•	Entitlements automatically remain attached.

What user sees
	•	After registration:
	•	Nothing changes in terms of access – premium stays unlocked.
	•	Message:
“Your account has been created. Your subscription is now linked to this account and can be used on other devices.”
	•	No need for restore purchases, no weird logout/login.

C2. Non-ideal implementation (new UID created accidentally)
If by mistake your app signs in a brand-new Firebase user (not linked), you get:
	•	Old anonymous:
	•	firebaseUid A, with entitlements.
	•	New account:
	•	firebaseUid B, no entitlements.

Business rule to fix it
	•	After login:
	•	If new UID, you must call RevenueCat logIn(B) and let RevenueCat merge previous entitlements from old ID → new B (assuming current device was previously logged as A).
	•	Product logic:
	•	Always treat new account after purchase on same device as “MOVE entitlements to new account.”

What user sees
	•	They log in → subscription still unlocked.
	•	Same success message as above:
	•	“We found your previous subscription and linked it to your new account.”

⸻

3.4 Scenario D – User Creates Account First, Then Purchases

State (before purchase)
	•	Firebase: registered user (email or Google) firebaseUid U.
	•	RevenueCat: appUserID = U, no entitlements.

User action
	•	Uses app with account.
	•	Opens paywall and buys subscription.

Business logic
	•	After purchase:
	•	Subscription is permanently tied to account U.
	•	Across any device where user logs in as U, they’ll get entitlements.

What user sees
	•	Premium unlocks.
	•	Message:
	•	“Subscription activated for your account. You can use it on any device by signing in.”

This is your cleanest, recommended path; you can subtly encourage it but still keep anonymous option.

⸻

3.5 Scenario E – User Has Account + Subscription, Then Logs Out

State (before logout)
	•	Firebase: registered account firebaseUid U.
	•	RevenueCat: appUserID = U, entitlements active.

User action
	•	Goes to Settings → taps “Log out”.

Business logic
	•	You show a clear warning:
	•	“If you log out, you will lose access to your subscription on this device until you log in again or restore purchases. Your subscription is NOT cancelled.”
	•	On confirm:
	•	Firebase: signOut()
	•	App immediately creates / switches to anonymous Firebase user firebaseUid A2.
	•	RevenueCat appUserID = A2.
	•	Since subscription is attached to U, new anonymous A2 sees no entitlements.
	•	This is expected: sub = attached to account U, not this new anonymous user.

What user sees after logout
	•	Back to “free user” experience.
	•	Premium content locked again.
	•	On paywall/account screen you must now explain clearly:
	•	“You’re using the app without an account.
To regain access to your subscription, either:
	•	Log back in with your [Google/email] account, or
	•	Tap ‘Restore Purchases’ if you bought without creating an account.”

Key point:
You DO NOT tell them “you lost the subscription”. You explain that access is bound to either:
	•	Their account, or
	•	Their store account + restore.

⸻

3.6 Scenario F – User Logs Into Another Account (Account Switching)

State (before)
	•	There is account A with subscription.
	•	Now user logs out and logs in as account B without subscription.

User action
	•	Log out from A → log in as B.

Business logic
	•	When logged in as B:
	•	RevenueCat appUserID = B.
	•	Entitlements: None (unless B also has subscription).
	•	You must not show A’s subscription to B.

What user sees
	•	Logged in as B:
	•	Premium locked.
	•	Messaging:
	•	“Your current account doesn’t have an active subscription.”
	•	Offer to:
	•	“Switch back to your previous account” (if you show which email)
	•	Or “Purchase a subscription with this account”.
	•	If the user insists they paid:
	•	Suggest:
	•	“Try logging in with the account you used when purchasing, or use ‘Restore Purchases’ if you bought without an account.”

⸻

3.7 Scenario G – Reinstall / New Device, Still Anonymous

There are two sub-cases.

G1. Same platform + same app store account, anonymous
State
	•	Old install: anonymous user A with subscription (tied to Apple/Google account).
	•	New install: fresh anonymous A' (new Firebase UID, new RevenueCat appUserID).

User action
	•	Installs app on new device, doesn’t create account, taps “Restore purchases”.

Business logic
	•	RevenueCat checks underlying app store account.
	•	Finds purchase, attaches to new appUserID = A'.
	•	Entitlements become active on A’.

What user sees
	•	After restore:
	•	“Your purchases have been restored on this device.”
	•	Premium unlocked.
	•	Optionally suggest:
	•	“Create a free account so you don’t need to restore manually next time.”

G2. New device, but user logs into their account (recommended)
State
	•	Old device: account user U with subscription.
	•	New device: user logs into same account U.

Business logic
	•	Firebase: authenticates as U.
	•	RevenueCat appUserID = U.
	•	Entitlements automatically loaded from RevenueCat without needing restore.

What user sees
	•	Immediately gets full access.
	•	Maybe a small note:
	•	“Welcome back, we’ve synced your subscription.”

⸻

3.8 Scenario H – Cross-Platform (iOS ↔ Android)

State
	•	Subscription exists on RevenueCat for user U.

User action
	•	Uses app on iOS and Android with:
	•	Without account: They’re anonymous on each platform → store-specific restore is needed.
	•	With account:
	•	Logs into account U on both devices.

Business logic
	•	Without account:
	•	iOS and Android stores are separate.
	•	Restoring on iOS will not activate Android and vice versa.
	•	You should gently tell users:
	•	“To use your subscription on both iOS and Android, please create an account and sign in on each device with the same account.”
	•	With account:
	•	RevenueCat appUserID is same U across platforms.
	•	Entitlements are shared. You don’t need restore.

What user sees
	•	Clear explanation somewhere like “How subscriptions work”:
	•	“If you want to use your subscription across iOS and Android, please create an account. Otherwise, ‘Restore Purchases’ works only per platform and store account.”

⸻

3.9 Scenario I – Subscription Cancellation / Expiry / Re-purchase

State
	•	User has subscription (anon or account).

User action
	•	Cancels from App Store / Google Play, or card fails.
	•	At some point RevenueCat entitlement becomes inactive.

Business logic
	•	On next entitlement refresh:
	•	hasActiveSubscription = false, status = expired / billingIssue.
	•	In the app:
	•	Lock premium content again.
	•	Show a clear state on paywall:
	•	“Your subscription has ended” or “There’s a billing issue with your subscription.”
	•	Offer:
	•	“Renew subscription” / “Re-subscribe”.

What user sees
	•	They no longer have access to locked content.
	•	They never see “error”; they see a normal end-of-subscription UX:
	•	“Your subscription has ended. To access premium content again, please subscribe.”

⸻

3.10 Scenario J – Broken Flow (New UID Instead of Link)

Sometimes dev will accidentally:
	•	Create anonymous user A → buy →
	•	Then sign up and get new Firebase UID B (without linking).

Business business-logic decision:
What do we do if this happens?

Policy
	•	If we detect a user who:
	•	Just purchased as anonymous on this device recently, and
	•	Just created an account which has no entitlements yet,
	•	Then we treat that as an automatic migration:
	•	Call RevenueCat logIn(B) (or equivalent merging behaviour).
	•	Refresh entitlements.
	•	If entitlements appear:
	•	Store internally that user B is now the owner of that subscription.

What user sees
	•	No weirdness. From their eyes:
	•	“I bought → then I created an account → nothing broke.”
	•	Optional banner:
	•	“We’ve linked your previous purchase to your new account.”

⸻

4. What the User Should / Should NOT See (Guidelines)

4.1 Things They Should See
	1.	Clear state on paywall
	•	“Free user” vs “Active subscription” vs “Subscription ended” vs “Billing issue”.
	2.	Clear next action
	•	As a free/anonymous user:
	•	“Subscribe”
	•	“Continue without subscription”
	•	Optional: “Create an account to sync.”
	•	As an account user without sub:
	•	“Subscribe” (with note: “Subscription will be attached to this account.”)
	•	As user with sub:
	•	No paywall; maybe “Manage subscription” link.
	3.	Account hints
	•	After subscription activation as anonymous:
	•	Soft prompt: “Create an account so you can use your purchase on other devices.”
	4.	Reassurance on logout
	•	“Logging out will not cancel your subscription, but you will need to log in again or restore purchases to access premium content.”

4.2 Things They Should NOT See
	•	Never show:
	•	“Your subscription is lost”
	•	“You must create an account to keep your subscription” (because your business rule is optional account).
	•	Avoid confusing mixed messages, e.g.:
	•	“You already have a subscription but we can’t find it” – instead guide them:
	•	“Try logging in with the account you used when purchasing or tap ‘Restore Purchases’.”
	•	Don’t expose implementation details:
	•	No talk about “Firebase UID” or “RevenueCat appUserID”.

⸻

5. Implementation-Oriented Business Rules (Summary)

You can convert this into pseudo-logic for your devs:
	1.	At app start
	•	Ensure there is always a Firebase user (anonymous or logged-in).
	•	Always initialise RevenueCat with appUserID = firebaseUid.
	•	Always fetch entitlements and update subscriptionState.
	2.	When user purchases (any state)
	•	After purchase, refetch entitlements.
	•	If active:
	•	Unlock premium.
	•	Show success message.
	•	If anonymous: show optional “create account” suggestion.
	3.	When user signs up or logs in
	•	If upgrading from anonymous (link flow):
	•	Keep same UID → nothing to transfer.
	•	If new UID:
	•	Call RevenueCat to merge entitlements to new UID.
	•	After that, refetch entitlements and update UI.
	4.	When user logs out
	•	Warn about consequences.
	•	Sign out, create new anonymous user, re-init RevenueCat with new UID.
	•	Refresh entitlements (likely no sub).
	•	Show them in free mode with clear explanation and restore option.
	5.	When user presses “Restore Purchases”
	•	Call RevenueCat restore.
	•	If entitlements appear:
	•	Unlock content and show “restored” message.
	•	If anonymous: again suggest “create account”.
	•	If none:
	•	Show: “We couldn’t find any active purchases for this store account.”

⸻

If you want, next step I can:
	•	Turn this into a decision table (rows = scenario, columns = auth state, RC entitlements, user action, app reaction), or
	•	Draft exact copy for your paywall / login / logout / restore screens so you can just paste into your app.