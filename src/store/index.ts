import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import type { PersistConfig } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import authReducer from './slices/authSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import examReducer from './slices/examSlice';
import contentReducer from './slices/contentSlice';
import bookReducer from './slices/bookSlice';
import ratingReducer from './slices/ratingSlice';
import reactotron from '../../ReactotronConfig';
import { progressSyncListenerMiddleware } from './progressSyncListenerMiddleware';
import { setAnonymousUser, setAuthenticatedUser } from './slices/authSlice';
import {
  answerQuestion,
  hideQuestionFromReview,
  hydrateExamUserData,
  resetExam,
  resetExamData,
  saveCurrentExamProgress,
  startExam,
  submitExam,
  toggleFavoriteQuestion,
  toggleFlagQuestion,
  updateTimeRemaining,
  updateTimeSpent,
  goToNextQuestion,
  goToPreviousQuestion,
  setCurrentQuestionIndex,
  resetAllExamUserData,
} from './slices/examSlice';
import { progressSyncService } from '../services/ProgressSyncService';
import { ratingSyncService, type RatingStatePayloadV1 } from '../services/RatingSyncService';
import { userProfileService } from '../services/UserProfileService';
import { loadProgress as loadBookProgress, flushPendingRemotePushes } from '../services/readingProgressService';
import {
  hydrateRatingState,
  recordChapterCompleted as recordRatingChapterCompleted,
  recordExamCompleted as recordRatingExamCompleted,
  recordPromptOutcome,
  recordPromptShown,
  resetRatingState,
  setRatingOwnerUid,
} from './slices/ratingSlice';

const examPersistTransform = createTransform(
  (inboundState: any) => ({
    currentLanguage: inboundState?.currentLanguage ?? 'en',
  }),
  (outboundState: any) => {
    const initialExamState = examReducer(undefined, { type: '@@INIT' } as any);
    return {
      ...initialExamState,
      currentLanguage: outboundState?.currentLanguage ?? initialExamState.currentLanguage ?? 'en',
    };
  },
  { whitelist: ['exam'] }
);

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  subscription: subscriptionReducer,
  exam: examReducer,
  content: contentReducer,
  book: bookReducer,
  rating: ratingReducer,
});

// Configure Redux Persist
const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  storage: AsyncStorage,
  // Whitelist defines which reducers will be persisted
  // NOTE: subscription is NOT persisted - it must always come fresh from RevenueCat
  whitelist: ['auth', 'exam', 'content', 'book', 'rating'],
  transforms: [examPersistTransform],
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializableCheck as they are used by redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        warnAfter: 128,
      },
      immutableCheck: { warnAfter: 128 },
    }).prepend(progressSyncListenerMiddleware.middleware),
    enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(reactotron.createEnhancer()),

});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript
type StoreState = ReturnType<typeof store.getState>;
type DefinedState<T> = {
  [K in keyof T]-?: Exclude<T[K], undefined>;
};
export type RootState = DefinedState<StoreState>;
export type AppDispatch = typeof store.dispatch;

const startAppListening = progressSyncListenerMiddleware.startListening.withTypes<RootState, AppDispatch>();

const EMPTY_CURRENT_EXAM = {
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
};

const PERSIST_ROOT_KEY = 'persist:root';
const BOOK_PROGRESS_BOOK_ID = 'life-in-the-uk';

function selectRatingPayloadForSync(rating: RootState['rating']): RatingStatePayloadV1 {
  const { ownerUid: _ownerUid, ...payload } = rating;
  return payload;
}

async function readLegacyPersistedExamSlice(params: { uid: string }): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(PERSIST_ROOT_KEY);
    if (!raw) return null;
    const root = JSON.parse(raw) as Record<string, unknown>;
    const authRaw = root?.auth;
    const examRaw = root?.exam;
    if (!authRaw || typeof authRaw !== 'string') return null;
    if (!examRaw || typeof examRaw !== 'string') return null;

    const legacyAuth = JSON.parse(authRaw);
    if (legacyAuth?.firebaseUid !== params.uid) return null;

    return JSON.parse(examRaw);
  } catch (error) {
    console.warn('ProgressSync: failed to read legacy persisted exam slice', error);
    return null;
  }
}

