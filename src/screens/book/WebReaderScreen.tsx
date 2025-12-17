import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Appbar, IconButton, Divider, Surface, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ReaderSearchBar } from '../../components/book/ReaderSearchBar';
import { ROUTES } from '../../constants/routes';
import { RootStackParamList } from '../../navigations/StackNavigator';
import { useAppTheme } from '../../providers/ThemeProvider';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { isSectionRead, markSectionAsUnread, markSectionAsRead, getChapterProgress } from '../../utils/readingProgress';
import { createStyles } from './WebReaderScreen.style';

import { LanguageSelector } from '../../components/common/LanguageSelector';
import { switchBookLanguage } from '../../store/slices/bookSlice';
import { RatingPrompt } from '../../components/common/RatingPrompt';
import { RatingService } from '../../services/RatingService';
import { recordChapterCompleted, recordPromptShown } from '../../store/slices/ratingSlice';
import PaywallModal from '../../components/common/PaywallModal';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

type ReaderRouteProp = RouteProp<RootStackParamList, typeof ROUTES.READER>;

const WebReaderScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const route = useRoute<ReaderRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { chapterId, subSectionId } = route.params;
  const { data: bookData, currentLanguage, loading: bookLoading, downloadProgress } = useAppSelector(state => state.book);
  const userId = useAppSelector(state => state.auth.firebaseUid) || 'local';
  const enableCloudSync = useAppSelector(state => state.auth.status === 'authenticated');
  const isPro = useAppSelector(state => state.subscription.status === 'active');
  const rating = useAppSelector(state => state.rating);
  const dispatch = useAppDispatch();
  
  // Debug logging for isPro changes
  useEffect(() => {
    console.log('[WebReaderScreen] isPro status changed to:', isPro);
  }, [isPro]);
  
  const webViewRef = useRef<WebView>(null);
  const [fontSize, setFontSize] = useState(100);
  const [showFontControl, setShowFontControl] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [isWaitingForLang, setIsWaitingForLang] = useState(false);
  
  // Search State
  const [searchVisible, setSearchVisible] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const bottomBarPadding = Math.max(insets.bottom, 16) + 8;

  const targetSection = useMemo(() => {
    if (!bookData) return null;
    const chapter = bookData.chapters.find(c => c.id === chapterId);
    if (!chapter) return null;
    return chapter.subSections.find(s => s.id === subSectionId);
  }, [bookData, chapterId, subSectionId]);

  // Check read status on mount
  useEffect(() => {
    let isActive = true;
    const checkReadStatus = async () => {
      if (subSectionId) {
        const status = await isSectionRead(subSectionId, userId, enableCloudSync);
        if (isActive) setIsRead(status);
      }
    };
    checkReadStatus();
    return () => { isActive = false; };
  }, [subSectionId, userId, enableCloudSync]);

  const content = targetSection?.content || '<p>Content not found</p>';

  // Generate CSS dynamically based on theme
  const css = useMemo(() => `
    html, body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 100%;
      padding: 16px 12px;
      line-height: 1.6;
      background-color: ${theme.colors.background} !important;
      color: ${theme.colors.onBackground} !important;
    }
    h1, h2, h3, h4, h5, h6 {
      color: ${theme.colors.primary} !important;
      margin-top: 1.5em;
    }
    a {
      color: ${theme.colors.secondary} !important;
    }
    img {
        border-radius: 8px;
        margin: 1rem 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .search-highlight { background-color: ${theme.dark ? '#f1c40f' : '#ffff00'}; color: black !important; }
    .search-highlight-active { background-color: ${theme.dark ? '#e67e22' : '#ff9900'}; }
  `, [theme]);

  // Inject styles directly into HTML to ensure they load immediately with the page
  const finalHtml = useMemo(() => {
    return content.replace('</head>', `<style>${css}</style></head>`);
  }, [content, css]);

  const source = useMemo(() => ({ html: finalHtml, baseUrl: '' }), [finalHtml]);

  // Initial injection script - ensures font size is applied on load/reload
  const injectedJS = useMemo(() => `
    (function() {
      // Init font size
      document.documentElement.style.fontSize = '${fontSize}%';
      
      // Search Logic
      window.highlightText = function(term) {
        // Clear prev
        var marks = document.querySelectorAll('.search-highlight');
        marks.forEach(function(m) {
            var p = m.parentNode;
            p.replaceChild(document.createTextNode(m.textContent), m);
            p.normalize();
        });
        if (!term) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'SEARCH_RESULT', count: 0}));
            return;
        }
        
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        var nodes = [];
        while(walker.nextNode()) nodes.push(walker.currentNode);
        
        var regex = new RegExp('(' + term.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&') + ')', 'gi');
        
        nodes.forEach(function(node) {
            if (node.parentNode.nodeName === 'SCRIPT' || node.parentNode.nodeName === 'STYLE') return;
            if (regex.test(node.nodeValue)) {
                var span = document.createElement('span');
                span.innerHTML = node.nodeValue.replace(regex, '<span class="search-highlight">$1</span>');
                node.parentNode.replaceChild(span, node);
            }
        });
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'SEARCH_RESULT', count: document.querySelectorAll('.search-highlight').length}));
      };
      
      window.scrollToMatch = function(idx) {
        var matches = document.querySelectorAll('.search-highlight');
        if (matches.length === 0) return;
        matches.forEach(function(m) { m.classList.remove('search-highlight-active'); });
        
        if (idx >= matches.length) idx = 0;
        if (idx < 0) idx = matches.length - 1;
        
        var current = matches[idx];
        current.classList.add('search-highlight-active');
        current.scrollIntoView({behavior: 'smooth', block: 'center'});
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'MATCH_INDEX', index: idx}));
      };
    })();
    true;
  `, [fontSize]);

  // Update font size dynamically without reload
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        document.documentElement.style.fontSize = '${fontSize}%';
        true;
      `);
    }
  }, [fontSize]);

  // Auto-close language selector when download finishes
  useEffect(() => {
    if (isWaitingForLang && !bookLoading) {
      setShowLanguageSelector(false);
      setIsWaitingForLang(false);
    }
  }, [bookLoading, isWaitingForLang]);

  const handleIncreaseFont = () => {
    setFontSize(prev => Math.min(prev + 10, 200));
  };

  const handleDecreaseFont = () => {
    setFontSize(prev => Math.max(prev - 10, 50));
  };

  const handleMarkRead = async () => {
    if (subSectionId) {
      if (isRead) {
        await markSectionAsUnread(subSectionId, userId, enableCloudSync);
        setIsRead(false);
      } else {
        await markSectionAsRead(subSectionId, 0, userId, enableCloudSync);
        setIsRead(true);
        
        // Check for chapter completion
        if (bookData && chapterId) {
           const chapter = bookData.chapters.find(c => c.id === chapterId);
           if (chapter) {
              const sectionIds = chapter.subSections.map(s => s.id);
              // We just marked one as read, so we can assume it's read in the check
              // BUT getChapterProgress is async and reads from storage.
              // markSectionAsRead writes to storage. It should be consistent.
              const progress = await getChapterProgress(sectionIds, userId, enableCloudSync);
              
              // If all sections are read (100% complete)
              if (progress.percentage === 100) {
                 dispatch(recordChapterCompleted());
                 
                 // Simulate logic for prompt
                 const simulatedState = {
                     ...rating,
                     totalChaptersCompleted: rating.totalChaptersCompleted + 1,
                     chaptersCompletedSinceLastPrompt: rating.chaptersCompletedSinceLastPrompt + 1,
                     installDate: rating.installDate || Date.now()
                 };
                 
                 if (RatingService.shouldShowPrompt(simulatedState)) {
                     setShowRatingPrompt(true);
                     dispatch(recordPromptShown());
                 }
              }
           }
        }
      }
    }
  };

  const handleLanguageSwitch = (langCode: string) => {
    dispatch(switchBookLanguage(langCode));
    setIsWaitingForLang(true);
  };

  const handleNext = () => {
    if (!bookData) return;
    
    const cIndex = bookData.chapters.findIndex(c => c.id === chapterId);
    if (cIndex === -1) return;
    
    const chapter = bookData.chapters[cIndex];
    const sIndex = chapter.subSections.findIndex(s => s.id === subSectionId);
    
    let nextParams = null;

    if (sIndex !== -1 && sIndex < chapter.subSections.length - 1) {
      const nextSub = chapter.subSections[sIndex + 1];
      nextParams = { chapterId: chapter.id, subSectionId: nextSub.id };
    } else if (cIndex < bookData.chapters.length - 1) {
      // Moving to next chapter
      const nextChapterIndex = cIndex + 1;
      const nextChapter = bookData.chapters[nextChapterIndex];
      
      // Check Paywall: Chapter 1 (index 0) is free. Others locked.
      if (nextChapterIndex > 0 && !isPro) {
        setShowPaywall(true);
        return;
      }

      if (nextChapter.subSections.length > 0) {
        nextParams = { chapterId: nextChapter.id, subSectionId: nextChapter.subSections[0].id };
      }
    }

    if (nextParams) {
      navigation.dispatch({
        type: 'PUSH',
        payload: {
          name: ROUTES.READER,
          params: nextParams,
        },
      });
    } else {
      // End of book - dismiss reader
      navigation.popToTop();
    }
  };

  const toggleSearch = () => {
    if (!searchVisible) {
        setShowFontControl(false);
        setSearchVisible(true);
    } else {
        setSearchVisible(false);
        // Clear highlights
        webViewRef.current?.injectJavaScript(`window.highlightText(''); true;`);
    }
  };

  const toggleFontControl = () => {
    if (!showFontControl) {
        setSearchVisible(false);
        // Clear highlights
        webViewRef.current?.injectJavaScript(`window.highlightText(''); true;`);
        setShowFontControl(true);
    } else {
        setShowFontControl(false);
    }
  };

  const handleSearch = (text: string) => {
    webViewRef.current?.injectJavaScript(`window.highlightText('${text}'); true;`);
  };

  const handleNextMatch = () => {
    webViewRef.current?.injectJavaScript(`window.scrollToMatch(${currentMatch + 1}); true;`);
  };

  const handlePrevMatch = () => {
    webViewRef.current?.injectJavaScript(`window.scrollToMatch(${currentMatch - 1}); true;`);
  };

  const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'SEARCH_RESULT') {
            setMatchCount(data.count);
            setCurrentMatch(0);
            if (data.count > 0) {
                // Auto scroll to first
                webViewRef.current?.injectJavaScript(`window.scrollToMatch(0); true;`);
            }
        } else if (data.type === 'MATCH_INDEX') {
            setCurrentMatch(data.index);
        }
    } catch (e) {
        // ignore
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
        <Appbar.Action icon="close" onPress={() => navigation.popToTop()} />
        <View style={{ flex: 1 }} />
        <Appbar.Action icon="format-size" onPress={toggleFontControl} iconColor={showFontControl ? theme.colors.primary : undefined} />
        <Appbar.Action icon="magnify" onPress={toggleSearch} iconColor={searchVisible ? theme.colors.primary : undefined} />
        <Appbar.Action icon="translate" onPress={() => setShowLanguageSelector(true)} />
        <Appbar.Action icon={isDarkMode ? "brightness-7" : "brightness-3"} onPress={toggleTheme} />
      </Appbar.Header>
      
      {showFontControl && (
        <View style={styles.fontControlBar}>
          <View style={styles.fontControlRow}>
            <IconButton icon="minus" size={20} onPress={handleDecreaseFont} disabled={fontSize <= 50} />
            <Text style={styles.fontText}>{fontSize}%</Text>
            <IconButton icon="plus" size={20} onPress={handleIncreaseFont} disabled={fontSize >= 200} />
          </View>
          <Divider />
        </View>
      )}

      <LanguageSelector
        visible={showLanguageSelector}
        onDismiss={() => setShowLanguageSelector(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleLanguageSwitch}
        loading={bookLoading}
        downloadProgress={downloadProgress}
      />

      <ReaderSearchBar 
        visible={searchVisible}
        onClose={toggleSearch}
        onSearch={handleSearch}
        onNext={handleNextMatch}
        onPrev={handlePrevMatch}
        matchCount={matchCount}
        currentMatch={currentMatch}
      />

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={source}
        style={{ backgroundColor: theme.colors.background, flex: 1 }}
        injectedJavaScript={injectedJS}
        onMessage={handleWebViewMessage}
        showsVerticalScrollIndicator={true}
        startInLoadingState={true}
        renderLoading={() => (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        )}
      />
      
      <Surface style={[styles.bottomBar, { paddingBottom: bottomBarPadding, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
        <Button 
          mode={isRead ? "contained" : "outlined"} 
          onPress={handleMarkRead}
          icon={isRead ? "check-circle" : "check-circle-outline"}
          style={[styles.bottomButton, isRead && { borderWidth: 1, borderColor: 'transparent' }]}
          textColor={isRead ? theme.colors.onPrimary : theme.colors.primary}
        >
          {isRead ? t('book.read') : t('book.markAsRead')}
        </Button>
        <Button 
          mode="contained" 
          onPress={handleNext}
          icon="arrow-right"
          contentStyle={{ flexDirection: 'row-reverse' }}
          style={[styles.bottomButton, { borderWidth: 1, borderColor: 'transparent' }]}
        >
          {t('book.next')}
        </Button>
      </Surface>

      <RatingPrompt 
        visible={showRatingPrompt} 
        onDismiss={() => setShowRatingPrompt(false)} 
        source="auto"
      />
      <PaywallModal 
        visible={showPaywall} 
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
};

export default WebReaderScreen;
