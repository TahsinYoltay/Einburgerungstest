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
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 6,
      borderRadius: 12,
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8EAED',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontWeight: '800',
      fontSize: 18,
      color: theme.colors.onBackground,
    },
    headerSpacer: {
      width: 24,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 16,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      shadowColor: '#000',
      shadowOpacity: theme.dark ? 0.25 : 0.05,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 6,
    },
    avatarWrapper: {
      width: 64,
      height: 64,
      borderRadius: 16,
      overflow: 'hidden',
      marginRight: 12,
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8F1FF',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    profileText: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.onSurface,
    },
    profileEmail: {
      marginTop: 4,
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    menuList: {
      gap: 14,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
      shadowColor: '#000',
      shadowOpacity: theme.dark ? 0.2 : 0.05,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 10,
      elevation: 5,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    sectionList: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    sectionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.colors.outline,
      opacity: theme.dark ? 0.6 : 0.35,
    },
    menuIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.dark ? 'rgba(29,155,240,0.16)' : '#E8F1FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    menuText: {
      flex: 1,
      gap: 2,
    },
    menuLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    menuDescription: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.85,
    },
    logoutButton: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dark ? 'rgba(29,155,240,0.12)' : '#E8F1FF',
      borderRadius: 16,
      paddingVertical: 14,
      gap: 8,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.outline,
    },
    logoutText: {
      color: theme.colors.primary,
      fontWeight: '800',
      fontSize: 16,
    },
    footer: {
      marginTop: 12,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    versionText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.8,
    },
  });
