import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, List, RadioButton, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';

interface LanguageSelectorProps {
  visible: boolean;
  onDismiss: () => void;
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  loading?: boolean;
  downloadProgress?: number;
}

export const LanguageSelector = ({
  visible,
  onDismiss,
  currentLanguage,
  onSelectLanguage,
  loading,
  downloadProgress
}: LanguageSelectorProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { languages } = useAppSelector(state => state.content);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={loading ? undefined : onDismiss} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
        <Text variant="titleLarge" style={styles.title}>{t('settings.selectLanguage')}</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 16 }}>{t('settings.downloadingLanguage')}</Text>
            {downloadProgress !== undefined && (
              <Text variant="bodySmall">{Math.round(downloadProgress * 100)}%</Text>
            )}
          </View>
        ) : (
          <View style={{ maxHeight: 400, width: '100%' }}>
            <ScrollView>
              <RadioButton.Group onValueChange={onSelectLanguage} value={currentLanguage}>
                {languages.map((lang) => (
                  <List.Item
                    key={lang.code}
                    title={lang.nativeName}
                    description={lang.name}
                    left={() => <RadioButton value={lang.code} />}
                    onPress={() => onSelectLanguage(lang.code)}
                  />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </View>
        )}
        
        {!loading && (
          <View style={styles.footer}>
            <Button mode="contained" onPress={onDismiss} style={styles.closeButton}>
              {t('common.close')}
            </Button>
          </View>
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    marginHorizontal: 30,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center', // Help center content
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollList: {
    width: '100%', // Ensure list takes width
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  footer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  closeButton: {
    width: '80%',
    paddingVertical: 4,
  },
});
