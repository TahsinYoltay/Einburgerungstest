# Gemini Memory & Project Context

## User Preferences
- **External Dependencies:** When a code change requires an external dependency or resource, first present the resource link to the user for approval before implementing the change.
- **UI/Navigation:** 
  - User prefers navigating to a new screen or using a modal for language selection instead of a long list in settings.
  - 'App Interface Language' should be labeled simply as 'Language'.
  - Preferences for better padding in UI elements.

## Coding Standards & Best Practices
- **Styles:** Always extract `StyleSheet.create` to a separate `.styles.ts` file for each component. Do not define styles inside the component file.
- **Theming:** 
  - Must support both Dark and Light modes.
  - Always use the `useAppTheme` hook.
  - Access colors via `theme.colors` (e.g., `theme.colors.background`, `theme.colors.primary`).
  - Use `theme.dark` boolean for conditional logic if necessary.
- **Multi-language & Dynamic Content:**
  - Static content screens (e.g., Privacy Policy, Terms) must be dynamic and fetchable from Firebase.
  - Naming convention: `filename_{lang}.json` (e.g., `privacy_policy_en.json`).
  - Must react to language changes: Re-fetch content when `i18n.language` changes.
  - Add corresponding translation keys to `src/localization/languages/en.json` for UI labels.

## Technical Architecture: Dynamic Content (Firebase)
The app supports dynamic updates for languages, exams, and UI content via Firebase Storage.

### Firebase Storage Structure
- **`config/`**: Global Configuration
  - `manifest.json`: Master version control for all modules.
  - `exams.json`: Exam definitions and metadata.
  - `languages.json`: List of available languages and their versions.
- **`content/`**: Dynamic UI Content
  - `home.json`: Configuration for the Home Screen.
  - **`privacy_policy/`**: Privacy Policy folder
    - `privacy_policy_{lang}.json`: Localized Privacy Policy content.
- **`exam/translations/`**: Exam Data
  - `allChaptersData.{lang}.json`: The actual exam questions and chapters.
- **`book/content/`**: Book Data
  - `bookContent.{lang}.json`: Localized book text.

### Update Strategy (Versioning)
- **Manifest-Driven:** The `manifest.json` file in `config/` is the Source of Truth.
- **Logic:**
  1. App fetches `config/manifest.json` on startup or refresh.
  2. Compares remote versions with local versions stored in `module_versions.json` (or `versions.json` for legacy exam/book data).
  3. If `Remote Version > Local Version`, the app downloads the specific updated file.
- **Manual Update Process:**
  1. Upload the new content file (e.g., `content/privacy_policy/privacy_policy_en.json`) to Firebase.
  2. Increment the version number for that module in `config/manifest.json`.
  3. Upload the updated `config/manifest.json` to Firebase.

### Key Files
- `src/services/ContentManager.ts`: Handles fetching `config/` files and `content/` files.
- `src/services/LanguageManager.ts`: Handles fetching `exam/translations/` and `book/content/` files.
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
