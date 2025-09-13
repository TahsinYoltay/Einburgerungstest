import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useReader } from './ReaderContext';
import { loadSectionContent, SectionData } from './ContentLoader';

interface StructuredContentReaderProps {
  chapterId: string;
  targetSectionId?: string; 
  onSectionRead?: (sectionId: string, timeSpent: number) => void;
}

interface ChapterSection {
  id: string;
  title: string;
  description: string;
}

interface ChapterData {
  id: string;
  title: string;
  description: string;
  sections: ChapterSection[];
}

export const StructuredContentReader: React.FC<StructuredContentReaderProps> = ({ 
  chapterId,
  targetSectionId, 
  onSectionRead 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentChapter, setCurrentChapter] = useState<ChapterData | null>(null);
  const [currentSection, setCurrentSection] = useState<ChapterSection | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [allSections, setAllSections] = useState<ChapterSection[]>([]);
  const [currentSectionContent, setCurrentSectionContent] = useState<string>('');
  const [readingStartTime, setReadingStartTime] = useState<number>(Date.now());
  const [currentChapterId, setCurrentChapterId] = useState<string>(chapterId); // Track the actual current chapter ID
  const theme = useTheme();
  const { fontSize } = useReader();
  const { t } = useTranslation();

  useEffect(() => {
    setCurrentChapterId(chapterId); // Reset tracked chapter ID when prop changes
    loadContent();
  }, [chapterId]);

  // Default reading progress callback if none provided
  const handleSectionRead = onSectionRead || ((sectionId: string, timeSpent: number) => {
    console.log(`Section ${sectionId} read for ${timeSpent} seconds`);
  });

  const loadContent = async () => {
    try {
      setLoading(true);
      setError('');

      // Get chapter data from chapters.json
      const chaptersData = await import('../assets/content/chapters.json');
      const chapterData = chaptersData.chapters.find((c: any) => c.id === chapterId);
      
      if (!chapterData) {
        throw new Error(`Chapter not found: ${chapterId}`);
      }

      setCurrentChapter(chapterData);
      setAllSections(chapterData.sections);
      setCurrentChapterId(chapterId); // Initialize the tracked chapter ID

      // Set initial section
      let startSectionIndex = 0;
      if (targetSectionId && chapterData.sections.length > 0) {
        const targetIndex = chapterData.sections.findIndex((section: ChapterSection) => section.id === targetSectionId);
        if (targetIndex !== -1) {
          startSectionIndex = targetIndex;
        }
      }

      setCurrentSectionIndex(startSectionIndex);
      setCurrentSection(chapterData.sections[startSectionIndex]);
      
      // Load the specific section content
      await loadSectionContentById(chapterData.sections[startSectionIndex].id);
      
      setLoading(false);
    } catch (err) {
      console.error(`Error loading content:`, err);
      setError(`Failed to load content: ${err}`);
      setLoading(false);
    }
  };

  const loadSectionContentById = async (sectionId: string) => {
    try {
      console.log(`🔍 Loading section content for: ${currentChapterId}/${sectionId}`);
      const sectionData = await loadSectionContent(currentChapterId, sectionId);
      
      if (!sectionData) {
        throw new Error(`Section content not found: ${currentChapterId}/${sectionId}`);
      }

      console.log(`✅ Successfully loaded section ${sectionId} with Firebase images`);
      
      // Apply font size to the loaded content
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sectionData.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #fff;
            font-size: ${Math.round(16 * (fontSize / 100))}px;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
            font-size: 2.2em;
        }
        
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.8em;
        }
        
        h3 {
            color: #7f8c8d;
            margin-top: 25px;
            margin-bottom: 10px;
            font-size: 1.4em;
        }
        
        p {
            margin-bottom: 15px;
            text-align: justify;
        }
        
        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }
        
        li {
            margin-bottom: 0.5em;
        }
        
        .highlight, .highlight-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 1em;
            margin: 1.5em 0;
        }
        
        .important, .info-box {
            background: #d1ecf1;
            border: 1px solid #b8daff;
            border-radius: 6px;
            padding: 1em;
            margin: 1.5em 0;
        }
        
        .warning {
            background-color: #f8d7da;
            padding: 15px;
            border-left: 4px solid #dc3545;
            margin: 20px 0;
        }
        
        .timeline, .process-box, .stats-box {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #dee2e6;
        }
        
        .stats-box {
            background: #e8f5e8;
            border: 1px solid #4caf50;
        }
        
        strong {
            color: #2c3e50;
        }
        
        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1em 0;
            display: block;
        }
        
        blockquote {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            margin: 1.5em 0;
            padding: 1em 1.5em;
            font-style: italic;
            border-radius: 0 8px 8px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        .section-marker {
            display: none;
        }
        
        /* Loading placeholder styles */
        .image-placeholder {
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            border-radius: 8px;
            padding: 2em;
            text-align: center;
            margin: 1em 0;
            color: #6c757d;
        }
        
        .image-placeholder .emoji {
            font-size: 2em;
            margin-bottom: 0.5em;
            display: block;
        }
        
        /* Original EPUB styles support */
        .calibre {
            display: table-column-group;
        }
        .calibre1 {
            display: table-column;
        }
        .calibre2 {
            display: table-row-group;
            vertical-align: middle;
        }
        .calibre3 {
            display: table-row;
            vertical-align: inherit;
        }
        .calibre4 {
            display: block;
        }
        .calibre5 {
            height: auto;
            width: auto;
        }
        .class {
            display: block;
            font-family: sans-serif;
            font-size: 1em;
            line-height: 1.2;
            padding-left: 0;
            padding-right: 0;
            margin: 0 5pt;
        }
        .class_s {
            -webkit-hyphens: none;
            border-bottom-color: gray;
            border-collapse: separate;
            border-left-color: gray;
            border-right-color: gray;
            border-spacing: 2px;
            border-top-color: gray;
            display: table;
            hyphens: none;
            margin-bottom: 0;
            margin-right: auto;
            margin-top: 0.3em;
            max-width: 100%;
            text-indent: 0;
        }
        .class_s7g {
            display: block;
            margin-top: 1em;
            text-align: center;
        }
        .class_s7g1 {
            -webkit-hyphens: none;
            height: auto;
            hyphens: none;
            width: 100%;
        }
        .class_s7j {
            -webkit-hyphens: none;
            display: block;
            hyphens: none;
            margin-top: 1em;
        }
        .class_s7p {
            -webkit-hyphens: none;
            color: #803f6a;
            display: block;
            font-size: 1.66667em;
            hyphens: none;
            line-height: 1.2;
            margin-bottom: 0.095927em;
            margin-top: 0.959273em;
        }
        .class_s7s {
            -webkit-hyphens: none;
            display: block;
            hyphens: none;
        }
        .class_s7v {
            color: #803f6a;
            display: block;
        }
        .class_s7x {
            display: table-cell;
            text-align: inherit;
            vertical-align: top;
            padding: 1px;
        }
        .class_s43f {
            font-weight: 800;
        }
        .class_sbk {
            -webkit-hyphens: none;
            display: block;
            font-weight: 800;
            hyphens: none;
            margin-top: 1em;
        }
        .class_sc {
            -webkit-hyphens: none;
            color: #58585a;
            display: block;
            font-size: 1.29167em;
            font-weight: 800;
            hyphens: none;
            line-height: 1.2;
            margin-bottom: 0.191855em;
            margin-top: 1.15113em;
        }
        .class_scu {
            color: #803f6a;
            display: block;
            font-size: 1em;
            font-weight: 800;
            line-height: 1.2;
        }
        .class_scw {
            color: #803f6a;
            display: block;
            font-family: "DejaVuSans Bold", sans-serif;
        }
        .class_sd {
            border-bottom-color: gray;
            border-collapse: separate;
            border-left-color: gray;
            border-right-color: gray;
            border-spacing: 2px;
            border-top-color: gray;
            display: table;
            font-size: 0.77419em;
            line-height: 1.2;
            margin-bottom: 0;
            margin-right: auto;
            margin-top: 0.3em;
            max-width: 100%;
            text-indent: 0;
        }
        .class_sdp {
            -webkit-hyphens: none;
            display: block;
            font-size: 1.29167em;
            hyphens: none;
            line-height: 1.2;
            margin-bottom: 1.319em;
            margin-top: 1.319em;
            padding: 0.219833em 1.563% 0.549583em;
            border: #803f6a solid 1px;
        }
        .class1 {
            display: table-column;
            width: 1.55211%;
        }
        .class2 {
            display: table-column;
            width: 2.7907%;
        }
        
        a {
            color: #007bff;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    ${sectionData.htmlContent}
</body>
</html>`;

      setCurrentSectionContent(htmlContent);
    } catch (error) {
      console.error(`Error loading section ${sectionId}:`, error);
      setCurrentSectionContent(`
        <div style="padding: 40px; text-align: center;">
          <h2>${t('book.contentLoadError')}</h2>
          <p>${t('book.sectionContentError')}</p>
        </div>
      `);
    }
  };

  const getCurrentSectionContent = (): string => {
    return currentSectionContent || `<div style="padding: 40px; text-align: center;"><h2>${t('book.loadingSection')}</h2><p>Content is being prepared.</p></div>`;
  };

  const navigateSection = async (direction: 'prev' | 'next') => {
    if (!currentChapter || allSections.length === 0) return;

    let newSectionIndex = currentSectionIndex;
    
    if (direction === 'prev' && currentSectionIndex > 0) {
      newSectionIndex = currentSectionIndex - 1;
    } else if (direction === 'next' && currentSectionIndex < allSections.length - 1) {
      newSectionIndex = currentSectionIndex + 1;
    } else {
      // Handle chapter navigation
      if (direction === 'prev' && currentSectionIndex === 0) {
        // Go to previous chapter's last section
        const prevChapterId = (parseInt(currentChapterId) - 1).toString();
        if (parseInt(currentChapterId) > 1) {
          await navigateToChapter(prevChapterId, 'last');
          return;
        }
      } else if (direction === 'next' && currentSectionIndex === allSections.length - 1) {
        // Go to next chapter's first section
        const nextChapterId = (parseInt(currentChapterId) + 1).toString();
        if (parseInt(currentChapterId) < 5) { // Assuming 5 chapters total
          await navigateToChapter(nextChapterId, 'first');
          return;
        }
      }
      return; // No more navigation possible
    }

    // Record reading time for current section
    const timeSpent = Math.floor((Date.now() - readingStartTime) / 1000);
    if (currentSection) {
      handleSectionRead(currentSection.id, timeSpent);
    }

    // Navigate to new section
    setCurrentSectionIndex(newSectionIndex);
    setCurrentSection(allSections[newSectionIndex]);
    setReadingStartTime(Date.now());
    
    await loadSectionContentById(allSections[newSectionIndex].id);
  };

  const navigateToChapter = async (newChapterId: string, position: 'first' | 'last') => {
    try {
      // Record reading time for current section
      const timeSpent = Math.floor((Date.now() - readingStartTime) / 1000);
      if (currentSection) {
        handleSectionRead(currentSection.id, timeSpent);
      }

      // Load new chapter data
      const chaptersData = await import('../assets/content/chapters.json');
      const newChapterData = chaptersData.chapters.find((c: any) => c.id === newChapterId);
      
      if (!newChapterData) {
        console.error(`Chapter not found: ${newChapterId}`);
        return;
      }

      setCurrentChapter(newChapterData);
      setAllSections(newChapterData.sections);
      setCurrentChapterId(newChapterId); // Update the tracked chapter ID

      // Set section index based on position
      const newSectionIndex = position === 'first' ? 0 : newChapterData.sections.length - 1;
      setCurrentSectionIndex(newSectionIndex);
      setCurrentSection(newChapterData.sections[newSectionIndex]);
      setReadingStartTime(Date.now());

      // Load the section content
      await loadSectionContentById(newChapterData.sections[newSectionIndex].id);
      
    } catch (error) {
      console.error(`Error navigating to chapter ${newChapterId}:`, error);
    }
  };

  const markCurrentSectionAsRead = () => {
    if (currentSection) {
      Alert.alert(
        t('book.markAsRead'),
        `${t('book.progressSaved')} ${currentSection.title}`,
        [{ text: 'OK', onPress: () => console.log('Section marked as read') }]
      );
    }
  };

  const onWebViewLoadStart = () => {
    console.log('🔄 WebView loading started for section:', currentSection?.id);
  };

  const onWebViewLoadEnd = () => {
    console.log('✅ WebView loaded for section:', currentSection?.id);
  };

  const onWebViewLoad = () => {
    console.log('📊 WebView fully loaded:', currentSection?.id);
  };

  const canNavigatePrev = () => {
    return currentSectionIndex > 0 || parseInt(currentChapterId) > 1;
  };

  const canNavigateNext = () => {
    return currentSectionIndex < allSections.length - 1 || parseInt(currentChapterId) < 5;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.onBackground }}>
          {t('book.loadingSection')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: theme.colors.error, textAlign: 'center', marginBottom: 20 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadContent}
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8
          }}
        >
          <Text style={{ color: theme.colors.onPrimary }}>
            {t('common.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Section Navigation Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline
      }}>
        <TouchableOpacity
          onPress={() => navigateSection('prev')}
          disabled={!canNavigatePrev()}
          style={{
            backgroundColor: canNavigatePrev() ? theme.colors.primary : theme.colors.surfaceDisabled,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            opacity: canNavigatePrev() ? 1 : 0.5
          }}
        >
          <Text style={{ 
            color: canNavigatePrev() ? theme.colors.onPrimary : theme.colors.onSurface,
            fontSize: 14 
          }}>
            ← {t('common.previous')}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: 'bold',
            color: theme.colors.onSurface,
            textAlign: 'center'
          }}>
            {currentSection?.title}
          </Text>
          <Text style={{ 
            fontSize: 12, 
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center'
          }}>
            {currentSectionIndex + 1} / {allSections.length}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigateSection('next')}
          disabled={!canNavigateNext()}
          style={{
            backgroundColor: canNavigateNext() ? theme.colors.primary : theme.colors.surfaceDisabled,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            opacity: canNavigateNext() ? 1 : 0.5
          }}
        >
          <Text style={{ 
            color: canNavigateNext() ? theme.colors.onPrimary : theme.colors.onSurface,
            fontSize: 14 
          }}>
            {t('common.next')} →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content WebView */}
      <WebView
        source={{ html: getCurrentSectionContent() }}
        style={{ flex: 1 }}
        onLoadStart={onWebViewLoadStart}
        onLoadEnd={onWebViewLoadEnd}
        onLoad={onWebViewLoad}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        scalesPageToFit={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
      />

      {/* Action Button */}
      <View style={{ 
        position: 'absolute', 
        bottom: 20, 
        right: 20 
      }}>
        <TouchableOpacity
          onPress={markCurrentSectionAsRead}
          style={{
            backgroundColor: theme.colors.secondary,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
        >
          <Text style={{ 
            color: theme.colors.onSecondary,
            fontSize: 24 
          }}>
            ✓
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
