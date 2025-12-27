# RevenueCat Custom Attributes - Quick Reference

## ✅ What's Already Implemented

### Automatic Tracking (in AuthProvider)
These attributes are automatically synced when a user logs in:

1. **platform** - `'ios'` or `'android'`
2. **osVersion** - OS version (e.g., `'17.2'` for iOS, `'33'` for Android)
3. **auth_provider** - `'none'`, `'email'`, or `'google'`
4. **last_active_date** - ISO timestamp of last activity

### Manual Tracking Available
You can add these when the events occur:

5. **app_language** - User's selected language (`'en'`, `'tr'`, etc.)
6. **account_age_days** - Days since account creation
7. **exam_downloaded** - `'true'` or `'false'`
8. **book_downloaded** - `'true'` or `'false'`
9. **total_exams_taken** - Number of completed exams
10. **total_questions_answered** - Total questions answered

---

## 📊 Recommended Attributes by Priority

### 🔴 High Priority (Track These First)

| Attribute | When to Track | Why Important | Example |
|-----------|--------------|---------------|---------|
| **app_language** | When user changes language | Segment by language, localize marketing | `'en'` |
| **exam_downloaded** | After exam content downloads | See who has content but isn't using it | `'true'` |
| **book_downloaded** | After book content downloads | Track content adoption | `'true'` |
| **total_exams_taken** | After each exam completion | Identify power users, engagement metric | `15` |

### 🟡 Medium Priority (Track When Feasible)

| Attribute | When to Track | Why Important | Example |
|-----------|--------------|---------------|---------|
| **total_questions_answered** | After each exam | Deeper engagement metric | `450` |
| **account_age_days** | At login | Cohort analysis, churn prediction | `45` |
| **last_active_date** | Daily (in background) | Identify inactive users | `'2025-01-15'` |

### 🟢 Low Priority (Nice to Have)

| Attribute | When to Track | Why Important | Example |
|-----------|--------------|---------------|---------|
| **preferred_theme** | When user changes theme | UI preferences | `'dark'` |
| **notification_enabled** | When user changes setting | Engagement optimization | `'true'` |
| **last_exam_score** | After exam completion | Performance tracking | `85` |

---

## 🎯 How to Use These Attributes

### 1. User Segmentation Examples

**Find iOS users with low engagement:**
```
platform = 'ios' AND total_exams_taken < 3
```

**Target Turkish speakers without subscription:**
```
app_language = 'tr' AND subscription_status = 'none'
```

**Identify churned users:**
```
last_active_date < 30 days ago
```

### 2. Conversion Analysis

**Compare conversion rates:**
- Users who downloaded exam content vs those who didn't
- Users with Google auth vs email auth
- iOS vs Android users

### 3. Re-engagement Campaigns

**Target inactive users:**
```
account_age_days > 7 AND total_exams_taken = 0
```

**Target users who downloaded but aren't using:**
```
exam_downloaded = 'true' AND total_exams_taken < 2
```

---

## 💡 Implementation Examples

### Track Language Change

```typescript
// In your language selector component
import { purchaseService } from '../services/PurchaseService';

const handleLanguageChange = async (newLanguage: string) => {
  await i18n.changeLanguage(newLanguage);
  
  // Track in RevenueCat
  await purchaseService.setCustomAttributes({
    app_language: newLanguage,
  });
};
```

### Track Exam Completion

```typescript
// After user completes an exam
import { purchaseService } from '../services/PurchaseService';

const handleExamComplete = async (score: number, questionsAnswered: number) => {
  const totalExams = currentExamCount + 1;
  const totalQuestions = currentQuestionCount + questionsAnswered;
  
  // Update local state/Redux...
  
  // Track in RevenueCat
  await purchaseService.syncUserBehaviorData({
    totalExamsTaken: totalExams,
    totalQuestionsAnswered: totalQuestions,
    lastActiveDate: new Date().toISOString(),
  });
};
```

### Track Content Download

```typescript
// After downloading exam content
import { purchaseService } from '../services/PurchaseService';

const handleExamDownloadComplete = async () => {
  // Update local state...
  
  // Track in RevenueCat
  await purchaseService.syncUserBehaviorData({
    examDownloaded: true,
  });
};
```

---

## 📈 Benefits Summary

### For Analytics
- **Understand user behavior patterns**
- **Identify drop-off points**
- **Measure feature adoption**

### For Marketing
- **Create targeted campaigns**
- **Personalize messaging by language**
- **Re-engage inactive users**

### For Product Development
- **Prioritize features by usage**
- **Identify platform-specific issues**
- **Track onboarding effectiveness**

### For Revenue Optimization
- **Find high-value user segments**
- **Optimize conversion funnels**
- **Reduce churn with targeted offers**

---

## 🔍 Where to View These Attributes

### RevenueCat Dashboard
1. Go to **Customers** section
2. Click any customer
3. Scroll to **Custom Attributes**
4. See all tracked data

### RevenueCat Charts (Pro Feature)
- Create custom charts based on attributes
- Track trends over time
- Compare segments

### Export Data
- Use RevenueCat API
- Export to CSV for analysis
- Integrate with your BI tools

---

## ⚠️ Best Practices

### DO ✅
- Track attributes that drive business decisions
- Update attributes when they actually change
- Use consistent naming conventions (snake_case)
- Document what each attribute means

### DON'T ❌
- Track PII beyond email/name (GDPR compliance)
- Update attributes unnecessarily (avoid API spam)
- Use inconsistent data types (always string)
- Track data you won't use

---

## 🚀 Quick Start Checklist

- [x] Device info tracking (platform, OS) - **Already implemented**
- [x] Auth provider tracking - **Already implemented**
- [x] Last active date tracking - **Already implemented**
- [ ] Language tracking - **Implement in language selector**
- [ ] Exam completion tracking - **Implement in exam results screen**
- [ ] Content download tracking - **Implement in download handlers**
- [ ] Question count tracking - **Implement in exam logic**

---

## 📞 Next Steps

1. **Start simple**: Language tracking is the easiest win
2. **Add exam tracking**: Track completion and question counts
3. **Monitor in RevenueCat**: Check dashboard to see data flowing
4. **Create segments**: Use attributes for targeted marketing
5. **Iterate**: Add more attributes based on what you learn
