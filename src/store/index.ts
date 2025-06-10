import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import userReducer from './slices/userSlice';
import examReducer from './slices/examSlice';
import reactotron from '../../ReactotronConfig';

// Configure Redux Persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Whitelist defines which reducers will be persisted
  whitelist: ['user', 'exam'], // Now we persist both user and exam data to save progress
};

// Combine reducers
const rootReducer = combineReducers({
  user: userReducer,
  exam: examReducer,
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
      },
    }),
    enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(reactotron.createEnhancer()),

});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
