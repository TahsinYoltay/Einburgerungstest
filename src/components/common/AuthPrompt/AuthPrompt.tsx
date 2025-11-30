import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Card, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';

interface AuthPromptProps {
  title?: string;
  message?: string;
  showSignIn?: boolean;
  showRegister?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

type AuthPromptNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AuthPrompt: React.FC<AuthPromptProps> = ({
  title,
  message,
  showSignIn = true,
  showRegister = true,
  onRetry,
  onDismiss
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthPromptNavigationProp>();
  const { theme } = useAppTheme();
  
  const styles = StyleSheet.create({
    container: {
      margin: 16,
      elevation: 4,
    },
    content: {
      alignItems: 'center',
      padding: 24,
    },
    iconContainer: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 50,
      backgroundColor: `${theme.colors.primary}20`,
    },
    title: {
      textAlign: 'center',
      marginBottom: 8,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    message: {
      textAlign: 'center',
      marginBottom: 24,
      color: theme.colors.onSurface,
      opacity: 0.8,
    },
    buttonContainer: {
      width: '100%',
      gap: 12,
    },
    primaryButton: {
      marginBottom: 8,
    },
    secondaryButton: {
      marginBottom: 8,
    },
    textButton: {
      marginBottom: 4,
    },
    buttonContent: {
      paddingVertical: 8,
    },
  });

  const handleSignIn = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  const handleRegister = () => {
    navigation.navigate(ROUTES.REGISTER);
  };

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon source="lock-outline" size={48} />
        </View>
        
        <Text variant="titleMedium" style={styles.title}>
          {title || t('auth.authRequired')}
        </Text>
        
        <Text variant="bodyMedium" style={styles.message}>
          {message || t('auth.authRequiredMessage')}
        </Text>

        <View style={styles.buttonContainer}>
          {showSignIn && (
            <Button
              mode="contained"
              onPress={handleSignIn}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
            >
              {t('auth.login')}
            </Button>
          )}

          {showRegister && (
            <Button
              mode="outlined"
              onPress={handleRegister}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
            >
              {t('auth.register')}
            </Button>
          )}

          {onRetry && (
            <Button
              mode="text"
              onPress={onRetry}
              style={styles.textButton}
              contentStyle={styles.buttonContent}
            >
              {t('common.retry')}
            </Button>
          )}

          {onDismiss && (
            <Button
              mode="text"
              onPress={onDismiss}
              style={styles.textButton}
              contentStyle={styles.buttonContent}
            >
              {t('common.cancel')}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

export default AuthPrompt; 