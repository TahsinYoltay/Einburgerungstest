import { StyleSheet } from 'react-native';
import { AppTheme } from '../../../providers/ThemeProvider';

export const createStyles = (theme: AppTheme) => StyleSheet.create({
  logoutButton: {
    borderColor: theme.colors.error,
  },
  dialog: {
    backgroundColor: theme.colors.surface,
  },
});