const LOCAL_EXAM_SAVE_DEBOUNCE_MS = 1500;
const localExamSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleLocalExamProgressSave(uid: string) {
  const existing = localExamSaveTimers.get(uid);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    localExamSaveTimers.delete(uid);
    const state = store.getState() as RootState;
    if (state.auth.firebaseUid !== uid) return;

    const snapshot = progressSyncService.buildLocalExamSnapshot({
      examHistory: state.exam.examHistory,
      favoriteQuestions: state.exam.favoriteQuestions,
      questionStats: state.exam.questionStats,
      inProgress: state.exam.inProgress,
      currentExam: state.exam.currentExam,
      currentLanguage: state.exam.currentLanguage,
      summaryClientUpdatedAt: progressSyncService.getSummaryClientUpdatedAt(uid) ?? 0,
    });
    await progressSyncService.saveLocalExamProgress(uid, snapshot);
  }, LOCAL_EXAM_SAVE_DEBOUNCE_MS);

  localExamSaveTimers.set(uid, timer);
}

startAppListening({
  actionCreator: setAuthenticatedUser,
  effect: async (_action, listenerApi) => {
    const previousUid = (listenerApi.getOriginalState() as RootState).auth.firebaseUid;
    const nextUid = (listenerApi.getState() as RootState).auth.firebaseUid;
    const isSwitchingUser = !!previousUid && !!nextUid && previousUid !== nextUid;

    if (previousUid && previousUid !== nextUid) {
      const prevState = listenerApi.getOriginalState() as RootState;
      const snapshot = progressSyncService.buildLocalExamSnapshot({
        examHistory: prevState.exam.examHistory,
        favoriteQuestions: prevState.exam.favoriteQuestions,
        questionStats: prevState.exam.questionStats,
        inProgress: prevState.exam.inProgress,
        currentExam: prevState.exam.currentExam,
        currentLanguage: prevState.exam.currentLanguage,
        summaryClientUpdatedAt: progressSyncService.getSummaryClientUpdatedAt(previousUid) ?? 0,
      });
      await progressSyncService.saveLocalExamProgress(previousUid, snapshot);
    }

    if (!nextUid) return;

    progressSyncService.setIdentity({ uid: nextUid, isAnonymous: false });

    const state = listenerApi.getState() as RootState;
    let local = await progressSyncService.loadLocalExamProgress(nextUid);

    if (!local && !isSwitchingUser) {
      const legacyExam = await readLegacyPersistedExamSlice({ uid: nextUid });
      if (legacyExam) {
        local = progressSyncService.buildLocalExamSnapshot({
          examHistory: legacyExam.examHistory || [],
          favoriteQuestions: legacyExam.favoriteQuestions || [],
          questionStats: legacyExam.questionStats || {},
          inProgress: legacyExam.inProgress || {},
          currentExam: legacyExam.currentExam || EMPTY_CURRENT_EXAM,
          currentLanguage: legacyExam.currentLanguage || state.exam.currentLanguage,
          summaryClientUpdatedAt: 0,
        });
      }
    }

    if (!local) {
      local = progressSyncService.buildLocalExamSnapshot({
        examHistory: [],
        favoriteQuestions: [],
        questionStats: {},
        inProgress: {},
        currentExam: EMPTY_CURRENT_EXAM,
        currentLanguage: state.exam.currentLanguage,
        summaryClientUpdatedAt: 0,
      });
    }

    let merged = local;
    try {
      const remote = await progressSyncService.pullRemoteExamProgress(nextUid);
      merged = progressSyncService.mergeExamProgress({ local, remote });
    } catch (error) {
      console.warn('ProgressSync: failed to pull remote exam progress', error);
    }

    await progressSyncService.saveLocalExamProgress(nextUid, merged);
    const hydration = progressSyncService.materializeExamHydrationPayload({
      snapshot: merged,
      chaptersData: (listenerApi.getState() as RootState).exam.chaptersData,
    });

    listenerApi.dispatch(resetAllExamUserData());
    listenerApi.dispatch(hydrateExamUserData(hydration));
    void progressSyncService.flushAll();

    const authState = (listenerApi.getState() as RootState).auth;
    const uid = authState.firebaseUid;
    if (!uid) return;

    void userProfileService.ensureUserProfileDoc({
      uid,
      isAnonymous: false,
      email: authState.email,
      displayName: authState.displayName,
      photoURL: authState.photoURL,
    });

    void (async () => {
      try {
        await loadBookProgress({
          bookId: BOOK_PROGRESS_BOOK_ID,
          userId: uid,
          syncMode: 'local+remote',
        });
        await flushPendingRemotePushes();
      } catch (error) {
        console.warn('ProgressSync: failed to bootstrap book progress', error);
      }
    })();
  },
});

