import type { ExamAttempt } from './exam';

export type AnswerMap = Record<string, string[]>;

export interface PersistedExamInProgressV1 {
  examId: string;
  attemptId: string | null;
  questionIds: string[];
  currentQuestionIndex: number;
  answers: AnswerMap;
  flaggedQuestions: string[];
  startTime: string | null;
  timeRemaining: number;
  timeSpentInSeconds: number;
  examCompleted: boolean;
  examStarted: boolean;
  lastSaved: string | null;
  examLanguage: string;
  clientUpdatedAt: number;
}

export interface PersistedExamProgressV1 {
  schemaVersion: 1;
  savedAt: number;
  summaryClientUpdatedAt: number;
  favoriteQuestions: string[];
  questionStats: Record<
    string,
    {
      attempts: number;
      correct: number;
      incorrect: number;
      hiddenFromIncorrectList?: boolean;
    }
  >;
  examHistory: ExamAttempt[];
  inProgress: Record<string, PersistedExamInProgressV1>;
  currentExam: PersistedExamInProgressV1 | null;
}

