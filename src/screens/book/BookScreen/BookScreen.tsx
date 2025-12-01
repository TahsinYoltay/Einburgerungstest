import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
import { useAppSelector } from '../../../store/hooks';

type BookScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BookScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<BookScreenNavigationProp>();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const userId = useAppSelector(state => state.user.user?.id);

  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({});
  const [chapterProgresses, setChapterProgresses] = useState<{ [chapterId: string]: { completed: number; total: number; percentage: number } }>({});
  const [expandedChapters, setExpandedChapters] = useState<{ [chapterId: string]: boolean }>({});
  
  const chapters = getAvailableChapters();

  // Refresh progress every time screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadReadingProgress();
    }, [userId])
  );

  const loadReadingProgress = async () => {
    console.log('📊 BookScreen - Loading reading progress...');
    const progress = await getReadingProgress(userId || undefined);
    setReadingProgress(progress);
    
    // Calculate progress for each chapter
    const progresses: { [chapterId: string]: { completed: number; total: number; percentage: number } } = {};
    for (const chapter of chapters) {
      const sectionIds = chapter.subSections.map(section => section.id);
      progresses[chapter.id] = await getChapterProgress(sectionIds, userId || undefined);
    }
    setChapterProgresses(progresses);
  };

  const openChapter = (chapter: Chapter, targetSectionId?: string) => {
    // Default to first subsection if no specific section is provided
    const sectionId = targetSectionId || `${chapter.id}-1`;
    
    navigation.navigate(ROUTES.EPUB_READER, {
      bookTitle: chapter.title,
      chapterId: chapter.id,
      targetSectionId: sectionId,
    });
  };

  const openSubSection = (chapter: Chapter, subSection: SubSection) => {
    navigation.navigate(ROUTES.EPUB_READER, {
      bookTitle: chapter.title,
      chapterId: chapter.id,
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
    return isRead ? theme.colors.primary : theme.colors.outline; // Use outline instead of hardcoded gray
  };

  const renderSubSection = (chapter: Chapter, subSection: SubSection) => {
    const isRead = readingProgress[subSection.id]?.isRead;
    const timeSpent = readingProgress[subSection.id]?.timeSpent;
    
    return (
      <Surface
        key={subSection.id}
        style={[
          styles.sectionSurface,
          {
            elevation: isRead ? 2 : 1,
            backgroundColor: isRead 
              ? theme.colors.surfaceVariant // Use theme color instead of hex alpha
              : theme.colors.surface,
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => openSubSection(chapter, subSection)}
          style={styles.sectionTouchable}
        >
          <View style={styles.sectionIconContainer}>
            <IconButton
              icon={getSectionStatusIcon(subSection.id)}
              iconColor={getSectionStatusColor(subSection.id)}
              size={24}
              style={{ margin: 0 }}
            />
          </View>
          
          <View style={styles.sectionTextContainer}>
            <Text
              variant="titleSmall"
              style={[
                styles.sectionTitle,
                {
                  color: isRead ? theme.colors.primary : theme.colors.onSurface,
                  fontWeight: isRead ? '600' : '500',
                }
              ]}
            >
              {subSection.title}
            </Text>
            <Text
              variant="bodySmall"
              style={styles.sectionSubtitle}
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
      <Card key={chapter.id} style={styles.chapterCard}>
        <TouchableOpacity
          onPress={() => toggleChapterExpansion(chapter.id)}
          style={{ padding: 0 }}
        >
          <View style={styles.chapterHeaderRow}>
            <Card.Cover 
              source={chapter.image} 
              style={styles.chapterImage} 
            />
            <View style={styles.chapterContent}>
              <View style={styles.chapterTitleRow}>
                <Text variant="titleMedium" style={styles.chapterTitle}>
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
                style={styles.chapterDescription}
                numberOfLines={2}
              >
                {chapter.description}
              </Text>
              
              {progress && (
                <View style={styles.progressBarContainer}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <ProgressBar 
                      progress={progressPercentage} 
                      color={theme.colors.primary}
                      style={styles.progressBar}
                    />
                  </View>
                  <Text 
                    variant="bodySmall" 
                    style={styles.progressTextSmall}
                  >
                    {progress.completed}/{progress.total}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedHeader}>
              <Text variant="titleSmall" style={styles.sectionsTitle}>
                Sections
              </Text>
              <TouchableOpacity
                onPress={() => openChapter(chapter)}
                style={styles.readButton}
              >
                <Text style={styles.readButtonText}>
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
          <Surface style={styles.progressSurface}>
            <Text variant="titleSmall" style={styles.progressTitle}>
              Your Progress
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <ProgressBar 
                  progress={
                    Object.values(chapterProgresses).reduce((acc, curr) => acc + curr.percentage, 0) / 
                    (Object.keys(chapterProgresses).length * 100) || 0
                  }
                  color={theme.colors.primary}
                  style={styles.progressBar}
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
