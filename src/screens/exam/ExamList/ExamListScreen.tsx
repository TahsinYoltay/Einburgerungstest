import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ScrollView, View, Pressable, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loadExams, switchExamLanguage } from '../../../store/slices/examSlice';
import { syncContent } from '../../../store/slices/contentSlice';
import { ExamAttempt } from '../../../types/exam';
import { createStyles } from './ExamListScreen.style';
import { useAppTheme } from '../../../providers/ThemeProvider';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ExamListScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Nav>();
  const { exams: examStateExams, examHistory, currentExam, inProgress, loading, currentLanguage } = useAppSelector(state => state.exam);
  const { exams: contentExams } = useAppSelector(state => state.content);
  
  // Use content exams if available (they are synced from Firebase), fallback to exam slice (legacy)
  const exams = contentExams.length > 0 ? contentExams : examStateExams;

  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Trigger update check every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkUpdates = async () => {
        try {
          // 1. Reload Manifests via Content Engine
          await dispatch(syncContent());
          
          // 2. If valid and active, check current language version
          if (isActive && currentLanguage !== 'en') {
             dispatch(switchExamLanguage(currentLanguage));
          }
        } catch (err) {
          console.log('Auto-update check failed', err);
        }
      };

      checkUpdates();

      return () => {
        isActive = false;
      };
    }, [dispatch, currentLanguage])
  );

  // Initial load
  useEffect(() => {
    dispatch(syncContent());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Sync Content
      await dispatch(syncContent()).unwrap();
      
      // 2. Check current language
      if (currentLanguage !== 'en') {
        await dispatch(switchExamLanguage(currentLanguage)).unwrap();
      }
    } catch (e) {
      console.log('Failed to refresh config', e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, currentLanguage]);



  // Helper: latest attempt per exam (include in-progress current exam)
  const latestByExam = useMemo(() => {
    const map: Record<string, ExamAttempt> = {};
    examHistory.forEach(att => {
      const prev = map[att.examId];
      if (!prev || new Date(att.startTime) > new Date(prev.startTime)) {
        map[att.examId] = att;
      }
    });
    Object.values(inProgress).forEach(p => {
      map[p.examId] = {
        id: p.attemptId || 'in-progress',
        examId: p.examId,
        startTime: p.startTime || new Date().toISOString(),
        status: 'in-progress',
        answers: Object.entries(p.answers).map(([qid, selected]) => ({
          questionId: qid,
          selectedAnswers: selected,
        })),
        score: undefined,
        totalQuestions: p.questions.length,
        correctAnswers: 0,
        flaggedQuestions: p.flaggedQuestions,
        timeSpentInSeconds: p.timeSpentInSeconds,
      };
    });
    if (currentExam.examId && currentExam.examStarted && !currentExam.examCompleted) {
      map[currentExam.examId] = {
        id: currentExam.attemptId || 'in-progress',
        examId: currentExam.examId,
        startTime: currentExam.startTime || new Date().toISOString(),
        status: 'in-progress',
        answers: Object.entries(currentExam.answers).map(([qid, selected]) => ({
          questionId: qid,
          selectedAnswers: selected,
        })),
        score: undefined,
        totalQuestions: currentExam.questions.length,
        correctAnswers: 0,
        flaggedQuestions: currentExam.flaggedQuestions,
        timeSpentInSeconds: currentExam.timeSpentInSeconds,
      };
    }
    return map;
  }, [examHistory, currentExam]);

  const avgScore = useMemo(() => {
    if (!examHistory.length) return 0;
    const total = examHistory.reduce((sum, a) => sum + (a.score ?? 0), 0);
    return Math.round(total / examHistory.length);
  }, [examHistory]);

  const completedCount = useMemo(() => {
    return Object.values(latestByExam).filter(a => a.status === 'passed' || a.status === 'failed').length;
  }, [latestByExam]);

  const totalExams = exams.length || 1;
  const completedPct = Math.round((completedCount / totalExams) * 100);

  const flaggedTotal = useMemo(() => {
    return examHistory.reduce((sum, a) => sum + (a.flaggedQuestions?.length || 0), 0);
  }, [examHistory]);

  const wrongTotal = useMemo(() => {
    return examHistory.reduce(
      (sum, a) => sum + Math.max(0, (a.totalQuestions || 0) - (a.correctAnswers || 0)),
      0
    );
  }, [examHistory]);

  const handleStart = (examId: string, restart?: boolean) => {
    navigation.navigate(ROUTES.EXAM, { id: examId, restart });
  };

  const handleViewResults = (examId: string) => {
    navigation.navigate(ROUTES.EXAM_RESULTS, { examId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTitlePill}>
            <Text style={styles.heroTitleText}>{t('exam.overallProgress', 'Your overall progress')}</Text>
          </View>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>{t('exam.averageScore', 'Average score')}</Text>
              <Text style={styles.heroValue}>{avgScore}%</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroLabel}>{t('exam.totalProgress', 'Total progress')}</Text>
              <Text style={styles.heroValue}>{t('exam.completedPct', { pct: completedPct, defaultValue: `Completed ${completedPct}%` })}</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressFill, { width: `${completedPct}%` }]} />
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickActionCard}>
            <Icon name="star" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionTitle}>{t('exam.starredQuestions', 'Starred questions')}</Text>
            <Text style={styles.quickActionSubtitle}>{flaggedTotal} {t('exam.items', 'items')}</Text>
          </Pressable>
          <Pressable style={styles.quickActionCard}>
            <Icon name="close-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionTitle}>{t('exam.wrongAnswers', 'Wrong answers')}</Text>
            <Text style={styles.quickActionSubtitle}>{wrongTotal} {t('exam.items', 'items')}</Text>
          </Pressable>
        </View>

        {/* Practice list */}
        <Text style={styles.sectionTitle}>{t('exam.practiceTests', 'Practice Tests')}</Text>
        {exams.map(exam => {
          const latest = latestByExam[exam.id];
          const expanded = expandedId === exam.id;
          const status = latest?.status ?? 'not-started';
          const isCompleted = status === 'passed' || status === 'failed';
          const isInProgress = status === 'in-progress';
          const timeLeft = isInProgress
            ? currentExam.examId === exam.id
              ? currentExam.timeRemaining
              : inProgress[exam.id]?.timeRemaining ?? null
            : null;
                  const scoreText = isCompleted
                    ? `${latest?.score ?? 0}%`
                    : t('exam.notAttempted', 'Not attempted');

          return (
            <View key={exam.id} style={styles.accordionCard}>
              <Pressable style={styles.accordionHeader} onPress={() => setExpandedId(expanded ? null : exam.id)}>
                <View style={styles.accordionLeft}>
                  <Icon
                    name={status === 'passed' ? 'check-circle' : status === 'failed' ? 'close-circle' : 'checkbox-blank-circle-outline'}
                    size={22}
                    color={status === 'passed' ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.accordionTitle}>{exam.title || exam.id}</Text>
                </View>
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={theme.colors.onSurface} />
              </Pressable>

              {expanded && (
                <View style={styles.accordionBody}>
                  <View style={styles.accordionRow}>
                    <Text style={styles.accordionLabel}>{t('exam.lastScore', 'Last score')}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {isCompleted && (
                        <Text style={{ color: status === 'passed' ? '#34A853' : theme.colors.error, fontWeight: '600', fontSize: 13 }}>
                          {status === 'passed' ? t('exam.passed', 'Passed') : t('exam.failed', 'Failed')}
                        </Text>
                      )}
                      <Text style={styles.accordionValue}>{scoreText}</Text>
                    </View>
                  </View>
                  <View style={styles.accordionRow}>
                    <Text style={styles.accordionLabel}>{t('exam.questions', 'Questions')}</Text>
                    <Text style={styles.accordionValue}>{exam.questions_per_exam}</Text>
                  </View>
                  
                  {isCompleted && (
                    <>
                      <View style={styles.accordionRow}>
                        <Text style={styles.accordionLabel}>{t('exam.correct', 'Correct')}</Text>
                        <Text style={styles.accordionValue}>
                          {latest?.correctAnswers ?? 0}/{latest?.totalQuestions ?? exam.questions_per_exam}
                        </Text>
                      </View>
                      <View style={styles.accordionRow}>
                        <Text style={styles.accordionLabel}>{t('exam.timeSpent', 'Time spent')}</Text>
                        <Text style={styles.accordionValue}>
                          {latest?.timeSpentInSeconds 
                            ? `${Math.floor(latest.timeSpentInSeconds / 60)}${t('common.minutes_short')} ${latest.timeSpentInSeconds % 60}${t('common.seconds_short')}`
                            : '-'}
                        </Text>
                      </View>
                      <View style={styles.accordionRow}>
                        <Text style={styles.accordionLabel}>{t('exam.date', 'Date')}</Text>
                        <Text style={styles.accordionValue}>
                          {latest?.startTime ? new Date(latest.startTime).toLocaleDateString() : '-'}
                        </Text>
                      </View>
                      
                      <Pressable
                        style={styles.viewResultsButton}
                        onPress={() => handleViewResults(exam.id)}
                      >
                        <Text style={styles.viewResultsText}>{t('exam.viewResults', 'View Results')}</Text>
                        <Icon name="chevron-right" size={18} color={theme.colors.primary} />
                      </Pressable>
                    </>
                  )}

                  {isInProgress && (
                    <View style={styles.accordionRow}>
                      <Text style={styles.accordionLabel}>{t('exam.timeLeft', 'Time left')}</Text>
                      <Text style={styles.accordionValue}>
                        {timeLeft !== null ? Math.max(0, Math.floor(timeLeft / 60)) + t('common.minutes_short') + ' ' + (timeLeft % 60) + t('common.seconds_short') : '--'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.actionButtonRow}>
                    {status === 'not-started' && (
                      <Pressable
                        style={[styles.filledButton, { flex: 1 }]}
                        onPress={() => handleStart(exam.id)}
                      >
                        <Text style={styles.filledButtonText}>{t('exam.start', 'Start')}</Text>
                      </Pressable>
                    )}

                    {isInProgress && (
                      <>
                        <Pressable
                          style={styles.outlineButton}
                          onPress={() => handleStart(exam.id, true)}
                        >
                          <Text style={styles.outlineButtonText}>{t('exam.restart', 'Restart')}</Text>
                        </Pressable>
                        <Pressable
                          style={styles.filledButton}
                          onPress={() => handleStart(exam.id)}
                        >
                          <Text style={styles.filledButtonText}>{t('exam.continue', 'Continue')}</Text>
                        </Pressable>
                      </>
                    )}

                    {isCompleted && !isInProgress && (
                      <>
                        <Pressable
                          style={styles.outlineButton}
                          onPress={() => handleStart(exam.id, true)}
                        >
                          <Text style={styles.outlineButtonText}>{t('exam.restart', 'Restart')}</Text>
                        </Pressable>
                        <Pressable
                          style={styles.filledButton}
                          onPress={() => handleStart(exam.id, true)}
                        >
                          <Text style={styles.filledButtonText}>{t('exam.retake', 'Retake')}</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExamListScreen;
