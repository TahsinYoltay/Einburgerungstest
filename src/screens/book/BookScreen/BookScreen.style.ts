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
  headerCard: {
    marginBottom: 24,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    color: theme.colors.text,
    marginBottom: 8,
  },
  description: {
    color: theme.colors.text,
  },
  sectionTitle: {
    marginBottom: 16,
    color: theme.colors.text,
  },
  chapterItem: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  chapterTitle: {
    color: theme.colors.text,
  },
  chapterDescription: {
    color: theme.colors.text,
  },
});