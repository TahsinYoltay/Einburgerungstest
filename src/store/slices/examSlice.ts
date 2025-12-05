import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ExamAttempt,
  ExamManifestEntry,
  ExamStatus,
  NormalizedQuestion,
  LanguageOption,
} from '../../types/exam';
import examsManifest from '../../data/exam/normalized/exams.json';
import defaultChaptersData from '../../data/exam/normalized/allChaptersData.normalized.json';
import { languageManager, ChaptersData } from '../../services/LanguageManager';

type AnswerMap = Record<string, string[]>; // questionId -> array of option index strings

type ExamState = {
  exams: ExamManifestEntry[];
  availableLanguages: LanguageOption[];
  // Store the chapters data in Redux to allow dynamic switching
  chaptersData: ChaptersData;
  currentLanguage: string;
  isDownloadingLanguage: boolean;
  downloadProgress: number;
  inProgress: Record<
    string,
    {
      examId: string;
      attemptId: string | null;
      questions: NormalizedQuestion[];
      currentQuestionIndex: number;
      answers: AnswerMap;
      flaggedQuestions: string[];
      startTime: string | null;
      timeRemaining: number;
      timeSpentInSeconds: number;
      examCompleted: boolean;
      examStarted: boolean;
      lastSaved: string | null;
    }
  >;
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
  questionStats: Record<
    string,
    {
      attempts: number;
      correct: number;
      incorrect: number;
      hiddenFromIncorrectList?: boolean; // New field to support "Removing" from Review without deleting stats
    }
  >;
  favoriteQuestions: string[];
  loading: boolean;
  error: string | null;
};

const defaultLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
];

const initialState: ExamState = {
  exams: examsManifest as ExamManifestEntry[],
  availableLanguages: defaultLanguages,
  chaptersData: defaultChaptersData as ChaptersData,
  currentLanguage: 'en',
  isDownloadingLanguage: false,
  downloadProgress: 0,
  inProgress: {},
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
  questionStats: {},
  favoriteQuestions: [],
  loading: false,
  error: null,
};

const examsManifestTyped = examsManifest as ExamManifestEntry[];

