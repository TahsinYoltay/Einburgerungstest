import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RatingStatus = 
  | 'not_eligible' 
  | 'eligible_not_asked' 
  | 'asked_ignored' 
  | 'asked_remind_later' 
  | 'completed_flow' 
  | 'negative_feedback_given' 
  | 'opted_out';

export type PromptOutcome = 
  | 'ignored' 
  | 'remind_later' 
  | 'positive_flow' 
  | 'negative_feedback' 
  | 'opted_out' 
  | null;

export interface RatingState {
  ownerUid: string | null;
  status: RatingStatus;
  installDate: number;
  firstEligibilityDate: number | null;
  lastPromptDate: number | null;
  totalPromptCount: number;
  lastOutcome: PromptOutcome;
  
  // Engagement counters since the last meaningful interaction (prompt shown or install)
  examsCompletedSinceLastPrompt: number;
  chaptersCompletedSinceLastPrompt: number;
  
  // Global counters for eligibility
  totalExamsCompleted: number;
  totalChaptersCompleted: number;
}

function createInitialRatingState(): RatingState {
  return {
    ownerUid: null,
    status: 'not_eligible',
    installDate: Date.now(),
    firstEligibilityDate: null,
    lastPromptDate: null,
    totalPromptCount: 0,
    lastOutcome: null,
    examsCompletedSinceLastPrompt: 0,
    chaptersCompletedSinceLastPrompt: 0,
    totalExamsCompleted: 0,
    totalChaptersCompleted: 0,
  };
}

const initialState: RatingState = createInitialRatingState();

const ratingSlice = createSlice({
  name: 'rating',
  initialState,
  reducers: {
    hydrateRatingState: (_state, action: PayloadAction<RatingState>) => {
      return action.payload;
    },
    resetRatingState: (_state, action: PayloadAction<{ ownerUid: string | null }>) => {
      return {
        ...createInitialRatingState(),
        ownerUid: action.payload.ownerUid,
      };
    },
    setRatingOwnerUid: (state, action: PayloadAction<string | null>) => {
      state.ownerUid = action.payload;
    },
    initializeRatingState: (state) => {
      if (!state.installDate) {
        state.installDate = Date.now();
      }
    },
    recordExamCompleted: (state) => {
      state.examsCompletedSinceLastPrompt += 1;
      state.totalExamsCompleted += 1;
    },
    recordChapterCompleted: (state) => {
      state.chaptersCompletedSinceLastPrompt += 1;
      state.totalChaptersCompleted += 1;
    },
    markEligible: (state) => {
        if (state.status === 'not_eligible') {
            state.status = 'eligible_not_asked';
            state.firstEligibilityDate = Date.now();
        }
    },
    recordPromptShown: (state) => {
      state.lastPromptDate = Date.now();
      state.totalPromptCount += 1;
      // We don't reset 'SinceLastPrompt' counters here immediately? 
      // Usually we reset them after the outcome is decided, or right here.
      // Let's reset them here to start counting for the next cycle.
      state.examsCompletedSinceLastPrompt = 0;
      state.chaptersCompletedSinceLastPrompt = 0;
    },
    recordPromptOutcome: (state, action: PayloadAction<{ outcome: PromptOutcome, nextStatus: RatingStatus }>) => {
      state.lastOutcome = action.payload.outcome;
      state.status = action.payload.nextStatus;
    },
    resetEngagementCounters: (state) => {
        state.examsCompletedSinceLastPrompt = 0;
        state.chaptersCompletedSinceLastPrompt = 0;
    }
  },
});

export const { 
    hydrateRatingState,
    resetRatingState,
    setRatingOwnerUid,
    initializeRatingState, 
    recordExamCompleted, 
    recordChapterCompleted, 
    markEligible,
    recordPromptShown,
    recordPromptOutcome,
    resetEngagementCounters
} = ratingSlice.actions;

export default ratingSlice.reducer;
