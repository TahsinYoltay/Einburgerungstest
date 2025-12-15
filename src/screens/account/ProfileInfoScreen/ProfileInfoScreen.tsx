import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppSelector } from '../../../store/hooks';
import { selectAuthState, selectIsAnonymous } from '../../../store/slices/authSlice';
import { createStyles } from './ProfileInfoScreen.styles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ProfileInfoScreen = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();

  const auth = useAppSelector(selectAuthState);
  const isAnonymous = useAppSelector(selectIsAnonymous);

  const handleClose = () => navigation.popToTop();
  const handleGoLogin = () => navigation.navigate(ROUTES.LOGIN);

  const providerLabel =
    auth.authProvider === 'google'
      ? 'Google'
      : auth.authProvider === 'email'
      ? t('account.profile.emailProvider', { defaultValue: 'Email' })
      : t('account.profile.unknownProvider', { defaultValue: 'Unknown' });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account.menu.profile')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <Icon name="close" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isAnonymous ? (
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>{t('account.profile.signInRequiredTitle', { defaultValue: 'Sign in to view profile info' })}</Text>
            <Text style={styles.ctaDesc}>
              {t('account.profile.signInRequiredDesc', {
                defaultValue: 'Log in to see your email, provider, and account details.',
              })}
            </Text>
            <View style={styles.buttonRow}>
              <Button mode="contained" onPress={handleGoLogin}>
                {t('account.signIn')}
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{t('account.profile.signedInStatus', { defaultValue: 'Signed in' })}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('account.profile.name', { defaultValue: 'Name' })}</Text>
              <Text style={styles.rowValue}>{auth.displayName || t('account.profile.noName', { defaultValue: 'Not set' })}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('account.profile.email', { defaultValue: 'Email' })}</Text>
              <Text style={styles.rowValue}>{auth.email || t('account.profile.noEmail', { defaultValue: 'Not set' })}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('account.profile.provider', { defaultValue: 'Provider' })}</Text>
              <Text style={styles.rowValue}>{providerLabel}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('account.profile.userId', { defaultValue: 'User ID' })}</Text>
              <Text style={styles.rowValue}>{auth.firebaseUid || t('account.profile.noUid', { defaultValue: 'Not available' })}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileInfoScreen;
