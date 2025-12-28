import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ScrollView, Linking, Alert, Modal as RNModal, Platform } from 'react-native';
import { Text, Button, Card, ActivityIndicator, IconButton } from 'react-native-paper';
import { PurchasesPackage } from 'react-native-purchases';
import { purchaseService } from '../../services/PurchaseService';
import { useAppTheme } from '../../providers/ThemeProvider';
import { createStyles } from './PaywallModal.styles';
import { APP_CONFIG } from '../../config/appConfig';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSubscriptionActive, setSubscriptionNone } from '../../store/slices/subscriptionSlice';
import { selectIsAnonymous } from '../../store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../constants/routes';

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
  onPurchaseSuccess?: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onDismiss, onPurchaseSuccess }) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  // State selectors
  const isAnonymous = useAppSelector(selectIsAnonymous);
  
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);

  const loadOfferings = useCallback(async () => {
    setLoading(true);
    setOfferingsError(null);
    try {
      const offering = await purchaseService.getOfferings();

      const availablePackages = offering?.availablePackages ?? [];
      setPackages(availablePackages);

      if (availablePackages.length > 0) {
        setSelectedPackageId(availablePackages[0].identifier);
      } else {
        setSelectedPackageId(null);
        setOfferingsError(
          Platform.OS === 'android'
            ? t('paywall.offeringsUnavailableAndroid')
            : t('paywall.offeringsUnavailable')
        );
      }
    } catch (error) {
      console.error('[PaywallModal] Failed to load offerings:', error);
      setPackages([]);
      setSelectedPackageId(null);
      setOfferingsError(
        Platform.OS === 'android'
          ? t('paywall.offeringsUnavailableAndroid')
          : t('paywall.offeringsUnavailable')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!visible) return;
    void loadOfferings();
  }, [loadOfferings, visible]);

  const handlePurchase = async (pack: PurchasesPackage) => {
    setPurchasing(true);
    console.log('[PaywallModal] Starting purchase for:', pack.identifier);
    const success = await purchaseService.purchasePackage(pack);
    console.log('[PaywallModal] Purchase result:', success);
    setPurchasing(false);
    
    if (success) {
      console.log('[PaywallModal] Purchase successful, updating subscription state');
      
      // Fetch and update subscription state
      try {
        const subscriptionState = await purchaseService.fetchAndUpdateEntitlements();
        
        if (subscriptionState.status === 'active') {
          dispatch(setSubscriptionActive({
            productId: subscriptionState.productId!,
            renewalType: subscriptionState.renewalType!,
            expiresAt: subscriptionState.expiresAt,
          }));
        } else {
          dispatch(setSubscriptionNone());
        }
      } catch (error) {
        console.error('[PaywallModal] Error updating subscription state:', error);
      }
      
      onPurchaseSuccess?.();
      onDismiss();
      
      // Show account creation prompt if anonymous
      if (isAnonymous) {
        setTimeout(() => {
          Alert.alert(
            t('auth.accountCreationPromptTitle', { defaultValue: 'Protect Your Purchase' }),
            t('auth.accountCreationPromptMessage', { 
              defaultValue: 'Create a free account to keep your subscription safe across all your devices and access it anytime.' 
            }),
            [
              { 
                text: t('common.notNow', { defaultValue: 'Not Now' }), 
                style: 'cancel' 
              },
              { 
                text: t('auth.createAccount', { defaultValue: 'Create Account' }), 
                onPress: () => navigation.navigate(ROUTES.REGISTER)
              }
            ]
          );
        }, 1000);
      }
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const success = await purchaseService.restorePurchases();
    setPurchasing(false);
    
    if (success) {
      console.log('[PaywallModal] Purchases restored, updating subscription state');
      
      // Fetch and update subscription state
      try {
        const subscriptionState = await purchaseService.fetchAndUpdateEntitlements();
        
        if (subscriptionState.status === 'active') {
          dispatch(setSubscriptionActive({
            productId: subscriptionState.productId!,
            renewalType: subscriptionState.renewalType!,
            expiresAt: subscriptionState.expiresAt,
          }));
        } else {
          dispatch(setSubscriptionNone());
        }
      } catch (error) {
        console.error('[PaywallModal] Error updating subscription state:', error);
      }
      
      onPurchaseSuccess?.();
      onDismiss();
      
      // Show account creation prompt if anonymous
      if (isAnonymous) {
        setTimeout(() => {
          Alert.alert(
            t('auth.accountCreationPromptTitle', { defaultValue: 'Protect Your Purchase' }),
            t('auth.restorePromptMessage', { 
              defaultValue: 'Your purchases have been restored! Create a free account so you don\'t need to restore manually next time.' 
            }),
            [
              { 
                text: t('common.notNow', { defaultValue: 'Not Now' }), 
                style: 'cancel' 
              },
              { 
                text: t('auth.createAccount', { defaultValue: 'Create Account' }), 
                onPress: () => navigation.navigate(ROUTES.REGISTER)
              }
            ]
          );
        }, 1000);
      }
    } else {
      // No purchases found to restore
      console.log('[PaywallModal] No purchases found to restore');
      Alert.alert(
        t('common.info', { defaultValue: 'No Purchases Found' }),
        t('subscription.noPurchasesToRestore', { 
          defaultValue: 'We couldn\'t find any active purchases for this store account. If you believe this is an error, please contact support.' 
        }),
        [{ text: t('common.ok', { defaultValue: 'OK' }) }]
      );
    }
  };

  const handleSelectPackage = (pack: PurchasesPackage) => {
    setSelectedPackageId(pack.identifier);
  };

  const featureItems = useMemo(() => ([
    { icon: 'infinity', label: t('paywall.featureUnlimited', 'Unlimited Practice Exams') },
    { icon: 'shield-check', label: t('paywall.featureAdFree', 'Ad-Free Experience') },
    { icon: 'cloud-download', label: t('paywall.featureOffline', 'Offline Access') },
  ]), [t]);

  const handleContinue = () => {
    if (!packages.length) return;
    const chosen = packages.find((p) => p.identifier === selectedPackageId) ?? packages[0];
    handlePurchase(chosen);
  };

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <View style={styles.container}>
          <ScrollView 
            contentContainerStyle={[styles.scrollContent, styles.scrollContentGrow]} 
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEnabled
            overScrollMode="never"
          >
            <View style={styles.headerSection}>
              <IconButton 
                icon="close" 
                onPress={onDismiss} 
                style={styles.closeButton}
                iconColor={theme.colors.onSurface}
                size={20}
              />
              <Text style={styles.title}>
                {t('paywall.title', 'Premium Access')}
              </Text>
              <Text style={styles.subtitle}>
                {t('paywall.subtitle', 'Pass your Einbürgerungstest.')}
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              {featureItems.map((item) => (
                <View key={item.icon} style={styles.featureRow}>
                  <IconButton 
                    icon={item.icon} 
                    size={20} 
                    iconColor={theme.colors.primary}
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>{item.label}</Text>
                </View>
              ))}
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : offeringsError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>{t('paywall.offeringsUnavailableTitle')}</Text>
                <Text style={styles.emptyStateMessage}>{offeringsError}</Text>
                <Button
                  mode="outlined"
                  onPress={() => void loadOfferings()}
                  style={styles.emptyStateButton}
                  textColor={theme.colors.primary}
                >
                  {t('common.retry')}
                </Button>
              </View>
            ) : (
              <View style={styles.packagesContainer}>
                {packages.map((pack, index) => {
                  const isSelected = selectedPackageId ? pack.identifier === selectedPackageId : index === 0;
                  return (
                    <Card 
                      key={pack.identifier} 
                      style={[
                        styles.packageCard,
                        isSelected ? styles.packageCardPrimary : styles.packageCardSecondary
                      ]}
                      onPress={() => handleSelectPackage(pack)}
                      mode="outlined"
                    >
                      <View style={styles.packageContent}>
                        <View style={styles.packageTextContainer}>
                          <Text style={[
                            styles.packageTitle,
                            isSelected ? styles.primaryText : null
                          ]}>
                            {pack.product.title}
                          </Text>
                          <Text style={styles.packageDescription}>
                            {pack.product.description}
                          </Text>
                        </View>
                        <Text style={[
                          styles.packagePrice,
                          isSelected ? styles.primaryText : null
                        ]}>
                          {pack.product.priceString}
                        </Text>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}

            <Button 
              mode="contained" 
              onPress={handleContinue} 
              disabled={purchasing || loading || !packages.length}
              style={styles.continueButton}
              contentStyle={styles.continueContent}
              labelStyle={styles.continueLabel}
            >
              {t('common.continue', 'Continue')}
            </Button>

            <Button 
              mode="text" 
              onPress={handleRestore} 
              disabled={purchasing}
              textColor={theme.colors.primary}
              style={styles.restoreInlineButton}
              labelStyle={styles.restoreInlineLabel}
            >
              {t('paywall.restorePurchases', 'Restore Purchases')}
            </Button>

            <View style={styles.separator} />

            <View style={styles.renewalSection}>
              <Text style={styles.renewalText}>
                {t('paywall.disclaimer', 'Payment will be charged to your store Account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.')}
              </Text>
              
              <View style={styles.linksRow}>
                <Text 
                  style={styles.linkText}
                  onPress={() => Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL)}
                >
                  {t('common.privacyPolicy', 'Privacy Policy')}
                </Text>
                <Text style={styles.linkSeparator}>•</Text>
                <Text 
                  style={styles.linkText}
                  onPress={() => Linking.openURL(APP_CONFIG.TERMS_URL)}
                >
                  {t('common.termsOfUse', 'Terms of Use')}
                </Text>
              </View>
            </View>
          </ScrollView>

          {purchasing && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
};

export default PaywallModal;
