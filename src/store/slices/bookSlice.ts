import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { languageManager, BookData } from '../../services/LanguageManager';

// Define Types based on the structure we generated
interface BookState {
  data: BookData | null;
  currentLanguage: string;
  loading: boolean;
  error: string | null;
  downloadProgress: number;
}

const initialState: BookState = {
  data: null,
  currentLanguage: 'en',
  loading: false,
  error: null,
  downloadProgress: 0,
};

// Thunk to switch language and load book content
export const switchBookLanguage = createAsyncThunk(
  'book/switchLanguage',
  async (langCode: string, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as any; // Access root state
      
      // Get remote version from content slice if available
      const targetLang = state.content?.languages?.find((l: any) => l.code === langCode);
      const remoteVersion = targetLang?.version || 1;

      // 1. Check if downloaded and version match
      const isDownloaded = await languageManager.isBookDownloaded(langCode);
      
      // Simple logic: if not downloaded or if we want to force check versions (future)
      // For now, just check existence or rely on English bundle
      
      // If not 'en' and not downloaded, download it.
      if (langCode !== 'en' && !isDownloaded) {
         await languageManager.downloadBook(langCode, (progress) => {
           dispatch(setBookDownloadProgress(progress.bytesTransferred / progress.totalBytes));
         });
      }

      // 3. Load the data
      const data = await languageManager.loadBookData(langCode);
      return { langCode, data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const loadBookContent = createAsyncThunk(
  'book/loadContent',
  async (_, { dispatch, getState }) => {
    // Initial load using current language (or default)
    // We can read the current language from the exam slice or a global settings slice if it exists
    // For now, default to 'en'
    return dispatch(switchBookLanguage('en'));
  }
);

const bookSlice = createSlice({
  name: 'book',
  initialState,
  reducers: {
    setBookDownloadProgress: (state, action: PayloadAction<number>) => {
      state.downloadProgress = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(switchBookLanguage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.downloadProgress = 0;
      })
      .addCase(switchBookLanguage.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLanguage = action.payload.langCode;
        state.data = action.payload.data;
        state.downloadProgress = 100;
      })
      .addCase(switchBookLanguage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setBookDownloadProgress } = bookSlice.actions;
export default bookSlice.reducer;
