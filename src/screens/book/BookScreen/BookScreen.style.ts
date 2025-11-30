import { StyleSheet } from 'react-native';
import { AppTheme } from '../../../providers/ThemeProvider';

export const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.onBackground,
  },
  card: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readerContainer: {
    flex: 1,
  },
  touchableContainer: {
    flex: 1,
  },
  readerControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  controlButton: {
    padding: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 5,
  },
  controlText: {
    color: theme.colors.onPrimary,
  },
  progressText: {
    color: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.onBackground,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  // New styles for chapter cards
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  chaptersList: {
    flex: 1,
  },
  chapterCard: {
    marginBottom: 16,
    elevation: 4,
  },
  chapterImage: {
    height: 150,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chapterTitle: {
    flex: 1,
    marginRight: 8,
    color: theme.colors.onSurface,
  },
  chapterChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  chapterChipText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 12,
  },
  chapterDescription: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  readButton: {
    marginTop: 8,
  },
});
