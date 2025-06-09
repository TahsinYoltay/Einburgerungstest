import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './LogoutButton.style';

interface LogoutButtonProps {
  onLogout: () => void;
  isLoading?: boolean;
}

const LogoutButton = ({ onLogout, isLoading = false }: LogoutButtonProps) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleLogout = () => {
    // Close dialog
    setShowConfirmDialog(false);
    // Trigger the logout function
    onLogout();
  };

  return (
    <View>
      <Button
        mode="outlined"
        icon="logout"
        onPress={() => setShowConfirmDialog(true)}
        style={styles.logoutButton}
        loading={isLoading}
        disabled={isLoading}
      >
        {t('auth.logout')}
      </Button>

      <Portal>
        <Dialog
          visible={showConfirmDialog}
          onDismiss={() => setShowConfirmDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{t('auth.logoutConfirmTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t('auth.logoutConfirmMessage')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={handleLogout}>
              {t('auth.logout')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default LogoutButton;
