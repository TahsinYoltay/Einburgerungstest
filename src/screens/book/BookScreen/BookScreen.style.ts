import { Platform, StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
         paddingHorizontal: 16,
    //   paddingTop: 12,
      paddingBottom: Platform.OS === 'android' ? 12 : 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.onBackground,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline || '#E5E7EB',
    elevation: 0,
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
    backgroundColor: theme.colors.backdrop,
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
    color: theme.colors.onSurface,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.onBackground,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
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
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.outline,
    elevation: theme.dark ? 0 : 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0 : 0.1,
    shadowRadius: 4,
  },
  chapterImage: {
    width: 80,
    height: 80,
    margin: 16,
    borderRadius: 8,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterContent: {
    flex: 1,
    paddingRight: 16,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chapterTitle: {
    flex: 1,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  chapterDescription: {
    color: theme.colors.onSurfaceVariant,
    opacity: 0.8,
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressTextSmall: {
    color: theme.colors.primary,
    fontWeight: '600',
    minWidth: 45,
  },
  expandedContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionsTitle: {
    flex: 1,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  readButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  readButtonText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  sectionSurface: {
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.outline,
    elevation: theme.dark ? 0 : 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0 : 0.1,
    shadowRadius: 2,
    // Background color will be handled dynamically in component for read/unread state
  },
  sectionTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionIconContainer: {
    marginRight: 12,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '500',
    // Color handled dynamically
  },
  sectionSubtitle: {
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  progressSurface: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.outline,
    width: '100%',
    elevation: theme.dark ? 0 : 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0 : 0.1,
    shadowRadius: 4,
  },
  progressTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
});
