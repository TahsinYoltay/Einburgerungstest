import { StyleSheet } from 'react-native';

export const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.onBackground,
    },
    iconButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8EAED',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingTop: 24,
      paddingBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pageTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      paddingHorizontal: 16,
      paddingBottom: 4,
      lineHeight: 40,
      textAlign: 'left',
    },
    lastUpdated: {
      fontSize: 14,
      fontWeight: '400',
      color: theme.dark ? theme.colors.onSurfaceVariant : '#6B7280',
      paddingHorizontal: 16,
      paddingBottom: 24,
      paddingTop: 4,
    },
    bodyText: {
      fontSize: 16,
      fontWeight: '400',
      color: theme.dark ? theme.colors.onSurface : '#1F2937',
      lineHeight: 26,
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    accordionContainer: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    accordionBodyText: {
      fontSize: 16,
      fontWeight: '400',
      color: theme.dark ? '#9CA3AF' : '#4B5563',
      lineHeight: 26,
      paddingBottom: 8,
      paddingTop: 4,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 16,
      marginBottom: 10,
    },
    retryButton: {
      padding: 10,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    retryText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });
