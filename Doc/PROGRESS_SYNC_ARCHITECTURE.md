# User Progress Cloud Sync (Firebase) — Architecture & Implementation Guide

**Project:** Life in the UK Test Prep (React Native)  
**Scope:** Exam progress + Book (reader) progress sync across devices/accounts  
**Goal:** Enable cross-device restore while staying within Firebase free-tier constraints by avoiding high-frequency writes.

---

## 1) Executive Summary

Today the app persists most user progress **locally** (Redux Persist + AsyncStorage). Firebase is already integrated (Auth, Firestore, Storage), but Firestore rules currently deny all `users/**` paths, so **no user progress can be stored remotely**.

This document proposes an **offline-first, low-write** sync architecture using **Cloud Firestore** as the remote database, with:
- **User-scoped local storage** (so switching accounts does not “leak” progress between users)
- **Checkpoint-based syncing** (bulk uploads on key events; not on every answer/scroll/tick)
- **Append-only attempt history** + **small “summary docs”** to minimize reads
- Clear **conflict resolution rules** for multi-device usage
- Firestore **security rules** and data governance guidance

Result: a user can sign in on a new device and restore exam + reading progress, while keeping Firestore writes predictable and small.

---

## 2) Current State (Codebase Reality)

### 2.1 Local persistence
- Redux store is persisted via `redux-persist` using AsyncStorage (`src/store/index.ts`).
  - Persist key: `root`
  - Whitelist includes: `auth`, `exam`, `content`, `book`, `rating`
  - **Problem:** persisted exam data is **not user-scoped**. If one user signs out and another signs in, exam progress remains on device unless manually reset.

### 2.2 Exam progress (Redux)
- Primary progress lives in `src/store/slices/examSlice.ts`:
  - `currentExam`, `inProgress`, `examHistory`, `questionStats`, `favoriteQuestions`
  - `currentExam.questions` stores **full question objects** (large, content-derived).
  - **Observation:** for cloud sync you generally do **not** want to upload full question text/options (it duplicates content and increases payload size). Store question IDs + answers instead.

### 2.3 Book/reader progress (AsyncStorage + prepared Firestore path)
- Reading progress utilities (`src/utils/readingProgress.ts`) wrap `src/services/readingProgressService.ts`.
- `readingProgressService` supports:
  - Local progress keyed by `reading_progress_v2::bookId::userId`
  - Remote path: `users/{uid}/books/{bookId}`
  - Remote sync uses `set(..., { merge: true })` when `syncMode === 'local+remote'`
- **Gaps today**
  1) Firestore rules deny `users/**`, so remote writes fail.
  2) Reads default to `local-only`, so remote progress is never fetched on new devices.

### 2.4 Firebase usage today
- Firestore is used for:
  - Support tickets (`supportTickets`) + email queue (`mail`)
  - Rating feedback (`ratingFeedback`) + email queue (`mail`)
- Firestore rules (`fireStore.rules`) allow only those `create` operations and deny everything else.
- Firebase Storage is used heavily for remote content (public read for `config/`, `content/`, `exam/translations/`, `book/content/`) (`storage.rules`).

---

## 3) Requirements & Constraints

### 3.1 Product requirements
1) **Cross-device restore**: a signed-in user can install on a new device and restore:
   - Exam: completed attempts / scores / pass/fail, favorites, and optionally in-progress attempt state.
   - Book: read/unread state per section and “continue where you left off”.
2) **Account switching**: signing in with a different account must load that account’s progress (not the previous user’s).
3) **Offline-first**: the app must work without network; sync should be “eventual”.

### 3.2 Cost constraints (Firebase free-tier friendly)
The design must avoid:
- Writing on every question answered
- Writing on every timer tick
- Writing on every scroll event

Instead we use **checkpoints** + **debounce/throttle** and send **bulk updates** only when needed.

---

## 4) Why Firestore (and not Realtime DB / Storage)

### 4.1 Firestore (recommended)
Pros:
- Already integrated in the app (`@react-native-firebase/firestore`)
- Strong per-user security rules
- Structured documents/subcollections fit “progress + attempts” well
- Great for small “summary docs” that power the UI quickly

Cons:
- Cost is per document read/write operation; naive “write on every action” will burn quota.

### 4.2 Realtime Database (not recommended for this project)
While it can be cost-effective for high-frequency streams, it adds:
- A second database technology + rule set to maintain
- Different data modeling trade-offs

