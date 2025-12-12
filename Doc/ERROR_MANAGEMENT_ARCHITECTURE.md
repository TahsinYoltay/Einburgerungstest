# Error Management Architecture

## 🏗️ Enterprise-Level Error Management System

This document describes the centralized, enterprise-level error management architecture for authentication and subscription services.

---

## 📂 Folder Structure

```
src/
├── constants/
│   └── authProviders.ts          # Provider constants & utilities
├── utils/
│   ├── authErrorMessages.ts      # Firebase error code mapping
│   └── authProviderDetection.ts  # Provider conflict detection
├── localization/
│   └── languages/
│       ├── en.json               # User-facing messages (English)
│       └── tr.json               # Turkish translations (future)
└── services/
    └── AuthService.ts            # Uses detection & error mapping
```

---

## 🎯 Core Components

### 1. **Constants: `authProviders.ts`**
Centralized provider identifiers and utilities.

```typescript
AUTH_PROVIDERS = {
  PASSWORD: 'password',
  GOOGLE: 'google.com',
  APPLE: 'apple.com',
  FACEBOOK: 'facebook.com',
  PHONE: 'phone',
  ANONYMOUS: 'anonymous',
}
```

**Utilities:**
- `isPasswordProvider(provider)` - Check if password-based
- `isSocialProvider(provider)` - Check if OAuth/social
- `PROVIDER_DISPLAY_NAMES` - User-friendly names

---

### 2. **Provider Detection: `authProviderDetection.ts`**
Enterprise-level provider conflict detection.

#### Key Functions:

**`detectProvidersForEmail(email)`**
- Fetches all sign-in methods for an email
- Returns: providers, flags, suggestion keys

**`canRegisterWithPassword(email)`**
- Checks if email/password registration is allowed
- Detects conflicts with Google, Apple, etc.
- Returns: allowed status + reason translation key

**`canSignInWithPassword(email)`**
- Checks if email/password sign-in is possible
- Suggests correct provider if conflict detected
- Returns: possible status + suggestion translation key

#### Example Usage:

```typescript
const check = await canRegisterWithPassword('user@example.com');

if (!check.allowed) {
  // Show translated message
  showError(t(check.reasonKey));
  // "This email is registered with Google. Please sign in with Google..."
}
```

---

### 3. **Error Messages: `authErrorMessages.ts`**
Maps Firebase error codes to user-friendly messages.

```typescript
getAuthErrorMessage(errorCode: string): string
getErrorCode(error: any): string
getErrorMessage(error: any): string
```

**Handled Error Codes:**
- `auth/invalid-email` → "Invalid email address"
- `auth/user-not-found` → "No account found with this email"
- `auth/wrong-password` → "Incorrect password"
- `auth/email-already-in-use` → "Email already in use"
- And many more...

---

### 4. **Localization: `en.json`**
All user-facing messages in translation files.

#### Structure:

```json
{
  "auth": {
    "errors": {
      "invalidEmail": "Please enter a valid email address",
      "passwordMismatch": "Passwords do not match",
      ...
    },
    "providerConflict": {
      "registeredWithGoogle": "This email is registered with Google...",
      "useGoogle": "This account is registered with Google. Please use 'Continue with Google'...",
      "alreadyHasPassword": "This email is already registered. Please sign in instead.",
      ...
    }
  }
}
```

**Benefits:**
- ✅ Multi-language ready (add `tr.json` for Turkish)
- ✅ Centralized message management
- ✅ Easy to update without code changes
- ✅ Consistent messaging across app

---

## 🔄 How It Works

### **Scenario 1: User tries to register with email already used by Google**

```
1. User enters: user@gmail.com + password
2. RegisterScreen calls: authService.createUserWithEmailAndPassword()
3. AuthService calls: canRegisterWithPassword('user@gmail.com')
4. Detection finds: email exists with Google provider
5. Returns: { allowed: false, reasonKey: 'auth.providerConflict.registeredWithGoogle' }
6. Screen shows: t('auth.providerConflict.registeredWithGoogle')
   → "This email is registered with Google. Please sign in with Google or use a different email."
```

