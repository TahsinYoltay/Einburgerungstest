# Authentication & RevenueCat Refactoring Plan

**Project:** Life in the UK App  
**Date Created:** December 8, 2025  
**Status:** Planning Phase  
**Reference Design:** [Auth-revenucat-design.md](./Auth-revenucat-design.md)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Phase 1: Audit & Documentation](#phase-1-audit--documentation)
4. [Phase 2: Redux State Refactoring](#phase-2-redux-state-refactoring)
5. [Phase 3: RevenueCat Service Enhancement](#phase-3-revenuecat-service-enhancement)
6. [Phase 4: Auth Service Enhancement](#phase-4-auth-service-enhancement)
7. [Phase 5: AuthProvider Refactoring](#phase-5-authprovider-refactoring)
8. [Phase 6: App Initialization Fix](#phase-6-app-initialization-fix)
9. [Phase 7: UI Components Update](#phase-7-ui-components-update)
10. [Phase 8: Testing & Validation](#phase-8-testing--validation)

---

## Executive Summary

This refactoring plan aligns the current authentication and RevenueCat implementation with the product specification defined in `Auth-revenucat-design.md`. The main goals are:

1. **Proper State Management:** Separate `authState` and `subscriptionState` as per design spec Section 2.3
2. **RevenueCat Integration:** Implement correct `appUserID` mapping using Firebase UID (Section 2.2)
3. **Auth Flow Compliance:** Follow all flows defined in Sections 4.1-4.9 (Launch, Login, Logout, Purchase, Restore)
4. **Error Handling:** Implement user-friendly error messages from Section 6
5. **Security & Best Practices:** Follow industry standards for auth and IAP

---

## Current State Analysis

### ✅ What's Working
- ✅ Firebase Auth SDK integrated (`@react-native-firebase/auth`)
- ✅ Google Sign-In SDK integrated (`@react-native-google-signin/google-signin`)
- ✅ RevenueCat SDK integrated (`react-native-purchases`)
- ✅ Anonymous login on app launch
- ✅ Basic Redux state management
- ✅ PaywallModal UI component
- ✅ Login/Register/ForgotPassword screens exist

### ❌ Critical Gaps
- ❌ Redux state doesn't match design spec (Section 2.3)
- ❌ RevenueCat not configured with `appUserID`
- ❌ Missing `Purchases.logIn(firebaseUid)` after authentication
- ❌ Missing `Purchases.logOut()` on sign out
- ❌ No entitlement refresh mechanism
- ❌ Forgot password not implemented (just placeholder)
- ❌ Error messages are generic, not user-friendly
- ❌ Anonymous purchase linking unclear

### 📦 Dependencies Status
```json
"@react-native-firebase/auth": "^22.2.1",       // ✅ Installed
"@react-native-google-signin/google-signin": "^16.0.0",  // ✅ Installed
"react-native-purchases": "^9.6.9",             // ✅ Installed
"@reduxjs/toolkit": "^2.8.2"                    // ✅ Installed
```

---

## Phase 1: Audit & Documentation

**Status:** ✅ COMPLETED

### Objectives
- [x] Review design documentation (`Auth-revenucat-design.md`)
- [x] Analyze current codebase implementation
- [x] Identify gaps between spec and implementation
- [x] Create this refactoring plan document

### Deliverables
- [x] `AUTH_REFACTORING_PLAN.md` (this document)
- [x] Gap analysis completed

---

## Phase 2: Redux State Refactoring

**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH (Foundation for all other phases)  
**Estimated Effort:** 2-3 hours

### Objectives
Restructure Redux state to match design specification Section 2.3.

### Current State Structure
```typescript
// src/store/slices/userSlice.ts
interface User {
  id: string;
  email: string;
  displayName: string | null;
  isAnonymous: boolean;
  isLoggedIn: boolean;
  isPremium: boolean;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
```

### Required State Structure (Design Spec Section 2.3)
```typescript
// NEW: src/store/slices/authSlice.ts
interface AuthState {
  status: 'anonymous' | 'authenticated' | 'loading';
  authProvider: 'none' | 'email' | 'google';
  firebaseUid: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  error: string | null;
}

// NEW: src/store/slices/subscriptionSlice.ts
interface SubscriptionState {
  status: 'none' | 'active' | 'expired' | 'billingIssue' | 'unknown' | 'loading';
  productId: string | null;
  renewalType: 'auto-renewing' | 'non-renewing' | null;
  expiresAt: string | null;  // ISO date string
  source: 'revenuecat';
  error: string | null;
}
```

### Tasks

#### 2.1: Create Auth Slice
- [ ] **File:** `src/store/slices/authSlice.ts` (NEW)
- [ ] **Actions to implement:**
  - `setAuthLoading(boolean)`
  - `setAuthenticatedUser({ firebaseUid, email, displayName, photoURL, authProvider })`
  - `setAnonymousUser({ firebaseUid })`
  - `clearAuth()`
  - `setAuthError(string | null)`
- [ ] **Selectors to export:**
  - `selectIsAuthenticated` (returns `status === 'authenticated'`)
  - `selectIsAnonymous` (returns `status === 'anonymous'`)
  - `selectAuthProvider`
  - `selectUserEmail`

#### 2.2: Create Subscription Slice
- [ ] **File:** `src/store/slices/subscriptionSlice.ts` (NEW)
- [ ] **Actions to implement:**
  - `setSubscriptionLoading(boolean)`
  - `setSubscriptionActive({ productId, renewalType, expiresAt })`
  - `setSubscriptionExpired()`
  - `setSubscriptionNone()`
  - `setSubscriptionError(string | null)`
- [ ] **Selectors to export:**
  - `selectHasActiveSubscription` (returns `status === 'active'`)
  - `selectSubscriptionStatus`
  - `selectProductId`

#### 2.3: Update Store Configuration
- [ ] **File:** `src/store/index.ts`
- [ ] Add `authReducer` to root reducer
- [ ] Add `subscriptionReducer` to root reducer
- [ ] Update persist whitelist: `whitelist: ['auth', 'subscription', 'exam', 'content', 'book', 'rating']`

#### 2.4: Migration Strategy
- [ ] **Decision Point:** Keep or deprecate `userSlice.ts`?
  - **Option A:** Deprecate `userSlice` entirely, migrate all usages
  - **Option B:** Keep `userSlice` for backward compatibility during transition
  - **Recommendation:** Option A for clean architecture

#### 2.5: Update Component Imports
- [ ] Update `AuthProvider.tsx` to use new slices
- [ ] Update `LoginScreen.tsx` to use new selectors
- [ ] Update `RegisterScreen.tsx` to use new selectors
- [ ] Update `SettingsScreen.tsx` to use new selectors
- [ ] Update `PaywallModal.tsx` to use new selectors
- [ ] Search for all `useAppSelector(state => state.user)` usages and update

### Testing Checklist
- [ ] Redux DevTools shows correct state structure
- [ ] Persisted state loads correctly after app restart
- [ ] All screens display user info correctly
- [ ] No console errors related to missing state properties

### Files Modified
- `src/store/slices/authSlice.ts` (NEW)
- `src/store/slices/subscriptionSlice.ts` (NEW)
- `src/store/index.ts` (MODIFIED)
- `src/providers/AuthProvider.tsx` (MODIFIED)
- `src/screens/auth/LoginScreen/LoginScreen.tsx` (MODIFIED)
- `src/screens/auth/RegisterScreen/RegisterScreen.tsx` (MODIFIED)
- `src/screens/settings/SettingsScreen/SettingsScreen.tsx` (MODIFIED)
- `src/components/common/PaywallModal.tsx` (MODIFIED)
- `src/store/slices/userSlice.ts` (DEPRECATED/REMOVED)

---

## Phase 3: RevenueCat Service Enhancement

**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH  
**Estimated Effort:** 3-4 hours  
**Dependencies:** Phase 2 (needs subscription state)

### Objectives
Implement proper RevenueCat integration following design spec Sections 4.1, 4.5, 4.7, 4.8.

### Current Issues
```typescript
// ❌ CURRENT: No appUserID management
async configure() {
  Purchases.configure({ apiKey: apiKey.trim() });
  this.isConfigured = true;
}

// ❌ Missing: No login/logout methods
// ❌ Missing: No entitlement mapping to Redux
```

### Required Implementation

#### 3.1: Add User ID Configuration
- [ ] **File:** `src/services/PurchaseService.ts`
- [ ] **Method:** `configureWithUser(firebaseUid?: string): Promise<void>`
  ```typescript
  async configureWithUser(firebaseUid?: string): Promise<void> {
    if (this.isConfigured) return;
    
    const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
    if (!apiKey) throw new Error('RevenueCat API Key missing');
    
    if (firebaseUid) {
      // Authenticated user
      Purchases.configure({ apiKey, appUserID: firebaseUid });
    } else {
      // Anonymous user
      Purchases.configure({ apiKey });
    }
    
    this.isConfigured = true;
  }
  ```

#### 3.2: Add Login Method (Design Spec Section 4.3, 4.4)
- [ ] **Method:** `loginUser(firebaseUid: string): Promise<CustomerInfo>`
  ```typescript
  async loginUser(firebaseUid: string): Promise<CustomerInfo> {
    if (!this.isConfigured) await this.configure();
    
    console.log('[PurchaseService] Logging in user to RevenueCat:', firebaseUid);
    
    const { customerInfo } = await Purchases.logIn(firebaseUid);
    console.log('[PurchaseService] Login success. Original ID:', customerInfo.originalAppUserId);
    
    return customerInfo;
  }
  ```

#### 3.3: Add Logout Method (Design Spec Section 4.6)
- [ ] **Method:** `logoutUser(): Promise<CustomerInfo>`
  ```typescript
  async logoutUser(): Promise<CustomerInfo> {
    if (!this.isConfigured) return;
    
    console.log('[PurchaseService] Logging out from RevenueCat');
    
    const { customerInfo } = await Purchases.logOut();
    await Purchases.invalidateCustomerInfoCache();
    
    console.log('[PurchaseService] Logged out. New anonymous ID:', customerInfo.originalAppUserId);
    
    return customerInfo;
  }
  ```

#### 3.4: Add Entitlement Fetching with Redux Dispatch
- [ ] **Method:** `fetchAndUpdateEntitlements(): Promise<SubscriptionState>`
  ```typescript
  async fetchAndUpdateEntitlements(): Promise<SubscriptionState> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      
      if (activeEntitlements.includes(ENTITLEMENT_ID)) {
        const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
        return {
          status: 'active',
          productId: entitlement.productIdentifier,
          renewalType: entitlement.willRenew ? 'auto-renewing' : 'non-renewing',
          expiresAt: entitlement.expirationDate || null,
          source: 'revenuecat',
          error: null
        };
      }
      
      return {
        status: 'none',
        productId: null,
        renewalType: null,
        expiresAt: null,
        source: 'revenuecat',
        error: null
      };
    } catch (error) {
      console.error('[PurchaseService] Error fetching entitlements:', error);
      return {
        status: 'unknown',
        productId: null,
        renewalType: null,
        expiresAt: null,
        source: 'revenuecat',
        error: error.message
      };
    }
  }
  ```

#### 3.5: Add User Attributes Sync
- [ ] **Method:** `syncUserAttributes(email?: string, displayName?: string): Promise<void>`
  ```typescript
  async syncUserAttributes(email?: string, displayName?: string): Promise<void> {
    if (!this.isConfigured) return;
    
    try {
      if (email) await Purchases.setEmail(email);
      if (displayName) await Purchases.setDisplayName(displayName);
      
      console.log('[PurchaseService] User attributes synced');
    } catch (error) {
      console.error('[PurchaseService] Error syncing attributes:', error);
    }
  }
  ```

#### 3.6: Update Existing Methods
- [ ] **Update:** `restorePurchases()` to return `SubscriptionState`
- [ ] **Update:** `purchasePackage()` to return `SubscriptionState`
- [ ] **Update:** `checkProStatus()` to use new entitlement structure

### Testing Checklist
- [ ] Anonymous user: RevenueCat uses anonymous ID
- [ ] Login: `Purchases.logIn(firebaseUid)` called successfully
- [ ] Entitlements: Redux subscription state updates correctly
- [ ] Logout: RevenueCat switches back to anonymous
- [ ] Purchase: Subscription state updates after purchase
- [ ] Restore: Works for both anonymous and logged-in users

### Files Modified
- `src/services/PurchaseService.ts` (MODIFIED)

---

## Phase 4: Auth Service Enhancement

**Status:** ⏳ PENDING  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 2 hours

### Objectives
- Implement forgot password functionality (Design Spec Section 4.9)
- Add user-friendly error handling (Design Spec Section 6)
- Improve existing auth methods

### Tasks

#### 4.1: Implement Forgot Password
- [ ] **File:** `src/services/AuthService.ts`
- [ ] **Method:** `sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }>`
  ```typescript
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AuthService] Sending password reset email to:', email);
      await auth().sendPasswordResetEmail(email);
      console.log('[AuthService] Password reset email sent');
      return { success: true };
    } catch (error: any) {
      console.error('[AuthService] Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      }
      
      return { success: false, error: errorMessage };
    }
  }
  ```

#### 4.2: Create Error Message Utility
- [ ] **File:** `src/utils/authErrorMessages.ts` (NEW)
  ```typescript
  export const getAuthErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      // Network errors
      'auth/network-request-failed': 'No internet connection. Please check your network and try again.',
      
      // Email/Password errors
      'auth/invalid-email': 'Invalid email address',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
      'auth/weak-password': 'Password should be at least 6 characters',
      
      // Google Sign-In errors
      'auth/account-exists-with-different-credential': 'An account with this email already exists with a different sign-in method',
      'auth/credential-already-in-use': 'This Google account is already linked to another user',
      
      // Rate limiting
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      
      // Default
      'unknown': 'An unexpected error occurred. Please try again'
    };
    
    return errorMessages[errorCode] || errorMessages['unknown'];
  };
  ```

#### 4.3: Update Auth Methods with Better Error Handling
- [ ] **Update:** `signInWithGoogle()` to use error utility
- [ ] **Update:** `signInWithEmailAndPassword()` to use error utility
- [ ] **Update:** `createUserWithEmailAndPassword()` to use error utility
- [ ] **Update:** `linkGoogleAccount()` to use error utility

#### 4.4: Add Email Validation Utility
- [ ] **File:** `src/utils/validators.ts` (NEW)
  ```typescript
  export const isEmailValid = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const isPasswordValid = (password: string): boolean => {
    return password.length >= 6;
  };
  ```

### Testing Checklist
- [ ] Forgot password sends email successfully
- [ ] Error messages are user-friendly and specific
- [ ] All auth methods return proper error messages
- [ ] No generic "An error occurred" messages shown

### Files Modified
- `src/services/AuthService.ts` (MODIFIED)
- `src/utils/authErrorMessages.ts` (NEW)
- `src/utils/validators.ts` (NEW)

---

## Phase 5: AuthProvider Refactoring

**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH  
**Estimated Effort:** 3-4 hours  
**Dependencies:** Phase 2, Phase 3

### Objectives
Refactor AuthProvider to follow design spec's initialization flow (Section 4.1).

### Current Issues
```typescript
// ❌ CURRENT: RevenueCat sync happens AFTER Redux update
// ❌ CURRENT: No proper entitlement refresh
// ❌ CURRENT: Timing issues between Firebase and RevenueCat
```

### Required Flow (Design Spec Section 4.1)
```
1. App starts
2. Initialize Firebase
3. Attach Firebase Auth listener
   - If authenticated: get firebaseUid, set authState
   - If anonymous: set authState to anonymous
4. Initialize RevenueCat with appUserID
5. Fetch RevenueCat entitlements
6. Update subscriptionState
```

### Tasks

#### 5.1: Refactor onAuthStateChanged Handler
- [ ] **File:** `src/providers/AuthProvider.tsx`
- [ ] **Logic:**
  ```typescript
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (currentUser) => {
      console.log('[AuthProvider] Auth state changed:', currentUser?.uid);
      
      if (currentUser) {
        // 1. Update Auth State IMMEDIATELY
        dispatch(setAuthenticatedUser({
          firebaseUid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          authProvider: currentUser.isAnonymous ? 'none' : 
            (currentUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email')
        }));
        
        // 2. Initialize/Login to RevenueCat
        try {
          await purchaseService.loginUser(currentUser.uid);
          
          // Sync user attributes
          if (currentUser.email) {
            await purchaseService.syncUserAttributes(
              currentUser.email, 
              currentUser.displayName
            );
          }
          
          // 3. Fetch and update entitlements
          const subscriptionState = await purchaseService.fetchAndUpdateEntitlements();
          dispatch(setSubscriptionActive(subscriptionState));
          
        } catch (error) {
          console.error('[AuthProvider] RevenueCat sync error:', error);
          dispatch(setSubscriptionError(error.message));
        }
        
      } else {
        // User logged out
        dispatch(clearAuth());
        dispatch(setSubscriptionNone());
      }
      
      setLoading(false);
    });
    
    return subscriber;
  }, [dispatch]);
  ```

#### 5.2: Add Entitlement Refresh on App Foreground
- [ ] **File:** `src/providers/AuthProvider.tsx`
- [ ] **Add AppState listener:**
  ```typescript
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && user) {
        console.log('[AuthProvider] App foregrounded, refreshing entitlements');
        const subscriptionState = await purchaseService.fetchAndUpdateEntitlements();
        dispatch(setSubscriptionActive(subscriptionState));
      }
    });
    
    return () => subscription.remove();
  }, [user, dispatch]);
  ```

#### 5.3: Update SignOut Method
- [ ] **Method:** `signOut()`
  ```typescript
  const signOut = async () => {
    setLoading(true);
    
    try {
      // 1. Logout from RevenueCat first
      await purchaseService.logoutUser();
      
      // 2. Logout from Google if applicable
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        console.log('[AuthProvider] Google sign out (ignorable):', e);
      }
      
      // 3. Logout from Firebase
      await auth().signOut();
      
      // 4. Sign in anonymously
      await auth().signInAnonymously();
      
      console.log('[AuthProvider] Sign out complete');
    } catch (error) {
      console.error('[AuthProvider] Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };
  ```

### Testing Checklist
- [ ] App launch: Auth state and subscription state load correctly
- [ ] Login: RevenueCat syncs immediately after Firebase auth
- [ ] Logout: RevenueCat switches to anonymous
- [ ] App foreground: Entitlements refresh
- [ ] Purchase linking: Anonymous purchases transfer on login

### Files Modified
- `src/providers/AuthProvider.tsx` (MODIFIED)

---

## Phase 6: App Initialization Fix

**Status:** ⏳ PENDING  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 1 hour  
**Dependencies:** Phase 5

### Objectives
Clean up App.tsx initialization to avoid conflicts with AuthProvider.

### Current Issues
```typescript
// ❌ App.tsx configures RevenueCat
// ❌ App.tsx signs in anonymously
// ❌ Conflicts with AuthProvider's auth listener
```

### Tasks

#### 6.1: Remove RevenueCat Configuration from App.tsx
- [ ] **File:** `App.tsx`
- [ ] **Remove:** `initAuthAndPurchases()` function
- [ ] **Remove:** RevenueCat configure call
- [ ] **Remove:** Anonymous sign-in logic
- [ ] **Keep:** Content sync logic

#### 6.2: Let AuthProvider Handle Initialization
- [ ] AuthProvider will detect no user and trigger anonymous sign-in
- [ ] AuthProvider will configure RevenueCat

#### 6.3: Simplified App.tsx useEffect
- [ ] **Code:**
  ```typescript
  useEffect(() => {
    // Only sync content on app launch
    dispatch(syncContent()).then(() => {
      dispatch(switchExamLanguage(currentLanguage));
      dispatch(switchBookLanguage(currentLanguage));
    });
  }, [dispatch]);
  ```

### Testing Checklist
- [ ] App launches successfully
- [ ] Anonymous user created automatically
- [ ] No duplicate RevenueCat configuration
- [ ] Content syncs correctly

### Files Modified
- `App.tsx` (MODIFIED)

---

## Phase 7: UI Components Update

**Status:** ⏳ PENDING  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 3-4 hours  
**Dependencies:** Phase 2, Phase 3, Phase 4

### Objectives
Update UI components to use new state structure and proper flows.

### Tasks

#### 7.1: Update ForgotPasswordScreen
- [ ] **File:** `src/screens/auth/ForgotPasswordScreen/ForgotPasswordScreen.tsx`
- [ ] **Replace:** Placeholder with actual Firebase implementation
  ```typescript
  const handleResetPassword = async () => {
    if (!isEmailValid(email)) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    const result = await authService.sendPasswordResetEmail(email);
    setIsLoading(false);
    
    if (result.success) {
      setShowSuccess(true);
    } else {
      setError(result.error || t('auth.errors.resetFailed'));
    }
  };
  ```

#### 7.2: Update LoginScreen
- [ ] **File:** `src/screens/auth/LoginScreen/LoginScreen.tsx`
- [ ] **Update:** Use new auth state selectors
  ```typescript
  const authStatus = useAppSelector(selectAuthStatus);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  ```
- [ ] **Update:** Use error message utility
- [ ] **Update:** Navigation logic based on auth status

#### 7.3: Update RegisterScreen
- [ ] **File:** `src/screens/auth/RegisterScreen/RegisterScreen.tsx`
- [ ] **Update:** Use new auth state selectors
- [ ] **Update:** Use error message utility
- [ ] **Update:** Navigation logic based on auth status

#### 7.4: Update PaywallModal
- [ ] **File:** `src/components/common/PaywallModal.tsx`
- [ ] **Update:** Use subscription state
  ```typescript
  const subscriptionStatus = useAppSelector(selectSubscriptionStatus);
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  ```
- [ ] **Add:** Anonymous user hint (Design Spec Section 3.2)
  ```typescript
  {isAnonymous && (
    <Text style={styles.hint}>
      💡 Create an account to access your purchase on other devices
    </Text>
  )}
  ```
- [ ] **Update:** Purchase flow to update subscription state
- [ ] **Update:** Restore flow with better feedback

#### 7.5: Update SettingsScreen
- [ ] **File:** `src/screens/settings/SettingsScreen/SettingsScreen.tsx`
- [ ] **Update:** Use new auth/subscription selectors
- [ ] **Update:** Restore purchases with proper feedback (Design Spec Section 4.8)
  ```typescript
  const handleRestorePurchases = async () => {
    setRestoring(true);
    const subscriptionState = await purchaseService.restorePurchases();
    setRestoring(false);
    
    if (subscriptionState.status === 'active') {
      Alert.alert(
        t('common.success'), 
        t('settings.purchasesRestored', 'Your purchases have been restored!')
      );
    } else {
      Alert.alert(
        t('common.info'),
        t('settings.noPurchasesFound', 'No active purchases found for this account.')
      );
    }
  };
  ```

### Testing Checklist
- [ ] Forgot password sends email and shows success
- [ ] Login screen shows proper errors
- [ ] Register screen shows proper errors
- [ ] PaywallModal shows subscription status correctly
- [ ] Settings screen restore purchases works
- [ ] All screens use new state structure

### Files Modified
- `src/screens/auth/ForgotPasswordScreen/ForgotPasswordScreen.tsx` (MODIFIED)
- `src/screens/auth/LoginScreen/LoginScreen.tsx` (MODIFIED)
- `src/screens/auth/RegisterScreen/RegisterScreen.tsx` (MODIFIED)
- `src/components/common/PaywallModal.tsx` (MODIFIED)
- `src/screens/settings/SettingsScreen/SettingsScreen.tsx` (MODIFIED)

---

## Phase 8: Testing & Validation

**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH  
**Estimated Effort:** 4-6 hours  
**Dependencies:** All previous phases

### Objectives
Comprehensive testing of all flows defined in design spec.

### Test Scenarios

#### 8.1: App Launch Flow (Section 4.1)
- [ ] **Test:** Fresh install
  - [ ] App creates anonymous user
  - [ ] RevenueCat configured with anonymous ID
  - [ ] Free content accessible
  - [ ] Premium content locked
- [ ] **Test:** Returning user (authenticated)
  - [ ] User state restored from Redux persist
  - [ ] RevenueCat configured with firebaseUid
  - [ ] Subscription status loaded
- [ ] **Test:** App foreground/background
  - [ ] Entitlements refresh on foreground
  - [ ] No unnecessary API calls

#### 8.2: Anonymous Usage Flow (Section 4.2)
- [ ] User can browse free content
- [ ] Paywall shows for premium content
- [ ] User can purchase as anonymous
- [ ] Purchase unlocks content immediately

#### 8.3: Email Registration Flow (Section 4.3.1)
- [ ] **Test:** New account creation
  - [ ] Email validation works
  - [ ] Password validation works
  - [ ] Firebase creates account
  - [ ] RevenueCat logs in with firebaseUid
  - [ ] Anonymous purchases transferred (if any)
  - [ ] Success message shown
- [ ] **Test:** Email already in use
  - [ ] Proper error message shown
  - [ ] Suggests login instead

#### 8.4: Email Login Flow (Section 4.3.2)
- [ ] **Test:** Valid credentials
  - [ ] Login successful
  - [ ] RevenueCat syncs with firebaseUid
  - [ ] Subscription status loaded
  - [ ] Navigation to home
- [ ] **Test:** Invalid credentials
  - [ ] User-friendly error message
  - [ ] No navigation
- [ ] **Test:** Network error
  - [ ] Network error message shown
  - [ ] Retry option available

#### 8.5: Google Sign-In Flow (Section 4.4)
- [ ] **Test:** First-time Google sign-in
  - [ ] Google picker shows
  - [ ] Firebase creates account
  - [ ] RevenueCat logs in with firebaseUid
  - [ ] Success navigation
- [ ] **Test:** Existing Google user
  - [ ] Login successful
  - [ ] Subscription restored
- [ ] **Test:** User cancels Google picker
  - [ ] "Sign-in cancelled" message
  - [ ] No error logged
- [ ] **Test:** Google account already linked
  - [ ] Proper error handling
  - [ ] User-friendly message

#### 8.6: Anonymous Purchase Linking (Section 4.5)
- [ ] **Test:** Purchase then create account
  - [ ] Anonymous user purchases subscription
  - [ ] User creates email account
  - [ ] RevenueCat transfers purchase to new account
  - [ ] Message: "We found your previous purchase"
  - [ ] Subscription shows as active
- [ ] **Test:** Purchase then login
  - [ ] Anonymous user purchases subscription
  - [ ] User logs in with Google
  - [ ] Purchase transferred
  - [ ] Subscription active

#### 8.7: Logout Flow (Section 4.6)
- [ ] **Test:** Logout confirmation
  - [ ] Confirmation dialog shows
  - [ ] Clear message about keeping purchases
- [ ] **Test:** Logout execution
  - [ ] Firebase signs out
  - [ ] RevenueCat logs out
  - [ ] New anonymous user created
  - [ ] Redux state cleared
  - [ ] Persisted state updated
  - [ ] Free content still accessible

#### 8.8: Purchase Flow (Section 4.7)
- [ ] **Test:** Anonymous purchase
  - [ ] Paywall shows offerings
  - [ ] Native store dialog appears
  - [ ] Purchase processes
  - [ ] Entitlements update
  - [ ] Content unlocks immediately
  - [ ] Success message shown
- [ ] **Test:** Authenticated purchase
  - [ ] Purchase linked to firebaseUid
  - [ ] Available on other devices
- [ ] **Test:** User cancels purchase
  - [ ] "Purchase cancelled" message
  - [ ] No error logged
- [ ] **Test:** Payment declined
  - [ ] User-friendly error message
  - [ ] Suggests checking payment method

#### 8.9: Restore Purchases Flow (Section 4.8)
- [ ] **Test:** Restore with active subscription
  - [ ] Entitlements restored
  - [ ] Success message shown
  - [ ] Content unlocks
- [ ] **Test:** Restore with no purchases
  - [ ] Info message: "No active purchases found"
  - [ ] Suggests checking store account
- [ ] **Test:** Restore after reinstall
  - [ ] Works for anonymous users (store account)
  - [ ] Works for authenticated users (RevenueCat ID)

#### 8.10: Forgot Password Flow (Section 4.9)
- [ ] **Test:** Valid email
  - [ ] Reset email sent
  - [ ] Success message shown
  - [ ] User can check inbox
- [ ] **Test:** Email not found
  - [ ] "No account found" message
- [ ] **Test:** Invalid email
  - [ ] "Invalid email" message
- [ ] **Test:** Network error
  - [ ] Network error message
  - [ ] Retry option

### Device Testing
- [ ] **iOS Simulator:** All flows work
- [ ] **iOS Physical Device:** All flows work
- [ ] **Android Emulator:** All flows work
- [ ] **Android Physical Device:** All flows work

### Edge Cases
- [ ] App killed during purchase
- [ ] Network loss during sign-in
- [ ] RevenueCat API timeout
- [ ] Firebase Auth timeout
- [ ] Rapid login/logout cycles
- [ ] Multiple devices same account

### Performance Testing
- [ ] App launch time < 3 seconds
- [ ] Login time < 2 seconds
- [ ] Entitlement fetch < 1 second
- [ ] No memory leaks
- [ ] Redux state size reasonable

### Documentation
- [ ] Update `AUTH_AND_IAP_STATUS.md` with final status
- [ ] Create user-facing help documentation
- [ ] Document known limitations
- [ ] Create troubleshooting guide

---

## Success Criteria

### Technical Requirements
- ✅ All unit tests pass
- ✅ No console errors or warnings
- ✅ Redux state matches design spec exactly
- ✅ RevenueCat properly configured with appUserID
- ✅ All auth flows work as designed
- ✅ Error messages are user-friendly
- ✅ Code follows React Native best practices

### User Experience
- ✅ User can use app without account
- ✅ User can purchase without account
- ✅ Account creation is smooth
- ✅ Purchases transfer on account creation
- ✅ Clear feedback on all actions
- ✅ No confusing error messages

### Security & Compliance
- ✅ No sensitive data in logs
- ✅ No hardcoded API keys
- ✅ Proper error handling (no crashes)
- ✅ Complies with Apple/Google IAP guidelines
- ✅ Privacy policy accessible

---

## Risk Assessment

### High Risk
- 🔴 **RevenueCat purchase transfer:** Anonymous to authenticated
  - **Mitigation:** Extensive testing, fallback to manual restore
- 🔴 **State synchronization:** Firebase ↔ RevenueCat ↔ Redux
  - **Mitigation:** Clear initialization sequence, proper error handling

### Medium Risk
- 🟡 **Network failures:** During auth or purchase
  - **Mitigation:** Retry logic, clear error messages
- 🟡 **Redux persist:** State corruption on upgrade
  - **Mitigation:** Migration strategy, version checking

### Low Risk
- 🟢 **UI updates:** Components using new state
  - **Mitigation:** TypeScript will catch most issues
- 🟢 **Forgot password:** Firebase API stable
  - **Mitigation:** Standard Firebase implementation

---

## Rollback Plan

If critical issues arise during refactoring:

1. **Git Strategy:** Each phase is a separate commit
2. **Rollback Points:** Can revert to any completed phase
3. **Testing Gates:** Don't proceed to next phase until current passes all tests
4. **Backup:** Keep `userSlice.ts` until Phase 7 complete

---

## Timeline Estimate

| Phase | Effort | Dependencies | Duration |
|-------|--------|--------------|----------|
| Phase 1 | ✅ Done | None | ✅ |
| Phase 2 | 2-3h | Phase 1 | 0.5 days |
| Phase 3 | 3-4h | Phase 2 | 0.5 days |
| Phase 4 | 2h | None | 0.25 days |
| Phase 5 | 3-4h | Phase 2, 3 | 0.5 days |
| Phase 6 | 1h | Phase 5 | 0.25 days |
| Phase 7 | 3-4h | Phase 2, 3, 4 | 0.5 days |
| Phase 8 | 4-6h | All | 1 day |

**Total Estimated Time:** 3-4 working days

---

## Notes & Comments

### Add Your Comments Below
_Use this section to add notes, questions, or modifications to the plan._

---

**Last Updated:** December 8, 2025  
**Document Version:** 1.0  
**Status:** Ready for Review
