import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { createStyles } from './HomeScreen.style';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loadExams } from '../../../store/slices/examSlice';
import { syncContent } from '../../../store/slices/contentSlice';
import ExamHistorySummary from '../../../components/exam/ExamHistorySummary/ExamHistorySummary';
import { FirebaseTest } from '../../../components/common/FirebaseTest/FirebaseTest';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { LocalizedText } from '../../../types/content';
import { useLocalizedContent } from '../../../hooks/useLocalizedContent';


type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const homeContent = useAppSelector(state => state.content.home);
  const { getLocalized } = useLocalizedContent();
  const [refreshing, setRefreshing] = useState(false);

  // Load exam data when the component mounts
  useEffect(() => {
    dispatch(loadExams());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(syncContent()).unwrap();
      await dispatch(loadExams()); // Reload exams too just in case
    } catch (error) {
      console.error('Failed to refresh content:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const navigateToBook = () => {
    navigation.navigate('BookTab');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title} variant="headlineMedium">
          {getLocalized(homeContent?.welcomeMessage) || t('home.welcome')}
        </Text>
        {/* Exam History Summary */}
        <ExamHistorySummary />
        <Card style={styles.card}>
          <Card.Cover source={require('../../../assets/images/book.png')} />
          <Card.Title title={t('home.bookTitle')} />
          <Card.Content>
            <Text variant="bodyMedium">{t('home.bookDescription')}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={navigateToBook}>
              {t('home.openBook')}
            </Button>
          </Card.Actions>
        </Card>

        {/* Firebase Test Component */}
        <FirebaseTest />
        
        {/* Firebase Image Test Component */}

      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;