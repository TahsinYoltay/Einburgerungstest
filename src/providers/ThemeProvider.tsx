import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define our custom colors
const lightColors = {
  primary: '#1E88E5',
  secondary: '#42A5F5',
  error: '#D32F2F',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  accent: '#03A9F4',
  text: '#212121',
  disabled: '#9E9E9E',
  placeholder: '#BDBDBD',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: '#FF5722',
  card: '#FFFFFF',
  border: '#E0E0E0',
};

const darkColors = {
  primary: '#90CAF9',
  secondary: '#42A5F5',
  error: '#EF5350',
  background: '#121212',
  surface: '#1E1E1E',
  accent: '#29B6F6',
  text: '#FFFFFF',
  disabled: '#757575',
  placeholder: '#616161',
  backdrop: 'rgba(0, 0, 0, 0.8)',
  notification: '#FF8A65',
  card: '#1E1E1E',
  border: '#424242',
};

// Define MD3 font configuration
const fontConfig = {
  headlineLarge: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontWeight: '400' as '400',
    letterSpacing: 0,
    lineHeight: 40,
    fontSize: 28,
  },
  headlineMedium: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontWeight: '400' as '400',
    letterSpacing: 0,
    lineHeight: 36,
    fontSize: 24,
  },
  headlineSmall: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontWeight: '400' as '400',
    letterSpacing: 0,
    lineHeight: 32,
    fontSize: 20,
  },
  bodyLarge: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontWeight: '400' as '400',
    letterSpacing: 0,
    lineHeight: 24,
    fontSize: 16,
  },
  bodyMedium: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontWeight: '400' as '400',
    letterSpacing: 0,
    lineHeight: 20,
    fontSize: 14,
  },
  bodySmall: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontWeight: '400' as '400',
    letterSpacing: 0,
    lineHeight: 16,
    fontSize: 12,
  },
  labelLarge: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontWeight: '500' as '500',
    letterSpacing: 0,
    lineHeight: 20,
    fontSize: 14,
  },
  labelMedium: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontWeight: '500' as '500',
    letterSpacing: 0,
    lineHeight: 16,
    fontSize: 12,
  },
  labelSmall: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontWeight: '500' as '500',
    letterSpacing: 0,
    lineHeight: 16,
    fontSize: 11,
  },
};

// Create our custom themes
const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
  fonts: configureFonts({ config: fontConfig, isV3: true }),
};

const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
  fonts: configureFonts({ config: fontConfig, isV3: true }),
};

// Create navigation themes
const CustomNavigationLightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: lightColors.primary,
    background: lightColors.background,
    card: lightColors.surface,
    text: lightColors.text,
    border: lightColors.border,
    notification: lightColors.notification,
  },
};

const CustomNavigationDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: darkColors.primary,
    background: darkColors.background,
    card: darkColors.surface,
    text: darkColors.text,
    border: darkColors.border,
    notification: darkColors.notification,
  },
};

// Theme context
type ThemeContextType = {
  isDarkMode: boolean;
  theme: typeof LightTheme;
  navigationTheme: typeof CustomNavigationLightTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  theme: LightTheme,
  navigationTheme: CustomNavigationLightTheme,
  toggleTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  // Load theme preference from storage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const themePreference = await AsyncStorage.getItem('themePreference');
        if (themePreference !== null) {
          setIsDarkMode(themePreference === 'dark');
        } else {
          // Use system preference if no stored preference
          setIsDarkMode(colorScheme === 'dark');
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, [colorScheme]);

  // Save theme preference when it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem('themePreference', isDarkMode ? 'dark' : 'light');
      } catch (error) {
        console.log('Error saving theme preference:', error);
      }
    };

    saveThemePreference();
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const navigationTheme = isDarkMode ? CustomNavigationDarkTheme : CustomNavigationLightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, navigationTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export type AppTheme = typeof LightTheme;