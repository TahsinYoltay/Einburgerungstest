import { StyleSheet, Dimensions } from 'react-native';
import { MD3Theme } from 'react-native-paper';

const { width } = Dimensions.get('window');

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  card: {
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
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  questionText: {
    flex: 1,
    marginBottom: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: theme.dark ? 2 : 0,
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 56,
    borderColor: theme.colors.outline || '#D1D5DB',
    elevation: theme.dark ? 0 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0 : 0.2,
    shadowRadius: 3,
  },
  optionText: {
    fontSize: 17,
    color: theme.colors.onSurface,
  },
  imagesContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  questionImage: {
    width: width - 64,
    height: 200,
    marginBottom: 8,
    borderRadius: 6,
  },
  optionImage: {
    width: width - 80,
    height: 100,
    marginLeft: 8,
    marginBottom: 8,
    borderRadius: 6,
  },
  explainButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 4,
  },
  hintText: {
    color: theme.colors.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  explanationContainer: {
    backgroundColor: theme.colors.secondaryContainer, // Lighter background for visibility
    borderRadius: 8,
    padding: 12,
  },
  divider: {
    marginVertical: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.onSecondaryContainer, // Match text to container
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onSecondaryContainer,
  },
});
