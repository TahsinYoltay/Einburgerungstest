import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.onBackground,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8EAED',
  },
  topActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Left items vs Right item
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: theme.colors.background,
  },
  leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  outlinedButton: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 20,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 12,
  },
  actionIconBtn: {
      // Now handled by outlinedButton style mostly
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36, // Match button height
    borderRadius: 20, // Match button radius
    paddingHorizontal: 12, // Match button horizontal padding
    gap: 4,
    justifyContent: 'center',
  },
  statText: {
    fontWeight: 'bold',
    fontSize: 12,
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
  deckContainer: {
      flex: 1,
      marginTop: 10, // Reduced spacing since we have topActionsContainer now
  },
  swipeDeck: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 10,
  },
});