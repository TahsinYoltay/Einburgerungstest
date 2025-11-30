import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './LoginScreen.style';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loginUser, clearError } from '../../../store/slices/userSlice';
 
type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useAppDispatch();
  
  // Get user state from Redux
  const { loading, error: reduxError, user } = useAppSelector((state) => state.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasEmailError = email.length > 0 && !isEmailValid(email);
  const hasPasswordError = password.length > 0 && password.length < 6;

  const handleLogin = async () => {
    if (!isEmailValid(email)) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errors.invalidPassword'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Here we would use Firebase authentication
      // For now, just simulate login
      setTimeout(() => {
        setIsLoading(false);
        // Navigate to the main app
        // In a real app, this would be handled by an auth context
        // that would trigger a re-render of the navigator
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      setError(t('auth.errors.loginFailed'));
      console.error('Login error:', error);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate(ROUTES.REGISTER);
  };

  const navigateToForgotPassword = () => {
    navigation.navigate(ROUTES.FORGOT_PASSWORD);
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
            {t('auth.welcomeBack')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t('auth.loginPrompt')}
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

          <Button
            mode="text"
            onPress={navigateToForgotPassword}
            style={styles.forgotPasswordButton}
            labelStyle={styles.forgotPasswordText}
          >
            {t('auth.forgotPassword')}
          </Button>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            loading={isLoading}
            disabled={isLoading || !email || !password}
          >
            {t('auth.login')}
          </Button>

          <View style={styles.registerContainer}>
            <Text variant="bodyMedium" style={styles.registerText}>
              {t('auth.noAccount')}
            </Text>
            <Button
              mode="text"
              onPress={navigateToRegister}
              labelStyle={styles.registerButtonText}
            >
              {t('auth.register')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;
