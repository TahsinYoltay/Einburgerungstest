import React, { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Text, Image } from 'react-native';
import { Reader, ReaderProvider, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { useEpubReader, ReadingLocation, TocItem } from '../contexts/EpubReaderContext';
import { updateSectionProgress } from '../services/readingProgressService';
import type { Chapter } from '../data/book/chapters';
import { chapters } from '../data/book/chapters';

// Static EPUB asset mapping - Metro bundler requires static requires
const EPUB_ASSETS: Record<string, any> = {
  'LIUKV3': require('../assets/bookEpub/LIUKV3.epub'),
};

interface UnifiedEpubReaderProps {
  epubPath: string; // Path to EPUB file in assets
  chapterId?: string;
  sectionId?: string;
  chapter?: Chapter; // Chapter data with chapterHref
  onProgressUpdate?: (chapterId: string, sectionId: string, progress: number) => void;
  onNavigationReady?: () => void;
}

export interface UnifiedEpubReaderRef {
  navigateToHref: (href: string) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}

/**
 * Clean EPUB Reader Component
 * 
 * This component uses @epubjs-react-native to handle all EPUB rendering,
 * navigation, and styling automatically. No manual HTML processing needed.
 */
export const UnifiedEpubReader = forwardRef<UnifiedEpubReaderRef, UnifiedEpubReaderProps>(({
  epubPath,
  chapterId,
  sectionId,
  chapter,
  onProgressUpdate,
  onNavigationReady,
}, ref) => {
  const { settings, updateLocation, setBookTitle, setToc } = useEpubReader();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localEpubUri, setLocalEpubUri] = useState<string | null>(null);

  // Extract EPUB to accessible location
  useEffect(() => {
    extractEpubToLocal();
  }, [epubPath]);

  const extractEpubToLocal = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Loading EPUB:', epubPath);

      // Get the EPUB asset from static mapping
      const epubAsset = EPUB_ASSETS[epubPath];
      if (!epubAsset) {
        throw new Error(`EPUB asset not found: ${epubPath}. Make sure it's added to EPUB_ASSETS mapping.`);
      }

      // Resolve the asset source to get the actual file URI
      const asset = Image.resolveAssetSource(epubAsset);
      if (!asset || !asset.uri) {
        throw new Error(`Could not resolve EPUB asset: ${epubPath}`);
      }

      console.log('Asset resolved:', asset.uri);

      // Set up cache directory
      const cacheDir = RNFS.CachesDirectoryPath;
      const epubFileName = `${epubPath}.epub`;
      const targetPath = `${cacheDir}/${epubFileName}`;

      // Check if already cached
      const exists = await RNFS.exists(targetPath);
      if (!exists) {
        console.log('Extracting EPUB to cache:', targetPath);
        
        const sourceUri = asset.uri;

        // Copy/download from bundle to cache
        if (sourceUri.startsWith('http')) {
          // Development: download from Metro bundler
          console.log('Downloading from Metro...');
          const result = await RNFS.downloadFile({
            fromUrl: sourceUri,
            toFile: targetPath,
          }).promise;
          
          if (result.statusCode !== 200) {
            throw new Error(`Failed to download EPUB: HTTP ${result.statusCode}`);
          }
        } else if (sourceUri.startsWith('file://')) {
          // Copy from file system
          console.log('Copying from file system...');
          await RNFS.copyFile(sourceUri.replace('file://', ''), targetPath);
        } else {
          // Try to copy directly
          console.log('Copying from source...');
          await RNFS.copyFile(sourceUri, targetPath);
        }
        
        console.log('EPUB extracted successfully to:', targetPath);
      } else {
        console.log('Using cached EPUB:', targetPath);
      }

      // Verify the file exists
      const finalExists = await RNFS.exists(targetPath);
      if (!finalExists) {
        throw new Error('EPUB file was not created successfully');
      }

      const fileUri = `file://${targetPath}`;
      console.log('Setting EPUB URI:', fileUri);
      setLocalEpubUri(fileUri);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to extract EPUB:', err);
      setError(`Failed to load book: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (error || !localEpubUri) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load book'}</Text>
      </View>
    );
  }

  return (
    <ReaderProvider>
      <EpubReaderContent
        ref={ref}
        epubUri={localEpubUri}
        chapterId={chapterId}
        sectionId={sectionId}
        chapter={chapter}
        onProgressUpdate={onProgressUpdate}
        onNavigationReady={onNavigationReady}
      />
    </ReaderProvider>
  );
});

/**
 * Inner component with access to Reader context
 */
interface EpubReaderContentProps {
  epubUri: string;
  chapterId?: string;
  sectionId?: string;
  chapter?: Chapter;
  onProgressUpdate?: (chapterId: string, sectionId: string, progress: number) => void;
  onNavigationReady?: () => void;
}

const EpubReaderContent = forwardRef<UnifiedEpubReaderRef, EpubReaderContentProps>(({
  epubUri,
  chapterId,
  sectionId,
  chapter,
  onProgressUpdate,
  onNavigationReady,
}, ref) => {
  const { settings, updateLocation, setBookTitle, setToc, saveProgress } = useEpubReader();
  const {
    goToLocation,
    changeFontSize,
    changeTheme,
    toc: epubToc,
    isLoading,
    goNext,
    goPrevious,
  } = useReader();

  const readingStartTime = useRef(Date.now());
  const currentChapterRef = useRef<string | undefined>(chapterId);
  const currentLocationRef = useRef<string | null>(null);
  const currentCfiRef = useRef<string | null>(null); // Track CFI for restoring position
  
  // Define the minimum allowed location (start of Chapter 1)
  const MIN_ALLOWED_LOCATION = 'OEBPS/part0005.xhtml';

  // Expose navigation methods via ref
  useImperativeHandle(ref, () => ({
    navigateToHref: (href: string) => {
      console.log('Navigating to href:', href);
      goToLocation(href);
    },
    goToNextPage: () => {
      goNext?.();
    },
    goToPreviousPage: () => {
      // Check if we're at the start of Chapter 1 - prevent going backwards
      if (currentLocationRef.current) {
        const currentHref = currentLocationRef.current.split('#')[0]; // Remove anchor
        if (currentHref === MIN_ALLOWED_LOCATION) {
          console.log('🛑 Already at Chapter 1 start - cannot go backwards');
          return;
        }
      }
      goPrevious?.();
    },
  }), [goToLocation, goNext, goPrevious]);

  // Load book metadata and TOC
  useEffect(() => {
    // Set default book title
    setBookTitle('Life in the United Kingdom');
  }, []);

  // Update TOC when available
  useEffect(() => {
    if (epubToc && epubToc.length > 0) {
      console.log('EPUB TOC loaded:', JSON.stringify(epubToc, null, 2));
      const formattedToc = formatToc(epubToc);
      setToc(formattedToc);
      onNavigationReady?.();
    }
  }, [epubToc]);

  // Navigation effect will be defined after the navigation functions

  // Apply reader settings - let epub.js naturally handle pagination
  useEffect(() => {
    if (settings.fontSize && changeFontSize) {
      console.log('🔤 Changing font size to:', settings.fontSize, 'px');
      // Just change the font size - epub.js will maintain position naturally
      changeFontSize(`${settings.fontSize}px`);
    }
  }, [settings.fontSize, changeFontSize]);

  useEffect(() => {
    if (settings.theme) {
      changeTheme({
        body: {
          background: settings.theme.backgroundColor,
          color: settings.theme.textColor,
        },
      });
    }
  }, [settings.theme]);

  const formatToc = (tocItems: any[]): TocItem[] => {
    return tocItems.map((item) => ({
      id: item.id || item.href,
      label: item.label,
      href: item.href,
      subitems: item.subitems ? formatToc(item.subitems) : undefined,
    }));
  };

  const navigateToChapter = useCallback((targetChapterId: string) => {
    if (!epubToc) {
      console.log('No TOC available yet');
      return;
    }

    console.log('Finding chapter in TOC:', targetChapterId);
    
    // Find the TOC item for this chapter
    const tocItem = findTocItemByChapterId(epubToc, targetChapterId);
    
    if (tocItem && tocItem.href) {
      console.log('Found chapter, navigating to:', tocItem.href, 'Label:', tocItem.label);
      goToLocation(tocItem.href);
      currentChapterRef.current = targetChapterId;
    } else {
      console.warn('Chapter not found in TOC:', targetChapterId);
      console.log('Available TOC items:', epubToc.map(t => ({ id: t.id, label: t.label, href: t.href })));
    }
  }, [epubToc, goToLocation]);

  const navigateToSection = useCallback((targetSectionId: string) => {
    if (!epubToc) {
      console.log('No TOC available yet');
      return;
    }

    // Extract chapter ID from section ID (e.g., "3-2" -> "3")
    const chapId = targetSectionId.split('-')[0];
    const sectionNum = targetSectionId.split('-')[1];
    
    // If it's the FIRST subsection (e.g., "3-1"), navigate to chapter start to show image
    if (sectionNum === '1' && chapter?.chapterHref) {
      console.log('🖼️ First subsection detected! Navigating to chapter start to show image:', chapter.chapterHref);
      goToLocation(chapter.chapterHref);
      currentChapterRef.current = chapId;
      return;
    }

    console.log('Finding section in TOC:', targetSectionId);
    
    // Find the TOC item for this section
    const tocItem = findTocItemBySectionId(epubToc, targetSectionId);
    
    if (tocItem && tocItem.href) {
      console.log('Found section, navigating to:', tocItem.href, 'Label:', tocItem.label);
      goToLocation(tocItem.href);
      currentChapterRef.current = chapId;
    } else {
      console.warn('Section not found in TOC:', targetSectionId);
      // Try to find by chapter number instead
      console.log('Trying to navigate to chapter instead:', chapId);
      
      // Inline chapter finding as fallback
      const chapterItem = findTocItemByChapterId(epubToc, chapId);
      if (chapterItem && chapterItem.href) {
        goToLocation(chapterItem.href);
        currentChapterRef.current = chapId;
      }
    }
  }, [epubToc, goToLocation, chapter]);

  // Navigate to specific chapter/section when TOC is ready
  useEffect(() => {
    if (!isLoading && epubToc && epubToc.length > 0) {
      console.log('Attempting navigation - chapterId:', chapterId, 'sectionId:', sectionId);
      
      // Small delay to ensure epub.js is fully ready
      const timer = setTimeout(() => {
        if (sectionId) {
          // Navigate to specific subsection
          console.log('Navigating to section:', sectionId);
          navigateToSection(sectionId);
        } else if (chapterId && chapter?.chapterHref) {
          // Navigate to chapter start (title page with image)
          console.log('Navigating to chapter start with chapterHref:', chapter.chapterHref);
          goToLocation(chapter.chapterHref);
          currentChapterRef.current = chapterId;
        } else if (chapterId) {
          // Fallback to TOC-based navigation
          console.log('Navigating to chapter via TOC:', chapterId);
          navigateToChapter(chapterId);
        }
      }, 300); // 300ms delay
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, chapterId, sectionId, chapter, epubToc, goToLocation, navigateToChapter, navigateToSection]);

  const handleLocationChange = useCallback((location: any) => {
    // Track reading progress
    const timeSpent = Math.floor((Date.now() - readingStartTime.current) / 1000);
    readingStartTime.current = Date.now();

    // Ensure we have a current chapter
    if (!currentChapterRef.current && chapterId) {
      currentChapterRef.current = chapterId;
    }

    // Track current location for boundary checking
    if (location?.start?.href) {
      currentLocationRef.current = location.start.href;
      // Save CFI for restoring position during font size changes
      if (location.start.cfi) {
        currentCfiRef.current = location.start.cfi;
      }
      
      // If user navigated backwards past Chapter 1, force them back
      const currentHref = location.start.href.split('#')[0];
      if (currentHref < MIN_ALLOWED_LOCATION && !currentHref.includes('part0005')) {
        console.log('⚠️ User went backwards past Chapter 1! Redirecting to Chapter 1 start...');
        setTimeout(() => {
          goToLocation(MIN_ALLOWED_LOCATION);
        }, 100);
        return;
      }
    }

    if (location) {
      const progress = location.start?.percentage || 0;
      const currentChapter = currentChapterRef.current || chapterId;
      const currentHref = location.start?.href || '';
      
      // Dynamically detect which section we're in based on the current href
      let detectedSection = sectionId; // Start with prop value
      
      if (!detectedSection && currentChapter) {
        // Find the chapter data
        const chapterData = chapters.find(ch => ch.id === currentChapter);
        if (chapterData) {
          // Find which subsection matches the current href
          const matchingSubSection = chapterData.subSections.find(sub => {
            const subHref = sub.href.split('#')[0]; // Remove anchor
            const locHref = currentHref.split('#')[0]; // Remove anchor
            return locHref.includes(subHref) || subHref.includes(locHref);
          });
          
          if (matchingSubSection) {
            detectedSection = matchingSubSection.id;
            console.log('🔍 Detected section from href:', detectedSection, 'href:', currentHref);
          } else {
            // Fallback to first section
            detectedSection = `${currentChapter}-1`;
          }
        } else {
          detectedSection = `${currentChapter}-1`;
        }
      }
      
      console.log('📖 Location changed:', {
        chapter: currentChapter,
        section: detectedSection,
        href: currentHref,
        progress: `${progress.toFixed(1)}%`,
        timeSpent: `${timeSpent}s`
      });

      if (currentChapter && detectedSection) {
        // Update context
        updateLocation({
          chapterId: currentChapter,
          sectionId: detectedSection,
          cfi: location.start?.cfi,
          progress: progress / 100,
        });

        // Save progress
        saveProgress();

        // Notify parent
        if (onProgressUpdate) {
          onProgressUpdate(currentChapter, detectedSection, progress);
        }

        // Update reading progress service - save to detected section
        updateSectionProgress({
          bookId: 'life-in-the-uk',
          sectionId: detectedSection,
          timeSpentSec: timeSpent,
          scrollProgress: progress / 100,
          markDone: progress >= 90,
          syncMode: 'local-only',
        }).then(() => {
          console.log('✅ Progress saved to section:', detectedSection, `${progress.toFixed(1)}%`);
        }).catch(err => {
          console.warn('❌ Failed to save progress:', err);
        });
      }
    }
  }, [chapterId, sectionId, updateLocation, saveProgress, onProgressUpdate]);

  const handleSwipeRight = useCallback(() => {
    // Swipe right = go to previous page
    if (currentLocationRef.current) {
      const currentHref = currentLocationRef.current.split('#')[0];
      if (currentHref === MIN_ALLOWED_LOCATION) {
        console.log('🛑 Already at Chapter 1 start - swipe backwards blocked');
        return;
      }
    }
    console.log('⬅️ Swiped right - going to previous page');
    goPrevious?.();
  }, [goPrevious]);

  const handleSwipeLeft = useCallback(() => {
    // Swipe left = go to next page
    console.log('➡️ Swiped left - going to next page');
    goNext?.();
  }, [goNext]);

  return (
    <View style={styles.readerContainer}>
      <Reader
        src={epubUri}
        fileSystem={useFileSystem}
        onLocationChange={handleLocationChange}
        width={'100%'}
        height={'100%'}
        enableSwipe={true}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
      />
    </View>
  );
});

/**
 * Helper functions to find TOC items by chapter/section ID
 */
function findTocItemByChapterId(toc: any[], chapterId: string): any {
  // Convert chapterId to number for comparison
  const chapterNum = parseInt(chapterId, 10);

  // Filter out ONLY "Contents" front matter (copyright pages removed from EPUB)
  const chapterItems = toc.filter(item => {
    const label = (item.label || '').trim().toLowerCase();
    return label !== 'contents';
  });

  console.log('Filtered chapter items:', chapterItems.map(t => ({ id: t.id, label: t.label.trim() })));

  // Direct index-based matching: chapterId 1 = index 0, chapterId 2 = index 1, etc.
  if (chapterNum > 0 && chapterNum <= chapterItems.length) {
    const chapter = chapterItems[chapterNum - 1];
    console.log('Matched chapter by index:', chapterNum - 1, '→', chapter.label.trim(), 'href:', chapter.href);
    return chapter;
  }

  // Fallback: try to match by ID or label
  for (const item of chapterItems) {
    const label = (item.label || '').trim().toLowerCase();
    if (item.id === chapterId ||
        item.id === `chapter${chapterId}` ||
        label.includes(`chapter ${chapterId}`) ||
        label.includes(`chapter${chapterId}`)) {
      console.log('Matched chapter by label/ID:', item.label.trim(), 'href:', item.href);
      return item;
    }
  }

  console.warn('Chapter not found:', chapterId);
  return null;
}

function findTocItemBySectionId(toc: any[], sectionId: string): any {
  // Parse section ID (e.g., "3-4" means chapter 3, section 4)
  const [chapterNum, sectionNum] = sectionId.split('-').map(n => parseInt(n, 10));
  
  console.log('Looking for section:', sectionId, '=> Chapter:', chapterNum, 'Section:', sectionNum);
  
  // Filter out ONLY "Contents" front matter (copyright pages removed from EPUB)
  const chapterItems = toc.filter(item => {
    const label = (item.label || '').trim().toLowerCase();
    return label !== 'contents';
  });

  // Find the chapter by index (chapterNum 1 = index 0)
  if (chapterNum > 0 && chapterNum <= chapterItems.length) {
    const chapter = chapterItems[chapterNum - 1];
    console.log('Found chapter at index', chapterNum - 1, ':', chapter.label.trim());
    
    // Check if chapter has subsections
    if (chapter.subitems && chapter.subitems.length > 0) {
      // Find section by index (sectionNum 1 = index 0)
      if (sectionNum > 0 && sectionNum <= chapter.subitems.length) {
        const section = chapter.subitems[sectionNum - 1];
        console.log('Found section at index', sectionNum - 1, ':', section.label.trim(), 'href:', section.href);
        return section;
      } else {
        console.warn('Section index out of range:', sectionNum, 'Max:', chapter.subitems.length);
      }
    } else {
      console.warn('Chapter has no subsections');
    }
  }

  // Fallback: try to find by ID or label match
  for (const item of toc) {
    const label = (item.label || '').trim().toLowerCase();
    if (item.id === sectionId ||
        item.id === `section${sectionId}` ||
        label.includes(sectionId)) {
      console.log('Matched section by ID/label:', item.label.trim(), 'href:', item.href);
      return item;
    }

    // Recursively check subitems
    if (item.subitems) {
      const found = findTocItemBySectionId(item.subitems, sectionId);
      if (found) return found;
    }
  }

  console.warn('Section not found:', sectionId);
  return null;
}

const styles = StyleSheet.create({
  readerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    padding: 20,
  },
});
