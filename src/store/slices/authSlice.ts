import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

/**
 * Auth State Structure
 * Following design spec Section 2.3
 */

export type AuthStatus = 'anonymous' | 'authenticated' | 'loading';
export type AuthProvider = 'none' | 'email' | 'google';

export interface AuthState {
  status: AuthStatus;
  authProvider: AuthProvider;
  firebaseUid: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  error: string | null;
}

const initialState: AuthState = {
  status: 'loading',
  authProvider: 'none',
  firebaseUid: null,
  email: null,
  displayName: null,
  photoURL: null,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.status = action.payload ? 'loading' : state.status;
      if (action.payload) {
        state.error = null;
      }
    },

    setAuthenticatedUser: (
      state,
      action: PayloadAction<{
        firebaseUid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
        authProvider: AuthProvider;
      }>
    ) => {
      state.status = 'authenticated';
      state.firebaseUid = action.payload.firebaseUid;
      state.email = action.payload.email;
      state.displayName = action.payload.displayName;
      state.photoURL = action.payload.photoURL;
      state.authProvider = action.payload.authProvider;
      state.error = null;
    },

    setAnonymousUser: (state, action: PayloadAction<{ firebaseUid: string }>) => {
      state.status = 'anonymous';
      state.firebaseUid = action.payload.firebaseUid;
      state.email = null;
      state.displayName = null;
      state.photoURL = null;
      state.authProvider = 'none';
      state.error = null;
    },

    clearAuth: (state) => {
      state.status = 'anonymous';
      state.authProvider = 'none';
      state.firebaseUid = null;
      state.email = null;
      state.displayName = null;
      state.photoURL = null;
      state.error = null;
    },

    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setUserPhotoURL: (state, action: PayloadAction<string | null>) => {
      state.photoURL = action.payload;
    },

    setUserDisplayName: (state, action: PayloadAction<string | null>) => {
      state.displayName = action.payload;
    },
  },
});

// Actions
export const {
  setAuthLoading,
  setAuthenticatedUser,
  setAnonymousUser,
  clearAuth,
  setAuthError,
  setUserPhotoURL,
  setUserDisplayName,
} = authSlice.actions;

// Selectors
export const selectAuthState = (state: RootState) => state.auth;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectIsAuthenticated = (state: RootState) => state.auth.status === 'authenticated';
export const selectIsAnonymous = (state: RootState) => state.auth.status === 'anonymous';
export const selectAuthProvider = (state: RootState) => state.auth.authProvider;
export const selectFirebaseUid = (state: RootState) => state.auth.firebaseUid;
export const selectUserEmail = (state: RootState) => state.auth.email;
export const selectUserDisplayName = (state: RootState) => state.auth.displayName;
export const selectUserPhotoURL = (state: RootState) => state.auth.photoURL;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;
