import type { MD3Theme } from 'react-native-paper';

type AppColors = MD3Theme['colors'] & {
  text: string;
  notification: string;
  backdrop: string;
  splashGradientStart: string;
  splashGradientMid: string;
  splashGradientEnd: string;
  splashGlowTop: string;
  splashGlowBottom: string;
  splashCardBackground: string;
  splashCardBorder: string;
  splashTextPrimary: string;
  splashTextSecondary: string;
  splashProgressTrack: string;
  splashProgressFill: string;
};

export type AppTheme = Omit<MD3Theme, 'colors'> & { colors: AppColors };
export type Theme = AppTheme;
