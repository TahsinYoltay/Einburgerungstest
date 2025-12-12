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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 18,
    color: theme.colors.onBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
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
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  socialContainer: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    borderRadius: 8,
  },
  dividerContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  input: {
    marginBottom: 4,
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: 10,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 24,
    marginBottom: 24,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: theme.colors.onSurfaceVariant,
  },
  loginButtonText: {
    fontWeight: 'bold',
  },
});