### 4.3 Cloud Storage (not recommended as primary progress store)
Storing a single JSON blob per user can reduce operation count, but creates:
- Harder conflict resolution (whole-file overwrites)
- No querying for subsets (attempt history, in-progress, etc.)

Firestore is the best fit if we control write frequency.

---

## 5) Target Data Model (Firestore)

### 5.1 Collections overview

```
users/{uid}                              // user profile + sync meta
  books/{bookId}                         // reading progress (already used by readingProgressService)
  examInProgress/{examId}                // resumable attempts (small, checkpointed)
  examAttempts/{attemptId}               // append-only completed attempts
  progress/exam                           // small “summary” doc for fast UI restore
```

Notes:
- `users/{uid}` is the canonical user identity (Firebase Auth UID).
- `progress/exam` is a single doc under a `progress` subcollection (collection/doc/collection/doc pattern).
- Keep **large/append-only** items (attempts) in their own docs to avoid the 1 MiB document limit.

### 5.2 Document schemas (proposed)

#### A) `users/{uid}` (profile + sync metadata)
Minimal, non-sensitive fields:
```json
{
  "schemaVersion": 1,
  "createdAt": "serverTimestamp",
  "lastSeenAt": "serverTimestamp",
  "app": { "version": "1.2.3", "buildNumber": "123" },
  "device": { "platform": "ios|android" }
}
```

**Write policy:** update `lastSeenAt` at most **once per day** (or once per app foreground session), not continuously.

#### B) `users/{uid}/progress/exam` (fast restore doc)
Purpose: allow the app to show exam list/progress without reading all attempt docs.

```json
{
  "schemaVersion": 1,
  "updatedAt": "serverTimestamp",
  "clientUpdatedAt": 1730000000000,

  "favorites": {
    "Q10169": true,
    "Q10500": true
  },

  "hiddenFromIncorrect": {
    "Q99999": true
  },

  "examSummaries": {
    "practice-1": {
      "attemptCount": 3,
      "lastAttemptId": "attempt-1730000000000",
      "lastStatus": "passed",
      "lastScore": 83,
      "lastCompletedAt": "2025-12-01T10:00:00.000Z",
      "bestScore": 92
    }
  }
}
```

Design notes:
- `favorites` and `hiddenFromIncorrect` are maps for easy add/remove (supports “false” as removal if you prefer).
- `examSummaries` is a map keyed by `examId` to avoid 40 separate reads.

#### C) `users/{uid}/examAttempts/{attemptId}` (append-only completed attempt)
Created on exam submission. Immutable after creation (preferred).

```json
{
  "schemaVersion": 1,
  "attemptId": "attempt-1730000000000",
  "examId": "practice-1",
  "startedAt": "2025-12-01T09:20:00.000Z",
  "completedAt": "2025-12-01T10:00:00.000Z",
  "status": "passed",
  "score": 83,
  "totalQuestions": 24,
  "correctAnswers": 20,
  "timeSpentInSeconds": 2400,
  "flaggedQuestions": ["Q10169"],
  "questionIds": ["Q10169", "Q10170"],
  "answers": {
    "Q10169": ["1"],
    "Q10170": ["0", "3"]
  },
  "content": {
    "examLanguage": "en"
  },
  "createdAt": "serverTimestamp",
  "clientCreatedAt": 1730000000000
}
```

Design notes:
- Store `questionIds` (order) + `answers` as a map. Do not store full question text/options.
- If you need strict dedupe, use `attemptId` as the Firestore document ID.

#### D) `users/{uid}/examInProgress/{examId}` (checkpointed resumable attempt)
Updated occasionally (not per answer/tick).

```json
{
  "schemaVersion": 1,
  "examId": "practice-1",
  "attemptId": "attempt-1730000000000",
  "questionIds": ["Q10169", "Q10170"],
  "answers": { "Q10169": ["1"] },
  "flaggedQuestions": ["Q10169"],
  "currentQuestionIndex": 7,
  "startedAt": "2025-12-01T09:20:00.000Z",
  "timeRemaining": 1200,
  "timeSpentInSeconds": 1500,
  "content": { "examLanguage": "en" },
  "updatedAt": "serverTimestamp",
  "clientUpdatedAt": 1730000123456
}
```

Design notes:
- This is the critical doc where **write-frequency must be controlled**.
- Keep payload small and deterministic.

