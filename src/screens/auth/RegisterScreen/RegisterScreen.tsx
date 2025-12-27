import React, { useState, useMemo } from 'react';
import { View, ScrollView, Image, KeyboardAvoidingView, Platform, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, HelperText, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import Icon from '@react-native-vector-icons/material-design-icons';
import auth from '@react-native-firebase/auth';
import { purchaseService } from '../../../services/PurchaseService';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './RegisterScreen.style';
import { authService } from '../../../services/AuthService';
import { isEmailValid, isPasswordValid, doPasswordsMatch } from '../../../utils/validators';

 
type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RegisterScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  // Local state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    // Use linkGoogleAccount to preserve anonymous UID (and subscription!)
    const result = await authService.linkGoogleAccount();
    
    if (!result.success) {
      setIsLoading(false);
      Alert.alert(t('common.error'), result.error || 'Google Sign-In failed');
    } else {
      // Check if UID changed (existing Google account scenario)
      if (result.uidChanged && result.previousUid) {
        console.log('[RegisterScreen] ⚠️ UID changed during Google linking! Auto-restoring purchases...');
        console.log('[RegisterScreen] Previous UID:', result.previousUid);
        console.log('[RegisterScreen] New UID:', auth().currentUser?.uid);
        
        try {
          await purchaseService.restorePurchases();
          console.log('[RegisterScreen] ✅ Purchases restored after UID change');
        } catch (restoreError) {
          console.error('[RegisterScreen] ⚠️ Restore failed:', restoreError);
        }
      }
      
      // Success! Firebase linked or signed in, AuthProvider will handle RevenueCat sync
      console.log('[RegisterScreen] ✅ Google account linked/signed in, AuthProvider will sync...');
      setIsLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.HOME }],
      });
    }
  };

  const showNameError = nameTouched && name.trim().length === 0;
  const hasEmailError = email.length > 0 && !isEmailValid(email);
  const hasPasswordError = password.length > 0 && !isPasswordValid(password);
  const hasConfirmPasswordError = confirmPassword.length > 0 && !doPasswordsMatch(password, confirmPassword);

  // No longer needed - we handle navigation directly after registration success

  const handleRegister = async () => {
    if (!name.trim()) {
      setNameTouched(true);
      setError(t('auth.errors.missingName', { defaultValue: 'Please enter your name' }));
      return;
    }

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

    const result = await authService.createUserWithEmailAndPassword(email, password, name.trim());
    
    if (!result.success) {
      setIsLoading(false);
      console.error('[RegisterScreen] Registration error:', result.error);
      
      // Check if we have a provider conflict suggestion
      if (result.suggestionKey) {
        setError(t(result.suggestionKey));
      } else if (result.error?.includes('email-already-in-use')) {
        setError(t('auth.errors.emailInUse', { defaultValue: 'Email already in use' }));
      } else if (result.error?.includes('invalid-email')) {
        setError(t('auth.errors.invalidEmail'));
      } else {
        setError(t('auth.errors.registerFailed'));
      }
    } else {
      // Success! Check if UID changed (email already existed scenario)
      if (result.uidChanged && result.previousUid) {
        console.log('[RegisterScreen] ⚠️ UID changed during registration! Auto-restoring purchases...');
        console.log('[RegisterScreen] Previous UID:', result.previousUid);
        console.log('[RegisterScreen] New UID:', auth().currentUser?.uid);
        
        // Auto-restore purchases to transfer from old UID to new UID
        try {
          await purchaseService.restorePurchases();
          console.log('[RegisterScreen] ✅ Purchases restored after UID change');
        } catch (restoreError) {
          console.error('[RegisterScreen] ⚠️ Restore failed:', restoreError);
          // Don't block navigation, user can manually restore later
        }
      }
      
      // Success! Firebase auto-signs in the user, AuthProvider will handle state and RevenueCat sync
      console.log('[RegisterScreen] ✅ Registration successful, AuthProvider will sync...');
      setIsLoading(false);
      
      // Navigate to home - AuthProvider will update auth state and sync RevenueCat in background
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.HOME }],
      });
    }
  };

  const goBackToSignIn = () => {
    navigation.goBack(); // Go back instead of stacking new route
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('auth.register')}
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
          {/* Social Sign-In Section */}
          <View style={styles.socialContainer}>
            <Button 
              mode="outlined" 
              icon="google"
              onPress={handleGoogleSignIn} 
              style={[styles.socialButton, { borderColor: theme.colors.outline }]}
              disabled={isLoading}
              loading={isLoading}
            >
              Continue with Google
            </Button>
          </View>

          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.outline }]}>
              OR SIGN UP WITH EMAIL
            </Text>
            <Divider style={styles.divider} />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TextInput
            label={t('auth.name', { defaultValue: 'Name' })}
            value={name}
            onChangeText={setName}
            onBlur={() => setNameTouched(true)}
            style={styles.input}
            mode="outlined"
            autoCapitalize="words"
            error={showNameError}
            disabled={isLoading}
          />
          {showNameError && (
            <HelperText type="error" visible={showNameError}>
              {t('auth.errors.missingName', { defaultValue: 'Please enter your name' })}
            </HelperText>
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
            disabled={isLoading || !name.trim() || !email || !password || !confirmPassword}
          >
            {t('auth.register')}
          </Button>

          <View style={styles.loginContainer}>
            <Text variant="bodyMedium" style={styles.loginText}>
              {t('auth.haveAccount')}
            </Text>
            <Button
              mode="text"
              onPress={goBackToSignIn}
              labelStyle={styles.loginButtonText}
            >
              {t('auth.signIn')}
            </Button>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