startAppListening({
  actionCreator: setAnonymousUser,
  effect: async (_action, listenerApi) => {
    const previousUid = (listenerApi.getOriginalState() as RootState).auth.firebaseUid;
    const nextUid = (listenerApi.getState() as RootState).auth.firebaseUid;
    const isSwitchingUser = !!previousUid && !!nextUid && previousUid !== nextUid;

    if (previousUid && previousUid !== nextUid) {
      const prevState = listenerApi.getOriginalState() as RootState;
      const snapshot = progressSyncService.buildLocalExamSnapshot({
        examHistory: prevState.exam.examHistory,
        favoriteQuestions: prevState.exam.favoriteQuestions,
        questionStats: prevState.exam.questionStats,
        inProgress: prevState.exam.inProgress,
        currentExam: prevState.exam.currentExam,
        currentLanguage: prevState.exam.currentLanguage,
        summaryClientUpdatedAt: progressSyncService.getSummaryClientUpdatedAt(previousUid) ?? 0,
      });
      await progressSyncService.saveLocalExamProgress(previousUid, snapshot);
    }

    if (!nextUid) return;

    // Anonymous users keep local-only progress; do not pull/push remote.
    progressSyncService.setIdentity({ uid: nextUid, isAnonymous: true });

    const state = listenerApi.getState() as RootState;
    let local = await progressSyncService.loadLocalExamProgress(nextUid);

    if (!local && !isSwitchingUser) {
      const legacyExam = await readLegacyPersistedExamSlice({ uid: nextUid });
      if (legacyExam) {
        local = progressSyncService.buildLocalExamSnapshot({
          examHistory: legacyExam.examHistory || [],
          favoriteQuestions: legacyExam.favoriteQuestions || [],
          questionStats: legacyExam.questionStats || {},
          inProgress: legacyExam.inProgress || {},
          currentExam: legacyExam.currentExam || EMPTY_CURRENT_EXAM,
          currentLanguage: legacyExam.currentLanguage || state.exam.currentLanguage,
          summaryClientUpdatedAt: 0,
        });
      }
    }

    if (!local) {
      local = progressSyncService.buildLocalExamSnapshot({
        examHistory: [],
        favoriteQuestions: [],
        questionStats: {},
        inProgress: {},
        currentExam: EMPTY_CURRENT_EXAM,
        currentLanguage: state.exam.currentLanguage,
        summaryClientUpdatedAt: 0,
      });
    }

    await progressSyncService.saveLocalExamProgress(nextUid, local);
    const hydration = progressSyncService.materializeExamHydrationPayload({
      snapshot: local,
      chaptersData: (listenerApi.getState() as RootState).exam.chaptersData,
    });

    listenerApi.dispatch(resetAllExamUserData());
    listenerApi.dispatch(hydrateExamUserData(hydration));
  },
});

