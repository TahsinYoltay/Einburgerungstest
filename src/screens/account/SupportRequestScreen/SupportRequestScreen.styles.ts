import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
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
      paddingBottom: 32,
      gap: 16,
    },
    hero: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      shadowColor: '#000',
      shadowOpacity: theme.dark ? 0.2 : 0.05,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 4,
    },
    heroIcon: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: theme.dark ? 'rgba(29,155,240,0.16)' : '#E8F1FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 4,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.onSurface,
    },
    heroSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.75,
      marginTop: 2,
    },
    heroText: {
      flex: 1,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      shadowColor: '#000',
      shadowOpacity: theme.dark ? 0.2 : 0.05,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 4,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.onSurface,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderRadius: 999,
    },
    chipUnselected: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    chipSelected: {
      backgroundColor: theme.colors.primary,
    },
    chipText: {
      color: theme.colors.onSurfaceVariant,
    },
    chipTextSelected: {
      color: theme.colors.onPrimary,
    },
    input: {
      backgroundColor: theme.colors.surface,
    },
    helperText: {
      fontSize: 13,
      color: theme.colors.onSurface,
      opacity: 0.7,
      lineHeight: 18,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    toggleTextWrap: {
      flex: 1,
      gap: 2,
    },
    toggleTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    toggleSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    submitButton: {
      borderRadius: 14,
      paddingVertical: 6,
    },
    dangerNote: {
      fontSize: 12,
      color: theme.colors.onSurface,
      opacity: 0.65,
      lineHeight: 18,
    },
  });
