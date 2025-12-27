import { StyleSheet, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.75; // Fixed card height (75% of screen)
const CARD_WIDTH = width - 32; // Fixed card width (Screen width - 32px padding)

export const createStyles = (theme: any) => StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    alignSelf: 'center', // Ensure it's centered if parent allows
    marginVertical: 8,
    backgroundColor: theme.colors.surface,
    elevation: 4,
    borderRadius: 16,
    height: CARD_HEIGHT,
    overflow: 'hidden', // Important for rounded corners with scrollview
  },
  scrollView: {
    // flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    lineHeight: 26,
  },
  imagesContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  correctOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer, // Light green/primary hint
    borderWidth: 2,
  },
  wrongOption: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorContainer, // Light red
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  optionTextContainer: {
    flex: 1,
  },
  correctText: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
  },
  wrongText: {
      color: theme.colors.onErrorContainer,
      fontWeight: '600',
  },
  actionContainer: {
      marginTop: 16,
  },
  bottomActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
  },
  revealButton: {
      width: '100%',
      marginBottom: 16,
  },
  favoriteButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  favText: {
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
  },
  divider: {
    marginVertical: 16,
  },
  explanationContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
  },
  explanationTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.onSurfaceVariant,
  },
  explanationText: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 22,
  },
  hintText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.colors.primary,
  },
});
