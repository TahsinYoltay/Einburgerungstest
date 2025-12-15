import {
  clearLocalOnlyProgress,
  clearProgress,
  flushPendingRemotePushes,
  loadProgress,
  updateSectionProgress,
} from '../services/readingProgressService';

const BOOK_ID = 'life-in-the-uk';
const DEFAULT_USER = 'local';

export interface ReadingProgress {
  [sectionId: string]: {
    isRead: boolean;
    lastReadAt: string;
    timeSpent: number; // in seconds
    scrollProgress?: number;
  };
}

const toLegacyShape = (data: Awaited<ReturnType<typeof loadProgress>>): ReadingProgress => {
  const legacy: ReadingProgress = {};
  Object.entries(data.sections).forEach(([id, entry]) => {
    legacy[id] = {
      isRead: entry.status === 'done',
      lastReadAt: entry.lastReadAt,
      timeSpent: entry.timeSpentSec,
      scrollProgress: entry.scrollProgress,
    };
  });
  return legacy;
};

export const getReadingProgress = async (
  userId: string = DEFAULT_USER,
  enableCloudSync: boolean = false
): Promise<ReadingProgress> => {
  try {
    const progress = await loadProgress({
      bookId: BOOK_ID,
      userId,
      syncMode: enableCloudSync ? 'local+remote' : 'local-only',
    });
    return toLegacyShape(progress);
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return {};
  }
};

export const markSectionAsRead = async (
  sectionId: string,
  timeSpent: number = 0,
  userId: string = DEFAULT_USER,
  enableCloudSync: boolean = false
): Promise<void> => {
  try {
    await updateSectionProgress({
      bookId: BOOK_ID,
      userId,
      sectionId,
      timeSpentSec: timeSpent,
      markDone: true,
      totalSections: undefined,
      syncMode: enableCloudSync ? 'local+remote' : 'local-only',
    });
    if (enableCloudSync) {
      void flushPendingRemotePushes();
    }
  } catch (error) {
    console.error('Error marking section as read:', error);
  }
};

export const markSectionAsUnread = async (
  sectionId: string,
  userId: string = DEFAULT_USER,
  enableCloudSync: boolean = false
): Promise<void> => {
  try {
    // Reuse updateSectionProgress with in_progress
    await updateSectionProgress({
      bookId: BOOK_ID,
      userId,
      sectionId,
      markDone: false,
      syncMode: enableCloudSync ? 'local+remote' : 'local-only',
    });
    if (enableCloudSync) {
      void flushPendingRemotePushes();
    }
  } catch (error) {
    console.error('Error marking section as unread:', error);
  }
};

export const isSectionRead = async (
  sectionId: string,
  userId: string = DEFAULT_USER,
  enableCloudSync: boolean = false
): Promise<boolean> => {
  try {
    const progress = await loadProgress({
      bookId: BOOK_ID,
      userId,
      syncMode: enableCloudSync ? 'local+remote' : 'local-only',
    });
    return progress.sections[sectionId]?.status === 'done';
  } catch (error) {
    console.error('Error checking if section is read:', error);
    return false;
  }
};

export const getChapterProgress = async (
  chapterSections: string[],
  userId: string = DEFAULT_USER,
  enableCloudSync: boolean = false
): Promise<{ completed: number; total: number; percentage: number }> => {
  try {
    const progress = await loadProgress({
      bookId: BOOK_ID,
      userId,
      syncMode: enableCloudSync ? 'local+remote' : 'local-only',
    });
    const completed = chapterSections.filter(sectionId => progress.sections[sectionId]?.status === 'done').length;
    const total = chapterSections.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  } catch (error) {
    console.error('Error calculating chapter progress:', error);
    return { completed: 0, total: chapterSections.length, percentage: 0 };
  }
};

export const clearAllProgress = async (
  userId: string = DEFAULT_USER,
  enableCloudSync: boolean = false
): Promise<void> => {
  try {
    if (enableCloudSync) {
      await clearProgress(BOOK_ID, userId);
    } else {
      await clearLocalOnlyProgress(BOOK_ID, userId);
    }
  } catch (error) {
    console.error('Error clearing reading progress:', error);
  }
};
