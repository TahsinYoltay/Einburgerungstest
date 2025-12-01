import { Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import storage from '@react-native-firebase/storage';
import defaultChaptersData from '../data/exam/normalized/allChaptersData.normalized.json';

// Define the type for the chapters data structure
export type ChaptersData = typeof defaultChaptersData;

const TRANSLATIONS_DIR = `${RNFS.DocumentDirectoryPath}/translations`;
const STORAGE_PATH_PREFIX = 'exam/translations'; // Path in Firebase Storage

class LanguageManager {
  /**
   * Ensures the translations directory exists.
   */
  private async ensureDirExists() {
    const exists = await RNFS.exists(TRANSLATIONS_DIR);
    if (!exists) {
      await RNFS.mkdir(TRANSLATIONS_DIR);
    }
  }

  /**
   * Gets the local file path for a specific language code.
   */
  private getLocalFilePath(langCode: string): string {
    return `${TRANSLATIONS_DIR}/allChaptersData.${langCode}.json`;
  }

  /**
   * Checks if the translation file for a language exists locally.
   */
  async isLanguageDownloaded(langCode: string): Promise<boolean> {
    if (langCode === 'en') return true; // English is always available
    return await RNFS.exists(this.getLocalFilePath(langCode));
  }

  /**
   * Downloads the translation file from Firebase Storage.
   * Returns progress callback.
   */
  async downloadLanguage(
    langCode: string, 
    onProgress?: (snapshot: { bytesTransferred: number; totalBytes: number }) => void
  ): Promise<void> {
    if (langCode === 'en') return;

    try {
      await this.ensureDirExists();
      
      const localPath = this.getLocalFilePath(langCode);
      const remotePath = `${STORAGE_PATH_PREFIX}/allChaptersData.${langCode}.json`;
      
      console.log(`LanguageManager: Starting download...`);
      console.log(`Remote: ${remotePath}`);
      console.log(`Local: ${localPath}`);

      const reference = storage().ref(remotePath);

      // Create a download task
      const task = reference.writeToFile(localPath);

      if (onProgress) {
        task.on('state_changed', (snapshot) => {
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
          });
        });
      }

      await task;
      console.log(`LanguageManager: Download complete.`);
    } catch (error) {
      console.error('LanguageManager: Download failed', error);
      throw error;
    }
  }

  /**
   * Loads the exam data for a specific language.
   * If 'en', returns the bundled JSON.
   * If other, reads from the local filesystem.
   */
  async loadLanguageData(langCode: string): Promise<ChaptersData> {
    console.log(`LanguageManager: Loading data for ${langCode}`);
    
    if (langCode === 'en') {
      return defaultChaptersData as ChaptersData;
    }

    const localPath = this.getLocalFilePath(langCode);
    const exists = await RNFS.exists(localPath);

    if (!exists) {
      throw new Error(`Translation file for ${langCode} not found locally.`);
    }

    const fileContent = await RNFS.readFile(localPath, 'utf8');
    return JSON.parse(fileContent) as ChaptersData;
  }

  /**
   * Deletes a downloaded language file to free up space.
   */
  async deleteLanguage(langCode: string): Promise<void> {
    if (langCode === 'en') return;
    const localPath = this.getLocalFilePath(langCode);
    if (await RNFS.exists(localPath)) {
      await RNFS.unlink(localPath);
    }
  }
  
  /**
   * Get available languages list (could be dynamic or static)
   * For now, returning the list we defined in the script
   */
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    ];
  }
}

export const languageManager = new LanguageManager();
