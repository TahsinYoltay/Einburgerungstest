import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../providers/ThemeProvider';

export const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    container: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 20,
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      margin: 0,
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8EAED',
      borderRadius: 12,
    },
    content: {
      width: '100%',
      alignItems: 'center',
    },
    iconPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 16,
      backgroundColor: theme.dark ? 'rgba(29,155,240,0.16)' : '#E8F1FF',
    },
    placeholderIconButton: {
      margin: 0,
    },
    title: {
      textAlign: 'center',
      color: theme.colors.onSurface,
      fontWeight: '800',
      marginBottom: 8,
    },
    subtitle: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 18,
      paddingHorizontal: 4,
      lineHeight: 20,
    },
    starContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 2,
      marginBottom: 18,
    },
    starButton: {
      margin: 0,
    },
    secondaryButton: {
      width: '100%',
      borderRadius: 14,
    },
    secondaryButtonContent: {
      height: 46,
    },
    secondaryButtonLabel: {
      fontWeight: '700',
      fontSize: 15,
    },
    input: {
      width: '100%',
      marginBottom: 14,
      minHeight: 110,
      backgroundColor: theme.colors.surface,
    },
    inputOutline: {
      borderRadius: 14,
    },
    submitButton: {
      width: '100%',
      borderRadius: 14,
    },
    submitButtonContent: {
      height: 48,
    },
    submitButtonLabel: {
      fontWeight: '700',
      fontSize: 15,
    },
  });
