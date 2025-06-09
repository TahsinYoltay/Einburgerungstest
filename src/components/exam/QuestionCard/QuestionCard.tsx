import React from 'react';
import { View } from 'react-native';
import { Card, Text, RadioButton, IconButton } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { styles } from './QuestionCard.style';

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  options: Option[];
};

type QuestionCardProps = {
  question: Question;
  selectedAnswer?: string;
  onSelectAnswer: (answerId: string) => void;
  isFlagged: boolean;
};

const QuestionCard = ({ 
  question, 
  selectedAnswer, 
  onSelectAnswer,
  isFlagged
}: QuestionCardProps) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

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
        
        <RadioButton.Group
          onValueChange={onSelectAnswer}
          value={selectedAnswer || ''}
        >
          {question.options.map((option) => (
            <View key={option.id} style={styles.optionContainer}>
              <RadioButton.Item
                label={option.text}
                value={option.id}
                labelStyle={styles.optionText}
                position="leading"
              />
            </View>
          ))}
        </RadioButton.Group>
      </Card.Content>
    </Card>
  );
};

export default QuestionCard;