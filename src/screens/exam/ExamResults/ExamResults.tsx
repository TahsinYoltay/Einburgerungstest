import React, { useMemo, useState } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Text, Button, Card, Divider, List, IconButton } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { resetExam, toggleFavoriteQuestion } from '../../../store/slices/examSlice';
import { createStyles } from './ExamResults.style';
import { NormalizedQuestion } from '../../../types/exam';

type ExamResultsRouteProp = RouteProp<RootStackParamList, typeof ROUTES.EXAM_RESULTS>;
type ExamResultsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExamResults = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<ExamResultsNavigationProp>();
  const route = useRoute<ExamResultsRouteProp>();
  const dispatch = useAppDispatch();
  const { examId } = route.params;

  // Get results from the store, including dynamic chapters data
  const { examHistory, exams, currentExam, favoriteQuestions, chaptersData } = useAppSelector(state => state.exam);

  // Find this exam's latest attempt (search backwards for the most recent)
  const lastAttempt =
    [...examHistory].reverse().find(attempt => attempt.examId === examId) ||
    (currentExam.examId === examId && currentExam.examCompleted
      ? {
          examId,
          score: 0,
          correctAnswers: 0,
          totalQuestions: currentExam.questions.length,
          flaggedQuestions: currentExam.flaggedQuestions,
          timeSpentInSeconds: currentExam.timeSpentInSeconds,
          status: 'failed',
          answers: [],
          id: 'temp',
          startTime: currentExam.startTime || new Date().toISOString(),
        }
      : undefined);

  // Find exam details
  const examDetails = exams.find(exam => exam.id === examId);

  // Format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}${t('common.minutes_short')} ${remainingSeconds}${t('common.seconds_short')}`;
  };

  const passMarkPct = Math.round((examDetails?.pass_mark ?? 0.75) * 100);
  const isPassing = lastAttempt?.score !== undefined ? lastAttempt.score >= passMarkPct : false;
  const totalCorrect = lastAttempt?.correctAnswers || 0;
  const totalQuestions = lastAttempt?.totalQuestions || 0;
  const timeSpent = lastAttempt?.timeSpentInSeconds || 0;
  const flaggedCount = lastAttempt?.flaggedQuestions?.length || 0;

  // If no attempt found
  if (!lastAttempt || !examDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon={Platform.OS === 'ios' ? 'chevron-left' : 'arrow-left'}
            size={28}
            iconColor={theme.colors.onSurface}
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('common.goBack', 'Go Back')}
          />
        </View>
        <View style={styles.errorView}>
          <Text style={styles.errorText}>{t('exam.noResultsFound')}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            {t('common.goToHome', 'Go Home')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Build a question index for review using dynamic chapters data
  const questionIndex = useMemo(() => {
    const map: Record<string, NormalizedQuestion> = {};
    
    // Use chaptersData from Redux state instead of static import
    const chaptersDataAny = (chaptersData as any).data;
    
    if (chaptersDataAny) {
      Object.values(chaptersDataAny).forEach((ch: any) => {
        ch.questions.forEach((q: any) => {
          map[q.id] = q;
        });
      });
    }
    return map;
  }, [chaptersData]);

  const wrongQuestions = useMemo(() => {
    if (!lastAttempt) return [];
    return (lastAttempt.answers || []).filter(ans => {
      const q = questionIndex[ans.questionId];
      if (!q) return false;
      const correct = q.correct_option_indexes.map((idx: number) => idx.toString());
      const selected = ans.selectedAnswers || [];
      const allCorrect = correct.every((c: string) => selected.includes(c));
      const noIncorrect = selected.every((s: string) => correct.includes(s));
      return !(allCorrect && noIncorrect);
    });
  }, [lastAttempt, questionIndex]);

  const [showReview, setShowReview] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <IconButton
                icon={Platform.OS === 'ios' ? 'chevron-left' : 'arrow-left'}
                size={28}
                iconColor={theme.colors.onSurface}
                onPress={() => navigation.goBack()}
                accessibilityLabel={t('common.goBack', 'Go Back')}
                style={{ margin: 0, marginLeft: -12 }} 
              />
              <Text variant="headlineMedium" style={[styles.resultTitle, { marginBottom: 0, flex: 1 }]}>
                {isPassing ? t('exam.passed', 'Passed') : t('exam.failed', 'Failed')}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View
              style={[
                styles.scoreCircle,
                { backgroundColor: isPassing ? '#34C759' : theme.colors.error },
              ]}
            >
              <Text style={styles.scoreText}>{lastAttempt.score}%</Text>
            </View>

            <Text variant="bodyMedium" style={styles.passText}>
              {t('exam.passingScore', 'Passing Score')}: {passMarkPct}%
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('exam.examDetails', 'Exam Details')}
            </Text>

            <List.Item
              title={t('exam.examName', 'Exam Name')}
              description={examDetails.title || examId}
              left={props => <List.Icon {...props} icon="book" />}
            />

            <List.Item
              title={t('exam.totalQuestions', 'Total Questions')}
              description={`${totalQuestions} ${t('exam.questions', 'Questions')}`}
              left={props => <List.Icon {...props} icon="format-list-bulleted" />}
            />

            <List.Item
              title={t('exam.correctAnswers', 'Correct Answers')}
              description={`${totalCorrect} / ${totalQuestions}`}
              left={props => <List.Icon {...props} icon="check-circle" />}
            />

            <List.Item
              title={t('exam.timeSpent', 'Time Spent')}
              description={formatTime(timeSpent)}
              left={props => <List.Icon {...props} icon="clock" />}
            />

            <List.Item
              title={t('exam.flaggedQuestions', 'Flagged Questions')}
              description={`${flaggedCount} ${t('exam.questions', 'Questions')}`}
              left={props => <List.Icon {...props} icon="flag" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.reviewHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('exam.wrongAnswers', 'Wrong answers')}
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowReview(prev => !prev)}
                disabled={wrongQuestions.length === 0}
              >
                {wrongQuestions.length === 0
                  ? t('exam.none', 'None')
                  : showReview
                  ? t('exam.hideReview', 'Hide')
                  : t('exam.reviewWrong', 'Review')}
              </Button>
            </View>

            {showReview && wrongQuestions.length > 0 && (
              <View style={styles.reviewList}>
                {wrongQuestions.map(ans => {
                  const q = questionIndex[ans.questionId];
                  if (!q) return null;
                  const isFav = favoriteQuestions?.includes(ans.questionId);
                  return (
                    <View key={ans.questionId} style={styles.reviewCard}>
                      <Button
                        icon={isFav ? 'thumb-up' : 'thumb-up-outline'}
                        compact
                        mode="text"
                        textColor={isFav ? theme.colors.primary : '#6B7280'}
                        contentStyle={styles.reviewFavButtonContent}
                        style={styles.reviewFavButton}
                        children={undefined}    
                        onPress={() => dispatch(toggleFavoriteQuestion(ans.questionId))}
                      />
                      <View style={styles.reviewCardHeader}>
                        <Text style={styles.reviewPrompt}>{q.prompt}</Text>
                      </View>
                      {q.options.map((opt: string, idx: number) => {
                        const isCorrect = q.correct_option_indexes.includes(idx);
                        const isSelected = (ans.selectedAnswers || []).includes(idx.toString());
                        const state =
                          isCorrect && isSelected
                            ? 'correct'
                            : isCorrect
                            ? 'answer'
                            : isSelected
                            ? 'wrong'
                            : 'neutral';
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.reviewOption,
                              state === 'correct' && styles.reviewOptionCorrect,
                              state === 'answer' && styles.reviewOptionAnswer,
                              state === 'wrong' && styles.reviewOptionWrong,
                            ]}
                          >
                            <Text style={styles.reviewOptionText}>{opt}</Text>
                            <Text style={styles.reviewOptionIcon}>
                              {state === 'correct' || state === 'answer' ? '✓' : state === 'wrong' ? '✕' : ''}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => {
              dispatch(resetExam());
              navigation.reset({
                index: 0,
                routes: [{ name: ROUTES.HOME }],
              });
            }}
          >
            {t('common.goToHome', 'Go to Home')}
          </Button>

          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => {
              dispatch(resetExam());
              navigation.replace(ROUTES.EXAM, { id: examId, restart: true });
            }}
          >
            {t('exam.retakeExam', 'Retake Exam')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExamResults;