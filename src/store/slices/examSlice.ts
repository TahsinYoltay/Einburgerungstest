import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ExamAttempt,
  ExamManifestEntry,
  ExamStatus,
  NormalizedQuestion,
} from '../../types/exam';
import examsManifest from '../../data/exam/normalized/exams.json';
import normalizedChapters from '../../data/exam/normalized/allChaptersData.normalized.json';

type AnswerMap = Record<string, string[]>; // questionId -> array of option index strings

type ExamState = {
  exams: ExamManifestEntry[];
  currentExam: {
    examId: string | null;
    attemptId: string | null;
    questions: NormalizedQuestion[];
    currentQuestionIndex: number;
    answers: AnswerMap;
    flaggedQuestions: string[];
    startTime: string | null;
    timeRemaining: number; // seconds
    timeSpentInSeconds: number;
    examCompleted: boolean;
    examStarted: boolean;
    lastSaved: string | null;
  };
  examHistory: ExamAttempt[];
  loading: boolean;
  error: string | null;
};

const initialState: ExamState = {
  exams: examsManifest as ExamManifestEntry[],
  currentExam: {
    examId: null,
    attemptId: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    flaggedQuestions: [],
    startTime: null,
    timeRemaining: 45 * 60,
    timeSpentInSeconds: 0,
    examCompleted: false,
    examStarted: false,
    lastSaved: null,
  },
  examHistory: [],
  loading: false,
  error: null,
};

const chaptersData = (normalizedChapters as any).data as Record<
  string,
  { questions: NormalizedQuestion[] }
>;

const examsManifestTyped = examsManifest as ExamManifestEntry[];

const getQuestionsForExam = (manifest: ExamManifestEntry): NormalizedQuestion[] => {
  const pool: NormalizedQuestion[] = [];

  const index: Record<string, NormalizedQuestion> = {};
  Object.values(chaptersData).forEach(ch => {
    ch.questions.forEach(q => {
      index[q.id] = q;
    });
  });

  if (manifest.question_ids && manifest.question_ids.length) {
    manifest.question_ids.forEach(id => {
      if (index[id]) pool.push(index[id]);
    });
  } else if (manifest.chapter_ids && manifest.chapter_ids.length) {
    manifest.chapter_ids.forEach(cid => {
      const key = `chapter${cid}`;
      if (chaptersData[key]) {
        pool.push(...chaptersData[key].questions);
      }
    });
  } else {
    pool.push(...Object.values(index));
  }

  return pool;
};

