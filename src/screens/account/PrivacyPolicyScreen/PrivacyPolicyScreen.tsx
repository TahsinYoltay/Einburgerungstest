import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { contentManager } from '../../../services/ContentManager';
import { PrivacyPolicyData } from '../../../types/content';
import AccordionItem from '../../../components/common/AccordionItem';
import { createStyles } from './PrivacyPolicyScreen.styles';

const PrivacyPolicyScreen = () => {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, i18n } = useTranslation();

  const [data, setData] = useState<PrivacyPolicyData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleClose = () => navigation.popToTop();

  useEffect(() => {
    loadContent();
  }, [i18n.language]);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Fetch dynamic content from Firebase (with cache fallback)
      const policy = await contentManager.getPrivacyPolicy(i18n.language);
      setData(policy);
    } catch (error) {
      console.error('Failed to load privacy policy', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background} 
      />
      
      {/* Standard Header matching ProfileInfoScreen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account.menu.privacy')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <Icon name="close" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : data ? (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Privacy Policy</Text>
          
          {/* Meta Text: Last Updated */}
          <Text style={styles.lastUpdated}>
            {t('account.privacy.lastUpdated', { date: data.lastUpdated })}
          </Text>
          
          {/* Intro Body Text */}
          <Text style={styles.bodyText}>
            {data.intro}
          </Text>
          
          {/* Accordions */}
          <View style={styles.accordionContainer}>
            {data.sections.map((section) => (
              <AccordionItem 
                key={section.id} 
                title={section.title}
              >
                {section.content.map((block, index) => {
                  if (block.type === 'paragraph') {
                    return (
                      <Text key={index} style={styles.accordionBodyText}>
                        {block.text}
                      </Text>
                    );
                  } else if (block.type === 'list' && block.items) {
                    return (
                      <View key={index} style={{ paddingLeft: 8, paddingBottom: 12 }}>
                        {block.items.map((item, itemIndex) => (
                          <View key={itemIndex} style={{ flexDirection: 'row', marginBottom: 6 }}>
                            <Text style={{ marginRight: 8, fontSize: 16, color: theme.colors.onSurface }}>•</Text>
                            <Text style={[styles.accordionBodyText, { paddingBottom: 0, paddingTop: 0, flex: 1 }]}>
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  }
                  return null;
                })}
              </AccordionItem>
            ))}
          </View>

          {/* Footer padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <TouchableOpacity onPress={loadContent} style={styles.retryButton}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;