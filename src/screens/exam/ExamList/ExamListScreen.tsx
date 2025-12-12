import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ScrollView, View, Pressable, RefreshControl, TouchableOpacity } from 'react-native';
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
import AccountHeader from '../../../components/account/AccountHeader/AccountHeader';
import PaywallModal from '../../../components/common/PaywallModal';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ExamListScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Nav>();
  const { exams: examStateExams, examHistory, currentExam, inProgress, loading, currentLanguage, favoriteQuestions, questionStats } = useAppSelector(state => state.exam);
  const { exams: contentExams } = useAppSelector(state => state.content);
  
  // Use content exams if available (they are synced from Firebase), fallback to exam slice (legacy)
  const exams = contentExams.length > 0 ? contentExams : examStateExams;

  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isPro = useAppSelector(state => state.subscription.status === 'active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);

  const handleExamPress = (examId: string, index: number) => {
    // Logic: First 5 exams (0-4) are free. Others need Pro.
    const isLocked = index >= 5 && !isPro;

    if (isLocked) {
      setShowPaywall(true);
      return;
    }
    
    setExpandedId(expandedId === examId ? null : examId);
  };

  // Calculate stats for buttons
  const incorrectCount = useMemo(() => {
      return Object.values(questionStats).filter(s => s.incorrect > 0 && !s.hiddenFromIncorrectList).length;
  }, [questionStats]);

  const favoritesCount = favoriteQuestions.length;

  // Trigger update check every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      setForceUpdateKey(prev => prev + 1);
      
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

  const handleStart = (examId: string, restart?: boolean) => {
    navigation.navigate(ROUTES.EXAM, { id: examId, restart });
  };

  const handleViewResults = (examId: string) => {
    navigation.navigate(ROUTES.EXAM_RESULTS, { examId });
  };

  const renderCircle = (percent: number, label: string) => {
    const clamped = Math.max(0, Math.min(percent, 100));
    const rightRotation = clamped > 50 ? 180 : (clamped / 50) * 180;
    const leftRotation = clamped <= 50 ? 0 : ((clamped - 50) / 50) * 180;

    return (
      <View style={styles.circleWrap}>
        <View style={styles.circleContainer}>
          <View style={styles.circleBg} />
          <View
            style={[
              styles.circleHalf,
              { transform: [{ rotateZ: `${rightRotation}deg` }] },
            ]}
          />
          <View
            style={[
              styles.circleLeft,
              { transform: [{ rotateZ: `${leftRotation}deg` }] },
            ]}
          />
          <View style={styles.circleInner}>
            <Text style={styles.circleValue}>{`${clamped}%`}</Text>
          </View>
        </View>
        <Text style={styles.circleLabel}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <AccountHeader showText={false} showChevron={false} />
        <Text style={styles.screenTitle}>{t('exam.practiceTitle', 'Practice Exams')}</Text>
        {/* <Text style={styles.screenSubtitle}>{t('exam.practiceSubtitle', '42 exams to prepare you for test day.')}</Text> */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{t('exam.overallProgress', 'Overall Progress')}</Text>
          <View style={styles.heroGrid}>
            {renderCircle(avgScore, t('exam.averageScore', 'Average Score'))}
            {renderCircle(completedPct, t('exam.completedPct', { pct: '', defaultValue: 'Completed Tests' }) || 'Completed Tests')}
          </View>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statCard} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.REVIEW_QUESTIONS, { mode: 'incorrect' })}
          >
            <View style={[styles.statIconWrap, { backgroundColor: '#FEECEC' }]}>
              <Icon name="close-circle-outline" size={22} color="#D32F2F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statTitle}>{t('exam.incorrect', 'Incorrect')}</Text>
              <Text style={styles.statSubtitle}>{incorrectCount} {t('exam.items', 'questions')}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.REVIEW_QUESTIONS, { mode: 'favorites' })}
          >
            <View style={[styles.statIconWrap, { backgroundColor: '#E8F1FF' }]}>
              <Icon name="star" size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statTitle}>{t('exam.starredQuestions', 'Favorites')}</Text>
              <Text style={styles.statSubtitle}>{favoritesCount} {t('exam.items', 'items')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Practice list */}
        <Text style={styles.sectionTitle}>{t('exam.practiceTests', 'All Practice Tests')}</Text>
        {exams.map((exam, index) => {
          const titleText = exam.title || '';
          const numberMatch = titleText.match(/(\\d+)/);
          const isPracticeTitle = /practice\\s*exam/i.test(titleText);
          const displayTitle =
            isPracticeTitle && numberMatch
              ? t('exam.practiceExam', { number: numberMatch[1] })
              : titleText || exam.id;
          const latest = latestByExam[exam.id];
          const lastAttempt = latest;
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

          const totalQuestions =
            lastAttempt?.totalQuestions ??
            (Array.isArray((exam as any).questions) ? (exam as any).questions.length : undefined) ??
            exam.questions_per_exam ??
            (Array.isArray((exam as any).question_ids) ? (exam as any).question_ids.length : undefined) ??
            0;

          const metaLabel = isInProgress
            ? t('exam.continue', 'Continue')
            : isCompleted
              ? `${lastAttempt?.correctAnswers ?? 0}/${totalQuestions}`
              : t('exam.status.not-started');

          // Locking Logic
          const isLocked = index >= 5 && !isPro;

          return (
            <View key={exam.id} style={[styles.accordionCard, isLocked && { opacity: 0.7 }]}>
              <Pressable style={styles.accordionHeader} onPress={() => handleExamPress(exam.id, index)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {isLocked && <Icon name="lock" size={20} color="gray" style={{ marginRight: 8 }} />}
                  <Text style={styles.accordionTitle}>{displayTitle}</Text>
                </View>
                <Text style={styles.accordionMeta}>{isLocked ? t('common.locked', 'Locked') : metaLabel}</Text>
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
      <PaywallModal 
        visible={showPaywall} 
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
};

export default ExamListScreen;
