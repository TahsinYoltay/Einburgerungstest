import AsyncStorage from '@react-native-async-storage/async-storage';

const READING_PROGRESS_KEY = 'reading_progress';

export interface ReadingProgress {
  [sectionId: string]: {
    isRead: boolean;
    lastReadAt: string;
    timeSpent: number; // in seconds
  };
}

export const getReadingProgress = async (): Promise<ReadingProgress> => {
  try {
    const progress = await AsyncStorage.getItem(READING_PROGRESS_KEY);
    return progress ? JSON.parse(progress) : {};
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return {};
  }
};

export const markSectionAsRead = async (sectionId: string, timeSpent: number = 0): Promise<void> => {
  try {
    const currentProgress = await getReadingProgress();
    const updatedProgress = {
      ...currentProgress,
      [sectionId]: {
        isRead: true,
        lastReadAt: new Date().toISOString(),
        timeSpent: (currentProgress[sectionId]?.timeSpent || 0) + timeSpent,
      },
    };
    await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(updatedProgress));
  } catch (error) {
    console.error('Error marking section as read:', error);
  }
};

export const markSectionAsUnread = async (sectionId: string): Promise<void> => {
  try {
    const currentProgress = await getReadingProgress();
    if (currentProgress[sectionId]) {
      currentProgress[sectionId].isRead = false;
    }
    await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(currentProgress));
  } catch (error) {
    console.error('Error marking section as unread:', error);
  }
};

export const isSectionRead = async (sectionId: string): Promise<boolean> => {
  try {
    const progress = await getReadingProgress();
    return progress[sectionId]?.isRead || false;
  } catch (error) {
    console.error('Error checking if section is read:', error);
    return false;
  }
};

export const getChapterProgress = async (chapterSections: string[]): Promise<{ completed: number; total: number; percentage: number }> => {
  try {
    const progress = await getReadingProgress();
    const completed = chapterSections.filter(sectionId => progress[sectionId]?.isRead).length;
    const total = chapterSections.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  } catch (error) {
    console.error('Error calculating chapter progress:', error);
    return { completed: 0, total: chapterSections.length, percentage: 0 };
  }
};

export const clearAllProgress = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(READING_PROGRESS_KEY);
  } catch (error) {
    console.error('Error clearing reading progress:', error);
  }
};
