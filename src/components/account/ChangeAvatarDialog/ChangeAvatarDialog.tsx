import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Button, Dialog, Portal, Text, IconButton } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './ChangeAvatarDialog.styles';

type Props = {
  visible: boolean;
  uploading: boolean;
  uploadProgress?: number;
  canRemove: boolean;
  onDismiss: () => void;
  onChooseFromLibrary: () => void;
  onTakePhoto: () => void;
  onRemovePhoto: () => void;
};

const ChangeAvatarDialog: React.FC<Props> = ({
  visible,
  uploading,
  uploadProgress,
  canRemove,
  onDismiss,
  onChooseFromLibrary,
  onTakePhoto,
  onRemovePhoto,
}) => {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();

  const progressPercent =
    uploadProgress && Number.isFinite(uploadProgress)
      ? Math.max(0, Math.min(100, Math.round(uploadProgress * 100)))
      : 0;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={uploading ? undefined : onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{t('account.avatar.changeTitle')}</Dialog.Title>
        <IconButton
          icon="close"
          size={18}
          disabled={uploading}
          onPress={onDismiss}
          style={styles.closeIconButton}
          iconColor={theme.colors.onSurface}
        />
        <Dialog.Content>
          <View style={styles.optionsList}>
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.9}
              onPress={onChooseFromLibrary}
              disabled={uploading}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <Icon name="image" size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.optionLabel}>{t('account.avatar.chooseFromLibrary')}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={theme.colors.onSurface} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.9}
              onPress={onTakePhoto}
              disabled={uploading}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <Icon name="camera" size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.optionLabel}>{t('account.avatar.takePhoto')}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={theme.colors.onSurface} />
            </TouchableOpacity>

            {canRemove ? (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.optionRow}
                  activeOpacity={0.9}
                  onPress={onRemovePhoto}
                  disabled={uploading}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.optionIcon, styles.removeIcon]}>
                      <Icon name="delete" size={22} color={theme.colors.error} />
                    </View>
                    <Text style={[styles.optionLabel, styles.removeLabel]}>{t('account.avatar.removePhoto')}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          {uploading ? (
            <View style={styles.progressWrapper}>
              <ActivityIndicator animating color={theme.colors.primary} />
              <Text style={styles.progressText}>
                {t('account.avatar.uploading', { percent: progressPercent })}
              </Text>
            </View>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button mode="contained" onPress={onDismiss} disabled={uploading} style={styles.closeButton}>
            {t('common.close')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ChangeAvatarDialog;
