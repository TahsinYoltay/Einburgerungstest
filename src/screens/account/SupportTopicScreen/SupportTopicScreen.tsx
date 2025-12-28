import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Text } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { supportTopics, SupportTopicKey, IconName } from '../../../constants/supportTopics';
import { createStyles } from './SupportTopicScreen.styles';
import { contentManager } from '../../../services/ContentManager';
import { HelpContentData, ContentBlock, SectionData } from '../../../types/content';
import { APP_CONFIG } from '../../../config/appConfig';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type SupportTopicRouteProp = RouteProp<RootStackParamList, typeof ROUTES.HELP_TOPIC>;

const SupportTopicScreen = () => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SupportTopicRouteProp>();
  const { t, i18n } = useTranslation();

  const [content, setContent] = useState<HelpContentData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => navigation.popToTop();
  const handleBack = () => navigation.goBack();
  const handleEmailPress = async () => {
    const mailto = `mailto:${APP_CONFIG.SUPPORT_EMAIL}`;
    try {
      const canOpen = await Linking.canOpenURL(mailto);
      if (canOpen) {
        await Linking.openURL(mailto);
      }
    } catch (error) {
      console.warn('Unable to open email client', error);
    }
  };

  const handleAccountSupportForm = () => {
    navigation.navigate(ROUTES.SUPPORT_REQUEST, {
      kind: 'bug',
      initialCategory: 'account',
      initialSubject: t('account.help.accountSupportSubject', { defaultValue: 'Account issue' }),
      initialMessage: t('account.help.accountSupportPrefill', {
        defaultValue: 'Describe your sign-in or account issue. Include the email you use (or want to use).',
      }),
    });
  };

  const handleAccountSupportEmail = async () => {
    const subject = `[Einburgerungstest] Account issue`;
    const mailto = `mailto:${APP_CONFIG.SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    try {
      const canOpen = await Linking.canOpenURL(mailto);
      if (canOpen) {
        await Linking.openURL(mailto);
      }
    } catch (error) {
      console.warn('Unable to open email client', error);
    }
  };

  const params = (route.params || {}) as Partial<{ topicKey: SupportTopicKey }>;
  const topicKey = params.topicKey;
  const isDynamicTopic = topicKey === 'exams' || topicKey === 'gettingStarted';
  const isAccountTopic = topicKey === 'accountIssues';

  useEffect(() => {
    if (isDynamicTopic) {
      const loadContent = async () => {
        setLoading(true);
        // Map topicKey to ContentManager topic
        const apiTopic = topicKey === 'gettingStarted' ? 'getting_started' : 'help';
        const data = await contentManager.getHelpSupport(i18n.language, apiTopic);
        setContent(data);
        setLoading(false);
      };
      loadContent();
    }
  }, [isDynamicTopic, topicKey, i18n.language]);

  const topic = supportTopics.find(item => item.key === topicKey);
  const title = topic
    ? t(topic.labelKey, { defaultValue: topic.defaultLabel })
    : t('account.help.topicFallbackTitle', { defaultValue: 'Support' });
  const iconName = (topic?.icon ?? 'information-outline') as IconName;
  const description = topic
    ? t(topic.descriptionKey, { defaultValue: topic.defaultDescription })
    : t('account.help.topicFallbackDescription', {
        defaultValue: "We're here to help. If something looks off, contact us and we'll follow up.",
      });

  const renderBullet = (text: string, index: number) => (
    <View style={styles.bulletRow} key={`${text}-${index}`}>
      <Icon name="check-circle" size={18} color={theme.colors.primary} style={styles.bulletIcon} />
      <Text style={[styles.paragraph, { flex: 1 }]}>{text}</Text>
    </View>
  );

  const renderContentBlock = (block: ContentBlock, index: number) => {
    if (block.type === 'paragraph' && block.text) {
      return (
        <Text key={index} style={styles.paragraph}>
          {block.text}
        </Text>
      );
    }
    if (block.type === 'list' && block.items) {
      return (
        <View key={index}>
          {block.items.map((item, idx) => renderBullet(item, idx))}
        </View>
      );
    }
    return null;
  };

  // Helper component for expandable sections
  const ExpandableSection = ({ section }: { section: SectionData }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(!expanded);
    };

    // Find the first paragraph to show as preview
    const previewBlock = section.content.find(
      (block) => block.type === 'paragraph' && block.text
    );

    return (
      <TouchableOpacity
        style={[styles.bodyCard, styles.section]}
        activeOpacity={0.7}
        onPress={toggleExpand}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.sectionTitle, { flex: 1, marginRight: 8 }]}>{section.title}</Text>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.primary}
          />
        </View>

        {expanded ? (
          <View style={{ marginTop: 8, gap: 8 }}>
            {section.content.map((block, index) => renderContentBlock(block, index))}
          </View>
        ) : (
          previewBlock && (
            <Text style={[styles.paragraph, { marginTop: 4 }]} numberOfLines={2} ellipsizeMode="tail">
              {previewBlock.text}
            </Text>
          )
        )}
      </TouchableOpacity>
    );
  };

  const renderDynamicContent = () => {
    if (loading) {
      return (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (!content) {
      return (
        <View style={styles.bodyCard}>
          <Text style={styles.bodyText}>
            {t('account.help.contentLoadError', { defaultValue: 'Unable to load content.' })}
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name={iconName} size={26} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
             <Text style={styles.heroTitle}>{title}</Text>
             <Text style={styles.heroSubtitle}>{content.intro}</Text>
          </View>
        </View>

        {/* Render Expandable Sections */}
        {content.sections.map((section) => (
          <ExpandableSection key={section.id} section={section} />
        ))}

        {/* Updated Date */}
        {content.lastUpdated && (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 16,
              color: theme.colors.onSurfaceVariant,
              opacity: 0.7,
              fontSize: 12,
            }}
          >
            Last Updated: {content.lastUpdated}
          </Text>
        )}
      </>
    );
  };

  const renderAccountTopic = () => {
    const bullets = [
      t('account.help.accountIssuesHint1', { defaultValue: 'Use the same sign-in method (Apple/Google/Email) you used to purchase.' }),
      t('account.help.accountIssuesHint2', { defaultValue: 'If you changed devices, try “Restore purchases” in Settings.' }),
      t('account.help.accountIssuesHint3', { defaultValue: 'To change email, contact us with the current and new email.' }),
    ];

    return (
      <>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name={iconName} size={26} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{t('account.help.accountIssuesDescription')}</Text>
          </View>
        </View>

        <View style={styles.bodyCard}>
          <Text style={styles.sectionTitle}>{t('account.help.accountIssuesChecklistTitle', { defaultValue: 'Quick checks' })}</Text>
          <View style={{ gap: 8 }}>
            {bullets.map((b, idx) => renderBullet(b, idx))}
          </View>
        </View>

        <View style={styles.bodyCard}>
          <Text style={styles.sectionTitle}>{t('account.help.accountSupportCtaTitle', { defaultValue: 'Still stuck?' })}</Text>
          <Text style={[styles.paragraph, { marginBottom: 12 }]}>
            {t('account.help.accountSupportCtaDesc', {
              defaultValue: 'Send us your account email and a short description. We will help you get back in.',
            })}
          </Text>
          <View style={styles.helpfulRow}>
            <TouchableOpacity style={styles.pillButton} activeOpacity={0.9} onPress={handleAccountSupportForm}>
              <Icon name="chat-processing" size={18} color={theme.colors.primary} />
              <Text style={styles.pillLabel}>{t('account.help.accountSupportButton', { defaultValue: 'Open support form' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pillButton} activeOpacity={0.9} onPress={handleAccountSupportEmail}>
              <Icon name="email-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.pillLabel}>{t('account.help.accountEmailButton', { defaultValue: 'Email support' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isDynamicTopic ? title : title}
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <Icon name="close" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDynamicTopic ? (
          renderDynamicContent()
        ) : isAccountTopic ? (
          renderAccountTopic()
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Icon name={iconName} size={26} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>{title}</Text>
                <Text style={styles.heroSubtitle}>{t('account.help.topicIntro')}</Text>
              </View>
            </View>

            <View style={styles.bodyCard}>
              <Text style={styles.bodyText}>{description}</Text>
            </View>

            <TouchableOpacity
              style={styles.emailButton}
              activeOpacity={0.92}
              onPress={handleEmailPress}
            >
              <Icon name="email-outline" size={20} color="#FFFFFF" />
              <Text style={styles.emailButtonText}>{t('account.help.contactSupportCta')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SupportTopicScreen;
