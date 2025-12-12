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
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 18,
    color: theme.colors.text,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  title: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  resetButton: {
    marginBottom: 16,
    paddingVertical: 6,
  },
  backButton: {
    marginTop: 8,
  },
  backButtonText: {
    color: theme.colors.primary,
  },
});
