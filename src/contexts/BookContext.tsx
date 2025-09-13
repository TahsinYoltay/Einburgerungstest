import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookContextType, ReaderPosition, ReaderSettings, BookProgress } from '../types/reader';
import { EpubBook, EpubSection } from '../types/epub';
import { loadOrParseEpub } from '../services/epubParser';

const STORAGE_KEYS = {
  SETTINGS: 'epub_reader_settings',
  PROGRESS: 'epub_reader_progress_',
  CURRENT_BOOK: 'epub_current_book'
};

interface BookState {
  book: EpubBook | null;
  sections: EpubSection[];
  currentSection: EpubSection | null;
  position: ReaderPosition;
  settings: ReaderSettings;
  progress: BookProgress | null;
  isLoading: boolean;
  error: string | null;
}

type BookAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BOOK'; payload: { book: EpubBook; sections: EpubSection[] } }
  | { type: 'SET_CURRENT_SECTION'; payload: EpubSection | null }
  | { type: 'UPDATE_POSITION'; payload: Partial<ReaderPosition> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ReaderSettings> }
  | { type: 'SET_PROGRESS'; payload: BookProgress | null }
  | { type: 'CLOSE_BOOK' };

const defaultSettings: ReaderSettings = {
  fontSize: 100,
  fontFamily: 'system',
  lineHeight: 1.6,
  theme: 'light',
  margin: 20,
  textAlign: 'left',
  isRTL: false
};

const defaultPosition: ReaderPosition = {
  sectionIndex: 0,
  href: '',
  scrollProgress: 0
};

const initialState: BookState = {
  book: null,
  sections: [],
  currentSection: null,
  position: defaultPosition,
  settings: defaultSettings,
  progress: null,
  isLoading: false,
  error: null
};

function bookReducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_BOOK':
      const { book, sections } = action.payload;
      const firstSection = sections[0] || null;
      return {
        ...state,
        book,
        sections,
        currentSection: firstSection,
        position: {
          ...state.position,
          sectionIndex: 0,
          href: firstSection?.href || ''
        },
        isLoading: false,
        error: null
      };
    
    case 'SET_CURRENT_SECTION':
      return { ...state, currentSection: action.payload };
    
    case 'UPDATE_POSITION':
      return {
        ...state,
        position: { ...state.position, ...action.payload }
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    
    case 'CLOSE_BOOK':
      return {
        ...initialState,
        settings: state.settings // Keep settings
      };
    
    default:
      return state;
  }
}

const BookContext = createContext<BookContextType | null>(null);

interface BookProviderProps {
  children: React.ReactNode;
}