### **Scenario 2: User tries to login with password, but account is Google-only**

```
1. User enters: user@gmail.com + password
2. LoginScreen calls: authService.signInWithEmailAndPassword()
3. AuthService calls: canSignInWithPassword('user@gmail.com')
4. Detection finds: email exists but no password provider, has Google
5. Returns: { possible: false, suggestionKey: 'auth.providerConflict.useGoogle' }
6. Screen shows: t('auth.providerConflict.useGoogle')
   → "This account is registered with Google. Please use 'Continue with Google' to sign in."
```

---

## 🎨 Integration in Screens

### **LoginScreen / RegisterScreen Pattern:**

```typescript
const result = await authService.signInWithEmailAndPassword(email, password);

if (!result.success) {
  // Check for provider conflict suggestion first
  if (result.suggestionKey) {
    setError(t(result.suggestionKey)); // Translated, user-friendly
  } else if (result.error?.includes('invalid-email')) {
    setError(t('auth.errors.invalidEmail'));
  } else {
    setError(t('auth.errors.signInFailed'));
  }
}
```

---

## 📊 Covered Scenarios

### ✅ **Authentication Provider Conflicts:**

1. **Email registered with Google → Try to login with password**
   - Shows: "This account is registered with Google. Please use 'Continue with Google' to sign in."

2. **Email registered with Google → Try to register with password**
   - Shows: "This email is registered with Google. Please sign in with Google or use a different email."

3. **Email registered with Apple → Try to login/register with password**
   - Shows: "This account is registered with Apple. Please use 'Continue with Apple'..."

4. **Email/password account exists → Try to register again**
   - Shows: "This email is already registered. Please sign in instead."

5. **Email doesn't exist → Try to login**
   - Shows: "No account found with this email. Please sign up first."

6. **Wrong password**
   - Shows: "Invalid email or password"

### ✅ **Validation Errors:**
- Invalid email format
- Password too short
- Passwords don't match
- Network errors
- Rate limiting

### ✅ **All Firebase Auth Errors:**
- Mapped to user-friendly messages
- Translated via i18n system

---

## 🌍 Multi-Language Support

### **Adding New Language (e.g., Turkish):**

1. Create `src/localization/languages/tr.json`
2. Copy structure from `en.json`
3. Translate all messages:

```json
{
  "auth": {
    "providerConflict": {
      "registeredWithGoogle": "Bu e-posta Google ile kayıtlı...",
      ...
    }
  }
}
```

4. No code changes needed! ✅

---

## 🚀 Best Practices

### ✅ **DO:**
- Use translation keys for all user-facing messages
- Check provider conflicts before authentication
- Show specific, helpful error messages
- Keep error logic centralized in utils/

### ❌ **DON'T:**
- Hardcode error messages in components
- Show technical Firebase error codes to users
- Duplicate error handling logic
- Mix error handling with UI logic

---

## 🔮 Future Enhancements

### **Phase 2: RevenueCat Errors**
Create similar structure for subscription errors:

```
src/
├── constants/
│   └── subscriptionErrors.ts
├── utils/
│   └── subscriptionErrorMessages.ts
├── localization/
│   └── languages/
│       └── en.json  (add "subscription" section)
```

### **Phase 3: Analytics Integration**
Track error occurrences:

```typescript
if (result.suggestionKey) {
  analytics.logEvent('auth_provider_conflict', {
    conflictType: result.suggestionKey,
    attemptedProvider: 'password',
    existingProvider: 'google',
  });
}
```

---

## 📝 Summary

**This architecture provides:**
- ✅ Centralized error management
- ✅ Multi-language support
- ✅ Provider conflict detection
- ✅ User-friendly messages
- ✅ Enterprise-level structure
- ✅ TypeScript type safety
- ✅ Easy maintenance & scalability

**No more:**
- ❌ Scattered error handling
- ❌ Hardcoded messages
- ❌ Technical jargon shown to users
- ❌ Provider conflict confusion

---

**Last Updated:** December 2024  
**Maintained By:** Development Team
