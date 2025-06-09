import React, { useState } from 'react';
import { View, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './RegisterScreen.style';
 
type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RegisterScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasEmailError = email.length > 0 && !isEmailValid(email);
  const hasPasswordError = password.length > 0 && password.length < 6;
  const hasConfirmPasswordError = confirmPassword.length > 0 && password !== confirmPassword;

  const handleRegister = async () => {
    if (!isEmailValid(email)) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errors.invalidPassword'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Here we would use Firebase authentication to register
      // For now, just simulate registration
      setTimeout(() => {
        setIsLoading(false);
        // Navigate to login after successful registration
        navigation.navigate(ROUTES.LOGIN);
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      setError(t('auth.errors.registerFailed'));
      console.error('Registration error:', error);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineLarge" style={styles.title}>
            {t('auth.createAccount')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t('auth.registerPrompt')}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TextInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={hasEmailError}
            disabled={isLoading}
          />
          {hasEmailError && (
            <HelperText type="error" visible={hasEmailError}>
              {t('auth.errors.invalidEmail')}
            </HelperText>
          )}

          <TextInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={hasPasswordError}
            disabled={isLoading}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          {hasPasswordError && (
            <HelperText type="error" visible={hasPasswordError}>
              {t('auth.errors.invalidPassword')}
            </HelperText>
          )}

          <TextInput
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            error={hasConfirmPasswordError}
            disabled={isLoading}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />
          {hasConfirmPasswordError && (
            <HelperText type="error" visible={hasConfirmPasswordError}>
              {t('auth.errors.passwordMismatch')}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.registerButton}
            loading={isLoading}
            disabled={isLoading || !email || !password || !confirmPassword}
          >
            {t('auth.register')}
          </Button>

          <View style={styles.loginContainer}>
            <Text variant="bodyMedium" style={styles.loginText}>
              {t('auth.haveAccount')}
            </Text>
            <Button
              mode="text"
              onPress={navigateToLogin}
              labelStyle={styles.loginButtonText}
            >
              {t('auth.login')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
