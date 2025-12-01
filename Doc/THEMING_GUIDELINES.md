# Theming & Dark Mode Guidelines

This document outlines the architecture and best practices for implementing styling, dark mode, and UI components in the application. Following these guidelines ensures consistency across the app and seamless switching between Light and Dark modes.

## 1. Core Architecture

The application uses a custom styling system built on top of **React Native Paper (MD3)**.

-   **Provider Location:** `src/providers/ThemeProvider.tsx`
-   **Key Hook:** `useAppTheme()`
    *   Returns: `{ theme, isDarkMode, toggleTheme, navigationTheme }`
-   **Theme Definition:** We use a "Dim" Twitter-like palette for Dark Mode (Blue-Gray) rather than pure black, ensuring better readability and reduced eye strain.

---

## 2. The "createStyles" Pattern (Mandatory)

**NEVER** use static `StyleSheet.create({})` for screen or component styles. Static styles cannot adapt to theme changes at runtime.

**ALWAYS** export a factory function that accepts the theme.

### Step-by-Step Implementation

#### A. In your style file (`MyComponent.style.ts`)
```typescript
import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Dynamic background
  },
  text: {
    color: theme.colors.onSurface, // Dynamic text color
    fontSize: 16,
  },
});
```

#### B. In your component file (`MyComponent.tsx`)
```typescript
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../../../providers/ThemeProvider'; // Adjust path
import { createStyles } from './MyComponent.style';

const MyComponent = () => {
  const { theme } = useAppTheme();
  // Memoize styles to prevent unnecessary recalculations on re-renders
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
};
```

---

## 3. The "Card" Styling Strategy

We use a specific conditional logic for Cards and Surfaces to ensure they look "elevated" in Light Mode but "defined" in Dark Mode.

*   **Light Mode:** Relies on **Shadow/Elevation** to create depth. Borders are invisible (width 0).
*   **Dark Mode:** Relies on **Borders** and lighter Surface colors. Shadows are invisible (opacity 0).

**Standard Card Style Block:**
```typescript
card: {
  backgroundColor: theme.colors.surface, // White (Light) / #273340 (Dark)
  borderRadius: 12,
  
  // CONDITIONAL BORDER (Dark Mode Only)
  borderWidth: theme.dark ? 1 : 0,
  borderColor: theme.colors.outline,
  
  // CONDITIONAL SHADOW (Light Mode Only)
  elevation: theme.dark ? 0 : 2, // Android
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: theme.dark ? 0 : 0.1,
  shadowRadius: 4,
}
```

---

## 4. Color Palette & Tokens

Use these semantic tokens instead of hardcoded hex values.

| UI Element | Theme Token | Description |
| :--- | :--- | :--- |
| **Screen Background** | `theme.colors.background` | Main app background. Dark: `#15202B` |
| **Card/Surface** | `theme.colors.surface` | Cards, Modals, Sheets. Dark: `#273340` |
| **Primary Action** | `theme.colors.primary` | Buttons, active icons, links. |
| **Main Text** | `theme.colors.onSurface` | Headings, body text. |
| **Secondary Text** | `theme.colors.onSurfaceVariant` | Subtitles, captions, descriptions. |
| **Borders** | `theme.colors.outline` | Card borders, dividers. |
| **Input Borders** | `theme.colors.outline` | Text input boundaries. |
| **Success** | `#34A853` | (Hardcoded for now) Green status text. |
| **Error** | `theme.colors.error` | Red status text/icons. |

### Special Cases
*   **Sub-sections / Highlighted Areas:** Use `theme.colors.surfaceVariant` or `secondaryContainer` to distinguish an area inside a card.
*   **Ripple/Touch Feedback:** Use `theme.colors.primary` or `theme.colors.onSurface` with opacity.

---

## 5. Checklist for New Screens

When adding a new feature or screen, verify the following:

1.  [ ] **Imports:** Does it import `useAppTheme` and `createStyles`?
2.  [ ] **Memoization:** Are styles wrapped in `useMemo`?
3.  [ ] **Background:** Is the root container using `theme.colors.background`?
4.  [ ] **Text:** Do all Text components have a defined color style (e.g., `color: theme.colors.onSurface`)? *Default text color is often black, which is invisible in Dark Mode.*
5.  [ ] **Cards:** Do cards follow the "Shadow vs. Border" pattern?
6.  [ ] **Icons:** Are icon colors set to `theme.colors.onSurface` (for neutral) or `theme.colors.primary` (for active)?
7.  [ ] **Dialogs/Modals:** Do they explicitly set `backgroundColor: theme.colors.surface`?

## 6. Common Pitfalls to Avoid

*   ❌ **Hardcoded Hex:** `color: '#000'` -> Will disappear in Dark Mode.
*   ❌ **Hardcoded Gray:** `color: '#888'` -> Might have poor contrast. Use `onSurfaceVariant`.
*   ❌ **Static Styles:** `const styles = StyleSheet.create(...)` -> Will not update when user toggles theme settings.
*   ❌ **Missing ScrollView Padding:** Ensure main content `ScrollView` matches the standard padding (usually `16` or `24` horizontal).
