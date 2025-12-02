# Dynamic Content Developer Guide

This guide explains how to manage the dynamic content of the Life in the UK App. Whether you are fixing a typo, adding a new language, or building a completely new dynamic screen, follow these steps.

---

## 📚 Table of Contents
1.  [How to Edit Home Screen Content](#1-how-to-edit-home-screen-content)
2.  [How to Add a New Dynamic Screen](#2-how-to-add-a-new-dynamic-screen-advanced)
3.  [How to Add a New Language](#3-how-to-add-a-new-language)
4.  [Deployment Checklist](#4-deployment-checklist)

---

## 1. How to Edit Home Screen Content

**Goal:** Change the "Welcome Message" or "Promo Banner" text.

### Step 1: Edit the JSON File
Open your local file: `firebase_config/home.json`.

**Format:**
Use the **LocalizedText** format. Instead of a string, provide an object with language codes.

```json
{
  "welcomeMessage": {
    "en": "Welcome to Life in the UK Prep",
    "es": "Bienvenido a la preparación",
    "tr": "Life in the UK Hazırlık",
    "pl": "Witamy w przygotowaniach"
  },
  "promoBanner": {
    "visible": true,
    "text": {
      "en": "New exams added!",
      "es": "¡Nuevos exámenes agregados!"
    }
  }
}
```
*Tip: If a language is missing (e.g., 'fr'), the app will fall back to 'en'.*

### Step 2: Update the Manifest Version
Open `firebase_config/manifest.json`. Find the `"home"` module and **increment the version**.

**Change:**
```json
"home": {
  "version": 3,   <-- Change from 2 to 3
  "path": "content/home.json",
  "required": false
}
```

### Step 3: Upload to Firebase
1.  Upload `home.json` to the folder `content/`.
2.  Upload `manifest.json` to the folder `config/`.

**Result:** Restart the app or Pull-to-Refresh on the Home Screen to see changes.

---

## 2. How to Add a New Dynamic Screen (Advanced)

**Goal:** You built a "Tips" screen and want its content to be dynamic.

### Phase 1: Define the Data (Frontend)

1.  **Define Type:** In `src/types/content.ts`, add your interface.
    ```typescript
    export interface TipsContent {
      dailyTip: LocalizedText;
    }
    ```

2.  **Update Redux:** In `src/store/slices/contentSlice.ts`:
    *   Add `tips: TipsContent | null` to `ContentState`.
    *   Update `syncContent` to download it:
    ```typescript
    // Inside syncContent...
    if (manifest.modules.tips && manifest.modules.tips.version > (localVersions['tips'] || 0)) {
       updates.push(contentEngine.downloadModuleData('tips', manifest.modules.tips.path, manifest.modules.tips.version));
    } else {
       updates.push(contentEngine.loadLocalModuleData('tips'));
    }
    ```
    *   Update the reducer to save it: `if (action.payload.tips) state.tips = action.payload.tips;`

### Phase 2: Create the Component

1.  **Create Component:** `src/screens/TipsScreen.tsx`.
2.  **Connect to Store:**
    ```typescript
    import { useLocalizedContent } from '../hooks/useLocalizedContent';
    
    const TipsScreen = () => {
      const { getLocalized } = useLocalizedContent();
      const tipsContent = useAppSelector(state => state.content.tips);

      return <Text>{getLocalized(tipsContent?.dailyTip)}</Text>;
    };
    ```

### Phase 3: Configure Firebase

1.  **Create JSON:** Create `tips.json` locally.
    ```json
    { "dailyTip": { "en": "Study hard!", "es": "¡Estudia mucho!" } }
    ```
2.  **Update Manifest:** Add `"tips"` to `firebase_config/manifest.json`.
    ```json
    "tips": {
      "version": 1,
      "path": "content/tips.json",
      "required": false
    }
    ```

### Phase 4: Deploy

1.  Upload `tips.json` to `content/tips.json`.
2.  Upload `manifest.json` to `config/manifest.json`.

---

## 3. How to Add a New Language

**Goal:** Add support for Italian (it).

1.  **Create Content:** Create `allChaptersData.it.json` (Exam Questions).
2.  **Upload Content:** Upload to `exam/translations/allChaptersData.it.json`.
3.  **Register Language:** Edit `firebase_config/languages.json`.
    ```json
    {
      "code": "it",
      "name": "Italian",
      "nativeName": "Italiano",
      "version": 1
    }
    ```
4.  **Upload Config:** Upload to `config/languages.json`.
5.  **Trigger Update:** Increment `"languages"` version in `manifest.json` and upload `manifest.json` to `config/`.

---

## 4. Deployment Checklist

| If you changed... | Upload File... | To Path... | Then Update & Upload... |
| :--- | :--- | :--- | :--- |
| **Home Text/Images** | `home.json` | `/content/home.json` | `manifest.json` (bump "home" ver) |
| **Available Languages** | `languages.json` | `/config/languages.json` | `manifest.json` (bump "languages" ver) |
| **Available Exams** | `exams.json` | `/config/exams.json` | `manifest.json` (bump "exams" ver) |
| **Specific Exam Content** | `allChaptersData.xx.json` | `/exam/translations/...` | `languages.json` (bump lang ver) |

**Important:** The app ONLY checks `manifest.json` first. If you don't update the manifest, the app won't know to look for your other changes.