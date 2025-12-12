import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8F1FF',
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    fallbackIcon: {
      opacity: 0.95,
    },
    editBadge: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      borderRadius: 999,
      padding: 2,
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
