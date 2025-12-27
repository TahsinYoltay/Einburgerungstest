import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Button, Dialog, IconButton, Portal, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useAppTheme } from '../../providers/ThemeProvider';
import { createStyles } from './LanguagePackageSelector.styles';
import type { LanguageOption } from '../../types/exam';

interface LanguagePackageSelectorProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  currentLanguage: string;
  languages: LanguageOption[];
  downloadedStatus: Record<string, boolean>;
  onSelectLanguage: (langCode: string) => void;
  onDownloadLanguage: (langCode: string) => void;
  onDeleteLanguage: (langCode: string) => void;
  loading?: boolean;
  downloadProgress?: number;
  defaultLanguageCode?: string;
}

const LanguagePackageSelector = ({
  visible,
  onDismiss,
  title,
  currentLanguage,
  languages,
  downloadedStatus,
  onSelectLanguage,
  onDownloadLanguage,
  onDeleteLanguage,
  loading,
  downloadProgress,
  defaultLanguageCode = 'en',
}: LanguagePackageSelectorProps) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();

  const handleActionPress = (langCode: string) => {
    const isDownloaded = Boolean(downloadedStatus[langCode]);
    if (isDownloaded) {
      onDeleteLanguage(langCode);
      return;
    }
    onDownloadLanguage(langCode);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={loading ? undefined : onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <IconButton
          icon="close"
          size={18}
          disabled={Boolean(loading)}
          onPress={onDismiss}
          style={styles.closeIconButton}
          iconColor={theme.colors.onSurface}
        />

        <Dialog.Content>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>{t('settings.downloadingLanguage')}</Text>
              {downloadProgress !== undefined ? (
                <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.listCard}>
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {languages.map((lang, index) => {
                  const isSelected = lang.code === currentLanguage;
                  const isDefault = lang.code === defaultLanguageCode;
                  const isDownloaded = Boolean(downloadedStatus[lang.code]);
                  const actionIcon = isDownloaded ? 'delete' : 'cloud-download-outline';
                  const actionStyle = isDownloaded ? styles.actionButtonDelete : styles.actionButtonDownload;
                  const actionColor = isDownloaded ? theme.colors.error : theme.colors.primary;

                  return (
                    <React.Fragment key={lang.code}>
                      <TouchableOpacity
                        style={styles.optionRow}
                        activeOpacity={0.9}
                        onPress={() => onSelectLanguage(lang.code)}
                      >
                        <View style={styles.optionLeft}>
                          <View style={styles.optionIcon}>
                            <Icon name="translate" size={22} color={theme.colors.primary} />
                          </View>
                          <View style={styles.optionText}>
                            <Text style={styles.optionLabel}>{lang.nativeName}</Text>
                            <Text style={styles.optionDescription}>{lang.name}</Text>
                          </View>
                        </View>
                        <View style={styles.optionRight}>
                          {isSelected ? (
                            <Icon name="check" size={20} color={theme.colors.primary} />
                          ) : (
                            <View style={styles.rightSpacer} />
                          )}
                          {!isDefault ? (
                            <TouchableOpacity
                              style={[styles.actionButton, actionStyle]}
                              activeOpacity={0.85}
                              onPress={() => handleActionPress(lang.code)}
                            >
                              <Icon name={actionIcon} size={18} color={actionColor} />
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.actionPlaceholder} />
                          )}
                        </View>
                      </TouchableOpacity>
                      {index < languages.length - 1 ? <View style={styles.divider} /> : null}
                    </React.Fragment>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button
            mode="contained"
            onPress={onDismiss}
            disabled={Boolean(loading)}
            style={styles.closeButton}
          >
            {t('common.close')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default LanguagePackageSelector;