// Helper to get questions from the dynamic chapters data in state
const getQuestionsForExam = (manifest: ExamManifestEntry, currentChaptersData: ChaptersData): NormalizedQuestion[] => {
  const pool: NormalizedQuestion[] = [];

  // Cast to any to access data property safely, matching the structure
  const chaptersDataAny = (currentChaptersData as any).data as Record<
    string,
    { questions: NormalizedQuestion[] }
  >;

  const index: Record<string, NormalizedQuestion> = {};
  Object.values(chaptersDataAny).forEach(ch => {
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
      if (chaptersDataAny[key]) {
        pool.push(...chaptersDataAny[key].questions);
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

const persistCurrentIfNeeded = (state: ExamState) => {
  const examId = state.currentExam.examId;
  if (examId && state.currentExam.examStarted && !state.currentExam.examCompleted) {
    state.inProgress[examId] = { ...state.currentExam, examId };
  }
};

export const loadExams = createAsyncThunk('exam/loadExams', async () => {
  // Fallback or legacy load
  return examsManifestTyped;
});

// New thunk to switch language
export const switchExamLanguage = createAsyncThunk(
  'exam/switchLanguage',
  async (langCode: string, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as { exam: ExamState; content: any };
      // Look up in content slice first
      const targetLang = state.content?.languages?.find((l: any) => l.code === langCode);
      const remoteVersion = targetLang?.version || 1;

      // 1. Check if downloaded and version match
      const isDownloaded = await languageManager.isLanguageDownloaded(langCode);
      const localVersion = await languageManager.getDownloadedVersion(langCode);
      
      // Update if not downloaded OR if remote version is newer
      const needsUpdate = !isDownloaded || (localVersion < remoteVersion);
      
      if (needsUpdate) {
        // 2. Download if needed (reporting progress)
        // Note: Dispatching progress actions here would require a separate action
        // For simplicity, we assume the UI handles loading state via the thunk's pending/fulfilled
        await languageManager.downloadLanguage(langCode, remoteVersion, (progress) => {
           dispatch(setDownloadProgress(progress.bytesTransferred / progress.totalBytes));
        });
      }

      // 3. Load the data
      const data = await languageManager.loadLanguageData(langCode);
      return { langCode, data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const loadExamQuestions = createAsyncThunk(
  'exam/loadExamQuestions',
  async (examId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { exam: ExamState };
      const manifest = (examsManifest as ExamManifestEntry[]).find(e => e.id === examId);
      
      if (!manifest) throw new Error(`Exam not found: ${examId}`);
      
      // Use the dynamic chapters data from state instead of static import
      const pool = getQuestionsForExam(manifest, state.exam.chaptersData);
      
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

      if (!examId) throw new Error('Missing examId');
      if (!questions || questions.length === 0) throw new Error('No questions to submit');

      const manifest = (examsManifest as ExamManifestEntry[]).find(e => e.id === examId);
      const passMark = manifest?.pass_mark ?? 0.75;
      const timeLimit = (manifest?.time_limit_minutes || 45) * 60;

      let correctCount = 0;
      questions.forEach(q => {
        const userAnswers = (answers && answers[q.id]) || [];
        const correct = q.correct_option_indexes.map(idx => idx.toString());
        const allCorrectSelected = correct.every(id => userAnswers.includes(id));
        const noIncorrectSelected = userAnswers.every(id => correct.includes(id));
        if (allCorrectSelected && noIncorrectSelected) correctCount++;
      });

      const score = Math.round((correctCount / questions.length) * 100);
      const status: ExamStatus = score >= passMark * 100 ? 'passed' : 'failed';
      
      // Use the actively tracked timeSpentInSeconds from the state
      let timeSpentSeconds = state.exam.currentExam.timeSpentInSeconds;
      
      if (timeSpentSeconds === 0 && state.exam.currentExam.startTime) {
         timeSpentSeconds = Math.max(
          0,
          Math.min(timeLimit, timeLimit - (state.exam.currentExam.timeRemaining ?? timeLimit))
        );
      }

      return {
        score,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        status,
        timeSpentSeconds,
      };
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    startExam: (state, action: PayloadAction<{ examId: string; forceRestart?: boolean }>) => {
      if (!state.inProgress) {
        state.inProgress = {};
      }
      const examId = action.payload.examId;
      const forceRestart = action.payload.forceRestart ?? false;

      // Save current exam progress before switching to another exam
      if (state.currentExam.examId && state.currentExam.examId !== examId) {
        persistCurrentIfNeeded(state);
      }

      if (forceRestart) {
        delete state.inProgress[examId];
      }
      const saved = !forceRestart ? state.inProgress[examId] : undefined;
      const attemptId = saved?.attemptId || `attempt-${Date.now()}`;

      if (saved) {
        state.currentExam = {
          ...saved,
          examCompleted: false,
          examStarted: true,
          attemptId,
          examId,
        };
      } else {
        state.currentExam = {
          examId,
          attemptId,
          questions: [],
          currentQuestionIndex: 0,
          answers: {},
          flaggedQuestions: [],
          startTime: new Date().toISOString(),
          timeRemaining: 45 * 60,
          timeSpentInSeconds: 0,
          examCompleted: false,
          examStarted: true,
          lastSaved: new Date().toISOString(),
        };
      }
    },
    resetExamData: (state, action: PayloadAction<{ examId?: string }>) => {
      const examId = action.payload.examId;
      if (examId) {
        state.examHistory = state.examHistory.filter(a => a.examId !== examId);
        state.exams = state.exams.map(e =>
          e.id === examId ? { ...e, attempts: [], lastAttempt: undefined } : e
        );
        delete state.inProgress[examId];
        if (state.currentExam.examId === examId) {
          state.currentExam = initialState.currentExam;
        }
      } else {
        state.examHistory = [];
        state.exams = state.exams.map(e => ({ ...e, attempts: [], lastAttempt: undefined }));
        state.inProgress = {};
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
    tickTime: (state) => {
      if (!state.currentExam.examStarted || state.currentExam.examCompleted) return;
      state.currentExam.timeRemaining = Math.max(0, state.currentExam.timeRemaining - 1);
      state.currentExam.timeSpentInSeconds += 1;
      state.currentExam.lastSaved = new Date().toISOString();
    },
    updateTimeSpent: (state, action: PayloadAction<number>) => {
      state.currentExam.timeSpentInSeconds = action.payload;
      state.currentExam.lastSaved = new Date().toISOString();
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.currentExam.timeRemaining = Math.max(0, action.payload);
      state.currentExam.lastSaved = new Date().toISOString();
    },
    saveCurrentExamProgress: (state) => {
      persistCurrentIfNeeded(state);
    },
    toggleFavoriteQuestion: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const set = new Set(state.favoriteQuestions);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      state.favoriteQuestions = Array.from(set);
    },
    setDownloadProgress: (state, action: PayloadAction<number>) => {
      state.downloadProgress = action.payload;
    },
    hideQuestionFromReview: (state, action: PayloadAction<string>) => {
      const questionId = action.payload;
      if (!state.questionStats[questionId]) {
        state.questionStats[questionId] = { attempts: 0, correct: 0, incorrect: 0, hiddenFromIncorrectList: true };
      } else {
        state.questionStats[questionId].hiddenFromIncorrectList = true;
      }
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
      .addCase(switchExamLanguage.pending, (state) => {
        state.isDownloadingLanguage = true;
        state.error = null;
        state.downloadProgress = 0;
      })
      .addCase(switchExamLanguage.fulfilled, (state, action) => {
        state.isDownloadingLanguage = false;
        state.currentLanguage = action.payload.langCode;
        state.chaptersData = action.payload.data;
        state.downloadProgress = 100;

        // Refresh the text of currently active questions to match the new language
        // This preserves the shuffled order and user progress
        if (state.currentExam.questions.length > 0) {
          // 1. Create a lookup map for the new translated questions
          const newQuestionsMap: Record<string, NormalizedQuestion> = {};
          const chaptersDataAny = (action.payload.data as any).data;
          if (chaptersDataAny) {
            Object.values(chaptersDataAny).forEach((ch: any) => {
              ch.questions.forEach((q: NormalizedQuestion) => {
                newQuestionsMap[q.id] = q;
              });
            });
          }

          // 2. Update existing questions in place
          state.currentExam.questions = state.currentExam.questions.map(oldQ => {
            const newQ = newQuestionsMap[oldQ.id];
            return newQ ? { ...oldQ, ...newQ } : oldQ; // Update text fields, keep other state if any
          });
        }
      })
      .addCase(switchExamLanguage.rejected, (state, action) => {
        state.isDownloadingLanguage = false;
        state.error = action.payload as string;
      })
      .addCase(loadExamQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExamQuestions.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentExam.examId === action.payload.examId) {
          const hasExistingQuestions = state.currentExam.questions.length > 0;
          if (!hasExistingQuestions || state.currentExam.examCompleted) {
            state.currentExam.questions = action.payload.questions;
            state.currentExam.timeRemaining = action.payload.timeLimit;
          }
        }
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
        const { score, correctAnswers, totalQuestions, status, timeSpentSeconds } = action.payload as {
          score: number;
          correctAnswers: number;
          totalQuestions: number;
          status: ExamStatus;
          timeSpentSeconds: number;
        };
        const safeAnswers = state.currentExam.answers || {};
        const attempt: ExamAttempt = {
          id: state.currentExam.attemptId || `attempt-${Date.now()}`,
          examId: state.currentExam.examId || '',
          startTime: state.currentExam.startTime || new Date().toISOString(),
          endTime: new Date().toISOString(),
          status,
          answers: Object.entries(safeAnswers).map(([questionId, selectedAnswers]) => ({
            questionId,
            selectedAnswers,
          })),
          score,
          totalQuestions,
          correctAnswers,
          flaggedQuestions: state.currentExam.flaggedQuestions,
          timeSpentInSeconds: timeSpentSeconds,
        };
        state.examHistory = [...state.examHistory, attempt];
        if (state.currentExam.examId) {
          delete state.inProgress[state.currentExam.examId];

          // Attach attempt to exam manifest
          state.exams = state.exams.map(exam =>
            exam.id === state.currentExam.examId
              ? {
                  ...exam,
                  attempts: [...(exam.attempts || []), attempt],
                  lastAttempt: attempt,
                }
              : exam
          );

          // Update per-question stats
          state.currentExam.questions.forEach(q => {
            const ans = state.currentExam.answers[q.id] || [];
            const correct = q.correct_option_indexes.map(idx => idx.toString());
            const allCorrect = correct.every(id => ans.includes(id));
            const noIncorrect = ans.every(id => correct.includes(id));
            const isCorrect = allCorrect && noIncorrect;
            if (!state.questionStats[q.id]) {
              state.questionStats[q.id] = { attempts: 0, correct: 0, incorrect: 0 };
            }
            state.questionStats[q.id].attempts += 1;
            if (isCorrect) {
              state.questionStats[q.id].correct += 1;
            } else {
              state.questionStats[q.id].incorrect += 1;
              // If user gets it wrong again, un-hide it if it was hidden
              state.questionStats[q.id].hiddenFromIncorrectList = false;
            }
          });
        }
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
  tickTime,
  saveCurrentExamProgress,
  toggleFavoriteQuestion,
  setDownloadProgress,
  hideQuestionFromReview,
} = examSlice.actions;

export default examSlice.reducer;
