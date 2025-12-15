import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './BillingSupportScreen.styles';
import { ROUTES } from '../../../constants/routes';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { APP_CONFIG } from '../../../config/appConfig';
import { purchaseService } from '../../../services/PurchaseService';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSubscriptionActive, setSubscriptionNone } from '../../../store/slices/subscriptionSlice';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BillingSupportScreen = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const subscriptionState = useAppSelector(state => state.subscription);
  const [restoring, setRestoring] = useState(false);

  const isIOS = Platform.OS === 'ios';

  const manageUrl = isIOS
    ? 'https://apps.apple.com/account/subscriptions'
    : `https://play.google.com/store/account/subscriptions?package=${APP_CONFIG.ANDROID_PACKAGE_NAME}`;

  const handleManageSubscription = async () => {
    try {
      const canOpen = await Linking.canOpenURL(manageUrl);
      if (canOpen) {
        await Linking.openURL(manageUrl);
      } else {
        Alert.alert(t('common.error'), t('billing.manageOpenError', { defaultValue: 'Unable to open subscriptions page.' }));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('billing.manageOpenError', { defaultValue: 'Unable to open subscriptions page.' }));
    }
  };

  const handleRestorePurchases = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      await purchaseService.restorePurchases();
      const result = await purchaseService.fetchAndUpdateEntitlements();
      if (result.status === 'active') {
        dispatch(setSubscriptionActive({
          productId: result.productId!,
          renewalType: result.renewalType!,
          expiresAt: result.expiresAt,
        }));
        Alert.alert(t('common.success'), t('settings.restoreSuccess', { defaultValue: 'Purchases restored successfully!' }));
      } else {
        dispatch(setSubscriptionNone());
        Alert.alert(t('common.info', { defaultValue: 'Info' }), t('subscription.noPurchasesToRestore'));
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('settings.restoreError', { defaultValue: 'Failed to restore purchases.' }));
    } finally {
      setRestoring(false);
    }
  };

  const handleContactSupport = () => {
    navigation.navigate(ROUTES.SUPPORT_REQUEST, {
      kind: 'bug',
      initialCategory: 'billing',
      initialSubject: t('billing.defaultSubject', { defaultValue: 'Billing / subscription issue' }),
      initialMessage: '',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('billing.title', { defaultValue: 'Billing & Subscriptions' })}</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {t('billing.subtitle', { defaultValue: 'Manage your subscription or fix purchase issues.' })}
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="credit-card-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>{t('billing.manageTitle', { defaultValue: 'Manage subscription' })}</Text>
          </View>
          <Text style={styles.cardBody}>
            {isIOS
              ? t('billing.manageSubtitleIos', { defaultValue: 'View or cancel your App Store subscription.' })
              : t('billing.manageSubtitleAndroid', { defaultValue: 'View or cancel your Google Play subscription.' })}
          </Text>
          <Button mode="contained" onPress={handleManageSubscription} style={styles.button}>
            {isIOS
              ? t('billing.manageOnStore', { defaultValue: 'Open App Store subscriptions' })
              : t('billing.manageOnPlay', { defaultValue: 'Open Google Play subscriptions' })}
          </Button>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="history" size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>{t('billing.restoreTitle', { defaultValue: 'Restore purchases' })}</Text>
          </View>
          <Text style={styles.cardBody}>
            {t('billing.restoreSubtitle', { defaultValue: 'Already paid but not unlocked? Restore your purchases.' })}
          </Text>
          <Button mode="outlined" onPress={handleRestorePurchases} loading={restoring} disabled={restoring} style={styles.button}>
            {t('settings.restore', { defaultValue: 'Restore' })}
          </Button>
          {subscriptionState.status === 'active' && (
            <Text style={styles.statusText}>
              {t('billing.activeStatus', { defaultValue: 'Current status: Active' })}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="lifebuoy" size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>{t('billing.contactTitle', { defaultValue: 'Still need help?' })}</Text>
          </View>
          <Text style={styles.cardBody}>
            {t('billing.contactSubtitle', { defaultValue: 'Tell us about billing or purchase issues.' })}
          </Text>
          <Button mode="contained-tonal" onPress={handleContactSupport} style={styles.button}>
            {t('billing.contactButton', { defaultValue: 'Contact support' })}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BillingSupportScreen;
