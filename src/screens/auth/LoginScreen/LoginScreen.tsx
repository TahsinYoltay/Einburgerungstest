import React, { useState, useMemo } from 'react';
import { View, ScrollView, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, IconButton, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './LoginScreen.style';
import { authService } from '../../../services/AuthService';
import { isEmailValid, isPasswordValid } from '../../../utils/validators';
 
type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Local state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasEmailError = email.length > 0 && !isEmailValid(email);
  const hasPasswordError = password.length > 0 && !isPasswordValid(password);

  // No longer needed - we handle navigation directly after login success

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    const result = await authService.signInWithGoogle();
    
    if (!result.success) {
      setIsLoading(false);
      Alert.alert(t('common.error'), result.error || 'Google Sign-In failed');
    } else {
      // Success! Firebase auto-signs in, AuthProvider will handle RevenueCat sync
      console.log('[LoginScreen] ✅ Google login successful, AuthProvider will sync...');
      setIsLoading(false);
      navigation.goBack();
    }
  };

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

    const result = await authService.signInWithEmailAndPassword(email, password);
    
    if (!result.success) {
      setIsLoading(false);
      console.error('[LoginScreen] Login error:', result.error);
      
      // Check if we have a provider conflict suggestion
      if (result.suggestionKey) {
        setError(t(result.suggestionKey));
      } else if (result.error?.includes('user-not-found') || result.error?.includes('wrong-password') || result.error?.includes('invalid-credential')) {
        setError(t('auth.errors.invalidCredentials', { defaultValue: 'Invalid email or password' }));
      } else if (result.error?.includes('invalid-email')) {
        setError(t('auth.errors.invalidEmail'));
      } else {
        setError(t('auth.errors.signInFailed'));
      }
    } else {
      // Success! Firebase signs in the user, AuthProvider will handle state and RevenueCat sync
      console.log('[LoginScreen] ✅ Email login successful, AuthProvider will sync...');
      setIsLoading(false);
      navigation.goBack();
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
      {/* Sticky Header */}
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          onPress={() => navigation.goBack()} 
          size={24}
          iconColor={theme.colors.onBackground}
        />
        <Text style={styles.headerTitle}>
          {t('auth.signIn')}
        </Text>
        <View style={{ width: 48 }} />
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          {/* Social Login Section */}
          <View style={styles.socialContainer}>
            <Button 
                mode="outlined" 
                icon="google" 
                onPress={handleGoogleLogin} 
                style={[styles.socialButton, { borderColor: theme.colors.outline }]}
                disabled={isLoading}
                loading={isLoading} 
            >
                Continue with Google
            </Button>
            <Button 
                mode="outlined" 
                icon="apple" 
                onPress={() => Alert.alert('Coming Soon', 'Apple Sign-In integration pending.')} 
                style={[styles.socialButton, { borderColor: theme.colors.outline }]}
                disabled={isLoading}
            >
                Continue with Apple
            </Button>
          </View>

          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.outline }]}>
                OR SIGN IN WITH EMAIL
            </Text>
            <Divider style={styles.divider} />
          </View>

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
            {t('auth.signIn')}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
