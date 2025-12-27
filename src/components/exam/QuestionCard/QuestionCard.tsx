import React, { useState, useMemo } from 'react';
import { View, Image, Pressable } from 'react-native';
import { Card, Text, IconButton, Divider } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { createStyles } from './QuestionCard.style';
import { NormalizedQuestion } from '../../../types/exam';
import Icon from '@react-native-vector-icons/material-design-icons';

type QuestionCardProps = {
  question: NormalizedQuestion;
  selectedAnswers?: string[];
  onSelectAnswer: (answerId: string) => void;
  isFlagged: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  hideExplanation?: boolean;
};

const QuestionCard = ({
  question,
  selectedAnswers = [],
  onSelectAnswer,
  isFlagged,
  isFavorite = false,
  onToggleFavorite,
  hideExplanation = false,
}: QuestionCardProps) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showExplanation, setShowExplanation] = useState(false);
  const canShowExplanation = !hideExplanation && (question.hint || question.explanation);
  
  const palette = {
    primary: theme.colors.primary,
    selectedBg: theme.colors.secondaryContainer, // Use container color for selected state
    border: theme.colors.outline,
    text: theme.colors.onSurface,
  };

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
              style={[
                styles.tileContainer,
                { borderColor: selected ? palette.primary : palette.border },
                selected && { borderWidth: 2, backgroundColor: palette.selectedBg },
              ]}
              android_ripple={{ color: palette.selectedBg }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.optionText,
                    { color: selected ? theme.colors.onSecondaryContainer : palette.text },
                    selected && { fontWeight: '600' },
                  ]}
                  numberOfLines={0}
                >
                  {option}
                </Text>
              </View>
              {selected && <Icon name="check-circle" size={24} color={palette.primary} />}
            </Pressable>
          );
        })}

        {/* Hint/Explanation + Favorite aligned on bottom row */}
        {(canShowExplanation || onToggleFavorite) && (
          <View style={styles.explainButtonContainer}>
            {canShowExplanation ? (
              <Pressable
                onPress={() => setShowExplanation(!showExplanation)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Icon
                  name="lightbulb-outline"
                  size={22} // Matched size with favorite icon
                  color={theme.colors.primary}
                />
                <Text style={styles.hintText}>
                  {showExplanation ? t('exam.hideHint') : t('exam.showHint')}
                </Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {onToggleFavorite && (
              <IconButton
                icon={isFavorite ? 'thumb-up' : 'thumb-up-outline'}
                size={22}
                iconColor={isFavorite ? theme.colors.primary : theme.colors.onSurfaceVariant}
                onPress={() => {
                  onToggleFavorite();
                }}
                style={{ margin: 0 }}
              />
            )}
          </View>
        )}

        {/* Explanation content only shown when expanded */}
        {canShowExplanation && showExplanation && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationTitle}>{t('exam.explanation')}</Text>
              {question.hint && <Text style={styles.explanationText}>{question.hint}</Text>}
              {question.explanation && <Text style={styles.explanationText}>{question.explanation}</Text>}
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

export default QuestionCard;
