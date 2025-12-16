import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { contentEngine } from '../../services/ContentEngine';
import { HomeContent } from '../../types/content';
import { ExamManifestEntry, LanguageOption } from '../../types/exam';

// Default/Fallback Data
import defaultExams from '../../data/exam/normalized/exams.json';
import defaultLanguages from '../../../firebase_config/languages.json';

interface ContentState {
  loading: boolean;
  error: string | null;
  
  // Data Stores
  home: HomeContent | null;
  exams: ExamManifestEntry[];
  languages: LanguageOption[];
  
  // Meta
  versions: Record<string, number>;
}

const initialState: ContentState = {
  loading: false,
  error: null,
  home: null,
  exams: defaultExams as ExamManifestEntry[],
  languages: defaultLanguages as LanguageOption[],
  versions: {},
};

export const syncContent = createAsyncThunk(
  'content/sync',
  async () => {
    // 1. Fetch Master Manifest
    const manifest = await contentEngine.fetchMasterManifest();
    if (!manifest) {
      // Offline/first-run fallback: use cached modules if available, otherwise bundled defaults.
      const cachedExams = await contentEngine.loadLocalModuleData<ExamManifestEntry[]>('exams');
      const cachedLanguages = await contentEngine.loadLocalModuleData<LanguageOption[]>('languages');
      const cachedHome = await contentEngine.loadLocalModuleData<HomeContent>('home');

      return {
        exams: cachedExams || defaultExams,
        languages: cachedLanguages || defaultLanguages,
        home: cachedHome || null,
      };
    }

    // 2. Get Local Versions
    const localVersions = await contentEngine.getLocalVersions();

    const updates: Promise<any>[] = [];

    // 3. Check specific modules
    
    // --- EXAMS ---
    if (manifest.modules.exams.version > (localVersions['exams'] || 0)) {
      updates.push(
        contentEngine.downloadModuleData('exams', manifest.modules.exams.path, manifest.modules.exams.version)
      );
    } else {
      // Load from cache if exists
      updates.push(contentEngine.loadLocalModuleData('exams'));
    }

    // --- LANGUAGES (Config) ---
    if (manifest.modules.languages.version > (localVersions['languages'] || 0)) {
      updates.push(
        contentEngine.downloadModuleData('languages', manifest.modules.languages.path, manifest.modules.languages.version)
      );
    } else {
       updates.push(contentEngine.loadLocalModuleData('languages'));
    }

    // --- HOME ---
    if (manifest.modules.home.version > (localVersions['home'] || 0)) {
      updates.push(
        contentEngine.downloadModuleData('home', manifest.modules.home.path, manifest.modules.home.version)
      );
    } else {
       updates.push(contentEngine.loadLocalModuleData('home'));
    }

    const results = await Promise.all(updates);
    
    return {
      exams: results[0] || defaultExams,
      languages: results[1] || defaultLanguages,
      home: results[2] || null
    };
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(syncContent.pending, state => {
        state.loading = true;
      })
      .addCase(syncContent.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.exams) state.exams = action.payload.exams;
        if (action.payload.languages) state.languages = action.payload.languages;
        if (action.payload.home) state.home = action.payload.home;
      })
      .addCase(syncContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Sync failed';
      });
  },
});

export default contentSlice.reducer;
