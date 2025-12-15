import type { ExamStatus } from './exam';
import type { PromptOutcome, RatingStatus } from '../store/slices/ratingSlice';

export type FirestoreEpochMillis = number;

export type FirestoreBoolMap = Record<string, boolean>;

export interface UserProfileDocV1 {
  schemaVersion: 1;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastSeenAt?: unknown;
  clientUpdatedAt?: FirestoreEpochMillis;
  email?: string | null;
  profile?: {
    displayName?: string | null;
    username?: string | null;
    photoURL?: string | null;
  };
  app?: {
    version?: string;
    buildNumber?: string;
  };
  device?: {
    platform?: 'ios' | 'android';
  };
}

export interface ExamSummaryEntryV1 {
  attemptCount: number;
  lastAttemptId: string;
  lastStatus: ExamStatus;
  lastScore: number;
  lastCompletedAt: string; // ISO
  bestScore: number;
}

export interface ExamProgressSummaryDocV1 {
  schemaVersion: 1;
  updatedAt?: unknown;
  clientUpdatedAt?: FirestoreEpochMillis;
  favorites?: FirestoreBoolMap;
  hiddenFromIncorrect?: FirestoreBoolMap;
  examSummaries?: Record<string, ExamSummaryEntryV1>;
}

export interface ExamAttemptDocV1 {
  schemaVersion: 1;
  attemptId: string;
  examId: string;
  startedAt: string; // ISO
  completedAt: string; // ISO
  status: ExamStatus;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentInSeconds: number;
  flaggedQuestions: string[];
  questionIds: string[];
  answers: Record<string, string[]>;
  content?: {
    examLanguage?: string;
  };
  createdAt?: unknown;
  clientCreatedAt: FirestoreEpochMillis;
}

export interface ExamInProgressDocV1 {
  schemaVersion: 1;
  examId: string;
  attemptId: string;
  questionIds: string[];
  answers: Record<string, string[]>;
  flaggedQuestions: string[];
  currentQuestionIndex: number;
  startedAt: string; // ISO
  timeRemaining: number;
  timeSpentInSeconds: number;
  content?: {
    examLanguage?: string;
  };
  updatedAt?: unknown;
  clientUpdatedAt: FirestoreEpochMillis;
}

export interface RatingProgressDocV1 {
  schemaVersion: 1;
  updatedAt?: unknown;
  clientUpdatedAt: FirestoreEpochMillis;
  state: {
    status: RatingStatus;
    installDate: FirestoreEpochMillis;
    firstEligibilityDate: FirestoreEpochMillis | null;
    lastPromptDate: FirestoreEpochMillis | null;
    totalPromptCount: number;
    lastOutcome: PromptOutcome;
    examsCompletedSinceLastPrompt: number;
    chaptersCompletedSinceLastPrompt: number;
    totalExamsCompleted: number;
    totalChaptersCompleted: number;
  };
}
