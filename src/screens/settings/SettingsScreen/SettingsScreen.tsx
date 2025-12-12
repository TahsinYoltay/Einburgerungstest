import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button, Switch, Text, ActivityIndicator, List, Divider, Portal, Dialog, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createStyles } from './SettingsScreen.style';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectAuthState, selectIsAnonymous } from '../../../store/slices/authSlice';
import { 
  selectHasActiveSubscription,
  setSubscriptionActive,
  setSubscriptionNone
} from '../../../store/slices/subscriptionSlice';
import { resetExamData, switchExamLanguage } from '../../../store/slices/examSlice';
import { switchBookLanguage } from '../../../store/slices/bookSlice';
import { languageManager } from '../../../services/LanguageManager';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { purchaseService } from '../../../services/PurchaseService';
import { authService } from '../../../services/AuthService';
import { useAuth } from '../../../providers/AuthProvider';
import auth, { getAuth, signInAnonymously as firebaseSignInAnonymously } from '@react-native-firebase/auth';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { isDarkMode, toggleTheme, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { signOut } = useAuth();
  
  const { isDownloadingLanguage, downloadProgress, currentLanguage: examContentLang } = useAppSelector(state => state.exam);
  const { loading: isBookDownloading, currentLanguage: bookContentLang } = useAppSelector(state => state.book);
  const { languages: availableLanguages } = useAppSelector(state => state.content);
  const authState = useAppSelector(selectAuthState);
  const isAnonymous = useAppSelector(selectIsAnonymous);
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  
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
    dispatch(resetExamData({}));
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

  const handleSignOut = async () => {
    const hasSubscription = useAppSelector(selectHasActiveSubscription);
    
    Alert.alert(
      t('auth.logoutConfirmTitle', { defaultValue: 'Sign Out?' }),
      hasSubscription 
        ? t('auth.logoutWithSubscriptionWarning', { 
            defaultValue: 'If you sign out, you will lose access to your subscription on this device until you sign in again or restore purchases.\n\nYour subscription will NOT be cancelled.' 
          })
        : t('auth.logoutWarning', { 
            defaultValue: 'Are you sure you want to sign out?' 
          }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.signOut', { defaultValue: 'Sign Out' }), 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
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

          <Divider style={styles.divider} />

          {!isAnonymous && authState.email ? (
            <>
              <View style={styles.row}>
                <View>
                  <Text style={styles.rowTitle}>{t('settings.loggedInAs', { defaultValue: 'Logged in as' })}</Text>
                  <Text style={styles.rowSubtitle}>{authState.email}</Text>
                </View>
                <Button mode="outlined" onPress={handleSignOut} textColor="red">
                  {t('settings.signOut', 'Sign Out')}
                </Button>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={[styles.rowTitle, { color: theme.colors.error }]}>{t('settings.deleteAccount')}</Text>
                <Button mode="outlined" onPress={handleDeleteAccount} textColor={theme.colors.error} style={{ borderColor: theme.colors.error }}>
                  {t('common.delete')}
                </Button>
              </View>
            </>
          ) : (
            <>
              <View style={styles.row}>
                 <Text style={styles.rowTitle}>{t('settings.syncProgress', 'Sync Progress')}</Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', gap: 10 }}>
                 <Button 
                   mode="outlined" 
                   icon="google" 
                   onPress={async () => {
                     console.log('[SettingsScreen] Linking Google account...');
                     const result = await authService.linkGoogleAccount();
                     
                     if (result.success) {
                       // Check if UID changed (account switched scenario)
                       if (result.uidChanged && result.previousUid) {
                         console.log('[SettingsScreen] ⚠️ UID changed! Auto-restoring purchases...');
                         console.log('[SettingsScreen] Previous UID:', result.previousUid);
                         console.log('[SettingsScreen] New UID:', auth().currentUser?.uid);
                         
                         // Auto-restore purchases to transfer from old UID to new UID
                         try {
                           const restored = await purchaseService.restorePurchases();
                           if (restored) {
                             Alert.alert(
                               t('common.success'), 
                               t('settings.accountSwitchedWithSubscription', { 
                                 defaultValue: 'Account linked successfully! Your subscription has been transferred.' 
                               })
                             );
                           } else {
                             Alert.alert(
                               t('common.success'),
                               t('settings.accountSwitchedNoSubscription', {
                                 defaultValue: 'Account linked successfully!'
                               })
                             );
                           }
                         } catch (error) {
                           console.error('[SettingsScreen] ❌ Restore error:', error);
                           Alert.alert(
                             t('common.success'),
                             t('settings.linkSuccessRestoreFailed', { 
                               defaultValue: 'Account linked! Please use "Restore Purchases" to transfer your subscription.' 
                             })
                           );
                         }
                       } else {
                         // Normal linking (UID preserved)
                         Alert.alert(t('common.success'), t('settings.linkSuccess', { defaultValue: 'Account linked successfully!' }));
                       }
                     } else {
                       Alert.alert(t('common.error'), result.error || t('common.error'));
                     }
                   }}
                   style={{ flex: 1 }}
                 >
                   Google
                 </Button>
                 <Button mode="outlined" icon="apple" onPress={() => Alert.alert('Coming Soon', 'Apple Sign-In integration pending.')} style={{ flex: 1 }}>
                   Apple
                 </Button>
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('settings.dataManagement')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{t('exam.resetExams')}</Text>
            <Button mode="outlined" icon="delete" onPress={handleResetExam} textColor="red">
              {t('settings.resetAction', 'Delete')}
            </Button>
          </View>
        </View>
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
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 16 }}>
            <Button mode="contained" onPress={() => setShowAppLangDialog(false)} style={{ width: '80%' }}>{t('common.close')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Exam Content Dialog */}
      <Portal>
        <Dialog visible={showExamLangDialog} onDismiss={() => setShowExamLangDialog(false)}>
          <Dialog.Title>{t('settings.examContent')}</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {languages.map((lang, index, arr) => {
                const isSelected = examContentLang === lang.code;
                const isDownloaded = examDownloadedStatus[lang.code];
                const isDefault = lang.code === 'en';

                return (
                  <React.Fragment key={lang.code}>
                    <List.Item
                      title={lang.nativeName}
                      description={lang.name}
                      onPress={() => {
                        handleExamLanguageChange(lang.code);
                        setShowExamLangDialog(false);
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
                                          await languageManager.deleteExamContent(lang.code);
                                          const status = { ...examDownloadedStatus };
                                          status[lang.code] = false;
                                          setExamDownloadedStatus(status);
                                        }
                                      }
                                    ]
                                  );
                                } else {
                                  handleExamLanguageChange(lang.code);
                                  setShowExamLangDialog(false);
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
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 16 }}>
            <Button mode="contained" onPress={() => setShowExamLangDialog(false)} style={{ width: '80%' }}>{t('common.close')}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showBookLangDialog} onDismiss={() => setShowBookLangDialog(false)}>
          <Dialog.Title>{t('settings.bookContent')}</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {languages.map((lang, index, arr) => {
                const isSelected = bookContentLang === lang.code;
                const isDownloaded = bookDownloadedStatus[lang.code];
                const isDefault = lang.code === 'en';

                return (
                  <React.Fragment key={lang.code}>
                    <List.Item
                      title={lang.nativeName}
                      description={lang.name}
                      onPress={() => {
                        handleBookLanguageChange(lang.code);
                        setShowBookLangDialog(false);
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
                                e.stopPropagation();
                                if (isDownloaded) {
                                  Alert.alert(
                                    t('common.delete'),
                                    t('settings.deleteBookConfirm'),
                                    [
                                      { text: t('common.cancel'), style: 'cancel' },
                                      { 
                                        text: t('common.delete'), 
                                        style: 'destructive',
                                        onPress: async () => {
                                          await languageManager.deleteBookContent(lang.code);
                                          const status = { ...bookDownloadedStatus };
                                          status[lang.code] = false;
                                          setBookDownloadedStatus(status);
                                        }
                                      }
                                    ]
                                  );
                                } else {
                                  handleBookLanguageChange(lang.code);
                                  setShowBookLangDialog(false);
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
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 16 }}>
            <Button mode="contained" onPress={() => setShowBookLangDialog(false)} style={{ width: '80%' }}>{t('common.close')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default SettingsScreen;
