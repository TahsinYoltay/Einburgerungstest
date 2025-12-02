import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Card, List, Divider, Button, Switch, Text, ActivityIndicator, ProgressBar, IconButton, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles } from './SettingsScreen.style';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { resetExamData, switchExamLanguage } from '../../../store/slices/examSlice';
import { languageManager } from '../../../services/LanguageManager';
import { useAppTheme } from '../../../providers/ThemeProvider';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { isDarkMode, toggleTheme, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const { isDownloadingLanguage, downloadProgress, currentLanguage: examContentLang } = useAppSelector(state => state.exam);
  const { languages: availableLanguages } = useAppSelector(state => state.content);
  
  const languages = availableLanguages;
  const [downloadedStatus, setDownloadedStatus] = useState<Record<string, boolean>>({});
  const [showAppLangDialog, setShowAppLangDialog] = useState(false);
  const [showContentLangDialog, setShowContentLangDialog] = useState(false);

  // Check which languages are downloaded on mount
  useEffect(() => {
    const checkDownloads = async () => {
      const status: Record<string, boolean> = {};
      for (const lang of languages) {
        status[lang.code] = await languageManager.isLanguageDownloaded(lang.code);
      }
      setDownloadedStatus(status);
    };
    checkDownloads();
  }, [languages, isDownloadingLanguage]); 

  const handleResetExam = () => {
    dispatch(resetExamData({}));
  };

  const handleContentLanguageChange = async (langCode: string) => {
    if (isDownloadingLanguage) return;
    try {
      await dispatch(switchExamLanguage(langCode)).unwrap();
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.downloadError', { msg: String(error) }));
    }
  };

  const currentAppLangName = languages.find(l => l.code === i18n.language)?.nativeName || 'English';
  const currentContentLangName = languages.find(l => l.code === examContentLang)?.nativeName || 'English';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} variant="headlineMedium">
          {t('screens.settings')}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              {t('settings.appearance')}
            </Text>
            <List.Item
              title={t('settings.darkMode')}
              right={() => <Switch value={isDarkMode} onValueChange={toggleTheme} />}
              style={styles.settingItem}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              {t('settings.language')}
            </Text>
            
            <List.Item
              title={t('settings.appLanguage')} // Now "Language"
              description={currentAppLangName}
              onPress={() => setShowAppLangDialog(true)}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              style={styles.settingItem}
            />
            
            <Divider style={styles.divider} />

            <List.Item
              title={t('settings.examContent')}
              description={isDownloadingLanguage ? t('settings.downloadingLanguage') : currentContentLangName}
              onPress={() => setShowContentLangDialog(true)}
              right={props => 
                isDownloadingLanguage 
                  ? <ActivityIndicator size="small" /> 
                  : <List.Icon {...props} icon="chevron-right" />
              }
              style={styles.settingItem}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              {t('settings.dataManagement')}
            </Text>
            <View style={{ marginVertical: 8 }}>
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleResetExam}
                textColor="red"
              >
                {t('exam.resetExams')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* App Language Dialog */}
      <Portal>
        <Dialog visible={showAppLangDialog} onDismiss={() => setShowAppLangDialog(false)}>
          <Dialog.Title>{t('settings.appLanguage')}</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {languages.filter(l => ['en', 'es', 'tr', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'pl', 'nl'].includes(l.code)).map((lang, index, arr) => (
                <React.Fragment key={lang.code}>
                  <List.Item
                    title={lang.nativeName}
                    onPress={() => {
                      i18n.changeLanguage(lang.code);
                      setShowAppLangDialog(false);
                    }}
                    right={props => i18n.language === lang.code && <List.Icon {...props} icon="check" color="green" />}
                  />
                  {index < arr.length - 1 && <Divider style={{ backgroundColor: theme.colors.outline, height: 1 }} />}
                </React.Fragment>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAppLangDialog(false)}>{t('common.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Exam Content Dialog */}
      <Portal>
        <Dialog visible={showContentLangDialog} onDismiss={() => setShowContentLangDialog(false)}>
          <Dialog.Title>{t('settings.examContent')}</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {languages.map((lang, index, arr) => {
                const isSelected = examContentLang === lang.code;
                const isDownloaded = downloadedStatus[lang.code];
                const isDefault = lang.code === 'en';

                return (
                  <React.Fragment key={lang.code}>
                    <List.Item
                      title={lang.nativeName}
                      description={lang.name}
                      onPress={() => {
                        handleContentLanguageChange(lang.code);
                        setShowContentLangDialog(false);
                      }}
                      right={props => (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {isSelected && <List.Icon {...props} icon="check" color="green" />}
                          {!isDefault && (
                            <IconButton
                              icon={isDownloaded ? "delete" : "cloud-download-outline"}
                              size={20}
                              iconColor={isDownloaded ? "red" : "blue"}
                              onPress={(e) => {
                                e.stopPropagation(); // Prevent item selection
                                if (isDownloaded) {
                                  Alert.alert(
                                    t('common.delete'),
                                    t('settings.deleteConfirm', { defaultValue: 'Delete this language pack?' }),
                                    [
                                      { text: t('common.cancel'), style: 'cancel' },
                                      { 
                                        text: t('common.delete'), 
                                        style: 'destructive',
                                        onPress: async () => {
                                          await languageManager.deleteLanguage(lang.code);
                                          const status = { ...downloadedStatus };
                                          status[lang.code] = false;
                                          setDownloadedStatus(status);
                                        }
                                      }
                                    ]
                                  );
                                } else {
                                  handleContentLanguageChange(lang.code);
                                  setShowContentLangDialog(false);
                                }
                              }}
                            />
                          )}
                        </View>
                      )}
                    />
                    {index < arr.length - 1 && <Divider style={{ backgroundColor: theme.colors.outline, height: 1 }} />}
                  </React.Fragment>
                );
              })}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowContentLangDialog(false)}>{t('common.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default SettingsScreen;
