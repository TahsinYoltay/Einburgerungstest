import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button, Switch, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createStyles } from './SettingsScreen.style';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsAuthenticated } from '../../../store/slices/authSlice';
import { setSubscriptionActive, setSubscriptionNone } from '../../../store/slices/subscriptionSlice';
import { resetAllExamUserData, resetExamData, switchExamLanguage } from '../../../store/slices/examSlice';
import { switchBookLanguage } from '../../../store/slices/bookSlice';
import { languageManager } from '../../../services/LanguageManager';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { purchaseService } from '../../../services/PurchaseService';
import { getAuth, signInAnonymously as firebaseSignInAnonymously } from '@react-native-firebase/auth';
import { clearAllProgress } from '../../../utils/readingProgress';
import { progressSyncService } from '../../../services/ProgressSyncService';
import { LanguageSelector } from '../../../components/common/LanguageSelector';
import LanguagePackageSelector from '../../../components/common/LanguagePackageSelector';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { isDarkMode, toggleTheme, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const { isDownloadingLanguage, currentLanguage: examContentLang, downloadProgress: examDownloadProgress } = useAppSelector(state => state.exam);
  const { loading: isBookDownloading, currentLanguage: bookContentLang, downloadProgress: bookDownloadProgress } = useAppSelector(state => state.book);
  const { languages: availableLanguages } = useAppSelector(state => state.content);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const firebaseUid = useAppSelector(state => state.auth.firebaseUid);
  
  const languages = availableLanguages;
  const [examDownloadedStatus, setExamDownloadedStatus] = useState<Record<string, boolean>>({});
  const [bookDownloadedStatus, setBookDownloadedStatus] = useState<Record<string, boolean>>({});
  const [showAppLangDialog, setShowAppLangDialog] = useState(false);
  const [showExamLangDialog, setShowExamLangDialog] = useState(false);
  const [showBookLangDialog, setShowBookLangDialog] = useState(false);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);

  // Force re-render when screen comes into focus (to reflect auth state changes after login)
  useFocusEffect(
    useCallback(() => {
      setForceUpdateKey(prev => prev + 1);
    }, [])
  );

  // Check which languages are downloaded on mount
  useEffect(() => {
    const checkDownloads = async () => {
      const eStatus: Record<string, boolean> = {};
      const bStatus: Record<string, boolean> = {};
      for (const lang of languages) {
        eStatus[lang.code] = await languageManager.isLanguageDownloaded(lang.code);
        bStatus[lang.code] = await languageManager.isBookDownloaded(lang.code);
      }
      setExamDownloadedStatus(eStatus);
      setBookDownloadedStatus(bStatus);
    };
    checkDownloads();
  }, [languages, isDownloadingLanguage, isBookDownloading]); 

  const handleResetExam = () => {
    Alert.alert(
      t('settings.resetAllProgressConfirmTitle', { defaultValue: 'Reset all progress data?' }),
      t('settings.resetAllProgressConfirmMsg', {
        defaultValue:
          'This will reset all exam progress and results. Favourites and wrong answers will stay.',
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('exam.reset', { defaultValue: 'Reset' }),
          style: 'destructive',
          onPress: async () => {
            try {
              const cloudOk =
                !isAuthenticated || !firebaseUid
                  ? true
                  : await progressSyncService.clearRemoteExamProgress({ uid: firebaseUid, mode: 'history' });

              dispatch(resetExamData({}));

              Alert.alert(
                t('common.success'),
                cloudOk
                  ? t('settings.resetAllProgressSuccess', { defaultValue: 'Exam progress has been reset.' })
                  : t('settings.resetCloudWarning', {
                      defaultValue:
                        "Reset completed on this device, but we couldn't clear your cloud progress. Please check your internet and try again.",
                    })
              );
            } catch (error) {
              Alert.alert(t('common.error'), t('common.error'));
            }
          },
        },
      ]
    );
  };

  const handleResetAllData = () => {
    Alert.alert(
      t('settings.resetAllDataConfirmTitle', { defaultValue: 'Reset everything?' }),
      t('settings.resetAllDataConfirmMsg', {
        defaultValue:
          'This will reset all progress on this device, including exam results, favourites, wrong answers, and reading progress. Your account will stay signed in.',
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('exam.reset', { defaultValue: 'Reset' }),
          style: 'destructive',
          onPress: async () => {
            try {
              const cloudOk =
                !isAuthenticated || !firebaseUid
                  ? true
                  : await progressSyncService.clearRemoteExamProgress({ uid: firebaseUid, mode: 'everything' });

              await clearAllProgress(firebaseUid || 'local', isAuthenticated);
              dispatch(resetAllExamUserData());
              Alert.alert(
                t('common.success'),
                cloudOk
                  ? t('settings.resetAllDataSuccess', { defaultValue: 'Everything has been reset.' })
                  : t('settings.resetCloudWarning', {
                      defaultValue:
                        "Reset completed on this device, but we couldn't clear your cloud progress. Please check your internet and try again.",
                    })
              );
            } catch (error) {
              Alert.alert(t('common.error'), t('common.error'));
            }
          },
        },
      ]
    );
  };

  const handleExamLanguageChange = async (langCode: string) => {
    if (isDownloadingLanguage) return;
    try {
      await dispatch(switchExamLanguage(langCode)).unwrap();
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.downloadError', { msg: String(error) }));
    }
  };

  const handleBookLanguageChange = async (langCode: string) => {
    if (isBookDownloading) return;
    try {
      await dispatch(switchBookLanguage(langCode)).unwrap();
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.downloadError', { msg: String(error) }));
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const isPro = await purchaseService.restorePurchases();
      
      // Fetch and update subscription state
      const subscriptionState = await purchaseService.fetchAndUpdateEntitlements();
      
      if (subscriptionState.status === 'active') {
        dispatch(setSubscriptionActive({
          productId: subscriptionState.productId!,
          renewalType: subscriptionState.renewalType!,
          expiresAt: subscriptionState.expiresAt,
        }));
        Alert.alert(
          t('common.success'), 
          t('settings.restoreSuccess', { defaultValue: 'Purchases restored successfully!' })
        );
      } else {
        dispatch(setSubscriptionNone());
        Alert.alert(
          t('common.info', { defaultValue: 'No Purchases Found' }), 
          t('subscription.noPurchasesToRestore', { 
            defaultValue: 'We couldn\'t find any active purchases for this store account. If you believe this is an error, please contact support.' 
          })
        );
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('settings.restoreError', { defaultValue: 'Failed to restore purchases.' }));
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('settings.deleteAccountConfirmTitle'),
      t('settings.deleteAccountConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              const authInstance = getAuth();
              const user = authInstance.currentUser;
              if (user) {
                // 1. Clean up revenue cat
                await purchaseService.logoutUser();
                
                // 2. Delete user
                await user.delete();
                
                // 3. Sign in anonymously to reset state
                await firebaseSignInAnonymously(authInstance);
                
                Alert.alert(t('common.success'), t('settings.deleteAccountSuccess'));
              }
            } catch (error: any) {
              console.error('Delete account error:', error);
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(t('common.error'), t('settings.deleteAccountReAuth'));
              } else {
                Alert.alert(t('common.error'), error.message || t('common.error'));
              }
            }
          }
        }
      ]
    );
  };

  const currentAppLangName = languages.find(l => l.code === i18n.language)?.nativeName || 'English';
  const currentExamLangName = languages.find(l => l.code === examContentLang)?.nativeName || 'English';
  const currentBookLangName = languages.find(l => l.code === bookContentLang)?.nativeName || 'English';
  const appLanguageCodes = useMemo(
    () => new Set(['en', 'es', 'tr', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'pl', 'nl']),
    []
  );

  const handleAppLanguageSelect = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowAppLangDialog(false);
  };

  const handleExamPackageSelect = (langCode: string) => {
    handleExamLanguageChange(langCode);
    setShowExamLangDialog(false);
  };

  const handleBookPackageSelect = (langCode: string) => {
    handleBookLanguageChange(langCode);
    setShowBookLangDialog(false);
  };

  const handleDeleteExamPackage = (langCode: string) => {
    Alert.alert(
      t('common.delete'),
      t('settings.deleteConfirm', { defaultValue: 'Delete this language pack?' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await languageManager.deleteExamContent(langCode);
            setExamDownloadedStatus(prev => ({ ...prev, [langCode]: false }));
          },
        },
      ]
    );
  };

  const handleDeleteBookPackage = (langCode: string) => {
    Alert.alert(
      t('common.delete'),
      t('settings.deleteBookConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await languageManager.deleteBookContent(langCode);
            setBookDownloadedStatus(prev => ({ ...prev, [langCode]: false }));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('screens.settings')}</Text>
        <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.iconButton}>
          <Icon name="close" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{t('settings.darkMode')}</Text>
              <Text style={styles.rowSubtitle}>{t('settings.darkMode')}</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>

          <TouchableOpacity style={styles.row} onPress={() => setShowAppLangDialog(true)} activeOpacity={0.85}>
            <View>
              <Text style={styles.rowTitle}>{t('settings.appLanguage')}</Text>
              <Text style={styles.rowSubtitle}>{currentAppLangName}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.onSurface} />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => setShowExamLangDialog(true)} activeOpacity={0.85}>
            <View>
              <Text style={styles.rowTitle}>{t('settings.examContent')}</Text>
              <Text style={styles.rowSubtitle}>
                {isDownloadingLanguage ? t('settings.downloadingLanguage') : currentExamLangName}
              </Text>
            </View>
            {isDownloadingLanguage ? <ActivityIndicator size="small" /> : <Icon name="chevron-right" size={20} color={theme.colors.onSurface} />}
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => setShowBookLangDialog(true)} activeOpacity={0.85}>
            <View>
              <Text style={styles.rowTitle}>{t('settings.bookContent', 'Book Content')}</Text>
              <Text style={styles.rowSubtitle}>
                {isBookDownloading ? t('settings.downloadingLanguage') : currentBookLangName}
              </Text>
            </View>
            {isBookDownloading ? <ActivityIndicator size="small" /> : <Icon name="chevron-right" size={20} color={theme.colors.onSurface} />}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.account', 'Account & Purchases')}</Text>
          
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{t('settings.restorePurchases', 'Restore Purchases')}</Text>
              <Text style={styles.rowSubtitle}>{t('settings.restorePurchasesDesc', 'Restore previously bought items')}</Text>
            </View>
            <Button mode="text" onPress={handleRestorePurchases}>
              {t('settings.restore', 'Restore')}
            </Button>
          </View>

          {isAuthenticated && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.row}>
                <Text style={[styles.rowTitle, styles.destructiveLabel]}>{t('settings.deleteAccount')}</Text>
                <Button
                  mode="outlined"
                  onPress={handleDeleteAccount}
                  textColor={theme.colors.error}
                  style={[styles.rowButton, styles.destructiveButton]}
                >
                  {t('common.delete', { defaultValue: 'Delete' })}
                </Button>
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.dataManagement')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>
              {t('settings.resetAllProgressData', { defaultValue: 'Reset All Progress Data' })}
            </Text>
            <Button
              mode="outlined"
              onPress={handleResetExam}
              textColor={theme.colors.error}
              style={[styles.rowButton, styles.destructiveButton]}
            >
              {t('exam.reset', { defaultValue: 'Reset' })}
            </Button>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Text style={[styles.rowTitle, styles.destructiveLabel]}>
              {t('settings.resetAllData', { defaultValue: 'Reset Everything' })}
            </Text>
            <Button
              mode="outlined"
              onPress={handleResetAllData}
              textColor={theme.colors.error}
              style={[styles.rowButton, styles.destructiveButton]}
            >
              {t('exam.reset', { defaultValue: 'Reset' })}
            </Button>
          </View>
        </View>
      </ScrollView>

      <LanguageSelector
        visible={showAppLangDialog}
        onDismiss={() => setShowAppLangDialog(false)}
        currentLanguage={i18n.language}
        onSelectLanguage={handleAppLanguageSelect}
        title={t('settings.appLanguage')}
        languages={languages}
        languageFilter={language => appLanguageCodes.has(language.code)}
      />

      <LanguagePackageSelector
        visible={showExamLangDialog}
        onDismiss={() => setShowExamLangDialog(false)}
        title={t('settings.examContent')}
        currentLanguage={examContentLang}
        languages={languages}
        downloadedStatus={examDownloadedStatus}
        onSelectLanguage={handleExamPackageSelect}
        onDownloadLanguage={handleExamPackageSelect}
        onDeleteLanguage={handleDeleteExamPackage}
        loading={isDownloadingLanguage}
        downloadProgress={examDownloadProgress}
      />

      <LanguagePackageSelector
        visible={showBookLangDialog}
        onDismiss={() => setShowBookLangDialog(false)}
        title={t('settings.bookContent')}
        currentLanguage={bookContentLang}
        languages={languages}
        downloadedStatus={bookDownloadedStatus}
        onSelectLanguage={handleBookPackageSelect}
        onDownloadLanguage={handleBookPackageSelect}
        onDeleteLanguage={handleDeleteBookPackage}
        loading={isBookDownloading}
        downloadProgress={bookDownloadProgress}
      />
    </SafeAreaView>
  );
};

export default SettingsScreen;
