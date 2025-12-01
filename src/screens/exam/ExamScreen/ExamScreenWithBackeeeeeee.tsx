import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Button, Text, ProgressBar, Dialog, Portal, IconButton } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuestionCard from '../../../components/exam/QuestionCard/QuestionCard';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { styles } from './ExamScreen.style';
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
} from '../../../store/slices/examSlice';

type ExamScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.EXAM>;
type ExamScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExamScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const route = useRoute<ExamScreenRouteProp>();
  const navigation = useNavigation<ExamScreenNavigationProp>();
  const dispatch = useAppDispatch();

  // Get the exam ID from route params
  const { id: examId } = route.params;

  // Get exam state from Redux
  const {
    loading,
    error,
    currentExam: {
      questions,
      currentQuestionIndex,
      answers,
      flaggedQuestions,
      timeRemaining,
      examStarted,
      examCompleted,
    },
  } = useAppSelector(state => state.exam);

  // Local state for UI
  const [showFlaggedDialog, setShowFlaggedDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showExitConfirmDialog, setShowExitConfirmDialog] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  // Calculate progress
  const progress = questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0;

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check if the current question has been answered
  const isCurrentQuestionAnswered = (): boolean => {
    if (!currentQuestion) {return false;}
    const questionAnswers = answers[currentQuestion.id];
    return !!questionAnswers && questionAnswers.length > 0;
  };

  // Check if the question is flagged
  const isQuestionFlagged = (questionId: string): boolean => {
    return flaggedQuestions.includes(questionId);
  };

  // Initialize the exam
  useEffect(() => {
    if (examId && !examStarted) {
      dispatch(startExam({ examId }));
      dispatch(loadExamQuestions(examId));
    }
  }, [dispatch, examId, examStarted]);

  // Setup timer
  useEffect(() => {
    if (examStarted && !examCompleted) {
      timerRef.current = setInterval(() => {
        dispatch(tickTime());
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [dispatch, examStarted, examCompleted]);

  // Handle exam completion
  useEffect(() => {
    if (examCompleted) {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Navigate to results
      navigation.navigate(ROUTES.EXAM_RESULTS, { examId });
    }
  }, [examCompleted, navigation, examId]);

  // Handle question answer
  const handleAnswer = (questionId: string, answerId: string) => {
    dispatch(answerQuestion({
      questionId,
      answerId,
      isMultiple: currentQuestion?.type === 'multiple',
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

    dispatch(goToNextQuestion());
  };

  // Handle back button press
  const handleBackPress = () => {
    // If exam has started but not completed, show confirmation dialog
    if (examStarted && !examCompleted) {
      setShowExitConfirmDialog(true);
    } else {
      navigation.goBack();
    }
  };

  // Handle exit confirmation
  const handleExitExam = () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setShowExitConfirmDialog(false);
    navigation.goBack();
  };

  // Handle flag toggling
  const handleToggleFlag = () => {
    if (currentQuestion) {
      dispatch(toggleFlagQuestion(currentQuestion.id));
    }
  };

  // Submit exam
  const navigateToResults = () => navigation.navigate(ROUTES.EXAM_RESULTS, { examId });

  const handleSubmitExam = async () => {
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
              // Go to first unanswered question
              const firstUnansweredIndex = questions.findIndex(q => !answers[q.id] || answers[q.id].length === 0);
              if (firstUnansweredIndex >= 0) {
                dispatch(setCurrentQuestionIndex(firstUnansweredIndex));
              }
            },
          },
          {
            text: t('exam.submitAnyway'),
            onPress: async () => {
              try {
                await dispatch(submitExam()).unwrap();
                navigateToResults();
              } catch (err) {
                Alert.alert(t('exam.submitError', 'Could not submit exam'), String(err));
              }
            },
            style: 'destructive',
          },
        ]
      );
      return;
    }

    // Check if there are flagged questions
    if (flaggedQuestions.length > 0) {
      setShowFlaggedDialog(true);
      return;
    }

    // Submit
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

    // Find the first flagged question
    const flaggedIndex = questions.findIndex(q => flaggedQuestions.includes(q.id));
    if (flaggedIndex >= 0) {
      dispatch(setCurrentQuestionIndex(flaggedIndex));
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
            {formatTime(timeRemaining)}
          </Text>
        </View>
        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <QuestionCard
          question={currentQuestion}
          selectedAnswers={answers[currentQuestion.id] || []}
          onSelectAnswer={(answerId) => handleAnswer(currentQuestion.id, answerId)}
          isFlagged={isQuestionFlagged(currentQuestion.id)}
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

        <Button
          mode={isQuestionFlagged(currentQuestion.id) ? 'contained' : 'outlined'}
          onPress={handleToggleFlag}
          icon="flag"
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {isQuestionFlagged(currentQuestion.id) ? t('exam.unflag') : t('exam.flag')}
        </Button>

        {currentQuestionIndex < questions.length - 1 ? (
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

      {/* Flagged Questions Dialog */}
      <Portal>
        <Dialog visible={showFlaggedDialog} onDismiss={() => setShowFlaggedDialog(false)}>
          <Dialog.Title>{t('exam.flaggedQuestionsTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('exam.flaggedQuestionsMessage', { count: flaggedQuestions.length })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleGoToFlaggedQuestion}>{t('exam.reviewFlagged')}</Button>
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
            >
              {t('exam.submitAnyway')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Time Warning Dialog */}
      <Portal>
        <Dialog visible={showTimeWarning} onDismiss={() => setShowTimeWarning(false)}>
          <Dialog.Title>{t('exam.timeWarningTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('exam.timeWarningMessage')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTimeWarning(false)}>{t('common.ok')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Exit Confirmation Dialog */}
      <Portal>
        <Dialog visible={showExitConfirmDialog} onDismiss={() => setShowExitConfirmDialog(false)}>
          <Dialog.Title>{t('exam.exitConfirmTitle', 'Exit Exam')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('exam.exitConfirmMessage', 'Are you sure you want to exit the exam? Your progress will not be saved.')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExitConfirmDialog(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onPress={handleExitExam} textColor={theme.colors.error}>{t('common.exit', 'Exit')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default ExamScreen;
