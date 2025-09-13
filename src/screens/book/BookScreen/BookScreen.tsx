import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Card, Text, ProgressBar, List, Badge, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { createStyles } from './BookScreen.style';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { getAvailableChapters } from '../../../data/book/chapters';
import type { Chapter, SubSection } from '../../../data/book/chapters';
import { getReadingProgress, getChapterProgress } from '../../../utils/readingProgress';
import type { ReadingProgress } from '../../../utils/readingProgress';

type BookScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BookScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<BookScreenNavigationProp>();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({});
  const [chapterProgresses, setChapterProgresses] = useState<{ [chapterId: string]: { completed: number; total: number; percentage: number } }>({});
  const [expandedChapters, setExpandedChapters] = useState<{ [chapterId: string]: boolean }>({});
  
  const chapters = getAvailableChapters();

  useEffect(() => {
    loadReadingProgress();
  }, []);

  const loadReadingProgress = async () => {
    const progress = await getReadingProgress();
    setReadingProgress(progress);
    
    // Calculate progress for each chapter
    const progresses: { [chapterId: string]: { completed: number; total: number; percentage: number } } = {};
    for (const chapter of chapters) {
      const sectionIds = chapter.subSections.map(section => section.id);
      progresses[chapter.id] = await getChapterProgress(sectionIds);
    }
    setChapterProgresses(progresses);
  };

  const openChapter = (chapter: Chapter, targetSectionId?: string) => {
    // Default to first subsection if no specific section is provided
    const sectionId = targetSectionId || `${chapter.id}-1`;
    
    console.log('BookScreen - Opening chapter:', {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      targetSectionId: sectionId
    });
    
    navigation.navigate(ROUTES.EPUB_READER, {
      bookTitle: chapter.title,
      targetSectionId: sectionId,
    });
  };

  const openSubSection = (chapter: Chapter, subSection: SubSection) => {
    console.log('BookScreen - Opening subsection:', {
      chapterId: chapter.id,
      subsectionId: subSection.id,
      subsectionTitle: subSection.title
    });
    
    navigation.navigate(ROUTES.EPUB_READER, {
      bookTitle: chapter.title,
      targetSectionId: subSection.id,
    });
  };

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const getSectionStatusIcon = (sectionId: string) => {
    const isRead = readingProgress[sectionId]?.isRead;
    return isRead ? 'check-circle' : 'circle-outline';
  };

  const getSectionStatusColor = (sectionId: string) => {
    const isRead = readingProgress[sectionId]?.isRead;
    return isRead ? theme.colors.primary : theme.colors.outline;
  };

  const renderSubSection = (chapter: Chapter, subSection: SubSection) => {
    const isRead = readingProgress[subSection.id]?.isRead;
    const timeSpent = readingProgress[subSection.id]?.timeSpent;
    
    return (
      <Surface
        key={subSection.id}
        style={{
          marginVertical: 4,
          marginHorizontal: 16,
          borderRadius: 12,
          elevation: isRead ? 2 : 1,
          backgroundColor: isRead 
            ? `${theme.colors.primaryContainer}20` 
            : theme.colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => openSubSection(chapter, subSection)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <View style={{ marginRight: 12 }}>
            <IconButton
              icon={getSectionStatusIcon(subSection.id)}
              iconColor={getSectionStatusColor(subSection.id)}
              size={24}
              style={{ margin: 0 }}
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text
              variant="titleSmall"
              style={{
                color: isRead ? theme.colors.primary : theme.colors.onSurface,
                fontWeight: isRead ? '600' : '500',
              }}
            >
              {subSection.title}
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurface,
                opacity: 0.7,
                marginTop: 2,
              }}
            >
              Section {subSection.order}
              {timeSpent && ` • ${Math.round(timeSpent / 60)}min read`}
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <IconButton
              icon="chevron-right"
              iconColor={theme.colors.onSurface}
              size={20}
              style={{ margin: 0, opacity: 0.6 }}
            />
          </View>
        </TouchableOpacity>
      </Surface>
    );
  };

  const renderChapter = (chapter: Chapter) => {
    const isExpanded = expandedChapters[chapter.id];
    const progress = chapterProgresses[chapter.id];
    const progressPercentage = progress ? progress.percentage / 100 : 0;
    
    return (
      <Card key={chapter.id} style={{ marginVertical: 8, marginHorizontal: 16 }}>
        <TouchableOpacity
          onPress={() => toggleChapterExpansion(chapter.id)}
          style={{ padding: 0 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Card.Cover 
              source={chapter.image} 
              style={{ 
                width: 80, 
                height: 80, 
                margin: 16,
                borderRadius: 8,
              }} 
            />
            <View style={{ flex: 1, paddingRight: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text variant="titleMedium" style={{ flex: 1, fontWeight: '600' }}>
                  {chapter.title}
                </Text>
                <IconButton
                  icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                  iconColor={theme.colors.primary}
                  size={24}
                  style={{ margin: 0 }}
                />
              </View>
              
              <Text 
                variant="bodySmall" 
                style={{ 
                  color: theme.colors.onSurface, 
                  opacity: 0.8,
                  marginBottom: 8,
                }}
                numberOfLines={2}
              >
                {chapter.description}
              </Text>
              
              {progress && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <ProgressBar 
                      progress={progressPercentage} 
                      color={theme.colors.primary}
                      style={{ height: 6, borderRadius: 3 }}
                    />
                  </View>
                  <Text 
                    variant="bodySmall" 
                    style={{ 
                      color: theme.colors.primary,
                      fontWeight: '600',
                      minWidth: 45,
                    }}
                  >
                    {progress.completed}/{progress.total}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={{ paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text variant="titleSmall" style={{ flex: 1, fontWeight: '600' }}>
                Sections
              </Text>
              <TouchableOpacity
                onPress={() => openChapter(chapter)}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: theme.colors.onPrimary, fontWeight: '600' }}>
                  Start Reading
                </Text>
              </TouchableOpacity>
            </View>
            
            {chapter.subSections.map(subSection => renderSubSection(chapter, subSection))}
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('book.lifeInTheUk')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('book.studyGuideDescription')}
          </Text>
          
          {/* Overall Progress Summary */}
          <Surface style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            backgroundColor: `${theme.colors.primaryContainer}20`,
          }}>
            <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 8 }}>
              Your Progress
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <ProgressBar 
                  progress={
                    Object.values(chapterProgresses).reduce((acc, curr) => acc + curr.percentage, 0) / 
                    (Object.keys(chapterProgresses).length * 100) || 0
                  }
                  color={theme.colors.primary}
                  style={{ height: 8, borderRadius: 4 }}
                />
              </View>
              <Text variant="bodySmall" style={{ 
                color: theme.colors.primary, 
                fontWeight: '600' 
              }}>
                {Math.round(
                  Object.values(chapterProgresses).reduce((acc, curr) => acc + curr.percentage, 0) / 
                  Object.keys(chapterProgresses).length || 0
                )}%
              </Text>
            </View>
          </Surface>
        </View>

        {chapters.map(chapter => renderChapter(chapter))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookScreen;
