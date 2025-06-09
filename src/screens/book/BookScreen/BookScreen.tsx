import React from 'react';
import { ScrollView } from 'react-native';
import { Card, Text, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './BookScreen.style';

type BookScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Sample chapter type
type Chapter = {
  id: string;
  title: string;
  description: string;
};

const BookScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<BookScreenNavigationProp>();

  // Sample chapters - would come from API or JSON file
  const chapters: Chapter[] = [
    {
      id: '1',
      title: t('book.chapter1.title'),
      description: t('book.chapter1.description'),
    },
    {
      id: '2',
      title: t('book.chapter2.title'),
      description: t('book.chapter2.description'),
    },
    {
      id: '3',
      title: t('book.chapter3.title'),
      description: t('book.chapter3.description'),
    },
    // More chapters...
  ];

  const navigateToChapter = (chapterId: string) => {
    navigation.navigate(ROUTES.CHAPTER, { id: chapterId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <Card.Cover source={require('../../../assets/images/book.png')} />
          <Card.Content style={styles.cardContent}>
            <Text variant="headlineMedium" style={styles.title}>
              {t('book.title')}
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {t('book.description')}
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          {t('book.chapters')}
        </Text>

        {chapters.map((chapter) => (
          <List.Item
            key={chapter.id}
            title={chapter.title}
            description={chapter.description}
            titleStyle={styles.chapterTitle}
            descriptionStyle={styles.chapterDescription}
            left={(props) => <List.Icon {...props} icon="book-open-variant" color={theme.colors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.primary} />}
            onPress={() => navigateToChapter(chapter.id)}
            style={styles.chapterItem}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookScreen;