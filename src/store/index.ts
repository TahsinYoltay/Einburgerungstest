import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import authReducer from './slices/authSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import examReducer from './slices/examSlice';
import contentReducer from './slices/contentSlice';
import bookReducer from './slices/bookSlice';
import ratingReducer from './slices/ratingSlice';
import reactotron from '../../ReactotronConfig';

// Configure Redux Persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Whitelist defines which reducers will be persisted
  // NOTE: subscription is NOT persisted - it must always come fresh from RevenueCat
  whitelist: ['auth', 'exam', 'content', 'book', 'rating'],
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  subscription: subscriptionReducer,
  exam: examReducer,
  content: contentReducer,
  book: bookReducer,
  rating: ratingReducer,
});

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
    }),
    enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(reactotron.createEnhancer()),

});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
