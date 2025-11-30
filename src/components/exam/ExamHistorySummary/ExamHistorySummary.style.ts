import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
  },
  loadingCard: {
    margin: 16,
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examTitle: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    marginTop: 4,
    marginBottom: 8,
    opacity: 0.7,
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
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  statChip: {
    marginRight: 8,
    marginTop: 4,
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
  },
  scoreContainer: {
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
