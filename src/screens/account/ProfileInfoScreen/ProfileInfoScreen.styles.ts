import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../../providers/ThemeProvider';

export const createStyles = (theme: AppTheme) =>
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
    iconButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8EAED',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.onBackground,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 16,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      shadowColor: '#000',
      shadowOpacity: theme.dark ? 0.2 : 0.05,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 8,
      elevation: 4,
      gap: 10,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      shadowColor: '#000',
      shadowOpacity: theme.dark ? 0.2 : 0.05,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 8,
      elevation: 4,
      gap: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    rowWithAction: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    rowWithActionMain: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flex: 1,
      gap: 12,
    },
    rowLabel: {
      width: 110,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    rowValue: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    editChip: {
      alignSelf: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : theme.colors.surface,
    },
    editChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statusPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8F1FF',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    statusText: {
      color: theme.colors.primary,
      fontWeight: '700',
      fontSize: 13,
    },
    muted: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    ctaCard: {
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#EEF2F7',
      borderRadius: 14,
      padding: 14,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      gap: 10,
    },
    ctaTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    ctaDesc: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
    },
    dialogInput: {
      backgroundColor: theme.colors.surface,
    },
    dialogInputOutline: {
      borderRadius: 14,
    },
    dialogKeyboardAvoidingView: {
      flex: 1,
      justifyContent: 'center',
    },
    dialog: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
    },
    dialogTitle: {
      color: theme.colors.onSurface,
      textAlign: 'center',
      alignSelf: 'center',
      width: '100%',
      fontWeight: '800',
    },
    dialogContent: {
      paddingTop: 0,
    },
    dialogActions: {
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
    },
    dialogActionButton: {
      flex: 1,
    },
  });
