import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../../providers/themeTypes';

export const createStyles = (theme: AppTheme) => StyleSheet.create({
  logoutButton: {
    borderColor: theme.colors.error,
  },
  dialog: {
    backgroundColor: theme.colors.surface,
  },
});
