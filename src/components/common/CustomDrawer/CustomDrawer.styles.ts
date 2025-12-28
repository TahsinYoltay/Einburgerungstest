import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      marginBottom: 10,
      backgroundColor: theme.colors.primary,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.onPrimary,
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.onPrimary,
      opacity: 0.8,
    },
    divider: {
      marginVertical: 10,
      backgroundColor: theme.colors.outline,
    },
  });
