import React, { useMemo, useState } from 'react';
import { View, Image, ScrollView, Dimensions } from 'react-native';
import { Card, Text, IconButton, Button, Divider, Chip } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { NormalizedQuestion } from '../../../types/exam';
import Icon from '@react-native-vector-icons/material-design-icons';
import { createStyles } from './ReviewQuestionCard.style';

type ReviewQuestionCardProps = {
  question: NormalizedQuestion;
  mode: 'favorites' | 'incorrect';
  userWrongAnswerId?: string; // For incorrect mode
};

const ReviewQuestionCard = ({
  question,
  mode,
  userWrongAnswerId,
}: ReviewQuestionCardProps) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  // Explanation logic:
  // 1. Always closed by default.
  // 2. Can be toggled.
  const [showExplanation, setShowExplanation] = useState(false);
  
  // In favorites mode, user must press to reveal answer logic.
  // In incorrect mode, we typically show the comparison immediately, BUT explanation text should still be hidden.
  const [isRevealed, setIsRevealed] = useState(mode === 'incorrect');

  // Reset local state when question changes
  React.useEffect(() => {
    setShowExplanation(false); // Always hide explanation on new question
    if (mode === 'favorites') {
      setIsRevealed(false);
    } else {
      setIsRevealed(true);
    }
  }, [question.id, mode]);

  const correctAnswers = question.correct_option_indexes.map(i => i.toString());

  const getOptionStyle = (optionId: string) => {
    const isCorrect = correctAnswers.includes(optionId);
    const isSelectedWrong = optionId === userWrongAnswerId;

    if (!isRevealed) return styles.tileContainer;

    if (isCorrect) {
      return [styles.tileContainer, styles.correctOption];
    }
    if (isSelectedWrong) {
      return [styles.tileContainer, styles.wrongOption];
    }
    return styles.tileContainer;
  };

  const getTextStyle = (optionId: string) => {
      const isCorrect = correctAnswers.includes(optionId);
      const isSelectedWrong = optionId === userWrongAnswerId;
      
      if (!isRevealed) return styles.optionText;

      if (isCorrect) return [styles.optionText, styles.correctText];
      if (isSelectedWrong) return [styles.optionText, styles.wrongText];
      return styles.optionText;
  };

  return (
    <Card style={styles.card}>
       <ScrollView 
         contentContainerStyle={styles.scrollContent} 
         showsVerticalScrollIndicator={false}
         nestedScrollEnabled={true} // Important for nested interactions
       >
          <Card.Content>
            <View style={styles.questionHeader}>
              <Text variant="titleLarge" style={styles.questionText}>
                {question.prompt}
              </Text>
            </View>

            {question.media?.image_url && (
              <View style={styles.imagesContainer}>
                <Image
                  source={{ uri: question.media.image_url }}
                  style={styles.questionImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {question.options.map((option, idx) => {
              const optionId = idx.toString();
              const isCorrect = correctAnswers.includes(optionId);
              const isSelectedWrong = optionId === userWrongAnswerId;

              return (
                <View
                  key={optionId}
                  style={getOptionStyle(optionId)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={getTextStyle(optionId)} numberOfLines={0}>
                      {option}
                    </Text>
                  </View>
                  {isRevealed && isCorrect && (
                    <Icon name="check-circle" size={24} color={theme.colors.primary} />
                  )}
                  {isRevealed && isSelectedWrong && (
                    <Icon name="close-circle" size={24} color={theme.colors.error} />
                  )}
                </View>
              );
            })}

            <View style={styles.actionContainer}>
                {mode === 'favorites' && !isRevealed && (
                    <Button 
                        mode="contained" 
                        onPress={() => setIsRevealed(true)}
                        style={styles.revealButton}
                    >
                        {t('exam.review.revealAnswer')}
                    </Button>
                )}
                
                {/* Bottom Actions Row */}
                <View style={styles.bottomActions}>
                    {/* Explanation Toggle */}
                    {(question.hint || question.explanation) && (
                        <Button 
                            icon={showExplanation ? "chevron-up" : "lightbulb-outline"}
                            mode="text"
                            onPress={() => setShowExplanation(!showExplanation)}
                            compact
                        >
                            {showExplanation ? t('exam.hideHint') : t('exam.showHint')}
                        </Button>
                    )}
                </View>
            </View>

            {/* Explanation Content */}
            {(question.hint || question.explanation) && showExplanation && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>{t('exam.explanation')}</Text>
                  {question.explanation && <Text style={styles.explanationText}>{question.explanation}</Text>}
                </View>
              </>
            )}
          </Card.Content>
      </ScrollView>
    </Card>
  );
};

export default ReviewQuestionCard;
