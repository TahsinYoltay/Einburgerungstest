import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ScrollView, RefreshControl, View, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../../../navigations/StackNavigator';
import { createStyles } from './HomeScreen.style';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loadExams } from '../../../store/slices/examSlice';
import { syncContent } from '../../../store/slices/contentSlice';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useLocalizedContent } from '../../../hooks/useLocalizedContent';
import { ROUTES } from '../../../constants/routes';
import AccountHeader from '../../../components/account/AccountHeader/AccountHeader';
import PaywallModal from '../../../components/common/PaywallModal';

type TabParamList = {
  HomeTab: undefined;
  ExamTab: { id?: string } | undefined;
  ProgressTab: undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { getLocalized } = useLocalizedContent();

  const authState = useAppSelector(state => state.auth);
  const homeContent = useAppSelector(state => state.content.home);
  const subscriptionStatus = useAppSelector(state => state.subscription.status);
  const isPro = subscriptionStatus === 'active';

  const [refreshing, setRefreshing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    dispatch(loadExams());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(syncContent()).unwrap();
      await dispatch(loadExams()).unwrap();
    } catch (error) {
      console.error('Failed to refresh content:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const tabNavigate = (routeName: 'HomeTab' | 'ExamTab' | 'ProgressTab') => {
    navigation.navigate(routeName as never);
  };

  const handleMockExamPress = () => {
    if (!isPro) {
      setShowPaywall(true);
      return;
    }
    navigation.navigate(ROUTES.MOCK_EXAMS);
  };

  const handleChapterExamPress = () => {
    if (!isPro) {
      setShowPaywall(true);
      return;
    }
    navigation.navigate(ROUTES.CHAPTER_EXAMS);
  };

  const greetingName = authState.displayName || t('home.defaultName', 'Explorer');
  const greeting = t('home.greeting', { name: greetingName });
  const subGreeting = getLocalized(homeContent?.welcomeMessage) || t('home.subtitle', 'Track your learning and pick up where you left off.');
  return (
    <SafeAreaView
      style={styles.container}
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <AccountHeader showText={false} showChevron={false} />

        <Text style={styles.sectionTitle}>{t('home.practiceTitle', 'Choose Your Practice')}</Text>
        <View style={styles.practiceList}>
          {[
            {
              key: 'full',
              icon: 'clipboard-text' as const,
              title: t('home.practice.fullMock', 'Full Mock Exam'),
              description: t('home.practice.fullMockDescription', 'Simulate the full 24-question test.'),
              onPress: handleMockExamPress,
            },
            {
              key: 'quick',
              icon: 'timer-outline' as const,
              title: t('home.practice.quickQuiz', 'Quick Practice'),
              description: t('home.practice.quickQuizDescription', 'Jump into a short practice session.'),
              onPress: () => tabNavigate('ExamTab'),
            },
            {
              key: 'chapter',
              icon: 'checkbox-multiple-marked-outline' as const,
              title: t('home.practice.chapterTest', 'Chapter-Specific Test'),
              description: t('home.practice.chapterTestDescription', 'Focus on a single chapter from the guide.'),
              onPress: handleChapterExamPress,
            },
          ].map(item => (
            <TouchableOpacity key={item.key} style={styles.practiceCard} activeOpacity={0.9} onPress={item.onPress}>
              <View style={styles.practiceIconWrapper}>
                <Icon name={item.icon} size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.practiceText}>
                <Text style={styles.practiceTitle}>{item.title}</Text>
                <Text style={styles.practiceDescription}>{item.description}</Text>
              </View>
              <Icon name="chevron-right" size={22} color={theme.colors.outline} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <PaywallModal 
        visible={showPaywall} 
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
