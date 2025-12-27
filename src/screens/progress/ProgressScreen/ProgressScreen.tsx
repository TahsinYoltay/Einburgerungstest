import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { Surface, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import { createStyles } from './ProgressScreen.style';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { getAvailableChapters } from '../../../data/book/chapters';
import { getReadingProgress, getChapterProgress, ReadingProgress } from '../../../utils/readingProgress';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loadExams } from '../../../store/slices/examSlice';
import { syncContent } from '../../../store/slices/contentSlice';
import AccountHeader from '../../../components/account/AccountHeader/AccountHeader';

const ProgressScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useAppDispatch();

  const firebaseUid = useAppSelector(state => state.auth.firebaseUid);
  const enableCloudSync = useAppSelector(state => state.auth.status === 'authenticated');
  const examHistory = useAppSelector(state => state.exam.examHistory);
  const chapters = useMemo(() => getAvailableChapters(), []);

  const [refreshing, setRefreshing] = useState(false);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({});
  const [chapterProgresses, setChapterProgresses] = useState<Record<string, { completed: number; total: number; percentage: number }>>({});

  const totalSections = useMemo(
    () => chapters.reduce((acc, chapter) => acc + chapter.subSections.length, 0),
    [chapters]
  );
  const completedSections = useMemo(
    () => Object.values(readingProgress).filter(section => section.isRead).length,
    [readingProgress]
  );
  const overallPercent = useMemo(() => {
    if (!totalSections) return 0;
    return Math.min(100, Math.round((completedSections / totalSections) * 100));
  }, [completedSections, totalSections]);

  const loadProgress = useCallback(async () => {
    const userId = firebaseUid || 'local';
    const progress = await getReadingProgress(userId, enableCloudSync);
    setReadingProgress(progress);

    const perChapter: Record<string, { completed: number; total: number; percentage: number }> = {};
    for (const chapter of chapters) {
      const sectionIds = chapter.subSections.map(section => section.id);
      perChapter[chapter.id] = await getChapterProgress(sectionIds, userId, enableCloudSync);
    }
    setChapterProgresses(perChapter);
  }, [chapters, firebaseUid, enableCloudSync]);

  useEffect(() => {
    dispatch(loadExams());
    loadProgress();
  }, [dispatch, loadProgress]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(syncContent()).unwrap();
      await dispatch(loadExams()).unwrap();
      await loadProgress();
    } catch (error) {
      console.error('Failed to refresh progress:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, loadProgress]);

  const avgScore = useMemo(() => {
    if (!examHistory.length) return 0;
    const total = examHistory.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0);
    return Math.round(total / examHistory.length);
  }, [examHistory]);

  const completedExams = useMemo(
    () => examHistory.filter(attempt => attempt.status === 'passed' || attempt.status === 'failed').length,
    [examHistory]
  );

  const lastAttempt = useMemo(() => {
    if (!examHistory.length) return undefined;
    return [...examHistory].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )[0];
  }, [examHistory]);
  const lastAttemptDate = lastAttempt?.startTime ? new Date(lastAttempt.startTime) : null;

  const chapterSummaries = useMemo(
    () =>
      chapters.map(chapter => {
        const progress = chapterProgresses[chapter.id] || {
          completed: 0,
          total: chapter.subSections.length,
          percentage: 0,
        };
        return {
          id: chapter.id,
          title: chapter.title,
          progress,
        };
      }),
    [chapterProgresses, chapters]
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <AccountHeader showText={false} showChevron={false} />
        <Text style={styles.screenTitle}>{t('progress.title', 'Progress')}</Text>

        <Surface style={styles.card} elevation={theme.dark ? 1 : 2}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>{t('home.progressTitle', 'Your Progress')}</Text>
              <Text style={styles.cardSubtitle}>
                {t('home.modulesDone', { completed: completedSections, total: totalSections })}
              </Text>
            </View>
            <Text style={styles.valueText}>{overallPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${overallPercent}%` }]} />
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Icon name='check-circle-outline' size={18} color={theme.colors.primary} />
              <Text style={styles.metaPillText}>
                {t('home.completedModules', { completed: completedSections, total: totalSections })}
              </Text>
            </View>
            <Text style={styles.metaMuted}>{t('progress.keepGoing', 'Keep it up!')}</Text>
          </View>
        </Surface>

        <Surface style={styles.card} elevation={theme.dark ? 1 : 2}>
          <Text style={styles.cardTitle}>{t('progress.examPerformance', 'Exam performance')}</Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.valueText}>{avgScore}%</Text>
              <Text style={styles.statLabel}>{t('exam.averageScore', 'Average score')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.valueText}>{completedExams}</Text>
              <Text style={styles.statLabel}>{t('progress.completedExams', 'Completed exams')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.valueText}>{examHistory.length}</Text>
              <Text style={styles.statLabel}>{t('exam.attempts', 'Attempts')}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Icon name="history" size={18} color={theme.colors.primary} />
            <Text style={styles.metaMuted}>
              {lastAttemptDate
                ? t('progress.lastAttempt', {
                    date: lastAttemptDate.toLocaleDateString(),
                  })
                : t('progress.noAttempts', 'No attempts yet')}
            </Text>
          </View>
        </Surface>

        <Text style={styles.sectionTitle}>{t('progress.readingProgress', 'Reading progress')}</Text>
        {chapterSummaries.map(chapter => (
          <Surface key={chapter.id} style={styles.chapterCard} elevation={theme.dark ? 1 : 0}>
            <View style={styles.chapterHeader}>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
              <Text style={styles.chapterValue}>{chapter.progress.percentage}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${Math.min(100, chapter.progress.percentage)}%` }]}
              />
            </View>
            <Text style={styles.metaMuted}>
              {t('home.completedModules', {
                completed: chapter.progress.completed,
                total: chapter.progress.total,
              })}
            </Text>
          </Surface>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProgressScreen;
