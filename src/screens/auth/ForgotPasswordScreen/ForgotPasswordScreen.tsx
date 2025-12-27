import React, { useState } from 'react';
import { View, ScrollView, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, HelperText, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './ForgotPasswordScreen.style';
import { authService } from '../../../services/AuthService';
import { isEmailValid } from '../../../utils/validators';
 
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

  const hasEmailError = email.length > 0 && !isEmailValid(email);

  const handleResetPassword = async () => {
    if (!isEmailValid(email)) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await authService.sendPasswordResetEmail(email);
    setIsLoading(false);

    if (result.success) {
      setShowSuccess(true);
    } else {
      setError(result.error || t('auth.errors.resetFailed'));
    }
  };

  const goBackToLogin = () => {
    navigation.goBack(); // Go back instead of stacking new route
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBackToLogin}
          style={styles.iconButton}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('auth.forgotPasswordTitle')}
        </Text>
        <View style={styles.iconButtonSpacer} />
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
            onPress={goBackToLogin}
            style={styles.backButton}
            labelStyle={styles.backButtonText}
          >
            {t('auth.backToSignIn')}
          </Button>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