#### E) `users/{uid}/books/{bookId}` (reading progress)
You already have a compatible shape in `src/services/readingProgressService.ts`:
- Keep the existing schema, but ensure merges are defined (see Section 8).

---

## 6) User-Scoped Local Storage (Required for Account Switching)

### 6.1 Why this is mandatory
Right now `redux-persist` uses a single key (`root`) so exam progress is effectively “device-global”.
That means:
- User A signs out
- User B signs in
- User B sees User A’s exam history/favorites unless you reset manually

This is a product bug once cloud sync exists.

### 6.2 Recommended approach (aligns with current reading progress design)
Adopt the same pattern as `readingProgressService`:
- Store **user progress per UID** in AsyncStorage keys scoped to `uid`.
- On auth identity change:
  1) Load local progress for that UID
  2) Pull remote progress for that UID (if enabled)
  3) Merge → hydrate Redux

### 6.3 Implementation options

**Option A (recommended): split “content” vs “progress” slices**
- Keep exam content (manifest/questions language packs) separate from exam progress.
- Persist content globally; persist progress per user.

**Option B: keep Redux Persist but re-key by UID**
- Recreate the persisted store when `firebaseUid` changes.
- Requires careful rehydration sequencing to avoid UI glitches.

### 6.4 Identity edge cases (linking vs switching accounts)
Your auth layer intentionally starts every user as Firebase **anonymous** (`src/providers/AuthProvider.tsx`). That creates some important cases:

1) **Anonymous → Link to email/Google (UID preserved)**
   - This is the ideal flow.
   - The Firebase UID stays the same, so:
     - local user-scoped keys remain valid
     - remote sync can be enabled immediately after linking

2) **Anonymous → Sign in to an existing account (UID changes)**
   - This happens when linking fails with `credential-already-in-use` and the app signs into an existing Firebase user.
   - You must decide what happens to “device progress” created under the previous UID:
     - **Safer UX (recommended):** do not auto-merge. Treat it as belonging to the previous identity and offer an explicit “Import device progress” action.
     - **Convenience UX:** auto-merge and record that a merge occurred (risk: shared device scenario).
   - If you implement explicit import, it should:
     - read previous UID’s local progress snapshot
     - merge into the new UID’s local + remote data using the merge rules in Section 8

---

## 7) Sync Strategy — When to Send Data (Low-Write)

### 7.1 Principles
1) **Local is source of truth** for UX (instant, offline).
2) Cloud is an **eventual backup** for restore and multi-device.
3) High-frequency events are **buffered** and sent only at checkpoints.

### 7.2 Sync eligibility
To avoid creating Firestore docs for every anonymous user, enable cloud sync only when:
- User is **not anonymous** (email/google), or
- User explicitly opts in (optional), or
- You later add server-side entitlement checks (advanced; out of scope for v1).

### 7.3 Checkpoints (recommended triggers)

**Exam**
- On exam submit (completed): write immediately.
- On leaving exam screen (navigate away / close): checkpoint once.
- While in exam: checkpoint at most every **60–120 seconds**, only if “dirty”.
- On app background/inactive: checkpoint once (best-effort).

**Book**
- On “mark read/unread”: debounce (e.g., 5–10 seconds) and then write.
- While reading: update local time/scroll frequently, but only checkpoint on:
  - leaving the reader screen
  - app background
  - every **3–5 minutes** if still reading

### 7.4 Debounce/throttle guidance (practical defaults)
- `examInProgress`:
  - throttle: 60s
  - also flush on background/unmount
- `bookProgress`:
  - debounce: 5–10s after mark read/unread
  - throttle: 300s while actively reading
- `favorites / hiddenFromIncorrect`:
  - debounce: 2–5s (these are rare; cost isn’t a concern)

### 7.5 Batch writes
Use Firestore batched writes to reduce network round-trips:
- e.g., on exam submit:
  - create `examAttempts/{attemptId}`
  - update `progress/exam` summary
  - delete/clear `examInProgress/{examId}` (optional)

Billing note: batching reduces requests but does **not** change Firestore operation counts.

### 7.6 Practical “what we sync” decisions (v1 defaults)
To keep the payloads small and implementation straightforward:
- Sync:
  - Book section completion + last read timestamps
  - Exam attempt results (score/status/time) and answers map (for review)
  - Favorites and “hidden from incorrect” flags
  - In-progress attempt checkpoints (optional but recommended)
