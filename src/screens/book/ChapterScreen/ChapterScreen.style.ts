import { StyleSheet } from 'react-native';
import { AppTheme } from '../../../providers/ThemeProvider';

export const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
    color: theme.colors.text,
  },
  backButton: {
    marginRight: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bookHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  bookTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  bookAuthor: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  sectionCount: {
    color: theme.colors.onSurfaceVariant,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentSectionCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionNumberText: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
  },
  sectionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  sectionProgress: {
    width: 20,
    alignItems: 'center',
  },
  currentIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  separator: {
    height: 8,
  },
  loadingText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 16,
  },
  loadButton: {
    marginTop: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  introCard: {
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: 8,
  },
  introText: {
    lineHeight: 24,
    color: theme.colors.text,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionContent_old: {
    lineHeight: 24,
    color: theme.colors.text,
  },
  divider: {
    marginTop: 16,
    backgroundColor: theme.colors.border,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    margin: 8,
  }
});
