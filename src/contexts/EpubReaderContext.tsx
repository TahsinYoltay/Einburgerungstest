import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReaderTheme {
  backgroundColor: string;
  textColor: string;
  name: 'light' | 'dark' | 'sepia';
}

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  theme: ReaderTheme;
  lineHeight: number;
}

export interface ReadingLocation {
  chapterId: string;
  sectionId?: string;
  cfi?: string; // Canonical Fragment Identifier for precise position
  progress: number; // 0-1
}

export interface TocItem {
  id: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}

interface EpubReaderContextType {
  // Settings
  settings: ReaderSettings;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  
  // Reading location
  currentLocation: ReadingLocation | null;
  updateLocation: (location: ReadingLocation) => void;
  
  // Book info
  bookTitle: string | null;
  setBookTitle: (title: string) => void;
  
  // Table of contents
  toc: TocItem[];
  setToc: (toc: TocItem[]) => void;
  
  // Progress
  saveProgress: () => Promise<void>;
  loadProgress: (bookId: string) => Promise<ReadingLocation | null>;
}

const THEMES: Record<string, ReaderTheme> = {
  light: {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    name: 'light',
  },
  dark: {
    backgroundColor: '#1A1A1A',
    textColor: '#E0E0E0',
    name: 'dark',
  },
  sepia: {
    backgroundColor: '#F4ECD8',
    textColor: '#5B4636',
    name: 'sepia',
  },
};

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  fontFamily: 'system',
  theme: THEMES.light,
  lineHeight: 1.6,
};

const STORAGE_KEYS = {
  SETTINGS: 'epub_reader_settings_v2',
  PROGRESS: 'epub_reader_progress_v2_',
};

const EpubReaderContext = createContext<EpubReaderContextType | null>(null);

export function EpubReaderProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [currentLocation, setCurrentLocation] = useState<ReadingLocation | null>(null);
  const [bookTitle, setBookTitle] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Save to storage
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  }, []);

  const updateLocation = useCallback((location: ReadingLocation) => {
    setCurrentLocation(location);
  }, []);

  const saveProgress = useCallback(async () => {
    if (!currentLocation || !bookTitle) return;
    
    try {
      const bookId = bookTitle.replace(/\s+/g, '-').toLowerCase();
      await AsyncStorage.setItem(
        STORAGE_KEYS.PROGRESS + bookId,
        JSON.stringify({
          ...currentLocation,
          lastRead: new Date().toISOString(),
        })
      );
      console.log('Progress saved:', currentLocation);
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  }, [currentLocation, bookTitle]);

  const loadProgress = useCallback(async (bookId: string): Promise<ReadingLocation | null> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS + bookId);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Progress loaded:', parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load progress:', error);
    }
    return null;
  }, []);

  const value: EpubReaderContextType = {
    settings,
    updateSettings,
    currentLocation,
    updateLocation,
    bookTitle,
    setBookTitle,
    toc,
    setToc,
    saveProgress,
    loadProgress,
  };

  return (
    <EpubReaderContext.Provider value={value}>
      {children}
    </EpubReaderContext.Provider>
  );
}

export function useEpubReader() {
  const context = useContext(EpubReaderContext);
  if (!context) {
    throw new Error('useEpubReader must be used within EpubReaderProvider');
  }
  return context;
}

export { THEMES };
