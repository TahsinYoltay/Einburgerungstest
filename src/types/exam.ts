// Types for exam-related data

export type ExamStatus = 'not-started' | 'in-progress' | 'completed' | 'passed' | 'failed';

export type QuestionAnswer = {
  questionId: string; 
  selectedAnswers: string[];
  isCorrect?: boolean;
};

export type ExamAttempt = {
  id: string;
  examId: string;
  startTime: string;
  endTime?: string;
  status: ExamStatus;
  answers: QuestionAnswer[];
  score?: number; // Calculated score after completion
  totalQuestions: number;
  correctAnswers: number;
  flaggedQuestions: string[];
  timeSpentInSeconds: number;
};

export type ExamSummary = {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  timeAllowedInMinutes: number;
  passingScore: number; // e.g. 75 for 75% passing score
  category: string;
  attempts?: ExamAttempt[]; // User's attempts for this exam
  lastAttempt?: ExamAttempt; // Last attempt info
};

// Status for questions during an exam
export type QuestionStatus = 'unanswered' | 'answered' | 'flagged';