startAppListening({
  actionCreator: toggleFavoriteQuestion,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    if (!state.auth.firebaseUid) return;

    const questionId = action.payload;
    const isFav = state.exam.favoriteQuestions.includes(questionId);
    progressSyncService.touchSummaryClientUpdatedAt(state.auth.firebaseUid);
    scheduleLocalExamProgressSave(state.auth.firebaseUid);

    if (state.auth.status === 'authenticated') {
      progressSyncService.setIdentity({ uid: state.auth.firebaseUid, isAnonymous: false });
      progressSyncService.scheduleExamSummaryPatch({
        favorites: { [questionId]: isFav },
      });
    }
  },
});

startAppListening({
  actionCreator: hideQuestionFromReview,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    if (!state.auth.firebaseUid) return;

    const questionId = action.payload;
    progressSyncService.touchSummaryClientUpdatedAt(state.auth.firebaseUid);
    scheduleLocalExamProgressSave(state.auth.firebaseUid);

    if (state.auth.status === 'authenticated') {
      progressSyncService.setIdentity({ uid: state.auth.firebaseUid, isAnonymous: false });
      progressSyncService.scheduleExamSummaryPatch({
        hiddenFromIncorrect: { [questionId]: true },
      });
    }
  },
});

startAppListening({
  actionCreator: submitExam.fulfilled,
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    if (!state.auth.firebaseUid) return;

    if (state.auth.status !== 'authenticated') {
      scheduleLocalExamProgressSave(state.auth.firebaseUid);
      return;
    }

    const latestAttempt = state.exam.examHistory[state.exam.examHistory.length - 1];
    if (!latestAttempt) return;

    const { currentExam, questionStats } = state.exam;
    const questionIds = currentExam.questions.map(q => q.id);
    const answers = currentExam.answers || {};

    // Unhide questions that were answered incorrectly in this attempt (matches reducer behavior)
    const incorrectQuestionIds: string[] = [];
    currentExam.questions.forEach(q => {
      const ans = currentExam.answers[q.id] || [];
      const correct = q.correct_option_indexes.map(idx => idx.toString());
      const allCorrect = correct.every(id => ans.includes(id));
      const noIncorrect = ans.every(id => correct.includes(id));
      const isCorrect = allCorrect && noIncorrect;
      if (!isCorrect) incorrectQuestionIds.push(q.id);
    });

    if (incorrectQuestionIds.length > 0) {
      progressSyncService.touchSummaryClientUpdatedAt(state.auth.firebaseUid);
    }
    scheduleLocalExamProgressSave(state.auth.firebaseUid);

    progressSyncService.setIdentity({ uid: state.auth.firebaseUid, isAnonymous: false });
    incorrectQuestionIds.forEach(qid => {
      progressSyncService.scheduleExamSummaryPatch({
        hiddenFromIncorrect: { [qid]: false },
      });
    });

    await progressSyncService.pushExamAttemptAndSummary({
      attempt: latestAttempt,
      questionIds,
      answers,
      examLanguage: state.exam.currentLanguage,
      favoriteQuestions: state.exam.favoriteQuestions,
      hiddenFromIncorrect: Object.entries(questionStats)
        .filter(([, stats]) => stats.hiddenFromIncorrectList)
        .map(([qid]) => qid),
      examHistory: state.exam.examHistory,
      clearInProgressExamId: currentExam.examId || undefined,
    });
  },
});

