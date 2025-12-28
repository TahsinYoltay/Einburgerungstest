import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../providers/themeTypes';

export const createStyles = (theme: AppTheme) =>
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
    closeIconButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      margin: 0,
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8EAED',
      borderRadius: 12,
      zIndex: 2,
    },
    listCard: {
      width: '100%',
      borderRadius: 14,
      overflow: 'hidden',
    },
    scrollView: {
      maxHeight: 420,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.dark ? 'rgba(29,155,240,0.16)' : '#E8F1FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    optionText: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    optionDescription: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.85,
    },
    rightSpacer: {
      width: 20,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outline,
      opacity: theme.dark ? 0.6 : 0.4,
      marginHorizontal: 12,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 8,
      gap: 10,
    },
    loadingText: {
      color: theme.colors.onSurface,
      opacity: 0.8,
      textAlign: 'center',
    },
    progressText: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.85,
      textAlign: 'center',
    },
    actions: {
      justifyContent: 'center',
      paddingBottom: 16,
      paddingHorizontal: 16,
    },
    closeButton: {
      width: '100%',
      borderRadius: 14,
    },
  });
