import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Button, Dialog, IconButton, Portal, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useAppSelector } from '../../store/hooks';
import { useAppTheme } from '../../providers/ThemeProvider';
import { createStyles } from './LanguageSelector.styles';
import type { LanguageOption } from '../../types/exam';

interface LanguageSelectorProps {
  visible: boolean;
  onDismiss: () => void;
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  loading?: boolean;
  downloadProgress?: number;
  title?: string;
  languages?: LanguageOption[];
  languageFilter?: (language: LanguageOption) => boolean;
}

export const LanguageSelector = ({
  visible,
  onDismiss,
  currentLanguage,
  onSelectLanguage,
  loading,
  downloadProgress,
  title,
  languages,
  languageFilter,
}: LanguageSelectorProps) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const { languages: availableLanguages } = useAppSelector(state => state.content);
  const resolvedLanguages = useMemo(() => {
    const base = languages ?? availableLanguages ?? [];
    return languageFilter ? base.filter(languageFilter) : base;
  }, [availableLanguages, languageFilter, languages]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={loading ? undefined : onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title || t('settings.selectLanguage')}</Dialog.Title>
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
                {resolvedLanguages.map((lang, index) => {
                  const isSelected = lang.code === currentLanguage;
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
                        {isSelected ? (
                          <Icon name="check" size={20} color={theme.colors.primary} />
                        ) : (
                          <View style={styles.rightSpacer} />
                        )}
                      </TouchableOpacity>
                      {index < resolvedLanguages.length - 1 ? <View style={styles.divider} /> : null}
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
