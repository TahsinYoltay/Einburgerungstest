import React, { useMemo, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, Dialog, Portal, TextInput } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectAuthState, selectIsAnonymous, setUserDisplayName } from '../../../store/slices/authSlice';
import { selectSubscriptionState } from '../../../store/slices/subscriptionSlice';
import { createStyles } from './ProfileInfoScreen.styles';
import { userProfileService } from '../../../services/UserProfileService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ProfileInfoScreen = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const auth = useAppSelector(selectAuthState);
  const isAnonymous = useAppSelector(selectIsAnonymous);
  const subscriptionState = useAppSelector(selectSubscriptionState);

  const handleClose = () => navigation.popToTop();
  const handleGoLogin = () => navigation.navigate(ROUTES.LOGIN);

  const [editVisible, setEditVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState(auth.displayName || '');
  const [saving, setSaving] = useState(false);

  const openEdit = useCallback(() => {
    setNameDraft(auth.displayName || '');
    setEditVisible(true);
  }, [auth.displayName]);

  const handleSaveName = useCallback(async () => {
    if (saving) return;
    if (isAnonymous) return;

    setSaving(true);
    try {
      const result = await userProfileService.updateCurrentUserProfile({
        displayName: nameDraft,
      });
      dispatch(setUserDisplayName(result.displayName));
      Alert.alert(
        t('common.success', { defaultValue: 'Success' }),
        t('account.profile.updateSuccess', { defaultValue: 'Your profile has been updated.' })
      );
      setEditVisible(false);
    } catch (error) {
      console.warn('ProfileInfoScreen: failed to update profile', error);
      Alert.alert(
        t('common.error', { defaultValue: 'Error' }),
        t('account.profile.updateError', { defaultValue: 'Unable to update your profile right now.' })
      );
    } finally {
      setSaving(false);
    }
  }, [dispatch, isAnonymous, nameDraft, saving, t]);

  const planLabel = useMemo(() => {
    if (subscriptionState.status === 'active') {
      if (subscriptionState.renewalType === 'non-renewing') {
        return t('account.profile.planPremiumLifetime', { defaultValue: 'Premium (Lifetime)' });
      }
      if (subscriptionState.renewalType === 'auto-renewing') {
        return t('account.profile.planPremiumMonthly', { defaultValue: 'Premium (Monthly)' });
      }
      return t('account.profile.planPremium', { defaultValue: 'Premium' });
    }

    if (subscriptionState.status === 'loading') {
      return t('account.profile.planLoading', { defaultValue: 'Checking…' });
    }

    return t('account.profile.planFree', { defaultValue: 'Free' });
  }, [subscriptionState.status, subscriptionState.renewalType, t]);

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
                defaultValue: 'Log in to see your email and subscription details.',
              })}
            </Text>
            <View style={styles.buttonRow}>
              <Button mode="contained" onPress={handleGoLogin}>
                {t('account.signIn')}
              </Button>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{t('account.profile.signedInStatus', { defaultValue: 'Signed in' })}</Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {t('account.profile.sections.profile', { defaultValue: 'Profile' })}
              </Text>

              <View style={styles.rowWithAction}>
                <View style={styles.rowWithActionMain}>
                  <Text style={styles.rowLabel}>{t('account.profile.name', { defaultValue: 'Name' })}</Text>
                  <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
                    {auth.displayName || t('account.profile.noName', { defaultValue: 'Not set' })}
                  </Text>
                </View>
                <TouchableOpacity onPress={openEdit} style={styles.editChip} disabled={saving}>
                  <Text style={styles.editChipText}>{t('account.profile.edit', { defaultValue: 'Edit' })}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {t('account.profile.sections.account', { defaultValue: 'Account' })}
              </Text>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('account.profile.email', { defaultValue: 'Email' })}</Text>
                <Text style={styles.rowValue}>{auth.email || t('account.profile.noEmail', { defaultValue: 'Not set' })}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('account.profile.plan', { defaultValue: 'Plan' })}</Text>
                <Text style={styles.rowValue}>{planLabel}</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {t('account.profile.sections.identifiers', { defaultValue: 'Identifiers' })}
              </Text>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('account.profile.userId', { defaultValue: 'User ID' })}</Text>
                <Text style={styles.rowValue}>{auth.firebaseUid || t('account.profile.noUid', { defaultValue: 'Not available' })}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Portal>
        {editVisible ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.dialogKeyboardAvoidingView}
          >
            <Dialog visible={editVisible} onDismiss={() => setEditVisible(false)} style={styles.dialog}>
              <Dialog.Title style={styles.dialogTitle}>
                {t('account.profile.editTitle', { defaultValue: 'Edit profile' })}
              </Dialog.Title>
              <Dialog.Content style={styles.dialogContent}>
                <TextInput
                  label={t('account.profile.name', { defaultValue: 'Name' })}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  autoCapitalize="words"
                  autoFocus
                  mode="outlined"
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  selectionColor={theme.colors.primary}
                  style={styles.dialogInput}
                  outlineStyle={styles.dialogInputOutline}
                  editable={!saving}
                />
              </Dialog.Content>
              <Dialog.Actions style={styles.dialogActions}>
                <Button
                  mode="outlined"
                  onPress={() => setEditVisible(false)}
                  disabled={saving}
                  style={styles.dialogActionButton}
                >
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveName}
                  loading={saving}
                  disabled={saving}
                  style={styles.dialogActionButton}
                >
                  {t('common.save', { defaultValue: 'Save' })}
                </Button>
              </Dialog.Actions>
            </Dialog>
          </KeyboardAvoidingView>
        ) : null}
      </Portal>
    </SafeAreaView>
  );
};

export default ProfileInfoScreen;
