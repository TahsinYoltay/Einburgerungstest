import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: theme.colors.onBackground,
  },
  loadingCard: {
    margin: 16,
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
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  examCard: {
    width: 300,
    marginHorizontal: 4,
    marginBottom: 8,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examTitle: {
    flex: 1,
    marginRight: 8,
    color: theme.colors.onSurface,
  },
  description: {
    marginTop: 4,
    marginBottom: 8,
    opacity: 0.7,
    color: theme.colors.onSurface,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  detailItem: {
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 4,
  },
  timeLeft: {
    textAlign: 'right',
    color: theme.colors.onSurface,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  statChip: {
    marginRight: 8,
    marginTop: 4,
    backgroundColor: theme.colors.surfaceVariant,
  },
  divider: {
    marginVertical: 12,
  },
  lastAttemptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  historyCard: {
    marginHorizontal: 16,
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
  scoreContainer: {
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
