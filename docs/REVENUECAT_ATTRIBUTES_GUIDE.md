# RevenueCat Custom Attributes Guide

## Overview
This guide explains how to use the enhanced RevenueCat integration to track user attributes and analytics.

## Available Methods

### 1. `syncDeviceInfo()`
Tracks platform and OS version information.

**Attributes tracked:**
- `platform`: 'ios' | 'android'
- `osVersion`: OS version string (e.g., '17.2' for iOS, '33' for Android)

**Usage:**
```typescript
await purchaseService.syncDeviceInfo();
```

### 2. `syncUserBehaviorData(userData)`
Tracks user engagement and app usage patterns.

**Attributes tracked:**
- `app_language`: User's selected language (e.g., 'en', 'tr')
- `auth_provider`: How user authenticated ('none', 'email', 'google')
- `account_age_days`: Days since account creation
- `exam_downloaded`: Whether exam content is downloaded
- `book_downloaded`: Whether book content is downloaded
- `total_exams_taken`: Number of exams completed
- `total_questions_answered`: Total questions answered
- `last_active_date`: ISO date string of last activity

**Usage:**
```typescript
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { selectAuthProvider } from '../store/slices/authSlice';

const { i18n } = useTranslation();
const authProvider = useAppSelector(selectAuthProvider);

await purchaseService.syncUserBehaviorData({
  language: i18n.language,
  authProvider: authProvider,
  examDownloaded: true,
  bookDownloaded: false,
  totalExamsTaken: 15,
  totalQuestionsAnswered: 300,
  lastActiveDate: new Date().toISOString(),
});
```

### 3. `setCustomAttributes(attributes)`
Set any custom attributes you want to track.

**Usage:**
```typescript
await purchaseService.setCustomAttributes({
  user_type: 'premium',
  registration_date: '2025-01-01',
  preferred_theme: 'dark',
});
```

## Recommended Integration Points

### In AuthProvider (After Login)

```typescript
// src/providers/AuthProvider.tsx
import { purchaseService } from '../services/PurchaseService';
import { useTranslation } from 'react-i18next';

const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        // ... existing login logic
        
        // Sync device info (do this once per session)
        await purchaseService.syncDeviceInfo();
        
        // Sync user behavior data
        await purchaseService.syncUserBehaviorData({
          language: i18n.language,
          authProvider: currentUser.isAnonymous ? 'none' : 'google',
          lastActiveDate: new Date().toISOString(),
        });
      }
    });
    
    return subscriber;
  }, []);
  
  return <>{children}</>;
};
```

### On Language Change

```typescript
// When user changes language
import { purchaseService } from '../services/PurchaseService';

const handleLanguageChange = async (newLanguage: string) => {
  await i18n.changeLanguage(newLanguage);
  
  // Update RevenueCat attribute
  await purchaseService.setCustomAttributes({
    app_language: newLanguage,
  });
};
```

### After Exam Completion

```typescript
// After user completes an exam
import { purchaseService } from '../services/PurchaseService';

const handleExamComplete = async (score: number, totalQuestions: number) => {
  // ... save exam results
  
  // Update RevenueCat attributes
  await purchaseService.syncUserBehaviorData({
    totalExamsTaken: updatedExamCount,
    totalQuestionsAnswered: updatedQuestionCount,
    lastActiveDate: new Date().toISOString(),
  });
};
```

### After Content Download

```typescript
// After downloading exam or book content
import { purchaseService } from '../services/PurchaseService';

const handleContentDownload = async (contentType: 'exam' | 'book') => {
  // ... download logic
  
  // Update RevenueCat attributes
  await purchaseService.syncUserBehaviorData({
    examDownloaded: contentType === 'exam' ? true : undefined,
    bookDownloaded: contentType === 'book' ? true : undefined,
  });
};
```

## Benefits of Tracking These Attributes

### 1. **User Segmentation**
- Target iOS vs Android users differently
- Identify users on older OS versions
- Segment by language preference

### 2. **Engagement Analysis**
- Track which auth method leads to better retention
- Identify highly engaged users (high exam counts)
- Find users who downloaded content but aren't using it

### 3. **Churn Prediction**
- Use `last_active_date` to identify inactive users
- Target re-engagement campaigns

### 4. **Conversion Optimization**
- See which user types convert to premium
- Analyze exam completion vs subscription correlation

### 5. **Support & Debugging**
- Quickly identify platform-specific issues
- Understand user context when they contact support

## Viewing Attributes in RevenueCat Dashboard

1. Go to RevenueCat Dashboard → Customers
2. Click on any customer
3. Scroll to "Custom Attributes" section
4. View all tracked attributes

You can also:
- Create charts based on these attributes
- Export data for analysis
- Set up webhooks triggered by attribute changes

## Best Practices

1. **Don't Over-Track**: Only track attributes that provide actionable insights
2. **Update Strategically**: Update attributes when they change, not on every app launch
3. **Privacy First**: Never track PII (personally identifiable information) beyond email/name
4. **Test Thoroughly**: Verify attributes appear in RevenueCat dashboard
5. **Document Changes**: Keep this guide updated when adding new attributes

## Example: Complete Integration

```typescript
// src/providers/AuthProvider.tsx
import { useEffect } from 'react';
import { purchaseService } from '../services/PurchaseService';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { selectAuthProvider } from '../store/slices/authSlice';

const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const authProvider = useAppSelector(selectAuthProvider);
  
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        // Login to RevenueCat
        await purchaseService.loginUser(currentUser.uid);
        
        // Sync user attributes
        await purchaseService.syncUserAttributes(
          currentUser.email,
          currentUser.displayName
        );
        
        // Track device info (once per session)
        await purchaseService.syncDeviceInfo();
        
        // Track user behavior
        await purchaseService.syncUserBehaviorData({
          language: i18n.language,
          authProvider: authProvider,
          lastActiveDate: new Date().toISOString(),
        });
      }
    });
    
    return subscriber;
  }, [authProvider, i18n.language]);
  
  return <>{children}</>;
};

export default AuthProvider;
```
