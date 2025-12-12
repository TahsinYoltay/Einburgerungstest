import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Button, Dialog, Divider, List, Portal, Text } from 'react-native-paper';
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
        <Dialog.Content>
          <List.Item
            title={t('account.avatar.chooseFromLibrary')}
            left={props => <List.Icon {...props} icon="image" />}
            onPress={onChooseFromLibrary}
            disabled={uploading}
            titleStyle={styles.itemTitle}
            style={styles.item}
          />
          <Divider />
          <List.Item
            title={t('account.avatar.takePhoto')}
            left={props => <List.Icon {...props} icon="camera" />}
            onPress={onTakePhoto}
            disabled={uploading}
            titleStyle={styles.itemTitle}
            style={styles.item}
          />
          {canRemove ? (
            <>
              <Divider />
            <List.Item
              title={t('account.avatar.removePhoto')}
              left={props => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
              titleStyle={[styles.itemTitle, styles.removeTitle]}
              onPress={onRemovePhoto}
              disabled={uploading}
              style={styles.item}
            />
            </>
          ) : null}

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
