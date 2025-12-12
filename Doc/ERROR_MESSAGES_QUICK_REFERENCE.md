# Error Messages Quick Reference

## 🎯 How to Add New Error Messages

### 1. Add Translation Key to `src/localization/languages/en.json`:

```json
{
  "auth": {
    "errors": {
      "yourNewError": "User-friendly error message here"
    }
  }
}
```

### 2. Use in Code:

```typescript
// In any screen/component
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Show error
setError(t('auth.errors.yourNewError'));
```

---

## 📋 All Available Error Messages

### **Validation Errors**
| Translation Key | Message |
|----------------|---------|
| `auth.errors.invalidEmail` | "Please enter a valid email address" |
| `auth.errors.invalidPassword` | "Password must be at least 6 characters" |
| `auth.errors.passwordMismatch` | "Passwords do not match" |

### **Authentication Errors**
| Translation Key | Message |
|----------------|---------|
| `auth.errors.invalidCredentials` | "Invalid email or password" |
| `auth.errors.signInFailed` | "Sign in failed. Please check your credentials." |
| `auth.errors.registerFailed` | "Registration failed. Please try again." |
| `auth.errors.resetFailed` | "Password reset failed. Please try again." |
| `auth.errors.emailInUse` | "Email already in use" |

### **Provider Conflict Messages**
| Translation Key | Message |
|----------------|---------|
| `auth.providerConflict.accountNotFound` | "No account found with this email. Please sign up first." |
| `auth.providerConflict.alreadyHasPassword` | "This email is already registered. Please sign in instead." |
| `auth.providerConflict.registeredWithGoogle` | "This email is registered with Google. Please sign in with Google or use a different email." |
| `auth.providerConflict.registeredWithApple` | "This email is registered with Apple. Please sign in with Apple or use a different email." |
| `auth.providerConflict.useGoogle` | "This account is registered with Google. Please use 'Continue with Google' to sign in." |
| `auth.providerConflict.useApple` | "This account is registered with Apple. Please use 'Continue with Apple' to sign in." |
| `auth.providerConflict.usePassword` | "This account uses email and password. Please enter your password to sign in." |

---

## 🔧 Common Patterns

### Pattern 1: Show Error from AuthService
```typescript
const result = await authService.signInWithEmailAndPassword(email, password);

if (!result.success) {
  if (result.suggestionKey) {
    // Provider conflict detected
    setError(t(result.suggestionKey));
  } else {
    // Firebase error
    setError(result.error);
  }
}
```

### Pattern 2: Validation Error
```typescript
if (!isEmailValid(email)) {
  setError(t('auth.errors.invalidEmail'));
  return;
}
```

### Pattern 3: Custom Error with Parameters
```typescript
// In en.json:
"greeting": "Hello {{name}}"

// In code:
t('greeting', { name: 'John' }) // "Hello John"
```

---

## 🌍 Multi-Language Support

### Current Languages:
- ✅ English (`en.json`)

### To Add New Language (e.g., Turkish):

1. Create `src/localization/languages/tr.json`
2. Copy structure from `en.json`
3. Translate all values
4. Configure in i18n setup

**No code changes needed!**

---

## ✅ Best Practices

1. **Always use translation keys**, never hardcode messages
2. **Keep keys descriptive**: `auth.errors.invalidEmail` ✅ not `error1` ❌
3. **Group by feature**: `auth.*`, `subscription.*`, `common.*`
4. **Test in all languages** before releasing
5. **Use provider detection** before showing generic errors

---

## 🚫 Common Mistakes to Avoid

❌ **DON'T:**
```typescript
// Hardcoded message
setError("Invalid email address");

// Technical Firebase error shown to user
setError(error.code); // "auth/invalid-email"
```

✅ **DO:**
```typescript
// Translated message
setError(t('auth.errors.invalidEmail'));

// User-friendly Firebase error
setError(getAuthErrorMessage(error.code));
```

---

**Quick Links:**
- Full Documentation: `ERROR_MANAGEMENT_ARCHITECTURE.md`
- Translation Files: `src/localization/languages/`
- Provider Detection: `src/utils/authProviderDetection.ts`
- Error Mapping: `src/utils/authErrorMessages.ts`
