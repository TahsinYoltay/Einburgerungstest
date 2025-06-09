import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Answer {
  questionId: string;
  selectedOption: number;
}

export interface ExamState {
  examId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, Answer>;
  flaggedQuestions: string[];
  timeRemaining: number; // in seconds
  examCompleted: boolean;
  examStarted: boolean;
  score: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: ExamState = {
  examId: null,
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  flaggedQuestions: [],
  timeRemaining: 45 * 60, // 45 minutes in seconds
  examCompleted: false,
  examStarted: false,
  score: null,
  loading: false,
  error: null,
};

// Mock questions for development
const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'What is the capital of the United Kingdom?',
    options: ['Edinburgh', 'London', 'Cardiff', 'Belfast'],
    correctAnswer: 1,
  },
  {
    id: '2',
    text: 'When did the UK join the European Economic Community (EEC)?',
    options: ['1957', '1973', '1981', '1993'],
    correctAnswer: 1,
  },
  {
    id: '3',
    text: 'Who is the head of state in the United Kingdom?',
    options: ['Prime Minister', 'The Queen', 'The King', 'Parliament'],
    correctAnswer: 2,
  },
];

// Async thunks
export const loadExam = createAsyncThunk(
  'exam/loadExam',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would fetch from an API
      // For now, we'll use mock data
      return {
        examId: 'exam001',
        questions: mockQuestions,
      };
    } catch (error) {
      return rejectWithValue('Failed to load exam: ' + (error as Error).message);
    }
  }
);

export const submitExam = createAsyncThunk(
  'exam/submitExam',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { exam: ExamState };
      const { questions, userAnswers } = state.exam;
      
      // Calculate score
      let correctCount = 0;
      questions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer && userAnswer.selectedOption === question.correctAnswer) {
          correctCount++;
        }
      });
      
      const score = (correctCount / questions.length) * 100;
      
      // In a real app, you would send this to an API
      return score;
    } catch (error) {
      return rejectWithValue('Failed to submit exam: ' + (error as Error).message);
    }
  }
);

export const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    startExam: (state) => {
      state.examStarted = true;
      state.examCompleted = false;
      state.timeRemaining = 45 * 60; // Reset timer to 45 minutes
      state.currentQuestionIndex = 0;
      state.userAnswers = {};
      state.flaggedQuestions = [];
      state.score = null;
    },
    resetExam: () => initialState,
    answerQuestion: (state, action: PayloadAction<Answer>) => {
      const { questionId, selectedOption } = action.payload;
      state.userAnswers[questionId] = { questionId, selectedOption };
    },
    goToNextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
      }
    },
    goToPreviousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },
    goToQuestion: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.questions.length) {
        state.currentQuestionIndex = action.payload;
      }
    },
    toggleFlagQuestion: (state, action: PayloadAction<string>) => {
      const questionId = action.payload;
      const flagIndex = state.flaggedQuestions.indexOf(questionId);
      
      if (flagIndex === -1) {
        state.flaggedQuestions.push(questionId);
      } else {
        state.flaggedQuestions.splice(flagIndex, 1);
      }
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
      if (state.timeRemaining <= 0) {
        state.examCompleted = true;
      }
    },
  },
  extraReducers: (builder) => {
    // Load Exam
    builder
      .addCase(loadExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadExam.fulfilled, (state, action) => {
        state.loading = false;
        state.examId = action.payload.examId;
        state.questions = action.payload.questions;
      })
      .addCase(loadExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
    // Submit Exam
    builder
      .addCase(submitExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitExam.fulfilled, (state, action) => {
        state.loading = false;
        state.examCompleted = true;
        state.score = action.payload;
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
  answerQuestion,
  goToNextQuestion,
  goToPreviousQuestion,
  goToQuestion,
  toggleFlagQuestion,
  updateTimeRemaining,
} = examSlice.actions;

export default examSlice.reducer;
