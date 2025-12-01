import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.error,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  resultCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.outline,
    elevation: theme.dark ? 0 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.dark ? 0 : 0.08,
    shadowRadius: 8,
  },
  resultTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  scoreText: {
    color: '#FFFFFF', // Always white on colored circle
    fontSize: 32,
    fontWeight: 'bold',
  },
  passText: {
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    paddingRight: 40,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.outline,
    elevation: theme.dark ? 0 : 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0 : 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 10,
  },
  reviewFavButton: {
    minWidth: 32,
    margin: 0,
    position: 'absolute',
    top: 1,
    right: 1,
  },
  reviewFavButtonContent: {
    margin: 0,
    paddingHorizontal: 0,
  },
  reviewPrompt: {
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  reviewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.outline || '#E5E7EB',
    marginBottom: 6,
  },
  reviewOptionCorrect: {
    backgroundColor: theme.dark ? 'rgba(52, 168, 83, 0.15)' : '#E8F5E9',
    borderColor: '#34A853',
  },
  reviewOptionAnswer: {
    backgroundColor: theme.dark ? 'rgba(52, 168, 83, 0.15)' : '#F0FFF4',
    borderColor: '#34A853',
  },
  reviewOptionWrong: {
    backgroundColor: theme.dark ? 'rgba(234, 67, 53, 0.15)' : '#FEF2F2',
    borderColor: theme.colors.error,
  },
  reviewOptionText: {
    flex: 1,
    color: theme.colors.onSurface,
  },
  reviewOptionIcon: {
    marginLeft: 8,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
});
