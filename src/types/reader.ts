import { EpubBook, EpubSection } from './epub';

export interface ReaderPosition {
  sectionIndex: number;
  href: string;
  scrollProgress: number; // 0-1
  elementId?: string;
}

export interface ReaderSettings {
  fontSize: number; // percentage, default 100
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  margin: number; // padding in px
  textAlign: 'left' | 'center' | 'justify';
  isRTL: boolean;
}

export interface BookProgress {
  bookId: string;
  position: ReaderPosition;
  lastRead: Date;
  totalSections: number;
  readingSessions: ReadingSession[];
}

export interface ReadingSession {
  startTime: Date;
  endTime?: Date;
  sectionsRead: string[];
  wordsRead: number;
}

export interface BookContextType {
  book: EpubBook | null;
  sections: EpubSection[];
  currentSection: EpubSection | null;
  position: ReaderPosition;
  settings: ReaderSettings;
  progress: BookProgress | null;
  isLoading: boolean;
  error: string | null;
  
  // Navigation methods
  goToSection: (sectionIndex: number) => void;
  goToHref: (href: string) => void;
  goNext: () => boolean;
  goPrev: () => boolean;
  
  // Settings methods
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  
  // Progress methods
  updatePosition: (position: Partial<ReaderPosition>) => void;
  markSectionRead: (href: string) => void;
  
  // Book loading
  loadBook: (epubUri: string) => Promise<void>;
  closeBook: () => void;
}

export interface NavigationItem {
  href: string;
  title: string;
  level: number;
  children?: NavigationItem[];
} 