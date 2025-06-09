import React, { useState } from 'react';
import { View, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, HelperText, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './ForgotPasswordScreen.style';
 
type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasEmailError = email.length > 0 && !isEmailValid(email);

  const handleResetPassword = async () => {
    if (!isEmailValid(email)) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Here we would use Firebase authentication to send password reset email
      // For now, just simulate sending email
      setTimeout(() => {
        setIsLoading(false);
        setShowSuccess(true);
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      setError(t('auth.errors.resetFailed'));
      console.error('Password reset error:', error);
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
            {t('auth.forgotPasswordTitle')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t('auth.forgotPasswordPrompt')}
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

          <Button
            mode="contained"
            onPress={handleResetPassword}
            style={styles.resetButton}
            loading={isLoading}
            disabled={isLoading || !email}
          >
            {t('auth.resetPassword')}
          </Button>

          <Button
            mode="text"
            onPress={navigateToLogin}
            style={styles.backButton}
            labelStyle={styles.backButtonText}
          >
            {t('auth.backToLogin')}
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={5000}
        action={{
          label: t('common.close'),
          onPress: () => setShowSuccess(false),
        }}
      >
        {t('auth.resetEmailSent')}
      </Snackbar>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
