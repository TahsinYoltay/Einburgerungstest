import React from 'react';
import { View, TouchableOpacity, ScrollView, Image } from 'react-native';
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
import { logoutUser } from '../../../store/slices/userSlice';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AccountScreen = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const user = useAppSelector(state => state.user.user);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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

  const handleAuthAction = () => {
    if (user) {
      dispatch(logoutUser());
      navigation.goBack();
      return;
    }
    navigation.navigate(ROUTES.LOGIN);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user?.displayName || t('account.guestName')}</Text>
            <Text style={styles.profileEmail}>{user?.email || t('account.notSignedIn')}</Text>
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
          <Icon name={user ? 'logout' : 'login'} size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>{user ? t('account.logout') : t('account.login')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountScreen;