const pickQuestions = (all: NormalizedQuestion[], count: number) => {
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const loadExams = createAsyncThunk('exam/loadExams', async () => {
  return examsManifestTyped;
});

export const loadExamQuestions = createAsyncThunk(
  'exam/loadExamQuestions',
  async (examId: string, { rejectWithValue }) => {
    try {
      const manifest = (examsManifest as ExamManifestEntry[]).find(e => e.id === examId);
      if (!manifest) throw new Error(`Exam not found: ${examId}`);
      const pool = getQuestionsForExam(manifest);
      if (!pool.length) throw new Error(`No questions for exam ${examId}`);
      const questions = pickQuestions(pool, manifest.questions_per_exam || pool.length);
      return {
        examId,
        questions,
        timeLimit: manifest.time_limit_minutes * 60,
        passMark: manifest.pass_mark,
      };
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const submitExam = createAsyncThunk(
  'exam/submitExam',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { exam: ExamState };
      const { questions, answers, examId } = state.exam.currentExam;
      const manifest = (examsManifest as ExamManifestEntry[]).find(e => e.id === examId);
      const passMark = manifest?.pass_mark ?? 0.75;

      let correctCount = 0;
      questions.forEach(q => {
        const userAnswers = answers[q.id] || [];
        const correct = q.correct_option_indexes.map(idx => idx.toString());
        const allCorrectSelected = correct.every(id => userAnswers.includes(id));
        const noIncorrectSelected = userAnswers.every(id => correct.includes(id));
        if (allCorrectSelected && noIncorrectSelected) correctCount++;
      });

      const score = Math.round((correctCount / questions.length) * 100);
      const status: ExamStatus = score >= passMark * 100 ? 'passed' : 'failed';
      return { score, correctAnswers: correctCount, totalQuestions: questions.length, status };
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    startExam: (state, action: PayloadAction<{ examId: string }>) => {
      const examId = action.payload.examId;
      const attemptId = `attempt-${Date.now()}`;
      state.currentExam = {
        ...initialState.currentExam,
        examId,
        attemptId,
        examStarted: true,
        startTime: new Date().toISOString(),
      };
    },
    resetExamData: (state, action: PayloadAction<{ examId?: string }>) => {
      const examId = action.payload.examId;
      if (examId) {
        state.examHistory = state.examHistory.filter(a => a.examId !== examId);
        state.exams = state.exams.map(e =>
          e.id === examId ? { ...e, attempts: [], lastAttempt: undefined } : e
        );
        if (state.currentExam.examId === examId) {
          state.currentExam = initialState.currentExam;
        }
      } else {
        state.examHistory = [];
        state.exams = state.exams.map(e => ({ ...e, attempts: [], lastAttempt: undefined }));
        state.currentExam = initialState.currentExam;
      }
    },
    resetExam: (state) => {
      state.currentExam = initialState.currentExam;
    },
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.currentExam.questions.length) {
        state.currentExam.currentQuestionIndex = action.payload;
      }
    },
    goToNextQuestion: (state) => {
      if (state.currentExam.currentQuestionIndex < state.currentExam.questions.length - 1) {
        state.currentExam.currentQuestionIndex += 1;
      }
    },
    goToPreviousQuestion: (state) => {
      if (state.currentExam.currentQuestionIndex > 0) {
        state.currentExam.currentQuestionIndex -= 1;
      }
    },
    answerQuestion: (
      state,
      action: PayloadAction<{
        questionId: string;
        answerId: string;
        type: NormalizedQuestion['type'];
        maxSelections: number;
      }>
    ) => {
      const { questionId, answerId, type, maxSelections } = action.payload;
      const answers = state.currentExam.answers;
      if (type === 'multiple_choice') {
        const current = answers[questionId] || [];
        const updated = current.includes(answerId)
          ? current.filter(id => id !== answerId)
          : [...current, answerId].slice(0, maxSelections || current.length + 1);
        state.currentExam.answers = { ...answers, [questionId]: updated };
      } else {
        state.currentExam.answers = { ...answers, [questionId]: [answerId] };
      }
      state.currentExam.lastSaved = new Date().toISOString();
    },
    toggleFlagQuestion: (state, action: PayloadAction<string>) => {
      const questionId = action.payload;
      const flagged = state.currentExam.flaggedQuestions;
      state.currentExam.flaggedQuestions = flagged.includes(questionId)
        ? flagged.filter(id => id !== questionId)
        : [...flagged, questionId];
      state.currentExam.lastSaved = new Date().toISOString();
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.currentExam.timeRemaining = action.payload;
      if (state.currentExam.timeRemaining <= 0) {
        state.currentExam.examCompleted = true;
      }
    },
    updateTimeSpent: (state, action: PayloadAction<number>) => {
      state.currentExam.timeSpentInSeconds = action.payload;
      state.currentExam.lastSaved = new Date().toISOString();
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(loadExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load exams';
      })
      .addCase(loadExamQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExamQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam.questions = action.payload.questions;
        state.currentExam.timeRemaining = action.payload.timeLimit;
      })
      .addCase(loadExamQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(submitExam.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitExam.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam.examCompleted = true;
        const { score, correctAnswers, totalQuestions, status } = action.payload;
        const attempt: ExamAttempt = {
          id: state.currentExam.attemptId || `attempt-${Date.now()}`,
          examId: state.currentExam.examId || '',
          startTime: state.currentExam.startTime || new Date().toISOString(),
          endTime: new Date().toISOString(),
          status,
          answers: Object.entries(state.currentExam.answers).map(([questionId, selectedAnswers]) => ({
            questionId,
            selectedAnswers,
          })),
          score,
          totalQuestions,
          correctAnswers,
          flaggedQuestions: state.currentExam.flaggedQuestions,
          timeSpentInSeconds: state.currentExam.timeSpentInSeconds,
        };
        state.examHistory = [...state.examHistory, attempt];
      })
      .addCase(submitExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  startExam,
  resetExam,
  resetExamData,
  setCurrentQuestionIndex,
  goToNextQuestion,
  goToPreviousQuestion,
  answerQuestion,
  toggleFlagQuestion,
  updateTimeRemaining,
  updateTimeSpent,
} = examSlice.actions;

export default examSlice.reducer;

export { loadExamQuestions, submitExam, loadExams, resetExamData };
