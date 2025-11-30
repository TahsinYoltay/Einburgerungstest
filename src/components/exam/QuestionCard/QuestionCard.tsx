import React, { useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { Card, Text, IconButton, Divider } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { styles } from './QuestionCard.style';
import { NormalizedQuestion } from '../../../types/exam';
import Icon from '@react-native-vector-icons/material-design-icons';

type QuestionCardProps = {
  question: NormalizedQuestion;
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

  // Reset explanation when question changes
  React.useEffect(() => {
    setShowExplanation(false);
  }, [question.id]);

  const isOptionSelected = (optionId: string) => selectedAnswers.includes(optionId);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.questionHeader}>
          <Text variant="titleLarge" style={styles.questionText}>
            {question.prompt}
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
        {question.media?.image_url && (
          <View style={styles.imagesContainer}>
            <Image
              source={{ uri: question.media.image_url }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Question options */}
        {question.options.map((option, idx) => {
          const optionId = idx.toString();
          const selected = isOptionSelected(optionId);
          return (
            <Pressable
              key={optionId}
              onPress={() => onSelectAnswer(optionId)}
              style={[styles.tileContainer, selected && styles.tileSelected]}
              android_ripple={{ color: '#E8F0FE' }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.optionText, selected && styles.optionTextSelected]}
                  numberOfLines={0}
                >
                  {option}
                </Text>
              </View>
              {selected && <Icon name="check-circle" size={24} color="#1A73E8" />}
            </Pressable>
          );
        })}

        {/* Hint/Explanation button */}
        {(question.hint || question.explanation) && (
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
        {(question.hint || question.explanation) && showExplanation && (
          <View style={styles.explanationContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.explanationTitle}>{t('exam.explanation')}</Text>
            {question.hint && <Text style={styles.explanationText}>{question.hint}</Text>}
            {question.explanation && <Text style={styles.explanationText}>{question.explanation}</Text>}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default QuestionCard;
