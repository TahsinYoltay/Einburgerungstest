import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for user state
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  isLoggedIn: boolean;
  isPremium: boolean;
}

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

// Async thunks for user authentication
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // This would be replaced with actual Firebase auth in a real app
      // For now, just simulating a successful login
      if (credentials.email && credentials.password) {
        // Mock successful login response
        const mockUser: User = {
          id: 'user123',
          email: credentials.email,
          displayName: 'Test User',
          isLoggedIn: true,
          isPremium: false,
        };

        // Store user in AsyncStorage for persistence
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));

        return mockUser;
      } else {
        return rejectWithValue('Invalid email or password');
      }
    } catch (error) {
      return rejectWithValue('Login failed: ' + (error as Error).message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'user/register',
  async (userData: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // This would be replaced with actual Firebase auth in a real app
      // For now, just simulating a successful registration
      if (userData.email && userData.password) {
        // Mock successful registration response
        const mockUser: User = {
          id: 'user123',
          email: userData.email,
          displayName: null,
          isLoggedIn: true,
          isPremium: false,
        };

        // Store user in AsyncStorage for persistence
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));

        return mockUser;
      } else {
        return rejectWithValue('Invalid email or password');
      }
    } catch (error) {
      return rejectWithValue('Registration failed: ' + (error as Error).message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Remove user from AsyncStorage
      await AsyncStorage.removeItem('user');
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed: ' + (error as Error).message);
    }
  }
);

export const loadUser = createAsyncThunk(
  'user/load',
  async (_, { rejectWithValue }) => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString) as User;
      }
      return null;
    } catch (error) {
      return rejectWithValue('Failed to load user: ' + (error as Error).message);
    }
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Load User
    builder
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;
