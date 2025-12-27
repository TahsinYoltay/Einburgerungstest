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

export type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
  version?: number;
  mockVersion?: number;
  chapterVersion?: number;
};

// Normalized schema for new exam/question model
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'statement_choice';

export type QuestionMedia = {
  image_url?: string | null;
  audio_prompt_url?: string | null;
  audio_option_urls?: (string | null)[];
};

export type QuestionMeta = {
  chapter_id: number;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  source?: string;
  updated_at: string; // ISO timestamp
};

export type NormalizedQuestion = {
  id: string; // e.g., "Q10169"
  type: QuestionType;
  prompt: string;
  options: string[];
  correct_option_indexes: number[];
  min_selections: number;
  max_selections: number;
  explanation: string;
  hint?: string | null;
  media?: QuestionMedia | null;
  meta: QuestionMeta;
};

export type ExamMode = 'chapter' | 'mock' | 'practice';

export type ExamManifestEntry = {
  id: string; // e.g., "chapter-8", "mock-1"
  title: string;
  mode: ExamMode;
  chapter_ids?: number[];
  question_ids?: string[];
  questions_per_exam: number;
  time_limit_minutes: number;
  pass_mark: number; // 0.75 for 75%
  is_free: boolean;
  version: number;
  updated_at: string; // ISO timestamp
  // optional runtime fields populated client-side
  attempts?: ExamAttempt[];
  lastAttempt?: ExamAttempt;
};
