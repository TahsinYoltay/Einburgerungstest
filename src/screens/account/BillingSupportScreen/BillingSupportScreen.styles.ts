import { StyleSheet } from 'react-native';
import { Theme } from '../../../providers/ThemeProvider';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onBackground,
    },
    iconButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 24,
      gap: 16,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginHorizontal: 4,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant || theme.colors.outline,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    cardBody: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    button: {
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    statusText: {
      marginTop: 8,
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
  });
