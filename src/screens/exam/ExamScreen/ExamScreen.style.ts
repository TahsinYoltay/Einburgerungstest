import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    paddingBottom: 0,
    backgroundColor: theme.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: theme.colors.background,
  },
  languageButton: {
    borderColor: theme.colors.outline,
    borderWidth: 1,
    borderRadius: 20,
  },
  languageButtonContent: {
    height: 36,
    paddingHorizontal: 12,
  },
  languageButtonLabel: {
    fontSize: 13,
    marginVertical: 0,
    marginHorizontal: 8,
    color: theme.colors.onSurface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timer: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  progressBar: {
    marginTop: 12,
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    backgroundColor: theme.colors.surface, // Footer might need to stand out or match bg
  },
  footerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footerInset: {
    backgroundColor: theme.colors.surface,
  },
  button: {
    // width: buttonWidth, // Removing fixed width to allow flex sizing in footer
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onBackground,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
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
  dialogCloseIconButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    margin: 0,
    backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8EAED',
    borderRadius: 12,
    zIndex: 2,
  },
  dialogContentText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },
  dialogActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  dialogActionButton: {
    flex: 1,
    borderRadius: 14,
  },
});
