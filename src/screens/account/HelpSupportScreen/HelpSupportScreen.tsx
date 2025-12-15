import React, { ComponentProps, Fragment, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity, ScrollView, StatusBar, Linking } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { createStyles } from './HelpSupportScreen.styles';
import { supportTopics } from '../../../constants/supportTopics';
import { APP_CONFIG } from '../../../config/appConfig';

type IconName = ComponentProps<typeof Icon>['name'];
type LocalizedTopic = (typeof supportTopics)[number] & { label: string; description: string };

const HelpSupportScreen = () => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleClose = () => navigation.popToTop();
  const handleNavigate = (topicKey: (typeof supportTopics)[number]['key']) => {
    if (topicKey === 'feedback') {
      navigation.navigate(ROUTES.SUPPORT_REQUEST, { kind: 'feedback' });
      return;
    }
    if (topicKey === 'reportBug') {
      navigation.navigate(ROUTES.SUPPORT_REQUEST, { kind: 'bug' });
      return;
    }
    if (topicKey === 'billingPayments') {
      navigation.navigate(ROUTES.BILLING);
      return;
    }
    navigation.navigate(ROUTES.HELP_TOPIC, { topicKey });
  };

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

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesQuery = (
    label: string,
    description: string,
    keywords: string[],
  ) => {
    if (!normalizedQuery) return true;
    return (
      label.toLowerCase().includes(normalizedQuery) ||
      description.toLowerCase().includes(normalizedQuery) ||
      keywords.some(k => k.toLowerCase().includes(normalizedQuery))
    );
  };

  const localizedTopics: LocalizedTopic[] = supportTopics.map(item => ({
    ...item,
    label: t(item.labelKey),
    description: t(item.descriptionKey),
  }));

  const faqTopics = localizedTopics.filter(
    item => item.section === 'faq' && matchesQuery(item.label, item.description, item.keywords),
  );
  const resourceTopics = localizedTopics.filter(
    item => item.section === 'resource' && matchesQuery(item.label, item.description, item.keywords),
  );

  const renderList = (items: LocalizedTopic[]) => {
    if (items.length === 0) {
      return (
        <View style={styles.cardList}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('account.help.noResults')}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cardList}>
        {items.map((item, index) => (
          <Fragment key={item.key}>
            <TouchableOpacity
              style={styles.listItem}
              activeOpacity={0.9}
              onPress={() => handleNavigate(item.key)}
            >
              <View style={styles.itemLeft}>
                <View style={styles.itemIcon}>
                  <Icon name={item.icon as IconName} size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={theme.colors.onSurface} />
            </TouchableOpacity>
            {index < items.length - 1 && <View style={styles.listDivider} />}
          </Fragment>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account.menu.help')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <Icon name="close" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="headset" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>{t('account.help.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('account.help.heroSubtitle')}</Text>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            mode="outlined"
            placeholder={t('account.help.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            left={<TextInput.Icon icon="magnify" />}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            style={{ backgroundColor: theme.colors.surface }}
            dense
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account.help.faqTopics')}</Text>
          {renderList(faqTopics)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account.help.contact')}</Text>
          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.9}
            onPress={handleEmailPress}
          >
            <Icon name="email-outline" size={26} color={theme.colors.primary} />
            <Text style={styles.contactLabel}>{t('account.help.emailSupport')}</Text>
            <Text style={styles.contactEmail}>{APP_CONFIG.SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account.help.otherResources')}</Text>
          {renderList(resourceTopics)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;
