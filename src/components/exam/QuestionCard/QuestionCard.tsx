import React, { useState } from 'react';
import { View, Image, Platform } from 'react-native';
import { Card, Text, RadioButton, IconButton, Checkbox, Divider } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { styles } from './QuestionCard.style';

type Option = {
  id: string;
  text: string;
  image?: string;
};

type Question = {
  id: string;
  text: string;
  options: Option[];
  type: 'single' | 'multiple';
  correctAnswers: string[];
  images?: string[];
  video?: string;
  explanation?: string;
};

type QuestionCardProps = {
  question: Question;
  selectedAnswers?: string[];
  onSelectAnswer: (answerId: string) => void;
  isFlagged: boolean;
};

const QuestionCard = ({
  question,
  selectedAnswers = [],
  onSelectAnswer,
  isFlagged,
}: QuestionCardProps) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const [showExplanation, setShowExplanation] = useState(false);

  // Function to handle option selection for multiple choice questions
  const handleMultipleChoice = (answerId: string) => {
    onSelectAnswer(answerId);
  };

  // Function to check if an option is selected
  const isOptionSelected = (optionId: string) => {
    return selectedAnswers.includes(optionId);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.questionHeader}>
          <Text variant="titleLarge" style={styles.questionText}>
            {question.text}
          </Text>
          {isFlagged && (
            <IconButton
              icon="flag"
              size={20}
              iconColor={theme.colors.error}
            />
          )}
        </View>

        {/* Display images if any */}
        {question.images && question.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {question.images.map((imageUrl, index) => (
              <Image
                key={`img-${index}`}
                source={{ uri: imageUrl }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ))}
          </View>
        )}

        {/* Display video if any */}
        {question.video && (
          <View style={styles.videoContainer}>
            <Text style={styles.videoText}>{t('exam.videoQuestion')}</Text>
            {/* In a real implementation, you would use a video player component here */}
          </View>
        )}

        {/* Question options */}
        {question.type === 'single' ? (
          // Single choice question
          <RadioButton.Group
            onValueChange={onSelectAnswer}
            value={selectedAnswers.length ? selectedAnswers[0] : ''}
          >
            {question.options.map((option) => (
              <View key={option.id} style={styles.optionContainer}>
                <RadioButton.Item
                  label={option.text}
                  value={option.id}
                  labelStyle={styles.optionText}
                  position="leading"
                  style={styles.optionItem}
                />
                {option.image && (
                  <Image
                    source={{ uri: option.image }}
                    style={styles.optionImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            ))}
          </RadioButton.Group>
        ) : (
          // Multiple choice question
          <View>
            <Text style={styles.multipleChoiceHeader}>
              {t('exam.selectMultiple')}
            </Text>
            {question.options.map((option) => (
              <View key={option.id} style={styles.optionContainer}>
                <Checkbox.Item
                  label={option.text}
                  status={isOptionSelected(option.id) ? 'checked' : 'unchecked'}
                  onPress={() => handleMultipleChoice(option.id)}
                  position="leading"
                  style={styles.optionItem}
                />
                {option.image && (
                  <Image
                    source={{ uri: option.image }}
                    style={styles.optionImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Explanation button only shown if explanation exists */}
        {question.explanation && (
          <View style={styles.explainButtonContainer}>
            <IconButton
              icon="lightbulb-outline"
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => setShowExplanation(!showExplanation)}
              style={styles.hintButton}
            />
            <Text
              style={styles.hintText}
              onPress={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? t('exam.hideHint') : t('exam.showHint')}
            </Text>
          </View>
        )}

        {/* Explanation content only shown when expanded */}
        {question.explanation && showExplanation && (
          <View style={styles.explanationContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.explanationTitle}>{t('exam.explanation')}</Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default QuestionCard;
