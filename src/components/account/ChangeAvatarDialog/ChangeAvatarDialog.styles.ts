import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    dialog: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
    },
    title: {
      color: theme.colors.onSurface,
      textAlign: 'center',
      alignSelf: 'center',
      width: '100%',
      fontWeight: '800',
    },
    itemTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    item: {
      paddingVertical: 2,
    },
    progressWrapper: {
      marginTop: 12,
      gap: 8,
      alignItems: 'center',
    },
    progressText: {
      color: theme.colors.onSurface,
      opacity: 0.8,
      textAlign: 'center',
    },
    removeTitle: {
      color: theme.colors.error,
    },
    actions: {
      justifyContent: 'center',
      paddingBottom: 16,
    },
    closeButton: {
      width: '80%',
    },
  });
