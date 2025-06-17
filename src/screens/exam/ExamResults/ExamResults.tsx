import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card, Divider, List } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppSelector } from '../../../store/hooks';

type ExamResultsRouteProp = RouteProp<RootStackParamList, typeof ROUTES.EXAM_RESULTS>;
type ExamResultsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExamResults = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation<ExamResultsNavigationProp>();
  const route = useRoute<ExamResultsRouteProp>();
  const { examId } = route.params;

  // Get results from the store
  const { examHistory, exams, currentExam } = useAppSelector(state => state.exam);

  // Find this exam's latest attempt
  const lastAttempt = examHistory.find(
    attempt => attempt.examId === examId
  );

  // Find exam details
  const examDetails = exams.find(exam => exam.id === examId);

  // Format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Stats data
  const isPassing = lastAttempt?.score && lastAttempt?.score >= 75;
  const totalCorrect = lastAttempt?.correctAnswers || 0;
  const totalQuestions = lastAttempt?.totalQuestions || 0;
  const timeSpent = lastAttempt?.timeSpentInSeconds || 0;
  const flaggedCount = lastAttempt?.flaggedQuestions?.length || 0;

  // If no attempt found
  if (!lastAttempt || !examDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorView}>
          <Text style={styles.errorText}>{t('exam.noResultsFound')}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            {t('common.goToHome')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.resultCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.resultTitle}>
              {isPassing ? t('exam.passed') : t('exam.failed')}
            </Text>

            <View style={[
              styles.scoreCircle,
              { backgroundColor: isPassing ? theme.colors.primary : theme.colors.error },
            ]}>
              <Text style={styles.scoreText}>{lastAttempt.score}%</Text>
            </View>

            <Text variant="bodyMedium" style={styles.passText}>
              {t('exam.passingScore')}: {examDetails.passingScore}%
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('exam.examDetails')}
            </Text>

            <List.Item
              title={t('exam.examName')}
              description={examDetails.name}
              left={props => <List.Icon {...props} icon="book" />}
            />

            <List.Item
              title={t('exam.totalQuestions')}
              description={`${totalQuestions} ${t('exam.questions')}`}
              left={props => <List.Icon {...props} icon="help-circle" />}
            />

            <List.Item
              title={t('exam.correctAnswers')}
              description={`${totalCorrect} / ${totalQuestions}`}
              left={props => <List.Icon {...props} icon="check-circle" />}
            />

            <List.Item
              title={t('exam.timeSpent')}
              description={formatTime(timeSpent)}
              left={props => <List.Icon {...props} icon="clock" />}
            />

            <List.Item
              title={t('exam.flaggedQuestions')}
              description={`${flaggedCount} ${t('exam.questions')}`}
              left={props => <List.Icon {...props} icon="flag" />}
            />
          </Card.Content>
        </Card>

        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            {t('common.goToHome')}
          </Button>

          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => navigation.navigate(ROUTES.EXAM, { id: examId })}
          >
            {t('exam.retakeExam')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  resultCard: {
    marginBottom: 16,
    elevation: 2,
  },
  resultTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  scoreText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  passText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default ExamResults;
