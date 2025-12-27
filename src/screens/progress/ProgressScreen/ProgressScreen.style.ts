import { Platform, StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'android' ? 12 : 32,
    },
    screenTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.colors.onBackground,
      marginBottom: 12,
    },
    card: {
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    cardSubtitle: {
      marginTop: 4,
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    valueText: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.dark ? '#2C3A4A' : '#E2E8F0',
      overflow: 'hidden',
      marginTop: 12,
      marginBottom: 10,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.dark ? 'rgba(29,155,240,0.12)' : '#E8F1FF',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    metaPillText: {
      marginLeft: 6,
      color: theme.colors.primary,
      fontWeight: '700',
    },
    metaMuted: {
      color: theme.colors.onSurface,
      opacity: 0.7,
      marginTop: 4,
      marginLeft: 10,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 12,
    },
    statItem: {
      flex: 1,
      paddingRight: 12,
    },
    statLabel: {
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.onBackground,
      marginTop: 4,
      marginBottom: 10,
    },
    chapterCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 12,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      marginBottom: 12,
    },
    chapterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    chapterTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onSurface,
      flex: 1,
      marginRight: 12,
    },
    chapterValue: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
    },
  });
