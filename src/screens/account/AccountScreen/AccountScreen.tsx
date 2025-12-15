import React from 'react';
import { View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { createStyles } from './AccountScreen.styles';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { selectIsAnonymous, setUserPhotoURL } from '../../../store/slices/authSlice';
import { useAuth } from '../../../providers/AuthProvider';
import { selectHasActiveSubscription } from '../../../store/slices/subscriptionSlice';
import ChangeAvatarDialog from '../../../components/account/ChangeAvatarDialog/ChangeAvatarDialog';
import UserAvatar from '../../../components/account/UserAvatar/UserAvatar';
import { RatingPrompt } from '../../../components/common/RatingPrompt';
import { avatarService, AvatarServiceError } from '../../../services/AvatarService';
import DeviceInfo from 'react-native-device-info';
import { recordPromptShown } from '../../../store/slices/ratingSlice';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type MenuItem = {
  key: string;
  icon: string;
  label: string;
  description?: string;
  onPress: () => void;
};

type MenuSection = {
  key: string;
  title: string;
  items: MenuItem[];
};

const AccountScreen = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const isAnonymous = useAppSelector(selectIsAnonymous);
  const authState = useAppSelector(state => state.auth);
  const hasSubscription = useAppSelector(selectHasActiveSubscription);
  const { signOut } = useAuth();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [avatarDialogVisible, setAvatarDialogVisible] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = React.useState<number | undefined>(undefined);
  const [showRatingPrompt, setShowRatingPrompt] = React.useState(false);

  const handleManualRate = React.useCallback(() => {
    dispatch(recordPromptShown());
    setShowRatingPrompt(true);
  }, [dispatch]);

  const menuSections: MenuSection[] = React.useMemo(() => {
    const accountItems: MenuItem[] = [
      ...(!isAnonymous
        ? [
            {
              key: 'profile',
              icon: 'account-circle',
              label: t('account.menu.profile'),
              description: t('account.menuDescriptions.profile', {
                defaultValue: 'Name, email and account details',
              }),
              onPress: () => navigation.navigate(ROUTES.PROFILE_INFO),
            },
          ]
        : []),
      {
        key: 'settings',
        icon: 'cog',
        label: t('account.menu.settings'),
        description: t('account.menuDescriptions.settings', { defaultValue: 'Language, theme and data management' }),
        onPress: () => navigation.navigate(ROUTES.SETTINGS),
      },
    ];

    const supportItems: MenuItem[] = [
      {
        key: 'giveFeedback',
        icon: 'message-alert-outline',
        label: t('account.help.giveFeedback', { defaultValue: 'Give Feedback' }),
        description: t('account.help.giveFeedbackDescription', {
          defaultValue: 'Share feature requests or ideas to improve the app.',
        }),
        onPress: () => navigation.navigate(ROUTES.SUPPORT_REQUEST, { kind: 'feedback' }),
      },
      {
        key: 'help',
        icon: 'help-circle-outline',
        label: t('account.menu.help'),
        description: t('account.menuDescriptions.help', { defaultValue: 'FAQs and contact options' }),
        onPress: () => navigation.navigate(ROUTES.HELP),
      },
    ];

    const aboutItems: MenuItem[] = [
      {
        key: 'rateUs',
        icon: 'star-outline',
        label: t('settings.rateUs', 'Rate Us'),
        description: t('account.menuDescriptions.rateUs', { defaultValue: 'Leave a review on the store' }),
        onPress: handleManualRate,
      },
      {
        key: 'privacy',
        icon: 'shield-outline',
        label: t('account.menu.privacy'),
        description: t('account.menuDescriptions.privacy', { defaultValue: 'Read how we handle your data' }),
        onPress: () => navigation.navigate(ROUTES.PRIVACY),
      },
    ];

    return [
      {
        key: 'account',
        title: t('account.sections.account', { defaultValue: 'Account' }),
        items: accountItems,
      },
      {
        key: 'support',
        title: t('account.sections.support', { defaultValue: 'Support' }),
        items: supportItems,
      },
      {
        key: 'about',
        title: t('account.sections.about', { defaultValue: 'About' }),
        items: aboutItems,
      },
    ].filter(section => section.items.length > 0);
  }, [handleManualRate, isAnonymous, navigation, t]);

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity style={styles.sectionItem} activeOpacity={0.9} onPress={item.onPress}>
      <View style={styles.menuIcon}>
        <Icon name={item.icon as any} size={22} color={theme.colors.primary} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        {!!item.description && <Text style={styles.menuDescription}>{item.description}</Text>}
      </View>
      <Icon name="chevron-right" size={20} color={theme.colors.onSurface} />
    </TouchableOpacity>
  );

  const handleAuthAction = async () => {
    if (!isAnonymous) {
      // Show logout warning before signing out
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
              navigation.goBack();
            }
          }
        ]
      );
      return;
    }
    navigation.navigate(ROUTES.LOGIN);
  };

  const handleAvatarPress = () => {
    if (isAnonymous) {
      Alert.alert(
        t('account.avatar.signInRequiredTitle'),
        t('account.avatar.signInRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('account.signIn'),
            onPress: () => navigation.navigate(ROUTES.LOGIN),
          },
        ]
      );
      return;
    }
    setAvatarDialogVisible(true);
  };

  const handleAvatarUpdate = async (source: 'library' | 'camera') => {
    if (avatarUploading) return;

    setAvatarUploading(true);
    setAvatarUploadProgress(0);
    try {
      const result =
        source === 'library'
          ? await avatarService.updateAvatarFromLibrary({ onProgress: setAvatarUploadProgress })
          : await avatarService.updateAvatarFromCamera({ onProgress: setAvatarUploadProgress });

      if (result.status === 'success') {
        dispatch(setUserPhotoURL(result.photoURL));
        setAvatarDialogVisible(false);
      }
    } catch (error) {
      const message =
        error instanceof AvatarServiceError && error.code === 'not_authenticated'
          ? t('account.avatar.signInRequiredMessage')
          : t('account.avatar.uploadError');
      Alert.alert(t('common.error'), message);
    } finally {
      setAvatarUploading(false);
      setAvatarUploadProgress(undefined);
    }
  };

  const handleAvatarRemove = () => {
    Alert.alert(
      t('account.avatar.removeConfirmTitle'),
      t('account.avatar.removeConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            if (avatarUploading) return;
            setAvatarUploading(true);
            setAvatarUploadProgress(undefined);
            try {
              await avatarService.removeAvatar();
              dispatch(setUserPhotoURL(null));
              setAvatarDialogVisible(false);
            } catch {
              Alert.alert(t('common.error'), t('account.avatar.removeError'));
            } finally {
              setAvatarUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <UserAvatar
            uri={authState.photoURL}
            size={64}
            shape="rounded"
            onPress={handleAvatarPress}
            disabled={avatarUploading}
            accessibilityLabel={t('account.avatar.changeTitle')}
            showEditBadge={!isAnonymous}
            containerStyle={styles.avatarWrapper}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{authState?.displayName || t('account.guestName')}</Text>
            <Text style={styles.profileEmail}>{authState?.email || t('account.notSignedIn')}</Text>
          </View>
        </View>

        <View style={styles.menuList}>
          {menuSections.map(section => (
            <View key={section.key} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionList}>
                {section.items.map((item, index) => (
                  <React.Fragment key={item.key}>
                    {renderMenuItem(item)}
                    {index < section.items.length - 1 && <View style={styles.sectionDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.9} onPress={handleAuthAction}>
          <Icon name={!isAnonymous ? 'logout' : 'login'} size={20} color={theme.colors.primary} />
          <Text style={styles.logoutText}>{!isAnonymous ? t('account.logout') : t('account.signIn')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>
            {t('account.versionLabel', { defaultValue: 'Version' })} {DeviceInfo.getVersion()}
          </Text>
        </View>
      </ScrollView>

      <ChangeAvatarDialog
        visible={avatarDialogVisible}
        uploading={avatarUploading}
        uploadProgress={avatarUploadProgress}
        canRemove={Boolean(authState.photoURL)}
        onDismiss={() => setAvatarDialogVisible(false)}
        onChooseFromLibrary={() => handleAvatarUpdate('library')}
        onTakePhoto={() => handleAvatarUpdate('camera')}
        onRemovePhoto={handleAvatarRemove}
      />

      <RatingPrompt visible={showRatingPrompt} onDismiss={() => setShowRatingPrompt(false)} source="manual" />
    </SafeAreaView>
  );
};

export default AccountScreen;
