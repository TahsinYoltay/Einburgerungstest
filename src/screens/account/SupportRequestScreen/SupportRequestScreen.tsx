import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { Button, Chip, Switch, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import DeviceInfo from 'react-native-device-info';

import { createStyles } from './SupportRequestScreen.styles';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { APP_CONFIG } from '../../../config/appConfig';
import { useAppSelector } from '../../../store/hooks';
import { submitSupportTicket, SupportTicketKind } from '../../../services/SupportTicketService';

type SupportRequestRouteProp = RouteProp<RootStackParamList, typeof ROUTES.SUPPORT_REQUEST>;

type CategoryOption = {
  key: string;
  labelKey: string;
  defaultLabel: string;
};

const SupportRequestScreen = () => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SupportRequestRouteProp>();
  const { t, i18n } = useTranslation();

  const authState = useAppSelector(state => state.auth);
  const isAnonymous = authState.status === 'anonymous';

  const kind: SupportTicketKind = route.params?.kind ?? 'feedback';
  const initialCategoryParam = route.params?.initialCategory;
  const initialSubjectParam = route.params?.initialSubject;
  const initialMessageParam = route.params?.initialMessage;

  const title =
    kind === 'bug'
      ? t('supportForm.bugTitle', { defaultValue: 'Report a Bug' })
      : t('supportForm.feedbackTitle', { defaultValue: 'Give Feedback' });
  const subtitle =
    kind === 'bug'
      ? t('supportForm.bugSubtitle', {
          defaultValue: 'Help us fix issues faster by describing what happened.',
        })
      : t('supportForm.feedbackSubtitle', {
          defaultValue: 'Tell us what you’d like to improve or add next.',
        });
  const iconName = kind === 'bug' ? 'bug-outline' : 'message-alert-outline';

  const categoryOptions: CategoryOption[] = useMemo(() => {
    if (kind === 'bug') {
      return [
        { key: 'crash', labelKey: 'supportForm.category.crash', defaultLabel: 'Crash' },
        { key: 'performance', labelKey: 'supportForm.category.performance', defaultLabel: 'Performance' },
        { key: 'content', labelKey: 'supportForm.category.content', defaultLabel: 'Content' },
        { key: 'billing', labelKey: 'supportForm.category.billing', defaultLabel: 'Billing' },
        { key: 'account', labelKey: 'supportForm.category.account', defaultLabel: 'Account' },
        { key: 'other', labelKey: 'supportForm.category.other', defaultLabel: 'Other' },
      ];
    }

    return [
      { key: 'feature_request', labelKey: 'supportForm.category.featureRequest', defaultLabel: 'Feature request' },
      { key: 'ui_ux', labelKey: 'supportForm.category.uiUx', defaultLabel: 'UI/UX' },
      { key: 'content', labelKey: 'supportForm.category.content', defaultLabel: 'Content' },
      { key: 'billing', labelKey: 'supportForm.category.billing', defaultLabel: 'Billing' },
      { key: 'other', labelKey: 'supportForm.category.other', defaultLabel: 'Other' },
    ];
  }, [kind]);

  const defaultCategory = categoryOptions[0]?.key ?? 'other';

  const [category, setCategory] = useState<string>(initialCategoryParam && categoryOptions.find(c => c.key === initialCategoryParam) ? initialCategoryParam : defaultCategory);
  const [subject, setSubject] = useState(initialSubjectParam || '');
  const [message, setMessage] = useState(initialMessageParam || '');
  const [contactEmail, setContactEmail] = useState(authState.email || '');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [alsoEmailSupport, setAlsoEmailSupport] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => navigation.popToTop();
  const handleBack = () => navigation.goBack();

  const openSupportEmail = async (options: { ticketId?: string }) => {
    const ticketId = options.ticketId ?? 'N/A';
    const subjectPrefix =
      kind === 'bug'
        ? t('supportForm.emailSubjectBug', { defaultValue: 'Bug report' })
        : t('supportForm.emailSubjectFeedback', { defaultValue: 'Feedback' });

    const emailSubject = `[LifeInTheUK] ${subjectPrefix}: ${subject} (Ticket ${ticketId})`;

    const appVersion = DeviceInfo.getReadableVersion();
    const osVersion = DeviceInfo.getSystemVersion();
    const deviceModel = DeviceInfo.getModel();

    const bodyLines: string[] = [
      `Ticket ID: ${ticketId}`,
      `Type: ${kind}`,
      `Category: ${category}`,
      `App version: ${appVersion}`,
      `Device: ${deviceModel}`,
      `OS: ${Platform.OS} ${osVersion}`,
      `App language: ${i18n.language}`,
      contactEmail ? `Contact email: ${contactEmail}` : '',
      '',
      `Subject: ${subject}`,
      '',
      'Message:',
      message,
      '',
    ];

    bodyLines.push(
      '—',
      'Note: Diagnostics are stored securely in Firestore (supportTickets).'
    );

    const mailto = `mailto:${APP_CONFIG.SUPPORT_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyLines.filter(Boolean).join('\n'))}`;

    try {
      const canOpen = await Linking.canOpenURL(mailto);
      if (canOpen) {
        await Linking.openURL(mailto);
      } else {
        Alert.alert(
          t('common.error'),
          t('supportForm.unableToOpenEmail', { defaultValue: 'Unable to open an email client on this device.' })
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const validate = () => {
    if (!subject.trim()) {
      Alert.alert(
        t('common.error'),
        t('supportForm.validationSubject', { defaultValue: 'Please enter a short subject.' })
      );
      return false;
    }
    if (!message.trim()) {
      Alert.alert(
        t('common.error'),
        t('supportForm.validationMessage', { defaultValue: 'Please enter the details.' })
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await submitSupportTicket({
        kind,
        category,
        subject: subject.trim(),
        message: message.trim(),
        contactEmail: contactEmail.trim() || undefined,
        includeDiagnostics,
        appLanguage: i18n.language,
        user: {
          uid: authState.firebaseUid,
          email: authState.email,
          isAnonymous,
          authProvider: authState.authProvider,
        },
      });

      Alert.alert(
        t('common.success'),
        result.supportEmailQueued
          ? t('supportForm.successMessageNotified', {
              defaultValue: 'Thanks! Your message has been saved and support has been notified. Ticket ID: {{id}}',
              id: result.ticketId,
            })
          : t('supportForm.successMessageNoNotify', {
              defaultValue:
                'Thanks! Your message has been saved, but we could not notify support automatically. Ticket ID: {{id}}',
              id: result.ticketId,
            }),
        [
          ...((alsoEmailSupport || !result.supportEmailQueued)
            ? [
                {
                  text: t('supportForm.emailSupport', { defaultValue: 'Email support' }),
                  onPress: () => openSupportEmail({ ticketId: result.ticketId }),
                },
              ]
            : []),
          {
            text: t('common.close'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('[SupportRequestScreen] Submit support ticket error:', error);
      const errorCode = typeof error?.code === 'string' ? error.code : '';
      const errorMessage = errorCode.includes('permission-denied') || errorCode.includes('unauthenticated')
        ? t('supportForm.submitErrorAuth', {
            defaultValue: 'Unable to send right now. Please restart the app and try again.',
          })
        : errorCode.includes('unavailable') || errorCode.includes('network')
          ? t('supportForm.submitErrorNetwork', {
              defaultValue: 'Unable to connect right now. Please check your internet connection and try again.',
            })
          : t('supportForm.submitError', { defaultValue: 'Unable to send right now. Please try again.' });

      Alert.alert(
        t('common.error'),
        errorMessage,
        [
          {
            text: t('supportForm.emailSupport', { defaultValue: 'Email support' }),
            onPress: () => openSupportEmail({}),
          },
          { text: t('common.ok') },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <Icon name="close" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name={iconName as any} size={26} color={theme.colors.primary} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('supportForm.categoryTitle', { defaultValue: 'Category' })}</Text>
          <View style={styles.chipRow}>
            {categoryOptions.map(option => {
              const selected = category === option.key;
              return (
                <Chip
                  key={option.key}
                  selected={selected}
                  showSelectedCheck={false}
                  onPress={() => setCategory(option.key)}
                  style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
                  textStyle={selected ? styles.chipTextSelected : styles.chipText}
                >
                  {t(option.labelKey, { defaultValue: option.defaultLabel })}
                </Chip>
              );
            })}
          </View>

          <TextInput
            mode="outlined"
            label={t('supportForm.subject', { defaultValue: 'Subject' })}
            value={subject}
            onChangeText={setSubject}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label={t('supportForm.message', { defaultValue: 'Message' })}
            value={message}
            onChangeText={setMessage}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            style={styles.input}
            multiline
            numberOfLines={6}
            scrollEnabled={false}
            textAlignVertical="top"
          />

          <TextInput
            mode="outlined"
            label={t('supportForm.contactEmail', { defaultValue: 'Email (optional)' })}
            value={contactEmail}
            onChangeText={setContactEmail}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>
                {t('supportForm.includeDiagnostics', { defaultValue: 'Include diagnostics' })}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {t('supportForm.includeDiagnosticsDesc', {
                  defaultValue: 'App version and device info help us reproduce the issue.',
                })}
              </Text>
            </View>
            <Switch value={includeDiagnostics} onValueChange={setIncludeDiagnostics} />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>
                {t('supportForm.alsoEmailSupport', { defaultValue: 'Email support' })}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {t('supportForm.alsoEmailSupportDesc', {
                  defaultValue: 'We’ll open your email app so you can send a copy to support.',
                })}
              </Text>
            </View>
            <Switch value={alsoEmailSupport} onValueChange={setAlsoEmailSupport} />
          </View>

          <Text style={styles.dangerNote}>
            {t('supportForm.privacyNote', {
              defaultValue: 'Please don’t include passwords or sensitive personal information.',
            })}
          </Text>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={styles.submitButton}
          >
            {kind === 'bug'
              ? t('supportForm.submitBug', { defaultValue: 'Report bug' })
              : t('supportForm.submitFeedback', { defaultValue: 'Send feedback' })}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SupportRequestScreen;
