import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, IconButton, Divider, Card } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './ChapterScreen.style';

type ChapterScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.CHAPTER>;
type ChapterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Section {
  id: string;
  title: string;
  content: string;
}

interface ChapterData {
  id: string;
  title: string;
  introduction: string;
  sections: Section[];
}

const ChapterScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const route = useRoute<ChapterScreenRouteProp>();
  const navigation = useNavigation<ChapterScreenNavigationProp>();

  const { id } = route.params;

  // This would come from an API or a local JSON file in a real app
  // For now, we're using dummy data
  const chapters: Record<string, ChapterData> = {
    '1': {
      id: '1',
      title: t('book.chapter1.title'),
      introduction: t('book.chapter1.introduction'),
      sections: [
        {
          id: '1.1',
          title: t('book.chapter1.section1.title'),
          content: t('book.chapter1.section1.content'),
        },
        {
          id: '1.2',
          title: t('book.chapter1.section2.title'),
          content: t('book.chapter1.section2.content'),
        },
      ],
    },
    '2': {
      id: '2',
      title: t('book.chapter2.title'),
      introduction: t('book.chapter2.introduction'),
      sections: [
        {
          id: '2.1',
          title: t('book.chapter2.section1.title'),
          content: t('book.chapter2.section1.content'),
        },
        {
          id: '2.2',
          title: t('book.chapter2.section2.title'),
          content: t('book.chapter2.section2.content'),
        },
      ],
    },
    '3': {
      id: '3',
      title: t('book.chapter3.title'),
      introduction: t('book.chapter3.introduction'),
      sections: [
        {
          id: '3.1',
          title: t('book.chapter3.section1.title'),
          content: t('book.chapter3.section1.content'),
        },
        {
          id: '3.2',
          title: t('book.chapter3.section2.title'),
          content: t('book.chapter3.section2.content'),
        },
      ],
    },
  };

  const chapterData = chapters[id] || {
    id: '0',
    title: 'Chapter not found',
    introduction: 'This chapter does not exist.',
    sections: [],
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {chapterData.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.introCard}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.introText}>
              {chapterData.introduction}
            </Text>
          </Card.Content>
        </Card>

        {chapterData.sections.map((section) => (
          <View key={section.id} style={styles.sectionContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {section.title}
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              {section.content}
            </Text>
            <Divider style={styles.divider} />
          </View>
        ))}

        <View style={styles.navigationButtons}>
          {parseInt(id) > 1 && (
            <IconButton
              icon="arrow-left"
              mode="contained"
              onPress={() => navigation.navigate(ROUTES.CHAPTER, { id: (parseInt(id) - 1).toString() })}
              style={styles.navButton}
              containerColor={theme.colors.primary}
              iconColor={theme.colors.surface}
            />
          )}

          <IconButton
            icon="book-open-variant"
            mode="contained"
            onPress={() => navigation.navigate(ROUTES.BOOK)}
            style={styles.navButton}
            containerColor={theme.colors.secondary}
            iconColor={theme.colors.surface}
          />

          {parseInt(id) < Object.keys(chapters).length && (
            <IconButton
              icon="arrow-right"
              mode="contained"
              onPress={() => navigation.navigate(ROUTES.CHAPTER, { id: (parseInt(id) + 1).toString() })}
              style={styles.navButton}
              containerColor={theme.colors.primary}
              iconColor={theme.colors.surface}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChapterScreen;
