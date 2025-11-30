import React, {useState} from 'react';
import {View, ScrollView, Alert} from 'react-native';
import {
  Card,
  Text,
  Divider,
  List,
  useTheme,
  Button,
  IconButton,
  Dialog,
  Portal,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useAppSelector, useAppDispatch} from '../../../store/hooks';
import {RootStackParamList} from '../../../navigations/StackNavigator';
import {ROUTES} from '../../../constants/routes';
import {resetExamData} from '../../../store/slices/examSlice';
import {ExamAttempt} from '../../../types/exam';
import {styles} from './ExamHistorySummary.style';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExamHistorySummary = () => {
  const {t} = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<HomeNavigationProp>();
  const dispatch = useAppDispatch();
  const {exams, examHistory, currentExam} = useAppSelector(state => state.exam);

  // Local state for reset dialog
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [examToReset, setExamToReset] = useState<string | null>(null);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Start an exam
  const handleStartExam = (examId: string) => {
    navigation.navigate(ROUTES.EXAM, {id: examId});
  };

  // View results
  const handleViewResults = (examId: string) => {
    navigation.navigate(ROUTES.EXAM_RESULTS, {examId});
  };

  // Handle reset exam confirmation dialog
  const showResetConfirmation = (examId?: string) => {
    setExamToReset(examId || null);
    setResetDialogVisible(true);
  };

  // Handle reset action
  const handleResetExam = () => {
    dispatch(resetExamData({examId: examToReset || undefined}));
    setResetDialogVisible(false);

    // Show success message
    Alert.alert(t('exam.resetSuccess'), '', [{text: 'OK'}]);
  };

  // Calculate progress for in-progress exams
  const calculateProgress = (examId: string) => {
    // If this is the current exam being taken
    if (
      currentExam.examId === examId &&
      currentExam.examStarted &&
      !currentExam.examCompleted
    ) {
      const totalQuestions = currentExam.questions.length;
      const answeredCount = Object.keys(currentExam.answers).length;
      return {
        answered: answeredCount,
        remaining: totalQuestions - answeredCount,
        progress: totalQuestions > 0 ? answeredCount / totalQuestions : 0,
        timeLeft: currentExam.timeRemaining,
      };
    }

    // If it's a saved in-progress exam
    const lastAttempt = (exams.find(e => e.id === examId) as any)?.lastAttempt as ExamAttempt | undefined;
    if (lastAttempt && lastAttempt.status === 'in-progress') {
      const answeredCount = lastAttempt.answers.length;
      return {
        answered: answeredCount,
        remaining: lastAttempt.totalQuestions - answeredCount,
        progress:
          lastAttempt.totalQuestions > 0
            ? answeredCount / lastAttempt.totalQuestions
            : 0,
        timeLeft: null, // We don't have this info for saved exams
      };
    }

    return null;
  };

  // Get attempt statistics
  const getAttemptStats = (examId: string) => {
    const attempts = examHistory.filter(attempt => attempt.examId === examId);
    const passedCount = attempts.filter(a => a.status === 'passed').length;
    const failedCount = attempts.filter(a => a.status === 'failed').length;

    return {
      total: attempts.length,
      passedCount,
      failedCount,
    };
  };

  // Get the button text based on exam status
  const getExamButtonText = (examId: string) => {
    const exam = exams.find(e => e.id === examId) as any;
    const lastAttempt = exam?.lastAttempt as ExamAttempt | undefined;
    if (!lastAttempt) return t('exam.start');
    if (lastAttempt.status === 'passed' || lastAttempt.status === 'failed') return t('exam.start');
    if (lastAttempt.status === 'in-progress') {
      return currentExam.examId === examId && currentExam.examStarted
        ? t('exam.continue')
        : t('exam.resume');
    }
    return t('exam.start');
  };

  // Get the status label with color
  const getStatusLabel = (status: string) => {
    let color;
    switch (status) {
      case 'passed':
        color = theme.colors.primary;
        break;
      case 'failed':
        color = theme.colors.error;
        break;
      case 'in-progress':
        color = '#FFA500'; // Orange for in-progress
        break;
      default:
        color = theme.colors.secondary;
    }

    const statusKey = status.replace('-', ''); // Remove hyphens for translation keys
    return <Text style={{color}}>{t(`exam.status.${statusKey}`)}</Text>;
  };

  if (!exams.length) {
    return (
      <Card style={styles.loadingCard}>
        <Card.Content>
          <Text>{t('exam.noExamsAvailable')}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="titleLarge" style={styles.title}>
          {t('exam.availableExams')}
        </Text>
        <Button
          icon="refresh"
          mode="text"
          onPress={() => showResetConfirmation()}
          accessibilityLabel={t('exam.resetExams')}>
          {t('exam.resetExams')}
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          {exams.map(exam => {
            const lastAttempt = (exam as any).lastAttempt as ExamAttempt | undefined;
            const progress = calculateProgress(exam.id);
            const stats = getAttemptStats(exam.id);

            return (
              <Card key={exam.id} style={styles.examCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text
                      variant="titleMedium"
                      numberOfLines={1}
                      style={styles.examTitle}>
                      {exam.title || exam.id}
                    </Text>
                    <IconButton
                      icon="refresh"
                      size={20}
                      onPress={() => showResetConfirmation(exam.id)}
                      accessibilityLabel={t('exam.reset')}
                    />
                  </View>

                  <Text
                    variant="bodySmall"
                    style={styles.description}
                    numberOfLines={2}>
                    {exam.mode ? t(`exam.modes.${exam.mode}`, exam.mode) : ''}
                  </Text>

                  <View style={styles.detailsContainer}>
                    <View style={styles.detailItem}>
                      <Text variant="labelSmall">{t('exam.questions')}</Text>
                      <Text variant="bodyMedium">{exam.questions_per_exam}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text variant="labelSmall">{t('exam.timeAllowed')}</Text>
                      <Text variant="bodyMedium">
                        {exam.time_limit_minutes} min
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text variant="labelSmall">{t('exam.attempts')}</Text>
                      <Text variant="bodyMedium">{stats.total}</Text>
                    </View>
                  </View>

                  {progress && (
                    <View style={styles.progressContainer}>
                      <Text variant="labelSmall">
                        {t('exam.questionsAnswered')}: {progress.answered}/
                        {progress.answered + progress.remaining}
                      </Text>
                      <ProgressBar
                        progress={progress.progress}
                        color={theme.colors.primary}
                        style={styles.progressBar}
                      />
                      {progress.timeLeft && (
                        <Text variant="labelSmall" style={styles.timeLeft}>
                          {t('exam.timeLeft')}: {formatTime(progress.timeLeft)}
                        </Text>
                      )}
                    </View>
                  )}

                  {stats.total > 0 && (
                    <View style={styles.statsContainer}>
                      <Chip
                        icon="check"
                        textStyle={{color: theme.colors.primary}}
                        style={styles.statChip}>
                        {t('exam.passCount')}: {stats.passedCount}
                      </Chip>
                      <Chip
                        icon="close"
                        textStyle={{color: theme.colors.error}}
                        style={styles.statChip}>
                        {t('exam.failCount')}: {stats.failedCount}
                      </Chip>
                    </View>
                  )}

                  {lastAttempt && (
                    <>
                      <Divider style={styles.divider} />
                      <View>
                        <View style={styles.lastAttemptRow}>
                          <Text variant="labelSmall">
                            {t('exam.lastAttempt')}:
                          </Text>
                          <Text variant="labelSmall">
                            {formatDate(lastAttempt.startTime)}
                          </Text>
                        </View>

                        <View style={styles.lastAttemptRow}>
                          <Text variant="labelSmall">{t('exam.status')}:</Text>
                          {getStatusLabel(lastAttempt.status)}
                        </View>

                        {lastAttempt.status === 'passed' ||
                        lastAttempt.status === 'failed' ? (
                          <View style={styles.lastAttemptRow}>
                            <Text variant="labelSmall">{t('exam.score')}:</Text>
                            <Text
                              variant="bodyMedium"
                              style={{
                                color:
                                  lastAttempt.status === 'passed'
                                    ? theme.colors.primary
                                    : theme.colors.error,
                              }}>
                              {lastAttempt.score}%
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </>
                  )}
                </Card.Content>

                <Card.Actions>
                  {lastAttempt?.status === 'passed' ||
                  lastAttempt?.status === 'failed' ? (
                    <Button
                      onPress={() => handleViewResults(exam.id)}
                      mode="text">
                      {t('exam.viewResults')}
                    </Button>
                  ) : null}

                  <Button
                    onPress={() => handleStartExam(exam.id)}
                    mode="contained">
                    {getExamButtonText(exam.id)}
                  </Button>
                </Card.Actions>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {examHistory.length > 0 && (
        <>
          <Text variant="titleLarge" style={styles.title}>
            {t('exam.recentAttempts')}
          </Text>
          <Card style={styles.historyCard}>
            <Card.Content>
              {examHistory.slice(0, 5).map((attempt, index) => {
                const exam = exams.find(e => e.id === attempt.examId) as any;

                return (
                  <View key={attempt.id}>
                    {index > 0 && <Divider style={styles.divider} />}
                    <List.Item
                      title={exam?.title || t('exam.unknownExam')}
                      description={`${formatDate(
                        attempt.startTime,
                      )} • ${formatTime(attempt.timeSpentInSeconds)}`}
                      left={props => (
                        <List.Icon
                          {...props}
                          icon={
                            attempt.status === 'passed'
                              ? 'check-circle'
                              : attempt.status === 'failed'
                              ? 'close-circle'
                              : 'clock-outline'
                          }
                          color={
                            attempt.status === 'passed'
                              ? theme.colors.primary
                              : attempt.status === 'failed'
                              ? theme.colors.error
                              : theme.colors.secondary
                          }
                        />
                      )}
                      right={props => (
                        <View style={styles.scoreContainer}>
                          {attempt.score !== undefined && (
                            <Text
                              {...props}
                              style={[
                                styles.scoreText,
                                {
                                  color:
                                    attempt.status === 'passed'
                                      ? theme.colors.primary
                                      : theme.colors.error,
                                },
                              ]}>
                              {attempt.score}%
                            </Text>
                          )}
                        </View>
                      )}
                      onPress={() => handleViewResults(attempt.examId)}
                    />
                  </View>
                );
              })}
            </Card.Content>
            {examHistory.length > 5 && (
              <Card.Actions>
                <Button>{t('exam.viewAllAttempts')}</Button>
              </Card.Actions>
            )}
          </Card>
        </>
      )}

      {/* Reset Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={resetDialogVisible}
          onDismiss={() => setResetDialogVisible(false)}>
          <Dialog.Title>{t('exam.reset')}</Dialog.Title>
          <Dialog.Content>
            <Text>
              {examToReset
                ? t('exam.resetExamConfirm')
                : t('exam.resetExamsConfirm')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={handleResetExam} textColor={theme.colors.error}>
              {t('exam.reset')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default ExamHistorySummary;
