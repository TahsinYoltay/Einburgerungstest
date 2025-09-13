import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Text, IconButton, ActivityIndicator, FAB, Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Reader, ReaderProvider } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles } from './EpubReaderScreen.style';
import { getChapterById, getAvailableChapters } from '../../../data/book/chapters';
import type { SubSection } from '../../../data/book/chapters';

type EpubReaderScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.EPUB_READER>;
type EpubReaderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Updated Firebase Storage URLs to match actual file names from Firebase Storage
const getEpubUrl = (chapterNumber: number): string => {
  const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/lifeuk-6dff5.appspot.com/o/BookData%2F';
  const fileName = `Life%20in%20the%20United%20Kingdom_%20A%20Guide%20for%20Ne%20-%20Chapter%20${chapterNumber}.epub`;
  const url = `${baseUrl}${fileName}?alt=media`;
  console.log('EpubReaderScreen - Generated URL:', url);
  return url;
};

// Enhanced WebView HTML for EPUB display with better error handling
const createWebViewHTML = (epubUrl: string, theme: any) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>EPUB Reader</title>
    <style>
        body {
            margin: 0;
            padding: 16px;
            font-family: system-ui, -apple-system, sans-serif;
            background-color: ${theme.colors.surface};
            color: ${theme.colors.onSurface};
            line-height: 1.6;
            overflow-x: hidden;
        }
        #viewer {
            width: 100%;
            height: calc(100vh - 32px);
            border: none;
            overflow-y: auto;
        }
        .loading {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 18px;
            text-align: center;
        }
        .error {
            color: #f44336;
            text-align: center;
            padding: 20px;
            font-size: 16px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin-bottom: 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .retry-btn {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
        }
        .retry-btn:hover {
            background-color: #2980b9;
        }
        /* EPUB content styling */
        .epub-content {
            max-width: 100%;
            padding: 20px;
            line-height: 1.8;
        }
        .epub-content h1, .epub-content h2, .epub-content h3 {
            color: ${theme.colors.primary};
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .epub-content p {
            margin-bottom: 15px;
            text-align: justify;
        }
        .epub-content ul, .epub-content ol {
            margin-bottom: 15px;
            padding-left: 20px;
        }
    </style>
</head>
<body>
    <div id="loading" class="loading">
        <div class="spinner"></div>
        <div>Loading EPUB...</div>
        <div style="font-size: 14px; margin-top: 10px; opacity: 0.7;">
            Initializing reader...
        </div>
    </div>
    <div id="viewer"></div>
    <div id="error" class="error" style="display: none;">
        <div>Failed to load EPUB content</div>
        <button class="retry-btn" onclick="retryLoad()">Retry</button>
    </div>

    <script>
        console.log('WebView EPUB Reader - Starting to load:', '${epubUrl}');
        
        let book = null;
        let rendition = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        function showError(message) {
            console.error('WebView EPUB Reader - Error:', message);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').innerHTML = 
                '<div>' + message + '</div>' +
                '<button class="retry-btn" onclick="retryLoad()">Retry</button>';
        }
        
        function retryLoad() {
            if (retryCount < maxRetries) {
                retryCount++;
                console.log('WebView EPUB Reader - Retrying load attempt:', retryCount);
                document.getElementById('error').style.display = 'none';
                document.getElementById('loading').style.display = 'flex';
                document.getElementById('loading').innerHTML = 
                    '<div class="spinner"></div>' +
                    '<div>Retrying... (Attempt ' + retryCount + '/' + maxRetries + ')</div>';
                setTimeout(loadEpub, 1000);
            } else {
                showError('Maximum retry attempts reached. Please check your internet connection.');
            }
        }
        
        function loadEpub() {
            try {
                // Check if ePub is available
                if (typeof ePub === 'undefined') {
                    throw new Error('EPUB.js library not loaded');
                }
                
                console.log('WebView EPUB Reader - Creating book instance');
                book = ePub('${epubUrl}');
                
                console.log('WebView EPUB Reader - Setting up rendition');
                rendition = book.renderTo("viewer", {
                    width: "100%",
                    height: "100%",
                    flow: "scrolled-doc",
                    manager: "continuous",
                    spread: "none"
                });

                book.ready.then(function() {
                    console.log('WebView EPUB Reader - Book ready');
                    document.getElementById('loading').innerHTML = 
                        '<div class="spinner"></div>' +
                        '<div>Rendering content...</div>';
                    return rendition.display();
                }).then(function() {
                    console.log('WebView EPUB Reader - Rendition displayed successfully');
                    document.getElementById('loading').style.display = 'none';
                    
                    // Apply theme styling
                    rendition.themes.default({
                        'body': {
                            'color': '${theme.colors.onSurface}',
                            'background': '${theme.colors.surface}',
                            'font-family': 'system-ui, -apple-system, sans-serif',
                            'line-height': '1.8',
                            'padding': '20px'
                        },
                        'h1, h2, h3, h4, h5, h6': {
                            'color': '${theme.colors.primary}',
                            'margin-top': '30px',
                            'margin-bottom': '15px'
                        },
                        'p': {
                            'margin-bottom': '15px',
                            'text-align': 'justify'
                        }
                    });
                    
                }).catch(function(error) {
                    console.error('WebView EPUB Reader - Display error:', error);
                    showError('Failed to display EPUB content: ' + error.message);
                });

            } catch (error) {
                console.error('WebView EPUB Reader - Script error:', error);
                showError('Failed to initialize EPUB reader: ' + error.message);
            }
        }
        
        // Load EPUB.js library and then load the EPUB
        function loadScript() {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js';
            script.onload = function() {
                console.log('WebView EPUB Reader - EPUB.js library loaded successfully');
                setTimeout(loadEpub, 500); // Small delay to ensure library is fully initialized
            };
            script.onerror = function() {
                console.error('WebView EPUB Reader - Failed to load EPUB.js library');
                showError('Failed to load EPUB reader library. Please check your internet connection.');
            };
            document.head.appendChild(script);
        }
        
        // Start loading
        loadScript();
        
    </script>
</body>
</html>
  `;
};

const EpubReaderScreen = () => {
  const route = useRoute<EpubReaderScreenRouteProp>();
  const navigation = useNavigation<EpubReaderScreenNavigationProp>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const { bookTitle, targetSectionId } = route.params;
  const totalChapters = getAvailableChapters().length;
  
  // Extract chapter number and subsection ID from targetSectionId
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [actualTargetSectionId, setActualTargetSectionId] = useState<string | undefined>(undefined);
  const [currentSection, setCurrentSection] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSubSection, setCurrentSubSection] = useState<SubSection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>('Initializing...');
  
  // Force WebView mode from start due to sandbox issues with native reader
  const [useWebViewFallback, setUseWebViewFallback] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  
  // Get chapter data for subsection navigation
  const chapter = getChapterById(chapterNumber.toString());
  const subSections = chapter?.subSections || [];
  
  useEffect(() => {
    let chapter = 1;
    let sectionId: string | undefined = undefined;
    
    if (targetSectionId) {
      // Handle different formats: 'chapter1-1', '1-1', '1', 'chapter1'
      if (targetSectionId.includes('-')) {
        // Format: 'chapter1-1' or '1-1'
        const match = targetSectionId.match(/(\d+)-(\d+)/);
        if (match) {
          chapter = parseInt(match[1], 10);
          sectionId = targetSectionId; // Keep full section ID for subsection navigation
        }
      } else {
        // Format: 'chapter1' or '1'
        const match = targetSectionId.match(/(\d+)/);
        if (match) {
          chapter = parseInt(match[1], 10);
          // Default to first subsection
          sectionId = `${chapter}-1`;
        }
      }
    }
    
    console.log('EpubReaderScreen - Parsed navigation:', { 
      targetSectionId, 
      chapter, 
      sectionId 
    });
    
    setChapterNumber(chapter);
    setActualTargetSectionId(sectionId);
    setError(null);
    setIsLoading(true);
    setLoadingProgress('Loading with WebView reader...');
    setUseWebViewFallback(true); // Always use WebView to avoid sandbox issues
    retryCountRef.current = 0;
  }, [targetSectionId]);

  // Set up header
  useEffect(() => {
    const chapterData = getChapterById(chapterNumber.toString());
    navigation.setOptions({
      title: chapterData?.title || bookTitle || t('book.ebook'),
    });
  }, [navigation, chapterNumber, bookTitle, t]);

  // Set up loading timeout
  useEffect(() => {
    if (isLoading) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set a 30-second timeout for WebView loading
      timeoutRef.current = setTimeout(() => {
        console.error('EpubReaderScreen - WebView loading timeout after 30 seconds');
        setError('Loading timeout. Please check your internet connection and try again.');
        setIsLoading(false);
      }, 30000);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [isLoading]);

  const epubUrl = getEpubUrl(chapterNumber);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChapterNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && chapterNumber > 1) {
      navigation.setParams({ 
        bookTitle, 
        targetSectionId: `${chapterNumber - 1}-1` 
      });
    } else if (direction === 'next' && chapterNumber < 5) {
      navigation.setParams({ 
        bookTitle, 
        targetSectionId: `${chapterNumber + 1}-1` 
      });
    }
  };

  const handleRetry = () => {
    console.log('EpubReaderScreen - Retrying to load chapter:', chapterNumber);
    setError(null);
    setIsLoading(true);
    setIsReady(false);
    setLoadingProgress('Retrying...');
    retryCountRef.current = 0;
  };

  const handleWebViewLoad = () => {
    console.log('EpubReaderScreen - WebView loaded successfully');
    setIsReady(true);
    setIsLoading(false);
    setError(null);
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('EpubReaderScreen - WebView error:', nativeEvent);
    setError(`WebView failed to load: ${nativeEvent.description || 'Unknown error'}`);
    setIsLoading(false);
  };

  if (error) {
    return (
      <ReaderProvider>
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={handleBack}
            />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1}>
                {t('book.chapter')} {chapterNumber}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.readerContainer, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
            <Text variant="headlineSmall" style={{ textAlign: 'center', marginBottom: 16, color: theme.colors.error }}>
              ⚠️ Error Loading Chapter
            </Text>
            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 24, color: theme.colors.onSurfaceVariant }}>
              {error}
            </Text>
            <Button mode="contained" onPress={handleRetry} style={{ marginBottom: 16 }}>
              Try Again
            </Button>
            <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
              Chapter {chapterNumber} • WebView Reader
            </Text>
          </View>
        </SafeAreaView>
      </ReaderProvider>
    );
  }

  if (isLoading) {
    return (
      <ReaderProvider>
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={handleBack}
            />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1}>
                {t('book.chapter')} {chapterNumber}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.readerContainer, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" animating={true} />
            <Text variant="bodyMedium" style={{ marginTop: 16, textAlign: 'center' }}>
              {loadingProgress || t('book.loading') || 'Loading chapter...'}
            </Text>
            <Text variant="bodySmall" style={{ marginTop: 8, textAlign: 'center', opacity: 0.7 }}>
              Chapter {chapterNumber} of {totalChapters} • WebView Reader
            </Text>
          </View>

          {/* WebView for loading */}
          <View style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1 }}>
            <WebView
              source={{ html: createWebViewHTML(epubUrl, theme) }}
              onLoad={handleWebViewLoad}
              onError={handleWebViewError}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
            />
          </View>
        </SafeAreaView>
      </ReaderProvider>
    );
  }

  return (
    <ReaderProvider>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleBack}
          />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1}>
              {t('book.chapter')} {chapterNumber}
            </Text>
            {currentSection && (
              <Text variant="bodySmall" style={{ opacity: 0.7 }} numberOfLines={1}>
                {currentSection.label || currentSection.title}
              </Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.readerContainer}>
          <WebView
            source={{ html: createWebViewHTML(epubUrl, theme) }}
            style={{ flex: 1 }}
            onLoad={handleWebViewLoad}
            onError={handleWebViewError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            showsVerticalScrollIndicator={true}
            bounces={true}
          />
        </View>

        {/* Chapter Navigation */}
        <View style={styles.controlsContainer}>
          <IconButton
            icon="book-open-page-variant"
            size={24}
            disabled={chapterNumber <= 1}
            onPress={() => handleChapterNavigation('prev')}
            style={[
              styles.controlButton,
              chapterNumber <= 1 && styles.disabledButton
            ]}
          />
          <Text variant="bodyMedium" style={styles.progressText}>
            Chapter {chapterNumber} / {totalChapters} (Web)
          </Text>
          <IconButton
            icon="book-open-page-variant"
            size={24}
            disabled={chapterNumber >= totalChapters}
            onPress={() => handleChapterNavigation('next')}
            style={[
              styles.controlButton,
              chapterNumber >= totalChapters && styles.disabledButton
            ]}
          />
        </View>
      </SafeAreaView>
    </ReaderProvider>
  );
};

export default EpubReaderScreen;
