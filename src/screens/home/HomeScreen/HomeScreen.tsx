import React, { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { createStyles } from './HomeScreen.style';
import { useAppDispatch } from '../../../store/hooks';
import { loadExams } from '../../../store/slices/examSlice';
import ExamHistorySummary from '../../../components/exam/ExamHistorySummary/ExamHistorySummary';
import { FirebaseTest } from '../../../components/common/FirebaseTest/FirebaseTest';
import { useAppTheme } from '../../../providers/ThemeProvider';


type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useAppDispatch();

  // Load exam data when the component mounts
  useEffect(() => {
    dispatch(loadExams());
  }, [dispatch]);

  const navigateToBook = () => {
    navigation.navigate('BookTab');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title} variant="headlineMedium">
          {t('home.welcome')}
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