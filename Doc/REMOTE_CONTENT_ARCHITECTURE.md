# Remote Content Management System (CMS) Architecture

**Date:** December 2, 2025  
**Project:** Life in the UK Test Prep

---

## 1. Executive Summary

This application uses a custom **Remote Content Engine** that allows the product team to update the app's content (Exams, Languages, Home Screen, Banners, Tips) dynamically without submitting a new version to the App Store or Google Play Store.

The system relies on a **"Master Manifest"** approach. The app downloads a small configuration file (`manifest.json`) to check for updates. If a specific module (like the "Spanish Language Pack" or "Home Screen Data") has a newer version on the server than on the device, the app automatically downloads and caches the new content.

---

## 2. Architecture Overview

### The "Master Manifest" Concept
The heart of the system is a single file stored in Firebase: `config/manifest.json`. This file acts as the "Traffic Controller." It tells the app:
1.  What features/content modules are available (e.g., "home", "exams", "languages").
2.  Where to find them (the storage path).
3.  What the current **Version** is.

### Data Flow
1.  **Check:** App launches, comes to foreground, or user pulls-to-refresh -> Downloads `config/manifest.json`.
2.  **Compare:** The app compares the **Server Version** vs. the **Local Device Version**.
3.  **Sync:**
    *   If `Server Version > Local Version`: The app downloads the new content file (JSON) and saves it to the device storage.
    *   If `Versions Match`: The app loads the data instantly from the device cache (offline capable).
4.  **Display:** The content is loaded into the Global Store (Redux) and displayed on the screen.

---

## 3. Firebase Storage Structure

Your Firebase Storage bucket must be organized into two main folders at the root:

```text
(root)
├── config/                  <-- CONFIGURATION FILES
│   ├── manifest.json        <-- MASTER MANIFEST (Lists all modules & versions)
│   ├── languages.json       <-- List of available languages
│   └── exams.json           <-- List of available exams
│
├── content/                 <-- DYNAMIC UI MODULES
│   ├── home.json            <-- Content for Home Screen (Titles, Banners, Images)
│   └── (other modules)      <-- e.g., tips.json, news.json
│
└── exam/                    <-- EXAM CONTENT
    └── translations/        
        ├── allChaptersData.en.json
        ├── allChaptersData.es.json
        ├── allChaptersData.tr.json
        └── ...
    └── mockExam/
        ├── mockExam.en.json
        ├── mockExam.es.json
        ├── mockExam.tr.json
        └── ...
    └── chapterName/
        ├── questionsByChapter.en.json
        ├── questionsByChapter.es.json
        ├── questionsByChapter.tr.json
        └── ...
```

---

## 4. Localization Strategy

The app supports multiple languages. We use two different strategies depending on the **size** of the content.

### Strategy A: "Localized Objects" (For UI Content)
For small UI modules like the **Home Screen** (`home.json`), we keep all languages in **one file**.
Each text field is an object containing the translations.

**Structure:**
```json
{
  "welcomeMessage": {
    "en": "Welcome!",
    "es": "¡Bienvenido!",
    "tr": "Hoşgeldiniz!"
  }
}
```
**Benefit:** Changing a title updates it for everyone instantly. No need to manage 10 small files.

### Strategy B: "File Per Language" (For Exams)
For large datasets like **Exam Questions**, we use **separate files** for each language (e.g., `allChaptersData.es.json`, `mockExam.es.json`, `questionsByChapter.es.json`).
**Benefit:** A Spanish user only downloads the Spanish questions (5MB), not the Chinese ones.

---

## 5. Refresh Mechanisms

The app checks for updates in three ways to ensure freshness:

1.  **App Launch (Cold Start):**
    *   **Trigger:** `useEffect` in `App.tsx`.
    *   **Action:** Dispatches `syncContent()`.
    *   **Result:** App starts with the latest content if network is available.

2.  **App Resume (Foreground):**
    *   **Trigger:** `AppState` listener in `App.tsx`.
    *   **Action:** Checks if the app was in the background. If yes, dispatches `syncContent()`.
    *   **Result:** Updates content if the user left the app open for a long time.

3.  **Pull-to-Refresh (Manual):**
    *   **Trigger:** User pulls down on the **Home Screen**.
    *   **Action:** Forces `syncContent()` and `loadExams()`.
    *   **Result:** Immediate check for updates.

---

## 6. Security

*   **Read Access:** Publicly allowed for `config/`, `content/`, and `exam/` folders.
*   **Write Access:** **Blocked** for everyone. Only the developer can upload files via the Firebase Console.