const maybeCheckpointExamInProgress = (state: RootState) => {
  if (state.auth.status !== 'authenticated' || !state.auth.firebaseUid) return;
  const { currentExam } = state.exam;
  if (!currentExam.examId || !currentExam.examStarted || currentExam.examCompleted) return;
  if (!currentExam.questions.length) return;

  progressSyncService.setIdentity({ uid: state.auth.firebaseUid, isAnonymous: false });
  progressSyncService.scheduleExamInProgressCheckpoint({
    examId: currentExam.examId,
    attemptId: currentExam.attemptId || `attempt-${Date.now()}`,
    questionIds: currentExam.questions.map(q => q.id),
    answers: currentExam.answers || {},
    flaggedQuestions: currentExam.flaggedQuestions || [],
    currentQuestionIndex: currentExam.currentQuestionIndex,
    startedAt: currentExam.startTime || new Date().toISOString(),
    timeRemaining: currentExam.timeRemaining,
    timeSpentInSeconds: currentExam.timeSpentInSeconds,
    examLanguage: state.exam.currentLanguage,
  });
};

[
  startExam,
  answerQuestion,
  toggleFlagQuestion,
  setCurrentQuestionIndex,
  goToNextQuestion,
  goToPreviousQuestion,
  updateTimeRemaining,
  updateTimeSpent,
  saveCurrentExamProgress,
  resetExam,
  resetExamData,
  resetAllExamUserData,
].forEach(actionCreator => {
  startAppListening({
    actionCreator,
    effect: async (_action, listenerApi) => {
      const state = listenerApi.getState() as RootState;
      if (state.auth.firebaseUid) {
        scheduleLocalExamProgressSave(state.auth.firebaseUid);
      }
      maybeCheckpointExamInProgress(state);
    },
  });
});

startAppListening({
  actionCreator: setAuthenticatedUser,
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const uid = state.auth.firebaseUid;
    if (!uid) return;

    const localRating = state.rating;
    const localPayload =
      localRating.ownerUid === uid || localRating.ownerUid == null ? selectRatingPayloadForSync(localRating) : null;

    if (localRating.ownerUid && localRating.ownerUid !== uid) {
      listenerApi.dispatch(resetRatingState({ ownerUid: uid }));
    }

    const remotePayload = await ratingSyncService.pullRemoteRatingState(uid);

    const mergedPayload = remotePayload
      ? ratingSyncService.mergeRatingState({ local: localPayload, remote: remotePayload })
      : localPayload && ratingSyncService.isMeaningfulState(localPayload)
        ? ratingSyncService.normalizeRatingState(localPayload)
        : ratingSyncService.normalizeRatingState({});

    listenerApi.dispatch(
      hydrateRatingState({
        ownerUid: uid,
        ...mergedPayload,
      })
    );

    if (remotePayload || ratingSyncService.isMeaningfulState(mergedPayload)) {
      ratingSyncService.scheduleRemoteRatingStatePush(uid, mergedPayload);
    }
  },
});

[
  recordRatingExamCompleted,
  recordRatingChapterCompleted,
  recordPromptShown,
].forEach(actionCreator => {
  startAppListening({
    actionCreator,
    effect: async (_action, listenerApi) => {
      const state = listenerApi.getState() as RootState;
      if (state.auth.status !== 'authenticated' || !state.auth.firebaseUid) return;
      const uid = state.auth.firebaseUid;

      const rating = state.rating;
      if (rating.ownerUid && rating.ownerUid !== uid) return;
      if (rating.ownerUid == null) listenerApi.dispatch(setRatingOwnerUid(uid));

      ratingSyncService.scheduleRemoteRatingStatePush(uid, selectRatingPayloadForSync(rating));
    },
  });
});

startAppListening({
  actionCreator: recordPromptOutcome,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    if (state.auth.status !== 'authenticated' || !state.auth.firebaseUid) return;
    const uid = state.auth.firebaseUid;

    const rating = state.rating;
    if (rating.ownerUid && rating.ownerUid !== uid) return;
    if (rating.ownerUid == null) listenerApi.dispatch(setRatingOwnerUid(uid));

    ratingSyncService.scheduleRemoteRatingStatePush(uid, selectRatingPayloadForSync(rating));

    if (action.payload.nextStatus === 'completed_flow' || action.payload.nextStatus === 'opted_out') {
      await ratingSyncService.flushRemoteRatingState(uid);
    }
  },
});
