import React, { useEffect } from 'react';
import { View, ScrollView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, IconButton, Divider, Card } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './ChapterScreen.style';
import { useBook } from '../../../contexts/BookContext';
import { EpubSection } from '../../../types/epub';

type ChapterScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.CHAPTER>;
type ChapterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ChapterScreen = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const route = useRoute<ChapterScreenRouteProp>();
  const navigation = useNavigation<ChapterScreenNavigationProp>();
  
  const { 
    book, 
    sections, 
    currentSection, 
    isLoading, 
    error, 
    loadBook, 
    goToSection 
  } = useBook();

  useEffect(() => {
    console.log('ChapterScreen - Book state check:', {
      hasBook: !!book,
      bookTitle: book?.package.metadata.title,
      sectionsLength: sections.length,
      isLoading,
      error
    });

    // Load a default book if none is loaded
    if (!book && !isLoading && !error) {
      console.log('ChapterScreen - No book loaded, loading default...');
      loadDefaultBook();
    }
  }, [book, isLoading, error, sections.length]);

  const loadDefaultBook = async () => {
    try {
      // Load a combined book from all available chapters
      const epubPath = 'src/assets/bookEpub'; // Point to the EPUB files directory
      console.log('ChapterScreen - Loading default book:', epubPath);
      await loadBook(epubPath);
      console.log('ChapterScreen - Book loaded successfully');
    } catch (error) {
      console.error('Failed to load default book:', error);
      Alert.alert(
        t('error'),
        t('failed_to_load_book'),
        [{ text: t('ok') }]
      );
    }
  };

  const handleSectionPress = async (section: EpubSection) => {
    console.log('ChapterScreen - Section pressed:', {
      sectionId: section.id,
      sectionIndex: section.index,
      sectionTitle: section.title,
      sectionsLength: sections.length
    });

    // First set the current section
    goToSection(section.index);
    console.log('ChapterScreen - Called goToSection with index:', section.index);
    
    // Small delay to ensure state is updated before navigation
    setTimeout(() => {
      const navParams = {
        bookPath: section.href,
        bookTitle: book?.package.metadata.title || 'EPUB Book',
        targetSectionId: section.id
      };
      console.log('ChapterScreen - Navigating with params:', navParams);
      navigation.navigate(ROUTES.EPUB_READER, navParams);
    }, 100);
  };

  const renderSectionItem = ({ item }: { item: EpubSection }) => (
    <TouchableOpacity
      onPress={() => handleSectionPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${t('chapter')} ${item.index + 1}: ${item.title}`}
    >
      <Card style={[
        styles.sectionCard,
        currentSection?.id === item.id && styles.currentSectionCard
      ]}>
        <Card.Content style={styles.sectionContent}>
          <View style={styles.sectionNumber}>
            <Text variant="titleMedium" style={styles.sectionNumberText}>
              {item.index + 1}
            </Text>
          </View>
          <View style={styles.sectionTextContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              {t('section_info', { 
                wordCount: item.content.split(' ').length,
                estimatedTime: Math.ceil(item.content.split(' ').length / 200)
              })}
            </Text>
          </View>
          <View style={styles.sectionProgress}>
            {currentSection?.id === item.id && (
              <View style={styles.currentIndicator} />
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading) {
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
            {t('chapters')}
          </Text>
        </View>
        <View style={styles.centerContainer}>
          <Text variant="bodyLarge" style={styles.loadingText}>{t('loading_book')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
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
            {t('chapters')}
          </Text>
        </View>
        <View style={styles.centerContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
          <IconButton
            icon="refresh"
            mode="contained"
            onPress={loadDefaultBook}
            style={styles.retryButton}
            containerColor={theme.colors.primary}
            iconColor={theme.colors.surface}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!book || sections.length === 0) {
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
            {t('chapters')}
          </Text>
        </View>
        <View style={styles.centerContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>{t('no_book_loaded')}</Text>
          <IconButton
            icon="book-open-variant"
            mode="contained"
            onPress={loadDefaultBook}
            style={styles.loadButton}
            containerColor={theme.colors.secondary}
            iconColor={theme.colors.surface}
          />
        </View>
      </SafeAreaView>
    );
  }

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
          {t('chapters')}
        </Text>
      </View>

      <View style={styles.bookHeader}>
        <Text variant="headlineSmall" style={styles.bookTitle} numberOfLines={2}>
          {book.package.metadata.title}
        </Text>
        <Text variant="bodyMedium" style={styles.bookAuthor}>
          {t('by_author', { author: book.package.metadata.author })}
        </Text>
        <Text variant="bodySmall" style={styles.sectionCount}>
          {t('sections_count', { count: sections.length })}
        </Text>
      </View>

      <FlatList
        data={sections}
        renderItem={renderSectionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

export default ChapterScreen;
