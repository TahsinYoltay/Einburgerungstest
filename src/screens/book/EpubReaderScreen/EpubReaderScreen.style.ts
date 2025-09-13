import { StyleSheet } from 'react-native';
import { AppTheme } from '../../../providers/ThemeProvider';

export const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  readerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.onSurfaceVariant,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primaryContainer,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  controlButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
  },
  disabledButton: {
    backgroundColor: theme.colors.surfaceVariant,
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
});