- Do **not** sync:
  - Full question text/options/explanations (content comes from Storage packs)
  - `questionStats` as a first pass (recompute from attempts if needed; store only user overrides like “hidden” separately)

---

## 8) Merge & Conflict Resolution (Multi-Device)

### 8.1 General rule
Use **clientUpdatedAt (epoch ms)** + **server updatedAt** as tie-breakers:
1) Prefer higher `clientUpdatedAt` when both exist (reflects user action time).
2) Fallback to `updatedAt` (server time).

### 8.2 Exam attempts
- Treat as **append-only**.
- De-duplicate by `attemptId`.
- Never overwrite attempt docs (unless you add a controlled migration later).

### 8.3 Exam in-progress
Options:
- **Simple (v1):** “last checkpoint wins” by `clientUpdatedAt`.
- **Robust (v2):** merge `answers` per questionId using per-question timestamps (more complex; rarely necessary).

Recommendation: start with **simple**, and only add robust merge if users actually multi-task on two devices mid-exam.

### 8.4 Book progress
Today `readingProgressService` merges whole-doc by `updatedAt` (last writer wins).
Given the book has ~24 sections, a better merge is easy:
- Merge per section:
  - for each `sectionId`, pick entry with highest `updatedAt`
- Recompute aggregates (`completedCount`, `lastSectionId`) after merge

---

## 9) Firestore Security Rules (Required Changes)

### 9.1 Current rules block progress sync
`fireStore.rules` denies everything except support/rating/mail creates.

### 9.2 Proposed rules (conceptual)
Allow users to read/write only their own progress documents:

