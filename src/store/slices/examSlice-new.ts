import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ExamStatus, ExamAttempt, ExamSummary, QuestionAnswer } from '../../types/exam';

export interface Option {
  id: string;
  text: string;
  image?: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctAnswers: string[];
  type: 'single' | 'multiple';
  images?: string[];
  video?: string;
  explanation?: string;
}

export interface ExamState {
  // Available exams
  exams: ExamSummary[];

  // Current active exam
  currentExam: {
    examId: string | null;
    attemptId: string | null;
    questions: Question[];
    currentQuestionIndex: number;
    answers: Record<string, string[]>; // questionId -> selected answer ids
    flaggedQuestions: string[];
    startTime: string | null;
    timeRemaining: number; // in seconds
    timeSpentInSeconds: number;
    examCompleted: boolean;
    examStarted: boolean;
    lastSaved: string | null; // timestamp of last save to persistence
  };

  // User's exam history
  examHistory: ExamAttempt[];

  // UI state
  loading: boolean;
  error: string | null;
}

const initialState: ExamState = {
  exams: [],

  currentExam: {
    examId: null,
    attemptId: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    flaggedQuestions: [],
    startTime: null,
    timeRemaining: 45 * 60, // 45 minutes in seconds
    timeSpentInSeconds: 0,
    examCompleted: false,
    examStarted: false,
    lastSaved: null,
  },

  examHistory: [],
  loading: false,
  error: null,
};

// Mock exam data
export const mockExams: ExamSummary[] = [
  {
    id: 'exam001',
    name: 'Life in the UK - Practice Test 1',
    description: 'A practice test covering UK history, government, and society.',
    totalQuestions: 24,
    timeAllowedInMinutes: 45,
    passingScore: 75,
    category: 'History',
  },
  {
    id: 'exam002',
    name: 'Life in the UK - Practice Test 2',
    description: 'A practice test focusing on UK traditions and customs.',
    totalQuestions: 24,
    timeAllowedInMinutes: 45,
    passingScore: 75,
    category: 'Culture',
  },
  {
    id: 'exam003',
    name: 'Life in the UK - Mock Test',
    description: 'A full mock test with questions from all categories.',
    totalQuestions: 24,
    timeAllowedInMinutes: 45,
    passingScore: 75,
    category: 'Comprehensive',
  },
];

// Mock questions for development
export const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: 'What is the capital of the United Kingdom?',
    options: [
      { id: 'a', text: 'London' },
      { id: 'b', text: 'Edinburgh' },
      { id: 'c', text: 'Cardiff' },
      { id: 'd', text: 'Belfast' },
    ],
    correctAnswers: ['a'],
    type: 'single',
    explanation: 'London is the capital of the United Kingdom and has been a major settlement for two millennia.',
  },
  {
    id: 'q2',
    text: 'Which of these is NOT a country in the United Kingdom?',
    options: [
      { id: 'a', text: 'England' },
      { id: 'b', text: 'Scotland' },
      { id: 'c', text: 'Ireland' },
      { id: 'd', text: 'Wales' },
    ],
    correctAnswers: ['c'],
    type: 'single',
    explanation: 'The United Kingdom consists of England, Scotland, Wales, and Northern Ireland. Ireland (Republic of Ireland) is an independent country.',
  },
  {
    id: 'q3',
    text: 'The UK Parliament has two chambers. Which of the following are they? (Select TWO options)',
    options: [
      { id: 'a', text: 'House of Representatives' },
      { id: 'b', text: 'House of Commons' },
      { id: 'c', text: 'House of Senate' },
      { id: 'd', text: 'House of Lords' },
      { id: 'e', text: 'House of Congress' },
    ],
    correctAnswers: ['b', 'd'],
    type: 'multiple',
    explanation: 'The UK Parliament consists of the House of Commons and the House of Lords. The House of Commons is elected, and the House of Lords is mostly appointed.',
  },
  {
    id: 'q4',
    text: 'The Union Flag, or Union Jack, combines the crosses of three patron saints. Which of the following countries are represented? (Select ALL that apply)',
    options: [
      { id: 'a', text: 'England (St George)' },
      { id: 'b', text: 'Wales (St David)' },
      { id: 'c', text: 'Scotland (St Andrew)' },
      { id: 'd', text: 'Northern Ireland (St Patrick)' },
      { id: 'e', text: 'Republic of Ireland (St Columba)' },
    ],
    correctAnswers: ['a', 'c', 'd'],
    type: 'multiple',
    explanation: 'The Union Flag combines the crosses of St George (England), St Andrew (Scotland), and St Patrick (Northern Ireland). Wales is not represented because when the first Union Flag was created in 1606, Wales was already united with England.',
    images: ['https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg'],
  },
  {
    id: 'q5',
    text: 'When did the UK join the European Economic Community (EEC), which later became the European Union?',
    options: [
      { id: 'a', text: '1957' },
      { id: 'b', text: '1973' },
      { id: 'c', text: '1981' },
      { id: 'd', text: '1993' },
    ],
    correctAnswers: ['b'],
    type: 'single',
    explanation: 'The UK joined the EEC on January 1, 1973, along with Denmark and Ireland.',
  },
  {
    id: 'q6',
    text: 'Who is the current head of state in the United Kingdom?',
    options: [
      { id: 'a', text: 'The Prime Minister' },
      { id: 'b', text: 'The President' },
      { id: 'c', text: 'The King' },
      { id: 'd', text: 'The Parliament' },
    ],
    correctAnswers: ['c'],
    type: 'single',
    explanation: 'The monarch (currently King Charles III) is the head of state in the United Kingdom. The Prime Minister is the head of government.',
  },
];

