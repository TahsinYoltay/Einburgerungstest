import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dimensions, View, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Button, Text, ProgressBar, Dialog, Portal, IconButton } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import QuestionCard from '../../../components/exam/QuestionCard/QuestionCard';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { createStyles } from './ExamScreen.style';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  loadExamQuestions,
  startExam,
  answerQuestion,
  toggleFlagQuestion,
  goToNextQuestion,
  goToPreviousQuestion,
  setCurrentQuestionIndex,
  updateTimeRemaining,
  updateTimeSpent,
  submitExam,
  saveCurrentExamProgress,
  resetExam,
  toggleFavoriteQuestion,
  switchExamLanguage,
} from '../../../store/slices/examSlice';
import { LanguageSelector } from '../../../components/common/LanguageSelector';

type ExamScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.EXAM>;
type ExamScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExamScreen = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const route = useRoute<ExamScreenRouteProp>();
  const navigation = useNavigation<ExamScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const isAndroid = Platform.OS === 'android';

  const screenWindowHeightDiff =
    Dimensions.get('screen').height - Dimensions.get('window').height;
  const isEdgeToEdgeAndroid = isAndroid && Math.abs(screenWindowHeightDiff) < 2;
  const footerInset = isAndroid
    ? (isEdgeToEdgeAndroid ? Math.max(insets.bottom, 16) : insets.bottom)
    : insets.bottom;

  // Get the exam ID from route params
  const { id: examId, restart } = route.params as { id: string; restart?: boolean };

  // Get exam state from Redux
  const {
    loading,
    error,
    currentExam,
    favoriteQuestions,
    currentLanguage,
    isDownloadingLanguage,
    downloadProgress,
    exams: examStateExams,
  } = useAppSelector(state => state.exam);
  
  const { languages: availableLanguages, exams: contentExams } = useAppSelector(state => state.content);

  const questions = currentExam.questions ?? [];
  const currentQuestionIndex = currentExam.currentQuestionIndex ?? 0;
  const answers = currentExam.answers ?? {};
  const flaggedQuestions = currentExam.flaggedQuestions ?? [];
  const timeRemaining = currentExam.timeRemaining ?? 0;
  const timeSpentInSeconds = currentExam.timeSpentInSeconds ?? 0;
  const examStarted = Boolean(currentExam.examStarted);
  const examCompleted = Boolean(currentExam.examCompleted);
  const currentExamId = currentExam.examId ?? null;

  // Local state for UI
  const [showFlaggedDialog, setShowFlaggedDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [showExitConfirmDialog, setShowExitConfirmDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [reviewFlaggedOnly, setReviewFlaggedOnly] = useState(false);
  const [flaggedOrder, setFlaggedOrder] = useState<number[]>([]);
  const [flaggedCursor, setFlaggedCursor] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeRemaining);

  const languages = availableLanguages;
  const currentLangName = languages.find(l => l.code === currentLanguage)?.nativeName || 'English';
  const exams = contentExams.length > 0 ? contentExams : examStateExams;
  const examMode = useMemo(
    () => exams.find(exam => exam.id === examId)?.mode,
    [exams, examId],
  );

  // References
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startLeftRef = useRef(timeRemaining);
  const timeLeftRef = useRef(timeRemaining);
  const initialSpentRef = useRef(timeSpentInSeconds);
  const timeExpiredRef = useRef(false);

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  // Calculate progress
  const progress = questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0;

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check if the current question has been answered
  const isCurrentQuestionAnswered = (): boolean => {
    if (!currentQuestion) {return false;}
    const questionAnswers = answers[currentQuestion.id] || [];
    const min = currentQuestion.min_selections || 1;
    return questionAnswers.length >= min;
  };

  // Check if the question is flagged
  const isQuestionFlagged = (questionId: string): boolean => {
    return flaggedQuestions.includes(questionId);
  };

  // Initialize or resume the exam
  useEffect(() => {
    if (!examId) return;
    dispatch(resetExam());
    dispatch(startExam({ examId, forceRestart: restart }));
  }, [dispatch, examId, restart]);

  // Load questions only when needed (new attempt or empty state)
  useEffect(() => {
    if (!examId) return;
    const needsQuestions =
      currentExamId !== examId ||
      questions.length === 0 ||
      (restart && !examCompleted);
    if (needsQuestions) {
      dispatch(loadExamQuestions(examId));
    }
  }, [dispatch, examId, restart, currentExamId, questions.length, examCompleted]);

  // Sync local timer when redux value changes (e.g., resume)
  useEffect(() => {
    setTimeLeft(timeRemaining);
    startLeftRef.current = timeRemaining;
  }, [timeRemaining]);

  // Track latest timer values
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Persist progress on unmount/navigation away
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const delta = Math.max(0, startLeftRef.current - timeLeftRef.current);
      dispatch(updateTimeRemaining(timeLeftRef.current));
      dispatch(updateTimeSpent(initialSpentRef.current + delta));
      dispatch(saveCurrentExamProgress());
    };
  }, [dispatch]);

  // Setup timer
  useEffect(() => {
    if (examStarted && !examCompleted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [examStarted, examCompleted]);

  // Auto-submit when time is up
  useEffect(() => {
    if (examStarted && !examCompleted && timeLeft <= 0) {
      if (timeExpiredRef.current) return;
      timeExpiredRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const delta = Math.max(0, startLeftRef.current - timeLeftRef.current);
      dispatch(updateTimeRemaining(0));
      dispatch(updateTimeSpent(initialSpentRef.current + delta));
      setShowTimeUpDialog(true);
    }
  }, [dispatch, examStarted, examCompleted, timeLeft]);

  // Time warning
  useEffect(() => {
    if (examStarted && !examCompleted && timeLeft === 300) {
      setShowTimeWarning(true);
    }
  }, [examStarted, examCompleted, timeLeft]);

  // Handle exam completion (fallback navigation if thunk sets flag)
  useEffect(() => {
    if (examStarted && examCompleted && currentExamId === examId && questions.length > 0) {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      navigation.replace(ROUTES.EXAM_RESULTS, { examId });
    }
  }, [examCompleted, navigation, examId, examStarted, currentExamId, questions.length]);

  // Handle question answer
  const handleAnswer = (questionId: string, answerId: string) => {
    dispatch(answerQuestion({
      questionId,
      answerId,
      type: currentQuestion?.type,
      maxSelections: currentQuestion?.max_selections || 1,
    }));
  };

  // Handle navigation
  const handlePrevious = () => {
    dispatch(goToPreviousQuestion());
  };

  const handleNext = () => {
    // If current question is not answered, show alert
    if (!isCurrentQuestionAnswered()) {
      Alert.alert(
        t('exam.questionNotAnswered'),
        t('exam.mustSelectOption'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (reviewFlaggedOnly) {
      if (flaggedCursor < flaggedOrder.length - 1) {
        const nextCursor = flaggedCursor + 1;
        setFlaggedCursor(nextCursor);
        dispatch(setCurrentQuestionIndex(flaggedOrder[nextCursor]));
      } else {
        // finished reviewing flagged, submit
        dispatch(submitExam());
      }
    }
    else {
      dispatch(goToNextQuestion());
    }
  };

  // Handle back button press
  const handleBackPress = () => {
    // If exam has started but not completed, show confirmation dialog
    if (examStarted && !examCompleted) {
      setShowExitConfirmDialog(true);
    } else {
      dispatch(saveCurrentExamProgress());
      navigation.goBack();
    }
  };

  // Handle exit confirmation
  const handleExitExam = () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    dispatch(saveCurrentExamProgress());
    setShowExitConfirmDialog(false);
    navigation.goBack();
  };

  // Handle flag toggling
  const handleToggleFlag = () => {
    if (currentQuestion) {
      dispatch(toggleFlagQuestion(currentQuestion.id));
    }
  };

  const handleLanguageSelect = async (langCode: string) => {
    setShowLanguageDialog(false);
    if (langCode === currentLanguage) return;

    try {
      // Switch UI language
      i18n.changeLanguage(langCode);
      // Switch Exam Content language (downloads if needed)
      await dispatch(switchExamLanguage(langCode)).unwrap();
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.downloadError', { msg: String(error) }));
    }
  };

  // Submit exam
  const navigateToResults = () => navigation.replace(ROUTES.EXAM_RESULTS, { examId });

  const handleSubmitExam = async () => {
    // sync timer before submit
    const delta = Math.max(0, startLeftRef.current - timeLeft);
    dispatch(updateTimeRemaining(timeLeft));
    dispatch(updateTimeSpent(timeSpentInSeconds + delta));

    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id] || answers[q.id].length === 0);

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        t('exam.unansweredQuestions'),
        t('exam.youHaveUnanswered', { count: unansweredQuestions.length }),
        [
          {
            text: t('exam.reviewQuestions'),
            onPress: () => {
              const firstUnansweredIndex = questions.findIndex(q => !answers[q.id] || answers[q.id].length === 0);
              if (firstUnansweredIndex >= 0) {
                dispatch(setCurrentQuestionIndex(firstUnansweredIndex));
              }
            },
          },
          {
            text: t('exam.submitAnyway'),
            onPress: () => dispatch(submitExam()),
            style: 'destructive',
          },
        ]
      );
      return;
    }

    if (flaggedQuestions.length > 0) {
      setShowFlaggedDialog(true);
      return;
    }

    try {
      await dispatch(submitExam()).unwrap();
      navigateToResults();
    } catch (err) {
      Alert.alert(t('exam.submitError', 'Could not submit exam'), String(err));
    }
  };

  const handleTimeUpSubmit = async () => {
    try {
      await dispatch(submitExam({ forceStatus: 'failed' })).unwrap();
      navigateToResults();
    } catch (err) {
      Alert.alert(t('exam.submitError', 'Could not submit exam'), String(err));
    }
  };

  // Go to a flagged question
  const handleGoToFlaggedQuestion = () => {
    setShowFlaggedDialog(false);

    // Prepare review of only flagged questions
    const order: number[] = questions
      .map((q, idx) => ({ q, idx }))
      .filter(item => flaggedQuestions.includes(item.q.id))
      .map(item => item.idx);

    if (order.length > 0) {
      setReviewFlaggedOnly(true);
      setFlaggedOrder(order);
      setFlaggedCursor(0);
      dispatch(setCurrentQuestionIndex(order[0]));
    }
  };

  // Render loading state
  if (loading && !currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('exam.loading')}</Text>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          {t('common.goBack')}
        </Button>
      </SafeAreaView>
    );
  }

  // If no current question, return empty view
  if (!currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text>{t('exam.noQuestions')}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          {t('common.goBack')}
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <IconButton
          icon={Platform.OS === 'ios' ? 'chevron-left' : 'arrow-left'}
          size={24}
          onPress={handleBackPress}
              accessibilityLabel={t('common.goBack')}
            />
            <Text variant="titleMedium">
              {t('exam.question')} {currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>
          <Text variant="titleMedium" style={styles.timer}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
      </View>

      {/* New Top Actions Row: Language & Flag */}
      <View style={styles.topActionsContainer}>
        <Button
          mode="outlined"
          onPress={() => setShowLanguageDialog(true)}
          style={styles.languageButton}
          contentStyle={styles.languageButtonContent}
          labelStyle={styles.languageButtonLabel}
          icon={isDownloadingLanguage ? () => <View style={{ marginRight: 8 }}><ActivityIndicator size={12} color={theme.colors.onSurface} /></View> : undefined}
        >
          {isDownloadingLanguage ? t('settings.downloadingLanguage') : currentLangName}
        </Button>

        <Button
          mode={isQuestionFlagged(currentQuestion.id) ? 'contained' : 'outlined'}
          onPress={handleToggleFlag}
          style={styles.languageButton}
          contentStyle={styles.languageButtonContent}
          labelStyle={styles.languageButtonLabel}
        >
          {isQuestionFlagged(currentQuestion.id) ? t('exam.unflag') : t('exam.flag')}
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <QuestionCard
          question={currentQuestion}
          selectedAnswers={answers[currentQuestion.id] || []}
          onSelectAnswer={(answerId) => handleAnswer(currentQuestion.id, answerId)}
          isFlagged={isQuestionFlagged(currentQuestion.id)}
          isFavorite={favoriteQuestions?.includes(currentQuestion.id)}
          onToggleFavorite={() => dispatch(toggleFavoriteQuestion(currentQuestion.id))}
          hideExplanation={examMode === 'mock'}
        />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtonsRow}>
          <Button
            mode="outlined"
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {t('exam.previous')}
          </Button>

          {reviewFlaggedOnly ? (
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {flaggedCursor < flaggedOrder.length - 1 ? t('exam.next') : t('exam.finishReview')}
            </Button>
          ) : currentQuestionIndex < questions.length - 1 ? (
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {t('exam.next')}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmitExam}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {t('exam.submit')}
            </Button>
          )}
        </View>
        {footerInset > 0 ? <View style={[styles.footerInset, { height: footerInset }]} /> : null}
      </View>

      {/* Language Selection Dialog */}
      <LanguageSelector
        visible={showLanguageDialog}
        onDismiss={() => setShowLanguageDialog(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleLanguageSelect}
        loading={isDownloadingLanguage}
        downloadProgress={downloadProgress}
      />

      {/* Flagged Questions Dialog */}
      <Portal>
        <Dialog visible={showFlaggedDialog} onDismiss={() => setShowFlaggedDialog(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>{t('exam.flaggedQuestionsTitle')}</Dialog.Title>
          <IconButton
            icon="close"
            size={18}
            onPress={() => setShowFlaggedDialog(false)}
            style={styles.dialogCloseIconButton}
            iconColor={theme.colors.onSurface}
          />
          <Dialog.Content>
            <Text style={styles.dialogContentText}>
              {t('exam.flaggedQuestionsMessage', { count: flaggedQuestions.length })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button mode="contained" onPress={handleGoToFlaggedQuestion} style={styles.dialogActionButton}>
              {t('exam.reviewFlagged', { count: flaggedQuestions.length })}
            </Button>
            <Button
              mode="outlined"
              onPress={async () => {
                setShowFlaggedDialog(false);
                try {
                  await dispatch(submitExam()).unwrap();
                  navigateToResults();
                } catch (err) {
                  Alert.alert(t('exam.submitError', 'Could not submit exam'), String(err));
                }
              }}
              textColor={theme.colors.primary}
              style={styles.dialogActionButton}
            >
              {t('exam.submitAnyway')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Time Warning Dialog */}
      <Portal>
        <Dialog visible={showTimeWarning} onDismiss={() => setShowTimeWarning(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>{t('exam.timeWarningTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('exam.timeWarningMessage')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTimeWarning(false)} textColor={theme.colors.primary}>{t('common.ok')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showTimeUpDialog} dismissable={false} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>{t('exam.timeUpTitle', "Time's Up")}</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogContentText}>
              {t('exam.timeUpMessage', 'You ran out of time. This attempt is marked as failed.')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button mode="contained" onPress={handleTimeUpSubmit} style={styles.dialogActionButton}>
              {t('exam.timeUpAction', 'View Results')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Exit Confirmation Dialog */}
      <Portal>
        <Dialog visible={showExitConfirmDialog} onDismiss={() => setShowExitConfirmDialog(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>{t('exam.exitConfirmTitle', 'Pause Exam?')}</Dialog.Title>
          <IconButton
            icon="close"
            size={18}
            onPress={() => setShowExitConfirmDialog(false)}
            style={styles.dialogCloseIconButton}
            iconColor={theme.colors.onSurface}
          />
          <Dialog.Content>
            <Text style={styles.dialogContentText}>
              {t('exam.exitConfirmMessage', 'Your progress will be saved. You can resume this exam later.')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowExitConfirmDialog(false)} 
              textColor={theme.colors.primary}
              style={styles.dialogActionButton}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handleExitExam} 
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              style={styles.dialogActionButton}
            >
              {t('common.exit', 'Exit')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default ExamScreen;
