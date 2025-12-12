import React from 'react';
import { View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { createStyles } from './AccountScreen.style';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { selectIsAnonymous, setUserPhotoURL } from '../../../store/slices/authSlice';
import { useAuth } from '../../../providers/AuthProvider';
import { selectHasActiveSubscription } from '../../../store/slices/subscriptionSlice';
import ChangeAvatarDialog from '../../../components/account/ChangeAvatarDialog/ChangeAvatarDialog';
import UserAvatar from '../../../components/account/UserAvatar/UserAvatar';
import { avatarService, AvatarServiceError } from '../../../services/AvatarService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

  const menuItems = [
    {
      key: 'profile',
      icon: 'account-circle',
      label: t('account.menu.profile'),
      onPress: () => navigation.navigate(ROUTES.PROFILE_INFO),
    },
    {
      key: 'settings',
      icon: 'cog',
      label: t('account.menu.settings'),
      onPress: () => navigation.navigate(ROUTES.SETTINGS),
    },
    {
      key: 'help',
      icon: 'help-circle-outline',
      label: t('account.menu.help'),
      onPress: () => navigation.navigate(ROUTES.HELP),
    },
    {
      key: 'privacy',
      icon: 'shield-outline',
      label: t('account.menu.privacy'),
      onPress: () => navigation.navigate(ROUTES.PRIVACY),
    },
  ];

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
          {menuItems.map(item => (
            <TouchableOpacity key={item.key} style={styles.menuItem} activeOpacity={0.9} onPress={item.onPress}>
              <View style={styles.menuIcon}>
                <Icon name={item.icon as any} size={22} color={theme.colors.onBackground} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Icon name="chevron-right" size={20} color={theme.colors.onSurface} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.9} onPress={handleAuthAction}>
          <Icon name={!isAnonymous ? 'logout' : 'login'} size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>{!isAnonymous ? t('account.logout') : t('account.signIn')}</Text>
        </TouchableOpacity>
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
    </SafeAreaView>
  );
};

export default AccountScreen;
