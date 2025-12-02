import { Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import storage from '@react-native-firebase/storage';
import defaultChaptersData from '../data/exam/normalized/allChaptersData.normalized.json';
import defaultBookData from '../assets/content/bookContent.en.json';
import { BookContent } from '../types/book';

// Define the type for the chapters data structure
export type ChaptersData = typeof defaultChaptersData;
export type BookData = BookContent;

const TRANSLATIONS_DIR = `${RNFS.DocumentDirectoryPath}/translations`;
const STORAGE_PATH_PREFIX = 'exam/translations'; // Path in Firebase Storage
const BOOK_STORAGE_PATH_PREFIX = 'book/content'; // Path in Firebase Storage for Book
const VERSIONS_FILE = 'versions.json';

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

  private getLocalBookFilePath(langCode: string): string {
    return `${TRANSLATIONS_DIR}/bookContent.${langCode}.json`;
  }

  private getVersionsFilePath(): string {
    return `${TRANSLATIONS_DIR}/${VERSIONS_FILE}`;
  }

  /**
   * Reads the local versions map.
   */
  async getLocalVersions(): Promise<Record<string, number>> {
    try {
      const path = this.getVersionsFilePath();
      if (await RNFS.exists(path)) {
        const content = await RNFS.readFile(path, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('LanguageManager: Failed to read versions file', error);
    }
    return {};
  }

  /**
   * Saves a version for a language.
   */
  private async saveVersion(langCode: string, version: number) {
    try {
      const versions = await this.getLocalVersions();
      versions[langCode] = version;
      await RNFS.writeFile(this.getVersionsFilePath(), JSON.stringify(versions), 'utf8');
    } catch (error) {
      console.error('LanguageManager: Failed to save versions file', error);
    }
  }

  /**
   * Checks if the translation file for a language exists locally.
   */
  async isLanguageDownloaded(langCode: string): Promise<boolean> {
    // English is always "available" (bundled fallback), but we check if a dynamic update exists
    if (langCode === 'en') {
      return await RNFS.exists(this.getLocalFilePath(langCode));
    }
    return await RNFS.exists(this.getLocalFilePath(langCode));
  }

  async isBookDownloaded(langCode: string): Promise<boolean> {
    if (langCode === 'en') {
      return await RNFS.exists(this.getLocalBookFilePath(langCode));
    }
    return await RNFS.exists(this.getLocalBookFilePath(langCode));
  }

  /**
   * Gets the locally downloaded version of a language. Returns 0 if not found.
   * For 'en', returns the downloaded version, or 1 (bundled version) if not downloaded.
   */
  async getDownloadedVersion(langCode: string): Promise<number> {
    const versions = await this.getLocalVersions();
    
    if (langCode === 'en') {
      // If we have a downloaded update, return its version.
      // Otherwise, return 1 (bundled version).
      // Note: This means remote 'en' version must be >= 2 to trigger an update.
      return versions['en'] || 1;
    }

    if (!await this.isLanguageDownloaded(langCode)) return 0;
    return versions[langCode] || 0;
  }

  /**
   * Downloads the translation file from Firebase Storage.
   * Returns progress callback.
   */
  async downloadLanguage(
    langCode: string, 
    version: number,
    onProgress?: (snapshot: { bytesTransferred: number; totalBytes: number }) => void
  ): Promise<void> {
    // Allow downloading 'en' updates now.
    
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
      // Update version registry on success
      await this.saveVersion(langCode, version);
      console.log(`LanguageManager: Download complete.`);
    } catch (error) {
      console.error('LanguageManager: Download failed', error);
      throw error;
    }
  }

  async downloadBook(
    langCode: string,
    onProgress?: (snapshot: { bytesTransferred: number; totalBytes: number }) => void
  ): Promise<void> {
    try {
      await this.ensureDirExists();
      const localPath = this.getLocalBookFilePath(langCode);
      const remotePath = `${BOOK_STORAGE_PATH_PREFIX}/bookContent.${langCode}.json`;
      
      console.log(`LanguageManager: Starting book download...`);
      const reference = storage().ref(remotePath);
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
      console.log(`LanguageManager: Book download complete.`);
    } catch (error) {
      console.error('LanguageManager: Book download failed', error);
      throw error;
    }
  }

  /**
   * Loads the exam data for a specific language.
   * If 'en', tries downloaded file first, then bundled.
   * If other, reads from the local filesystem.
   */
  async loadLanguageData(langCode: string): Promise<ChaptersData> {
    console.log(`LanguageManager: Loading data for ${langCode}`);
    
    // For English, check if we have a downloaded update first
    if (langCode === 'en') {
      const localPath = this.getLocalFilePath('en');
      if (await RNFS.exists(localPath)) {
        console.log('LanguageManager: Using downloaded English update');
        const fileContent = await RNFS.readFile(localPath, 'utf8');
        return JSON.parse(fileContent) as ChaptersData;
      }
      console.log('LanguageManager: Using bundled English data');
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

  async loadBookData(langCode: string): Promise<BookData> {
    console.log(`LanguageManager: Loading book data for ${langCode}`);
    if (langCode === 'en') {
      const localPath = this.getLocalBookFilePath('en');
      if (await RNFS.exists(localPath)) {
         const fileContent = await RNFS.readFile(localPath, 'utf8');
         return JSON.parse(fileContent) as BookData;
      }
      return defaultBookData as unknown as BookData;
    }
    
    const localPath = this.getLocalBookFilePath(langCode);
    if (await RNFS.exists(localPath)) {
       const fileContent = await RNFS.readFile(localPath, 'utf8');
       return JSON.parse(fileContent) as BookData;
    }
    throw new Error(`Book content for ${langCode} not found locally.`);
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

    const bookPath = this.getLocalBookFilePath(langCode);
    if (await RNFS.exists(bookPath)) {
      await RNFS.unlink(bookPath);
    }

    // Also remove from versions
    const versions = await this.getLocalVersions();
    if (versions[langCode]) {
      delete versions[langCode];
      await RNFS.writeFile(this.getVersionsFilePath(), JSON.stringify(versions), 'utf8');
    }
  }
}

export const languageManager = new LanguageManager();
