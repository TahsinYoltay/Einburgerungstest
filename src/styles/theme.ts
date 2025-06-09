import { MD3LightTheme, configureFonts, adaptNavigationTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';

const { LightTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
});

const fontConfig = {
  regular: {
    fontFamily: 'sans-serif',
    fontWeight: 'normal' as 'normal',
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  medium: {
    fontFamily: 'sans-serif-medium',
    fontWeight: 'normal' as 'normal',
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  light: {
    fontFamily: 'sans-serif-light',
    fontWeight: 'normal' as 'normal',
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  thin: {
    fontFamily: 'sans-serif-thin',
    fontWeight: 'normal' as 'normal',
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
};

export const theme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
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
  },
  fonts: configureFonts({ config: fontConfig }),
};

export type Theme = typeof theme;