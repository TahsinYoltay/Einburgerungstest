import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ScrollView, RefreshControl, View, Image, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { Avatar, Surface, Text, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../../../navigations/StackNavigator';
import { createStyles } from './HomeScreen.style';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loadExams } from '../../../store/slices/examSlice';
import { syncContent } from '../../../store/slices/contentSlice';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useLocalizedContent } from '../../../hooks/useLocalizedContent';
import { getAvailableChapters } from '../../../data/book/chapters';
import { getReadingProgress, getChapterProgress, ReadingProgress } from '../../../utils/readingProgress';
import { ROUTES } from '../../../constants/routes';
import AccountHeader from '../../../components/account/AccountHeader/AccountHeader';
import PaywallModal from '../../../components/common/PaywallModal';

type TabParamList = {
  HomeTab: undefined;
  BookTab: undefined;
  ExamTab: { id?: string } | undefined;
  ProgressTab: undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ChapterCard = {
  id: string;
  title: string;
  description: string;
  image: any;
  progress: { completed: number; total: number; percentage: number };
  lastReadAt?: number;
  firstSectionId?: string;
  subSections: { id: string }[];
  locked: boolean;
};

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
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({});
  const [chapterProgresses, setChapterProgresses] = useState<Record<string, { completed: number; total: number; percentage: number }>>({});
  const [showPaywall, setShowPaywall] = useState(false);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);

  const chapters = useMemo(() => getAvailableChapters(), []);
  const totalSections = useMemo(
    () => chapters.reduce((acc, chapter) => acc + chapter.subSections.length, 0),
    [chapters]
  );
  const completedSections = useMemo(
    () =>
      Object.values(readingProgress).filter(section => section.isRead).length,
    [readingProgress]
  );
  const overallPercent = useMemo(() => {
    if (!totalSections) return 0;
    return Math.min(100, Math.round((completedSections / totalSections) * 100));
  }, [completedSections, totalSections]);

  const loadReadingState = useCallback(async () => {
    const userId = authState.firebaseUid || 'local';
    const enableCloudSync = authState.status === 'authenticated';
    const progress = await getReadingProgress(userId, enableCloudSync);
    setReadingProgress(progress);

    const perChapter: Record<string, { completed: number; total: number; percentage: number }> = {};
    for (const chapter of chapters) {
      const sectionIds = chapter.subSections.map(section => section.id);
      perChapter[chapter.id] = await getChapterProgress(sectionIds, userId, enableCloudSync);
    }
    setChapterProgresses(perChapter);
  }, [chapters, authState.firebaseUid, authState.status]);

  useEffect(() => {
    dispatch(loadExams());
    loadReadingState();
  }, [dispatch, loadReadingState]);

  useFocusEffect(
    useCallback(() => {
      loadReadingState();
      setForceUpdateKey(prev => prev + 1);
    }, [loadReadingState])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(syncContent()).unwrap();
      await dispatch(loadExams()).unwrap();
      await loadReadingState();
    } catch (error) {
      console.error('Failed to refresh content:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, loadReadingState]);

  const recommendedChapters: ChapterCard[] = useMemo(() => {
    return chapters
      .map((chapter, index) => {
        const progress = chapterProgresses[chapter.id] || {
          completed: 0,
          total: chapter.subSections.length,
          percentage: 0,
        };
        const lastReadAt = chapter.subSections.reduce((latest, section) => {
          const stamp = readingProgress[section.id]?.lastReadAt
            ? new Date(readingProgress[section.id].lastReadAt).getTime()
            : 0;
          return stamp > latest ? stamp : latest;
        }, 0);

        // Lock Logic: Chapter 1 (index 0) is free. Others locked.
        const locked = index > 0 && !isPro;

        return {
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          image: chapter.image,
          progress,
          lastReadAt,
          firstSectionId: chapter.subSections[0]?.id,
          subSections: chapter.subSections,
          locked,
        };
      })
      .sort((a, b) => {
        if ((b.lastReadAt || 0) !== (a.lastReadAt || 0)) {
          return (b.lastReadAt || 0) - (a.lastReadAt || 0);
        }
        return a.progress.percentage - b.progress.percentage;
      });
  }, [chapters, chapterProgresses, readingProgress, isPro, forceUpdateKey]);

  const tabNavigate = (routeName: 'HomeTab' | 'BookTab' | 'ExamTab' | 'ProgressTab') => {
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

  const handleOpenChapter = (chapter: ChapterCard) => {
    if (chapter.locked) {
      setShowPaywall(true);
      return;
    }

    // pick first unread subsection; fallback to first
    const targetSub =
      chapter.subSections?.find(sub => !readingProgress[sub.id]?.isRead) ||
      chapter.subSections?.[0];
    if (!targetSub) return;

    navigation.navigate(ROUTES.READER, {
      chapterId: chapter.id,
      subSectionId: targetSub.id,
    });
  };

  const greetingName = authState.displayName || t('home.defaultName', 'Explorer');
  const greeting = t('home.greeting', { name: greetingName });
  const subGreeting = getLocalized(homeContent?.welcomeMessage) || t('home.subtitle', 'Track your learning and pick up where you left off.');
  const goToAccount = () => navigation.navigate(ROUTES.ACCOUNT);

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

        <Surface style={styles.progressCard} elevation={theme.dark ? 1 : 2}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>{t('home.progressTitle', 'Your Progress')}</Text>
              <Text style={styles.progressMeta}>
                {t('home.modulesDone', { completed: completedSections, total: totalSections })}
              </Text>
            </View>
            <Text style={styles.progressValue}>{overallPercent}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${overallPercent}%` }]} />
          </View>
          <View style={styles.progressFooter}>
            <View style={styles.pill}>
              <Icon name="check-circle-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.pillText}>{t('home.completed', 'Completed')}</Text>
            </View>
            <Text style={styles.progressFooterText}>
              {t('home.completedModules', {
                completed: completedSections,
                total: totalSections,
              })}
            </Text>
          </View>
        </Surface>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.resumeTitle', 'Pick Up Where You Left Off')}</Text>
          <Button
            onPress={() => tabNavigate('BookTab')}
            compact
            textColor={theme.colors.primary}
          >
            {t('home.viewAll', 'View all')}
          </Button>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {recommendedChapters.map(chapter => (
            <TouchableOpacity
              key={chapter.id}
              style={[styles.chapterCard, chapter.locked && { opacity: 0.7 }]}
              activeOpacity={0.9}
              onPress={() => handleOpenChapter(chapter)}
            >
              <Image source={chapter.image} style={styles.chapterImage} resizeMode="cover" />
              
              {chapter.locked && (
                <View style={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  backgroundColor: 'rgba(0,0,0,0.6)', 
                  borderRadius: 12, 
                  padding: 4 
                }}>
                  <Icon name="lock" size={16} color="white" />
                </View>
              )}

              <Text style={styles.chapterTitle} numberOfLines={2}>
                {chapter.title}
              </Text>
              <Text style={styles.chapterSubtitle} numberOfLines={2}>
                {t('home.chapterProgress', { percent: chapter.progress.percentage })}
              </Text>
              <View style={styles.smallProgressTrack}>
                <View
                  style={[
                    styles.smallProgressFill,
                    { width: `${Math.min(100, chapter.progress.percentage)}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
