import React, { useEffect, useState, useMemo } from 'react';
import { View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, Button, Portal, Dialog, List, Divider } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTranslation } from 'react-i18next';

import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useAppTheme } from '../../providers/ThemeProvider';
import { toggleFavoriteQuestion, switchExamLanguage, hideQuestionFromReview } from '../../store/slices/examSlice';
import ReviewQuestionCard from '../../components/exam/ReviewQuestionCard/ReviewQuestionCard';
import SwipeDeck from '../../components/exam/SwipeDeck/SwipeDeck';
import { NormalizedQuestion } from '../../types/exam';
import { createStyles } from './ReviewQuestionsScreen.style';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigations/StackNavigator';

type RouteParams = {
  mode: 'favorites' | 'incorrect';
};

const ReviewQuestionsScreen = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const params = route.params as RouteParams;
  const mode = params?.mode || 'favorites';

  const favoriteIds = useAppSelector(state => state.exam.favoriteQuestions);
  const questionStats = useAppSelector(state => state.exam.questionStats);
  const chaptersData = useAppSelector(state => state.exam.chaptersData);
  const examHistory = useAppSelector(state => state.exam.examHistory);
  const { currentLanguage, isDownloadingLanguage } = useAppSelector(state => state.exam);
  const { languages: availableLanguages } = useAppSelector(state => state.content);

  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [userWrongAnswers, setUserWrongAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);

  const languages = availableLanguages;
  const currentLangName = languages.find(l => l.code === currentLanguage)?.nativeName || 'English';

  const currentQuestion = questions[currentIndex];
  const currentStats = currentQuestion ? questionStats[currentQuestion.id] : null;
  const isCurrentFavorite = currentQuestion ? favoriteIds.includes(currentQuestion.id) : false;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // ... existing load logic ...
      const allQuestionsMap: Record<string, NormalizedQuestion> = {};
      const dataAny = (chaptersData as any).data;
      if (dataAny) {
        Object.values(dataAny).forEach((ch: any) => {
           ch.questions.forEach((q: NormalizedQuestion) => {
             allQuestionsMap[q.id] = q;
           });
        });
      }

      let filteredQuestions: NormalizedQuestion[] = [];
      
      if (mode === 'favorites') {
         filteredQuestions = favoriteIds
            .map(id => allQuestionsMap[id])
            .filter(Boolean);
      } else {
         // Incorrect Mode: Filter where incorrect > 0 AND not hidden
         const incorrectIds = Object.entries(questionStats)
            .filter(([_, stats]) => stats.incorrect > 0 && !stats.hiddenFromIncorrectList)
            .map(([id]) => id);
         
         filteredQuestions = incorrectIds
            .map(id => allQuestionsMap[id])
            .filter(Boolean);

         const wrongMap: Record<string, string> = {};
         for (let i = examHistory.length - 1; i >= 0; i--) {
             const attempt = examHistory[i];
             attempt.answers.forEach(ans => {
                 if (!wrongMap[ans.questionId]) {
                     const q = allQuestionsMap[ans.questionId];
                     if (q) {
                         const correct = q.correct_option_indexes.map(x => x.toString());
                         const userPicked = ans.selectedAnswers[0];
                         if (userPicked && !correct.includes(userPicked)) {
                             wrongMap[ans.questionId] = userPicked;
                         }
                     }
                 }
             });
         }
         setUserWrongAnswers(wrongMap);
      }

      setQuestions(filteredQuestions);
      setCurrentIndex(0); // Reset index on reload
      setLoading(false);
    };

    loadData();
  }, [mode, favoriteIds, questionStats, chaptersData, examHistory]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleToggleFavorite = () => {
    if (currentQuestion) {
        dispatch(toggleFavoriteQuestion(currentQuestion.id));
    }
  };

  const handleRemoveFromReview = () => {
    if (currentQuestion) {
        dispatch(hideQuestionFromReview(currentQuestion.id));
    }
  };

  const handleLanguageSelect = async (langCode: string) => {
    setShowLanguageDialog(false);
    if (langCode === currentLanguage) return;

    try {
      i18n.changeLanguage(langCode);
      await dispatch(switchExamLanguage(langCode)).unwrap();
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.downloadError', { msg: String(error) }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
       {/* Custom Header */}
       <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
           <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
         </TouchableOpacity>
         <Text variant="titleMedium" style={styles.headerTitle}>
             {mode === 'favorites' ? t('exam.review.favoritesTitle') : t('exam.review.incorrectTitle')}
         </Text>
         <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.iconButton}>
           <Icon name="close" size={22} color={theme.colors.onBackground} />
         </TouchableOpacity>
       </View>

       {/* Top Actions Row */}
       <View style={styles.topActionsContainer}>
        {/* Left Group: Stats, Favorite, Hide */}
        <View style={styles.leftActions}>
            {/* Stats (First) */}
            {currentStats && (
                <View style={{ flexDirection: 'row', gap: 4 }}>
                    <View style={[styles.statBadge, { backgroundColor: '#E6F4EA' }]}>
                        <Icon name="check" size={20} color="#34A853" />
                        <Text style={[styles.statText, { color: '#34A853' }]}>{currentStats.correct}</Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: '#FCE8E6' }]}>
                        <Icon name="close" size={20} color="#D93025" />
                        <Text style={[styles.statText, { color: '#D93025' }]}>{currentStats.incorrect}</Text>
                    </View>
                </View>
            )}

            {/* Favorite Icon (Second) */}
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.outlinedButton}>
                <Icon 
                    name={isCurrentFavorite ? 'thumb-up' : 'thumb-up-outline'} 
                    size={20} 
                    color={isCurrentFavorite ? theme.colors.primary : theme.colors.onSurfaceVariant} 
                />
            </TouchableOpacity>

            {/* Hide/Delete Button (Incorrect Mode Only) (Third) */}
            {mode === 'incorrect' && (
                <TouchableOpacity onPress={handleRemoveFromReview} style={styles.outlinedButton}>
                    <Icon name="playlist-remove" size={20} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
            )}
        </View>

        {/* Right Group: Language */}
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
       </View>

       {/* Content */}
       <View style={styles.deckContainer}>
          {questions.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                {mode === 'favorites' 
                    ? t('exam.review.emptyFavorites') 
                    : t('exam.review.emptyIncorrect')}
                </Text>
                <Button mode="contained" onPress={() => navigation.goBack()}>
                  {t('common.goBack', 'Go Back')}
                </Button>
            </View>
          ) : (
            <SwipeDeck
                data={questions}
                onIndexChange={setCurrentIndex}
                renderCard={(item, index) => (
                    <ReviewQuestionCard 
                        question={item}
                        mode={mode}
                        userWrongAnswerId={userWrongAnswers[item.id]}
                        // Pass minimal props as controls are now external
                    />
                )}
                onSwipeLeft={() => {}}
                onSwipeRight={() => {}}
                onFinished={() => {
                    navigation.goBack();
                }}
                containerStyle={styles.swipeDeck}
            />
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
    </SafeAreaView>
  );
};

export default ReviewQuestionsScreen;
