import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
    //   paddingTop: 12,
      paddingBottom: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8F1FF',
    },
    headerText: {
      flex: 1,
      marginLeft: 12,
    },
    greetingText: {
      color: theme.colors.onBackground,
      fontWeight: '700',
    },
    subGreeting: {
      color: theme.colors.onBackground,
      opacity: 0.7,
      marginTop: 2,
    },
    progressCard: {
      borderRadius: 16,
      padding: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressTitle: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: '700',
    },
    progressMeta: {
      marginTop: 4,
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    progressValue: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    progressBarTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.dark ? '#2C3A4A' : '#E2E8F0',
      overflow: 'hidden',
      marginVertical: 14,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
    },
    progressFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.dark ? 'rgba(29,155,240,0.12)' : '#E8F1FF',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    pillText: {
      marginLeft: 6,
      color: theme.colors.primary,
      fontWeight: '700',
    },
    progressFooterText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.onBackground,
      marginBottom: 12,
    },
    carousel: {
      paddingRight: 6,
      marginBottom: 16,
    },
    chapterCard: {
      width: 220,
      marginRight: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      padding: 12,
    },
    chapterImage: {
      width: '100%',
      height: 120,
      borderRadius: 12,
      marginBottom: 10,
    },
    chapterTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    chapterSubtitle: {
      color: theme.colors.onSurface,
      opacity: 0.7,
      marginBottom: 8,
    },
    smallProgressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: theme.dark ? '#2C3A4A' : '#E2E8F0',
      overflow: 'hidden',
    },
    smallProgressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
    },
    practiceList: {
      marginTop: 6,
    },
    practiceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      marginBottom: 12,
    },
    practiceIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.dark ? 'rgba(29,155,240,0.12)' : '#E8F1FF',
      marginRight: 12,
    },
    practiceText: {
      flex: 1,
    },
    practiceTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    practiceDescription: {
      color: theme.colors.onSurface,
      opacity: 0.7,
      fontSize: 13,
    },
  });
