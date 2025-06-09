import React from 'react';
import { View, ScrollView } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { styles } from './HomeScreen.style';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const navigateToExam = () => {
    navigation.navigate(ROUTES.EXAM, { id: '1' });
  };

  const navigateToBook = () => {
    navigation.navigate(ROUTES.BOOK);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title} variant="headlineMedium">
          {t('home.welcome')}
        </Text>
        
        <Card style={styles.card}>
          <Card.Cover source={require('../../../assets/images/exam.png')} />
          <Card.Title title={t('home.examTitle')} />
          <Card.Content>
            <Text variant="bodyMedium">{t('home.examDescription')}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={navigateToExam}>
              {t('home.startExam')}
            </Button>
          </Card.Actions>
        </Card>

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
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;