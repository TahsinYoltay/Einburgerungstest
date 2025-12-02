# Exam Module – Implementation Guide

## Overview
This document captures the current implementation of the “Exam” experience in the app: data sources, Redux state shape, screen flows, timing logic, persistence, favorites, and retake/continue behavior.

## Data sources
- Manifest: `src/data/exam/normalized/exams.json`  
  - Defines exams (practice-1…40), mode, questions_per_exam, time_limit_minutes, pass_mark, is_free, etc.
- Questions: `src/data/exam/normalized/allChaptersData.normalized.json`  
  - Contains normalized questions keyed by chapter, each with:
    - `id`, `type` (`single_choice|multiple_choice|true_false|statement_choice`), `prompt`, `options[]`, `correct_option_indexes[]`, `min_selections`, `max_selections`, `explanation`, optional `hint`, `media`, `meta` (chapter_id, tags, difficulty, source, updated_at).

## Redux state (slice: `src/store/slices/examSlice.ts`)
State shape:
```ts
{
  exams: ExamManifestEntry[];              // From manifest
  inProgress: Record<examId, CurrentExam>; // Cached in-progress attempts
  currentExam: CurrentExam;                // Active attempt
  examHistory: ExamAttempt[];              // Completed attempts
  questionStats: Record<questionId, { attempts; correct; incorrect }>;
  favoriteQuestions: string[];             // Global favorites
  loading: boolean;
  error: string | null;
}
```

`CurrentExam`:
```ts
{
  examId: string | null;
  attemptId: string | null;
  questions: NormalizedQuestion[];
  currentQuestionIndex: number;
  answers: Record<questionId, string[]>;   // option indexes as strings
  flaggedQuestions: string[];
  startTime: string | null;
  timeRemaining: number;                   // seconds
  timeSpentInSeconds: number;
  examCompleted: boolean;
  examStarted: boolean;
  lastSaved: string | null;
}
```

Key reducers/actions:
- `startExam({ examId, forceRestart? })`: Initializes/resumes an attempt; caches existing in `inProgress`. `forceRestart` resets state.
- `loadExamQuestions(examId)`: Shuffles/picks questions per manifest.
- `answerQuestion`: Stores selections; multiple-choice toggles up to `maxSelections`.
- `toggleFlagQuestion`: Adds/removes question from flagged list.
- `toggleFavoriteQuestion`: Adds/removes question ID in `favoriteQuestions`.
- `goToNextQuestion / goToPreviousQuestion / setCurrentQuestionIndex`: Navigation within attempt.
- Timer reducers:
  - `updateTimeRemaining(value)`, `updateTimeSpent(value)`: Used to sync timer on exit/submit.
  - `tickTime` is legacy; current screens run local timers and sync on exit.
- `saveCurrentExamProgress`: Persists active attempt into `inProgress`.
- `resetExam / resetExamData`: Clears current and/or history and in-progress.
- `submitExam`: Scores all-or-nothing per question (must select exactly the correct set). Computes `score`, `correctAnswers`, `totalQuestions`, `status`, `timeSpentSeconds` (timeLimit - remaining clamped), appends attempt to history, updates stats and clears `inProgress` for that exam.

Exports: slice reducer + thunks (`loadExams`, `loadExamQuestions`, `submitExam`) + actions (above).

## Timer behavior
- Each exam screen runs a local `setInterval` decrementing a local `timeLeft`.
- On unmount/submit, the screen dispatches `updateTimeRemaining(timeLeft)` and `updateTimeSpent(previousSpent + delta)` where `delta` = startRemaining - currentRemaining.
- Auto-submit triggers when `timeLeft <= 0`.

## Screens
### ExamList (`src/screens/exam/ExamList/ExamListScreen.tsx`)
- Shows hero progress, quick actions, and accordion list of exams.
- Status per exam determined from latest attempt or in-progress cache.
- Buttons:
  - Start (not started)
  - Continue (in-progress)
  - Restart/Retake (completed or forced restart)
- Time left shown for in-progress when expanded.

### Exam (`src/screens/exam/ExamScreen/ExamScreen.tsx`)
- On mount: `resetExam()` then `startExam({ examId, forceRestart: restart? })`, then `loadExamQuestions` if needed.
- Uses local timer (`timeLeft`). Syncs to Redux on unmount/submit.
- Answer selection blocks “Next” unless min selections reached.
- Flagging per question.
- Favorites: thumb-up on the question card bottom row (right, aligned with “Show Explanation”), color turns primary when favorited (state from `favoriteQuestions`).
- Submit flow:
  - Warn if unanswered.
  - Warn if flagged (optional review).
  - Dispatch `submitExam().unwrap()`; navigates to results.

### ExamResults (`src/screens/exam/ExamResults/ExamResults.tsx`)
- Reads latest attempt for `examId` from history/currentExam.
- Shows pass/fail, score, pass mark, details, time spent (from submission), flagged count.
- Wrong answers section:
  - Expandable list; each wrong question shows options with correctness coloring.
  - Thumb-up icon top-right of each card toggles favorite (no text).
- Buttons:
  - Go Home: `resetExam()` + navigation reset to Home.
  - Retake Exam: `resetExam()` + `navigation.replace` to Exam with `restart: true`.

## Data model and scoring
- Question correctness: all-or-nothing match of user selections to `correct_option_indexes` (as strings in answers map).
- Multi-select respects `min_selections`/`max_selections` from question data.
- Score = round((correct / total) * 100). Pass if `score >= pass_mark * 100`.

## Persistence
- In-progress attempts stored in `inProgress`; updated via `saveCurrentExamProgress` on screen unmount.
- Completed attempts stored in `examHistory` and also attached to `exams` manifest entries (lastAttempt/attempts).
- Favorites stored globally in `favoriteQuestions` (IDs).
- Per-question stats stored in `questionStats` (attempts/correct/incorrect) for future analytics.

## Favorites
- Global array of question IDs.
- Toggled from question card during exam or from wrong-answers list in results.
- UI indicates favorite with primary-colored thumb-up; grey when not favorited.

## Retake / Restart / Continue logic
- Start: new attempt if none/in-progress for that exam.
- Continue: resumes from `inProgress` copy (same answers/time).
- Restart/Retake: force new attempt (`forceRestart`), clears in-progress for that exam, re-shuffles questions per manifest, timer resets.
- Results screen retake replaces navigation to Exam with `restart: true` after resetting exam state.

## Timing rules (per manifest)
- `time_limit_minutes` per exam (e.g., 45 min) -> seconds on load.
- Auto-submit at 0; warns at 5 minutes remaining (ExamScreen).

## Files summary
- Logic/state: `src/store/slices/examSlice.ts`
- Types: `src/types/exam.ts`
- Data: `src/data/exam/normalized/exams.json`, `src/data/exam/normalized/allChaptersData.normalized.json`
- Screens:
  - `src/screens/exam/ExamList/ExamListScreen.tsx` (+ style)
  - `src/screens/exam/ExamScreen/ExamScreen.tsx` (+ style)
  - `src/screens/exam/ExamResults/ExamResults.tsx` (+ style)
- Components:
  - `src/components/exam/QuestionCard/QuestionCard.tsx` (+ style) – options UI, hint, favorite toggle.
  - `src/components/exam/ExamHistorySummary/...` (history display)

## Product constraints
- Practice exams are fixed sets (practice-1..40), 24 questions each, shuffled order per start/retake, no cross-mixing between exams.
- Pass mark typically 75% (manifest-driven).
- Timer 45 minutes (manifest-driven).
- All-or-nothing scoring; no partial credit.

---
