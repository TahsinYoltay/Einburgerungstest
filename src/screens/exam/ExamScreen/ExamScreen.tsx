import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Button, Text, ProgressBar } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
 import QuestionCard from '../../../components/exam/QuestionCard/QuestionCard';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { styles } from './ExamScreen.style';

type ExamScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.EXAM>;
type ExamScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Sample question type
type Question = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
};

const ExamScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const route = useRoute<ExamScreenRouteProp>();
  const navigation = useNavigation<ExamScreenNavigationProp>();
  const { id } = route.params;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);

  // Sample questions - would come from API or JSON file
  const questions: Question[] = [
    {
      id: '1',
      text: 'What is the capital of the United Kingdom?',
      options: [
        { id: 'a', text: 'London' },
        { id: 'b', text: 'Edinburgh' },
        { id: 'c', text: 'Cardiff' },
        { id: 'd', text: 'Belfast' },
      ],
      correctAnswer: 'a',
    },
    {
      id: '2',
      text: 'Which of these is NOT a country in the United Kingdom?',
      options: [
        { id: 'a', text: 'England' },
        { id: 'b', text: 'Scotland' },
        { id: 'c', text: 'Ireland' },
        { id: 'd', text: 'Wales' },
      ],
      correctAnswer: 'c',
    },
    // More questions...
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex + 1) / questions.length;

  const handleAnswer = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const toggleFlag = () => {
    const questionId = currentQuestion.id;
    setFlaggedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const isFlagged = flaggedQuestions.includes(currentQuestion.id);
  const hasSelectedAnswer = !!selectedAnswers[currentQuestion.id];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium">
          {t('exam.question')} {currentQuestionIndex + 1}/{questions.length}
        </Text>
        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswers[currentQuestion.id]}
          onSelectAnswer={(answerId) => handleAnswer(currentQuestion.id, answerId)}
          isFlagged={isFlagged}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          {t('exam.previous')}
        </Button>

        <Button
          mode={isFlagged ? 'contained' : 'outlined'}
          onPress={toggleFlag}
          icon="flag"
        >
          {isFlagged ? t('exam.unflag') : t('exam.flag')}
        </Button>

        <Button
          mode="contained"
          onPress={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          {t('exam.next')}
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default ExamScreen;