- `users/{uid}`: allow read/write only if `request.auth.uid == uid`
- Subcollections under `users/{uid}` (books, examAttempts, examInProgress, progress/*): same restriction

Optional hardening:
- Block anonymous users from writing progress:
  - check `request.auth.token.firebase.sign_in_provider != "anonymous"`

Important: keep existing support/rating/mail create rules as-is (anonymous sign-in is used there).

### 9.3 Data validation (recommended but keep practical)
In rules you can enforce:
- Only expected top-level fields (`schemaVersion`, etc.)
- Basic type checks (numbers, strings, maps)
Avoid overly strict per-question validation; it makes iteration painful.

---

## 10) Cost Model & Keeping Within Free Tier

Firestore free-tier limits vary by plan/region; verify in Firebase Console. As a rule of thumb, design so one engaged user produces **single-digit writes per session**, not hundreds.

### 10.0 How Firestore billing “counts” in practice (important)
- A query that returns **N documents** is billed as **N reads**.
- Updating a document is billed as **1 write** per call, even if you only changed one field.
- `set(..., { merge: true })` is still a write.
- Batching reduces network requests, but the billed operation count is still per document.

### 10.1 “Bad” vs “Good” write patterns

**Bad (do not do this):**
- 1 write per answered question (24 writes/exam)
- 1 write per timer tick (2,700 writes/45 min exam)
- 1 write per scroll event (hundreds/minute)

**Good (recommended):**
- Exam:
  - 1–3 in-progress checkpoints
  - 1 attempt create on submit
  - 1 summary update on submit
- Book:
  - 1 write when a section is marked read/unread
  - optional periodic “reading session” checkpoint every few minutes

### 10.2 Retention controls (optional)
- Keep all attempts (simpler) OR enforce retention:
  - e.g., keep last 50 attempts, delete older (adds deletes; only do if needed)
- Store summary doc regardless (cheap, constant size).

### 10.3 Firestore limits that affect design
- Document size limit: **1 MiB** → keep attempts as individual docs; keep summaries small.
- Batch write limit: **500 operations per batch** → flush queues in chunks if needed.
- Per-document write rate limits → avoid writing the same summary doc every second/minute.

---

## 11) Implementation Plan (Phased, Low Risk)

### Phase 0 — Firestore foundation
1) Decide whether cloud sync is allowed for anonymous users.
2) Update Firestore rules to allow `users/{uid}/...` access.
3) Deploy rules and test with a dev build.

### Phase 1 — Reading progress (finish what’s started)
1) Enable remote reads in `getReadingProgress()` for authenticated users (use `syncMode: 'local+remote'`).
2) Add checkpoint/debounce so reading time/scroll doesn’t trigger excessive writes.
3) Add merge improvements (per-section merge) if needed.

### Phase 2 — Exam summary + attempts (core value)
1) Serialize exam progress into:
   - `progress/exam` summary doc
   - `examAttempts/{attemptId}` docs on submit
2) On login, fetch summary doc and hydrate:
   - `examHistory` (either full or “summary-only” first, full on demand)
   - `favoriteQuestions`
   - hidden-from-review flags

3) UI restore details to not miss:
   - `examSlice` currently also attaches attempts to `state.exam.exams[*].attempts` and `lastAttempt`.
   - When hydrating from remote, you must rebuild those derived fields so screens like ExamList remain correct.

### Phase 3 — Resumable in-progress exams
1) Store `examInProgress/{examId}` using checkpointing.
2) On login, fetch in-progress docs and offer “Continue” if available.

### Phase 4 — User-scoped local persistence
1) Remove “device-global” progress leakage by scoping local persistence by UID.
2) Add a safe migration path from the old `persist:root` progress to the new per-user key.

---

## 12) Testing Matrix (Manual + Automated)

### Must-pass scenarios
1) **New device restore**: sign in → reading progress + exam summaries appear.
2) **Account switching**: user A signs out → user B signs in → user B does not see A’s progress.
3) **Offline usage**: do exam + mark sections → kill app → reopen offline → progress intact locally.
4) **Delayed sync**: do progress offline → go online → checkpoint flush succeeds.
5) **Conflict** (basic): device 1 and device 2 both update reading progress → merge behaves as expected.

### Observability
- Add structured logs around “checkpoint created”, “flush started”, “flush success/failure”, including doc counts.
- Monitor Firestore usage in Firebase Console during beta.

---

## 13) Appendix — Code Touch Points (Where Implementation Will Live)

### Existing files to integrate with
- Store/persistence: `src/store/index.ts`
- Auth identity source: `src/providers/AuthProvider.tsx`, `src/store/slices/authSlice.ts`
- Exam progress: `src/store/slices/examSlice.ts`
- Reading progress: `src/services/readingProgressService.ts`, `src/utils/readingProgress.ts`
- Firestore rules: `fireStore.rules`

### Recommended new modules (no code here; naming guidance)
- `src/services/ProgressSyncService.ts`
  - Responsible for:
    - buffering “dirty” updates
    - scheduling checkpoints
    - writing to Firestore in batches
    - pulling + merging remote state on login

### Appendix A — Data mapping (current Redux → remote docs)

**Exam (from `src/store/slices/examSlice.ts`)**
- `state.exam.favoriteQuestions` → `users/{uid}/progress/exam.favorites`
- `state.exam.questionStats[questionId].hiddenFromIncorrectList` → `users/{uid}/progress/exam.hiddenFromIncorrect[questionId]`
- `state.exam.examHistory[]` (completed attempts) → `users/{uid}/examAttempts/{attemptId}`
  - store only IDs + answers (not full question objects)
- `state.exam.inProgress[examId]` and/or `state.exam.currentExam` → `users/{uid}/examInProgress/{examId}`
  - `questionIds = currentExam.questions.map(q => q.id)`
  - `answers = currentExam.answers`
  - `flaggedQuestions = currentExam.flaggedQuestions`
  - timer fields + indexes as-is

**Book**
- `src/services/readingProgressService.ts` already defines a cloud-friendly schema under `users/{uid}/books/{bookId}`.
- Ensure **reads** use `syncMode: 'local+remote'` when cloud sync is enabled.

### Appendix B — Remote restore (remote docs → Redux/UI)

**Exam in-progress restore**
1) Fetch `users/{uid}/examInProgress/*`
2) For each doc:
   - load questions from the current language pack by ID (lookup in `chaptersData`)
   - preserve the stored order via `questionIds`
   - hydrate `state.exam.inProgress[examId]` and/or offer “Continue”
3) If content packs changed and an ID is missing:
   - skip missing IDs and continue, or invalidate that in-progress attempt (product decision)

**Exam history restore**
- Minimal restore (fast): rely on `users/{uid}/progress/exam.examSummaries` to populate “passed/failed/last score” UI.
- Full restore (for history screen): query `users/{uid}/examAttempts` ordered by `completedAt` and hydrate `state.exam.examHistory`.

**Book restore**
- Fetch `users/{uid}/books/{bookId}` and merge with local per-section timestamps, then render.

---
