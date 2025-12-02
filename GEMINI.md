# Gemini Memory & Project Context

## User Preferences
- **External Dependencies:** When a code change requires an external dependency or resource, first present the resource link to the user for approval before implementing the change.
- **UI/Navigation:** 
  - User prefers navigating to a new screen or using a modal for language selection instead of a long list in settings.
  - 'App Interface Language' should be labeled simply as 'Language'.
  - Preferences for better padding in UI elements.

## Technical Architecture: Dynamic Content (Firebase)
The app supports dynamic updates for languages and exams without app store releases.

### Storage Structure
- **Manifests (Config):**
  - `exam/config/languages.json`: List of available languages and their **versions**.
  - `exam/config/exams.json`: List of exam definitions.
- **Content:**
  - `exam/translations/allChaptersData.{lang}.json`: The actual question data.

### Update Strategy (Versioning)
- **Versioning:** The system relies on the `version` field in `languages.json` to detect updates.
- **Logic:** 
  1. App fetches `languages.json` on startup or **Pull-to-Refresh** (ExamListScreen).
  2. Compares Remote Version vs. Local Version (stored in `versions.json`).
  3. If `Remote > Local`, it forces a re-download of the content file.
- **Manual Update Process:**
  1. Upload new content file (overwrite existing).
  2. Increment `version` in `languages.json`.
  3. Upload updated `languages.json`.

### Key Files
- `src/services/ContentManager.ts`: Handles manifest fetching.
- `src/services/LanguageManager.ts`: Handles content downloading, caching, and version tracking.
- `src/store/slices/examSlice.ts`: Orchestrates the check and update logic.

## Technical Architecture: UI & Theming
The app uses a unified theming strategy supporting Light and Dark modes, integrated with React Native Paper and React Navigation.

### Strategy
- **Provider:** `src/providers/ThemeProvider.tsx` wraps the application.
- **Persistence:** User preference is saved in `AsyncStorage` key `'themePreference'`. Falls back to system `useColorScheme` if not set.
- **Definitions:**
  - **Light Palette:** `src/providers/ThemeProvider.tsx` -> `lightColors`
  - **Dark Palette:** `src/providers/ThemeProvider.tsx` -> `darkColors`
  - **Framework:** Extends `MD3LightTheme` and `MD3DarkTheme` (Material Design 3).
- **Usage:**
  - Use the hook: `const { theme, isDarkMode, toggleTheme } = useAppTheme();`
  - Use `theme.colors.primary`, `theme.colors.background`, etc. in styles.