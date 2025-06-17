import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from 'react-native-paper';
import { useReader } from './ReaderContext';
import { getChapterById } from '../data/book/chapters';
import type { Chapter, SubSection } from '../data/book/chapters';
import { loadChapterContent } from './ContentLoader';

interface StructuredContentReaderProps {
  chapterId: string;
  targetSectionId?: string; 
  onSectionRead?: (sectionId: string, timeSpent: number) => void;
}

export const StructuredContentReader: React.FC<StructuredContentReaderProps> = ({ 
  chapterId,
  targetSectionId, 
  onSectionRead 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentSubSection, setCurrentSubSection] = useState<SubSection | null>(null);
  const [currentSubSectionIndex, setCurrentSubSectionIndex] = useState(0);
  const [allSubSections, setAllSubSections] = useState<SubSection[]>([]);
  const [chapterContent, setChapterContent] = useState<string>('');
  const [readingStartTime, setReadingStartTime] = useState<number>(Date.now());
  const theme = useTheme();
  const { fontSize } = useReader();

  useEffect(() => {
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

      // Get chapter data from our chapters definition
      const chapterData = getChapterById(chapterId);
      if (!chapterData) {
        throw new Error(`Chapter not found: ${chapterId}`);
      }

      // Load the HTML content for this chapter
      const htmlContent = await loadChapterHtml(chapterId);
      if (!htmlContent) {
        throw new Error(`Content not found for chapter: ${chapterId}`);
      }

      setCurrentChapter(chapterData);
      setChapterContent(htmlContent);
      setAllSubSections(chapterData.subSections);

      // Set initial subsection
      let startSubSectionIndex = 0;
      if (targetSectionId && chapterData.subSections.length > 0) {
        const targetIndex = chapterData.subSections.findIndex(section => section.id === targetSectionId);
        if (targetIndex !== -1) {
          startSubSectionIndex = targetIndex;
        }
      }

      setCurrentSubSectionIndex(startSubSectionIndex);
      setCurrentSubSection(chapterData.subSections[startSubSectionIndex]);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load content: ${err}`);
      setLoading(false);
    }
  };

  const loadChapterHtml = async (chapterId: string): Promise<string | null> => {
    try {
      // Use ContentLoader to load the chapter content
      const content = await loadChapterContent(chapterId);
      if (content) {
        // Apply font size to the loaded content
        return content.replace(
          /font-size:\s*\d+px/g, 
          `font-size: ${Math.round(16 * (fontSize / 100))}px`
        );
      }
      return content;
    } catch (error) {
      console.error('Error loading chapter HTML:', error);
      return null;
    }
  };

  const getCurrentSectionContent = (): string => {
    if (!currentSubSection || !chapterContent) {
      return '<div style="padding: 40px; text-align: center;"><h2>Loading...</h2><p>Content is being prepared.</p></div>';
    }

    // Find the section in the content based on section markers
    const sectionRegex = new RegExp(
      `<div class="section-marker" data-section="${currentSubSection.id}"></div>([\\s\\S]*?)(?=<div class="section-marker" data-section="|$)`,
      'i'
    );
    
    const match = chapterContent.match(sectionRegex);
    if (match && match[1]) {
      // Extract just this section's content
      const sectionContent = match[1].trim();
      
      // Create a complete HTML document with the section content
      return chapterContent.replace(
        /<body>[\s\S]*<\/body>/i,
        `<body>${sectionContent}</body>`
      );
    }

    // Fallback: return full content if section markers don't work
    return chapterContent;
  };

  const navigateSubSection = async (direction: 'prev' | 'next') => {
    if (!currentChapter || allSubSections.length === 0) return;

    // Track reading time for current section
    const timeSpent = Math.floor((Date.now() - readingStartTime) / 1000);
    if (currentSubSection && timeSpent > 10) {
      handleSectionRead(currentSubSection.id, timeSpent);
    }

    const newIndex = direction === 'prev' 
      ? Math.max(0, currentSubSectionIndex - 1)
      : Math.min(allSubSections.length - 1, currentSubSectionIndex + 1);

    if (newIndex !== currentSubSectionIndex) {
      setReadingStartTime(Date.now()); // Reset reading time
      setCurrentSubSectionIndex(newIndex);
      setCurrentSubSection(allSubSections[newIndex]);
    }
  };

  const markCurrentSectionAsRead = () => {
    if (currentSubSection) {
      const timeSpent = Math.floor((Date.now() - readingStartTime) / 1000);
      handleSectionRead(currentSubSection.id, timeSpent);
      Alert.alert('Progress Saved', 'Section marked as read!');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.onBackground, marginTop: 16 }}>Loading content...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, padding: 20 }}>
        <Text style={{ color: theme.colors.error, textAlign: 'center', fontSize: 16, marginBottom: 20 }}>
          {error}
        </Text>
        <TouchableOpacity 
          onPress={loadContent}
          style={{ 
            backgroundColor: theme.colors.primary, 
            padding: 12, 
            borderRadius: 8 
          }}
        >
          <Text style={{ color: theme.colors.onPrimary }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Navigation Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16, 
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline
      }}>
        <TouchableOpacity 
          onPress={() => navigateSubSection('prev')}
          disabled={currentSubSectionIndex === 0}
          style={{ 
            backgroundColor: currentSubSectionIndex === 0 ? theme.colors.surfaceDisabled : theme.colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 6
          }}
        >
          <Text style={{ 
            color: currentSubSectionIndex === 0 ? theme.colors.onSurfaceDisabled : theme.colors.onPrimary,
            fontWeight: 'bold'
          }}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 16 }}>
          <Text style={{ 
            color: theme.colors.onSurface, 
            fontSize: 16, 
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {currentSubSection?.title || 'Loading...'}
          </Text>
          <Text style={{ 
            color: theme.colors.onSurfaceVariant, 
            fontSize: 14,
            marginTop: 4
          }}>
            {currentSubSectionIndex + 1} of {allSubSections.length}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={() => navigateSubSection('next')}
          disabled={currentSubSectionIndex === allSubSections.length - 1}
          style={{ 
            backgroundColor: currentSubSectionIndex === allSubSections.length - 1 ? theme.colors.surfaceDisabled : theme.colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 6
          }}
        >
          <Text style={{ 
            color: currentSubSectionIndex === allSubSections.length - 1 ? theme.colors.onSurfaceDisabled : theme.colors.onPrimary,
            fontWeight: 'bold'
          }}>
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content WebView */}
      <WebView
        source={{ html: getCurrentSectionContent() }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true}
        scalesPageToFit={false}
        javaScriptEnabled={false}
        domStorageEnabled={false}
        onLoadEnd={() => {
          console.log(`Content loaded for section: ${currentSubSection?.id}`);
        }}
      />

      {/* Bottom Action Bar */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center',
        padding: 16, 
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline
      }}>
        <TouchableOpacity 
          onPress={markCurrentSectionAsRead}
          style={{ 
            backgroundColor: theme.colors.secondary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8
          }}
        >
          <Text style={{ 
            color: theme.colors.onSecondary,
            fontWeight: 'bold',
            fontSize: 16
          }}>
            Mark as Read
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