// Async thunks
export const loadExams = createAsyncThunk(
  'exam/loadExams',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would fetch from an API
      // For now, we'll use mock data
      return mockExams;
    } catch (error) {
      return rejectWithValue('Failed to load exams: ' + (error as Error).message);
    }
  }
);

export const loadExamQuestions = createAsyncThunk(
  'exam/loadExamQuestions',
  async (examId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would fetch from an API based on examId
      // For now, we'll use mock data
      return {
        examId,
        questions: mockQuestions,
      };
    } catch (error) {
      return rejectWithValue('Failed to load exam questions: ' + (error as Error).message);
    }
  }
);

export const submitExam = createAsyncThunk(
  'exam/submitExam',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { exam: ExamState };
      const { questions, answers } = state.exam.currentExam;

      // Calculate score
      let correctCount = 0;

      questions.forEach(question => {
        const userAnswers = answers[question.id] || [];

        // For single choice questions
        if (question.type === 'single') {
          if (userAnswers.length === 1 && question.correctAnswers.includes(userAnswers[0])) {
            correctCount++;
          }
        }
        // For multiple choice questions
        else if (question.type === 'multiple') {
          // All correct answers must be selected and no incorrect answers
          const allCorrectSelected = question.correctAnswers.every(id => userAnswers.includes(id));
          const noIncorrectSelected = userAnswers.every(id => question.correctAnswers.includes(id));

          if (allCorrectSelected && noIncorrectSelected) {
            correctCount++;
          }
        }
      });

      const score = Math.round((correctCount / questions.length) * 100);
      const isPassing = score >= 75; // Assuming 75% is passing

      return {
        score,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        status: isPassing ? 'passed' as ExamStatus : 'failed' as ExamStatus,
      };
    } catch (error) {
      return rejectWithValue('Failed to submit exam: ' + (error as Error).message);
    }
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    // EXAM MANAGEMENT
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

    resetExam: (state) => {
      state.currentExam = initialState.currentExam;
    },

    // NAVIGATION
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.currentExam.questions.length) {
        state.currentExam.currentQuestionIndex = action.payload;
      }
    },

    goToNextQuestion: (state) => {
      const currentIndex = state.currentExam.currentQuestionIndex;
      const questionsLength = state.currentExam.questions.length;

      if (currentIndex < questionsLength - 1) {
        state.currentExam.currentQuestionIndex += 1;
      }
    },

    goToPreviousQuestion: (state) => {
      if (state.currentExam.currentQuestionIndex > 0) {
        state.currentExam.currentQuestionIndex -= 1;
      }
    },

    // ANSWER MANAGEMENT
    answerQuestion: (state, action: PayloadAction<{
      questionId: string;
      answerId: string;
      isMultiple?: boolean;
    }>) => {
      const { questionId, answerId, isMultiple } = action.payload;
      const answers = state.currentExam.answers;

      if (isMultiple) {
        // For multiple choice, toggle the answer in the array
        const currentAnswers = answers[questionId] || [];
        const updatedAnswers = currentAnswers.includes(answerId)
          ? currentAnswers.filter(id => id !== answerId)
          : [...currentAnswers, answerId];

        state.currentExam.answers = {
          ...answers,
          [questionId]: updatedAnswers,
        };
      } else {
        // For single choice, just replace the answer
        state.currentExam.answers = {
          ...answers,
          [questionId]: [answerId],
        };
      }

      // Update last saved timestamp
      state.currentExam.lastSaved = new Date().toISOString();
    },

    // FLAG MANAGEMENT
    toggleFlagQuestion: (state, action: PayloadAction<string>) => {
      const questionId = action.payload;
      const flagged = state.currentExam.flaggedQuestions;

      if (flagged.includes(questionId)) {
        state.currentExam.flaggedQuestions = flagged.filter(id => id !== questionId);
      } else {
        state.currentExam.flaggedQuestions = [...flagged, questionId];
      }

      // Update last saved timestamp
      state.currentExam.lastSaved = new Date().toISOString();
    },

    // TIME MANAGEMENT
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.currentExam.timeRemaining = action.payload;

      // Auto-submit if time runs out
      if (state.currentExam.timeRemaining <= 0) {
        state.currentExam.examCompleted = true;
      }
    },

    updateTimeSpent: (state, action: PayloadAction<number>) => {
      state.currentExam.timeSpentInSeconds = action.payload;
      state.currentExam.lastSaved = new Date().toISOString();
    },

    // COMPLETE EXAM
    completeExam: (state, action: PayloadAction<{
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      status: ExamStatus;
    }>) => {
      const { score, correctAnswers, totalQuestions, status } = action.payload;
      state.currentExam.examCompleted = true;

      // Create an attempt record
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

      // Add to history
      state.examHistory = [...state.examHistory, attempt];

      // Update the exam in exams list if it exists
      const examIndex = state.exams.findIndex(e => e.id === state.currentExam.examId);
      if (examIndex !== -1) {
        state.exams[examIndex] = {
          ...state.exams[examIndex],
          attempts: [...(state.exams[examIndex].attempts || []), attempt],
          lastAttempt: attempt,
        };
      }
    },
  },
  extraReducers: (builder) => {
    // Load Exams List
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
        state.error = action.payload as string;
      });

    // Load Exam Questions
    builder
      .addCase(loadExamQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExamQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam.questions = action.payload.questions;
      })
      .addCase(loadExamQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Submit Exam
    builder
      .addCase(submitExam.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitExam.fulfilled, (state, action) => {
        state.loading = false;
        // The completeExam reducer will handle updating the state with the results
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
  setCurrentQuestionIndex,
  goToNextQuestion,
  goToPreviousQuestion,
  answerQuestion,
  toggleFlagQuestion,
  updateTimeRemaining,
  updateTimeSpent,
  completeExam,
} = examSlice.actions;

export default examSlice.reducer;
