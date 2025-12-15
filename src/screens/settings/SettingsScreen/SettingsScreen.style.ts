import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.outline,
    shadowColor: '#000',
    shadowOpacity: theme.dark ? 0.2 : 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  rowSubtitle: {
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  divider: {
    marginVertical: 6,
    backgroundColor: theme.colors.outline,
    height: 1,
  },
  rowButton: {
    borderRadius: 12,
    minWidth: 110,
  },
  destructiveLabel: {
    color: theme.colors.error,
  },
  destructiveButton: {
    borderColor: theme.colors.error,
  },
});