export function BookProvider({ children }: BookProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(bookReducer, initialState);

  // Load settings on init
  useEffect(() => {
    console.log('BookProvider - Initializing...');
    loadSettings();
    checkForPreviousBook();
    
    // Clear cache on startup to ensure fresh content
    const clearCache = async () => {
      try {
        const { clearEpubCache } = await import('../services/epubParser');
        await clearEpubCache();
        console.log('BookProvider - Cache cleared on startup');
      } catch (error) {
        console.warn('BookProvider - Failed to clear cache:', error);
      }
    };
    clearCache();
  }, []);

  const checkForPreviousBook = useCallback(async () => {
    try {
      const previousBook = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_BOOK);
      console.log('BookProvider - Previous book found:', previousBook);
      // We'll check for this after loadBook is defined
    } catch (error) {
      console.warn('BookProvider - Failed to load previous book:', error);
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  // Save progress when position changes
  useEffect(() => {
    if (state.book && state.progress) {
      saveProgress(state.progress);
    }
  }, [state.position, state.book]);

  const loadSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const settings = JSON.parse(stored);
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }, []);

  const saveSettings = useCallback(async (settings: ReaderSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }, []);

  const loadProgress = useCallback(async (bookId: string): Promise<BookProgress | null> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS + bookId);
      if (stored) {
        const progress = JSON.parse(stored);
        progress.lastRead = new Date(progress.lastRead);
        return progress;
      }
    } catch (error) {
      console.warn('Failed to load progress:', error);
    }
    return null;
  }, []);

  const saveProgress = useCallback(async (progress: BookProgress) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PROGRESS + progress.bookId,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  }, []);

  const loadBook = useCallback(async (epubUri: string) => {
    console.log('BookContext - Starting book load:', epubUri);
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Clear current section to ensure fresh start
    dispatch({ type: 'SET_CURRENT_SECTION', payload: null });
    
    try {
      console.log('BookContext - Calling loadOrParseEpub...');
      const { book, sections } = await loadOrParseEpub(epubUri);
      console.log('BookContext - Book loaded successfully:', {
        title: book.package.metadata.title,
        sectionsCount: sections.length,
        firstSectionId: sections[0]?.id
      });
      
      // Load existing progress
      const progress = await loadProgress(book.package.metadata.identifier);
      console.log('BookContext - Progress loaded:', progress);
      
      dispatch({ type: 'SET_BOOK', payload: { book, sections } });
      dispatch({ type: 'SET_PROGRESS', payload: progress });
      
      // If we have progress, navigate to last position
      if (progress) {
        console.log('BookContext - Navigating to previous position:', progress.position.sectionIndex);
        goToSection(progress.position.sectionIndex);
      }
      
      // Save current book reference
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_BOOK, epubUri);
      console.log('BookContext - Book load complete');
      
    } catch (error) {
      console.error('BookContext - Failed to load book:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to load book: ${error}` });
    }
  }, [loadProgress]);

  const closeBook = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_BOOK);
      dispatch({ type: 'CLOSE_BOOK' });
    } catch (error) {
      console.warn('Failed to clear current book:', error);
    }
  }, []);

  const goToSection = useCallback((sectionIndex: number) => {
    console.log('BookContext - goToSection called:', {
      sectionIndex,
      sectionsLength: state.sections.length,
      currentSectionId: state.currentSection?.id
    });
    
    if (sectionIndex < 0 || sectionIndex >= state.sections.length) {
      console.warn('BookContext - Invalid section index:', sectionIndex);
      return;
    }
    
    const section = state.sections[sectionIndex];
    console.log('BookContext - Setting current section:', {
      sectionId: section.id,
      sectionTitle: section.title,
      sectionIndex: section.index
    });
    
    dispatch({ type: 'SET_CURRENT_SECTION', payload: section });
    dispatch({
      type: 'UPDATE_POSITION',
      payload: {
        sectionIndex,
        href: section.href,
        scrollProgress: 0
      }
    });
  }, [state.sections]);

  const goToHref = useCallback((href: string) => {
    const sectionIndex = state.sections.findIndex(section => section.href === href);
    if (sectionIndex >= 0) {
      goToSection(sectionIndex);
    }
  }, [state.sections, goToSection]);

  const goNext = useCallback((): boolean => {
    const nextIndex = state.position.sectionIndex + 1;
    if (nextIndex < state.sections.length) {
      goToSection(nextIndex);
      return true;
    }
    return false;
  }, [state.position.sectionIndex, state.sections.length, goToSection]);

  const goPrev = useCallback((): boolean => {
    const prevIndex = state.position.sectionIndex - 1;
    if (prevIndex >= 0) {
      goToSection(prevIndex);
      return true;
    }
    return false;
  }, [state.position.sectionIndex, goToSection]);

  const updateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  }, []);

  const updatePosition = useCallback((newPosition: Partial<ReaderPosition>) => {
    dispatch({ type: 'UPDATE_POSITION', payload: newPosition });
  }, []);

  const markSectionRead = useCallback((href: string) => {
    if (!state.progress || !state.book) return;
    
    const now = new Date();
    const updatedProgress: BookProgress = {
      ...state.progress,
      position: { ...state.position },
      lastRead: now
    };
    
    // Add to current reading session if exists
    const currentSession = updatedProgress.readingSessions[updatedProgress.readingSessions.length - 1];
    if (currentSession && !currentSession.endTime) {
      if (!currentSession.sectionsRead.includes(href)) {
        currentSession.sectionsRead.push(href);
      }
    } else {
      // Start new reading session
      updatedProgress.readingSessions.push({
        startTime: now,
        sectionsRead: [href],
        wordsRead: 0 // Could be calculated from content
      });
    }
    
    dispatch({ type: 'SET_PROGRESS', payload: updatedProgress });
  }, [state.progress, state.position, state.book]);

  const contextValue: BookContextType = {
    ...state,
    loadBook,
    closeBook,
    goToSection,
    goToHref,
    goNext,
    goPrev,
    updateSettings,
    updatePosition,
    markSectionRead
  };

  return (
    <BookContext.Provider value={contextValue}>
      {children}
    </BookContext.Provider>
  );
}

export function useBook(): BookContextType {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
} 