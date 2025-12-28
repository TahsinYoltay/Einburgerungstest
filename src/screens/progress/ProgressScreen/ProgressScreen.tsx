import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { Surface, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { createStyles } from './ProgressScreen.style';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loadExams } from '../../../store/slices/examSlice';
import { syncContent } from '../../../store/slices/contentSlice';
import AccountHeader from '../../../components/account/AccountHeader/AccountHeader';

const ProgressScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useAppDispatch();

  const examHistory = useAppSelector(state => state.exam.examHistory);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(loadExams());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(syncContent()).unwrap();
      await dispatch(loadExams()).unwrap();
    } catch (error) {
      console.error('Failed to refresh progress:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

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
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProgressScreen;
