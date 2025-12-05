import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Button, Text, ProgressBar, Dialog, Portal, IconButton, List, Divider, RadioButton } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { languageManager } from '../../../services/LanguageManager';

type ExamScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.EXAM>;
type ExamScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExamScreen = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const route = useRoute<ExamScreenRouteProp>();
  const navigation = useNavigation<ExamScreenNavigationProp>();
  const dispatch = useAppDispatch();

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
  } = useAppSelector(state => state.exam);
  
  const { languages: availableLanguages } = useAppSelector(state => state.content);

  const {
    questions,
    currentQuestionIndex,
    answers,
    flaggedQuestions,
    timeRemaining,
    timeSpentInSeconds,
    examStarted,
    examCompleted,
    examId: currentExamId,
  } = currentExam;

  // Local state for UI
  const [showFlaggedDialog, setShowFlaggedDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showExitConfirmDialog, setShowExitConfirmDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [reviewFlaggedOnly, setReviewFlaggedOnly] = useState(false);
  const [flaggedOrder, setFlaggedOrder] = useState<number[]>([]);
  const [flaggedCursor, setFlaggedCursor] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeRemaining);

  const languages = availableLanguages;
  const currentLangName = languages.find(l => l.code === currentLanguage)?.nativeName || 'English';

  // References
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startLeftRef = useRef(timeRemaining);
  const timeLeftRef = useRef(timeRemaining);
  const initialSpentRef = useRef(timeSpentInSeconds);

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
      currentExam.questions.length === 0 ||
      (restart && !examCompleted);
    if (needsQuestions) {
      dispatch(loadExamQuestions(examId));
    }
  }, [dispatch, examId, restart, currentExamId, currentExam.questions.length, examCompleted]);

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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      dispatch(submitExam());
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
    <SafeAreaView style={styles.container}>
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
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('exam.previous')}
        </Button>

        {/* Removed Flag button from here */}

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

      {/* Language Selection Dialog */}
      <Portal>
        <Dialog visible={showLanguageDialog} onDismiss={() => setShowLanguageDialog(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>{t('settings.language')}</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400, paddingHorizontal: 0 }}>
            <ScrollView>
              {languages.map((lang, index) => (
                <React.Fragment key={lang.code}>
                  <List.Item
                    title={lang.nativeName}
                    description={lang.name}
                    titleStyle={{ color: theme.colors.onSurface }}
                    descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                    onPress={() => handleLanguageSelect(lang.code)}
                    right={props => lang.code === currentLanguage && <List.Icon {...props} icon="check" color={theme.colors.primary} />}
                  />
                  {index < languages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowLanguageDialog(false)} textColor={theme.colors.primary}>{t('common.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Flagged Questions Dialog */}
      <Portal>
        <Dialog visible={showFlaggedDialog} onDismiss={() => setShowFlaggedDialog(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>{t('exam.flaggedQuestionsTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('exam.flaggedQuestionsMessage', { count: flaggedQuestions.length })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleGoToFlaggedQuestion} textColor={theme.colors.primary}>
              {t('exam.reviewFlagged', { count: flaggedQuestions.length })}
            </Button>
            <Button
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

      {/* Exit Confirmation Dialog */}
      <Portal>
        <Dialog visible={showExitConfirmDialog} onDismiss={() => setShowExitConfirmDialog(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface, textAlign: 'center' }}>{t('exam.exitConfirmTitle', 'Pause Exam?')}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {t('exam.exitConfirmMessage', 'Your progress will be saved. You can resume this exam later.')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 }}>
            <Button 
              mode="outlined" 
              onPress={() => setShowExitConfirmDialog(false)} 
              textColor={theme.colors.primary}
              style={{ flex: 1, marginRight: 8 }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handleExitExam} 
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              style={{ flex: 1, marginLeft: 8 }}
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
