import { Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import storage, { getStorage, ref } from '@react-native-firebase/storage';
import defaultChaptersData from '../data/exam/normalized/allChaptersData.normalized.json';
import defaultMockChaptersData from '../data/exam/normalized/mockExam.en.json';
import defaultChapterQuestionsData from '../data/exam/normalized/questionsByChapter.en.json';
import type { NormalizedQuestion } from '../types/exam';

// Define the type for the chapters data structure
export type ChaptersData = {
  data: Record<
    string,
    {
      chapterID: number;
      chapterName: string;
      questions: NormalizedQuestion[];
    }
  >;
};
const TRANSLATIONS_DIR = `${RNFS.DocumentDirectoryPath}/translations`;
const STORAGE_PATH_PREFIX = 'exam/translations'; // Path in Firebase Storage
const MOCK_STORAGE_PATH_PREFIX = 'exam/mockExam';
const MOCK_BASENAME = 'mockExam';
const LEGACY_MOCK_BASENAME = 'chapterQuestions';
const CHAPTER_STORAGE_PATH_PREFIX = 'exam/chapterName';
const LEGACY_CHAPTER_STORAGE_PATH_PREFIX = 'exam/chapterQuestions';
const CHAPTER_BASENAME = 'questionsByChapter';
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

  private getLocalMockFilePath(langCode: string): string {
    return `${TRANSLATIONS_DIR}/${MOCK_BASENAME}.${langCode}.json`;
  }

  private getLegacyLocalMockFilePath(langCode: string): string {
    return `${TRANSLATIONS_DIR}/${LEGACY_MOCK_BASENAME}.${langCode}.json`;
  }

  private getLocalChapterQuestionsFilePath(langCode: string): string {
    return `${TRANSLATIONS_DIR}/${CHAPTER_BASENAME}.${langCode}.json`;
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

  private async saveMockVersion(langCode: string, version: number) {
    try {
      const versions = await this.getLocalVersions();
      versions[`mock_${langCode}`] = version;
      await RNFS.writeFile(this.getVersionsFilePath(), JSON.stringify(versions), 'utf8');
    } catch (error) {
      console.error('LanguageManager: Failed to save mock versions file', error);
    }
  }

  private async saveChapterQuestionsVersion(langCode: string, version: number) {
    try {
      const versions = await this.getLocalVersions();
      versions[`chapter_${langCode}`] = version;
      await RNFS.writeFile(this.getVersionsFilePath(), JSON.stringify(versions), 'utf8');
    } catch (error) {
      console.error('LanguageManager: Failed to save chapter versions file', error);
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

  async isMockDownloaded(langCode: string): Promise<boolean> {
    if (langCode === 'en') {
      return (
        await RNFS.exists(this.getLocalMockFilePath(langCode))
      ) || (await RNFS.exists(this.getLegacyLocalMockFilePath(langCode)));
    }
    return (
      await RNFS.exists(this.getLocalMockFilePath(langCode))
    ) || (await RNFS.exists(this.getLegacyLocalMockFilePath(langCode)));
  }

  async isChapterQuestionsDownloaded(langCode: string): Promise<boolean> {
    if (langCode === 'en') {
      return await RNFS.exists(this.getLocalChapterQuestionsFilePath(langCode));
    }
    return await RNFS.exists(this.getLocalChapterQuestionsFilePath(langCode));
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

  async getDownloadedMockVersion(langCode: string): Promise<number> {
    const versions = await this.getLocalVersions();

    if (langCode === 'en') {
      return versions['mock_en'] || 0;
    }

    if (!await this.isMockDownloaded(langCode)) return 0;
    return versions[`mock_${langCode}`] || 0;
  }

  async getDownloadedChapterQuestionsVersion(langCode: string): Promise<number> {
    const versions = await this.getLocalVersions();

    if (langCode === 'en') {
      return versions['chapter_en'] || 0;
    }

    if (!await this.isChapterQuestionsDownloaded(langCode)) return 0;
    return versions[`chapter_${langCode}`] || 0;
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

      const storageInstance = getStorage();
      const reference = ref(storageInstance, remotePath);

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

  async downloadMockExam(
    langCode: string,
    version: number,
    onProgress?: (snapshot: { bytesTransferred: number; totalBytes: number }) => void
  ): Promise<void> {
    try {
      await this.ensureDirExists();

      const localPath = this.getLocalMockFilePath(langCode);
      const remotePath = `${MOCK_STORAGE_PATH_PREFIX}/${MOCK_BASENAME}.${langCode}.json`;
      const legacyRemotePath = `${MOCK_STORAGE_PATH_PREFIX}/${LEGACY_MOCK_BASENAME}.${langCode}.json`;

      console.log(`LanguageManager: Starting mock exam download...`);
      console.log(`Remote: ${remotePath}`);
      console.log(`Local: ${localPath}`);

      const storageInstance = getStorage();
      const attemptDownload = async (path: string) => {
        const reference = ref(storageInstance, path);
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
      };

      try {
        await attemptDownload(remotePath);
      } catch (error) {
        console.warn('LanguageManager: mock exam not found, trying legacy name');
        await attemptDownload(legacyRemotePath);
      }
      await this.saveMockVersion(langCode, version);
      console.log(`LanguageManager: Mock exam download complete.`);
    } catch (error) {
      console.error('LanguageManager: Mock exam download failed', error);
      throw error;
    }
  }

  async downloadChapterQuestions(
    langCode: string,
    version: number,
    onProgress?: (snapshot: { bytesTransferred: number; totalBytes: number }) => void
  ): Promise<void> {
    try {
      await this.ensureDirExists();

      const localPath = this.getLocalChapterQuestionsFilePath(langCode);
      const remotePath = `${CHAPTER_STORAGE_PATH_PREFIX}/${CHAPTER_BASENAME}.${langCode}.json`;
      const legacyRemotePath = `${CHAPTER_STORAGE_PATH_PREFIX}/${CHAPTER_BASENAME} ${langCode}.json`;
      const legacyFolderRemotePath = `${LEGACY_CHAPTER_STORAGE_PATH_PREFIX}/${CHAPTER_BASENAME}.${langCode}.json`;
      const legacyFolderLegacyRemotePath = `${LEGACY_CHAPTER_STORAGE_PATH_PREFIX}/${CHAPTER_BASENAME} ${langCode}.json`;

      console.log(`LanguageManager: Starting chapter questions download...`);
      console.log(`Remote: ${remotePath}`);
      console.log(`Local: ${localPath}`);

      const storageInstance = getStorage();

      const attemptDownload = async (path: string) => {
        const reference = ref(storageInstance, path);
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
      };

      const candidates = [
        remotePath,
        legacyRemotePath,
        legacyFolderRemotePath,
        legacyFolderLegacyRemotePath,
      ];

      let lastError: unknown = null;
      for (const candidate of candidates) {
        try {
          await attemptDownload(candidate);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        throw lastError;
      }
      await this.saveChapterQuestionsVersion(langCode, version);
      console.log(`LanguageManager: Chapter questions download complete.`);
    } catch (error) {
      console.error('LanguageManager: Chapter questions download failed', error);
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

  async loadMockExamData(langCode: string): Promise<ChaptersData> {
    console.log(`LanguageManager: Loading mock exam data for ${langCode}`);

    if (langCode === 'en') {
      const localPath = this.getLocalMockFilePath('en');
      if (await RNFS.exists(localPath)) {
        const fileContent = await RNFS.readFile(localPath, 'utf8');
        return JSON.parse(fileContent) as ChaptersData;
      }
      const legacyPath = this.getLegacyLocalMockFilePath('en');
      if (await RNFS.exists(legacyPath)) {
        const fileContent = await RNFS.readFile(legacyPath, 'utf8');
        return JSON.parse(fileContent) as ChaptersData;
      }
      return defaultMockChaptersData as ChaptersData;
    }

    const localPath = this.getLocalMockFilePath(langCode);
    if (await RNFS.exists(localPath)) {
      const fileContent = await RNFS.readFile(localPath, 'utf8');
      return JSON.parse(fileContent) as ChaptersData;
    }
    const legacyPath = this.getLegacyLocalMockFilePath(langCode);
    if (await RNFS.exists(legacyPath)) {
      const fileContent = await RNFS.readFile(legacyPath, 'utf8');
      return JSON.parse(fileContent) as ChaptersData;
    }

    throw new Error(`Mock exam file for ${langCode} not found locally.`);
  }

  async loadChapterQuestionsData(langCode: string): Promise<ChaptersData> {
    console.log(`LanguageManager: Loading chapter questions data for ${langCode}`);

    if (langCode === 'en') {
      const localPath = this.getLocalChapterQuestionsFilePath('en');
      if (await RNFS.exists(localPath)) {
        const fileContent = await RNFS.readFile(localPath, 'utf8');
        return JSON.parse(fileContent) as ChaptersData;
      }
      return defaultChapterQuestionsData as ChaptersData;
    }

    const localPath = this.getLocalChapterQuestionsFilePath(langCode);
    if (await RNFS.exists(localPath)) {
      const fileContent = await RNFS.readFile(localPath, 'utf8');
      return JSON.parse(fileContent) as ChaptersData;
    }

    throw new Error(`Chapter questions file for ${langCode} not found locally.`);
  }

  async deleteExamContent(langCode: string): Promise<void> {
    if (langCode === 'en') return;
    const localPath = this.getLocalFilePath(langCode);
    if (await RNFS.exists(localPath)) {
      await RNFS.unlink(localPath);
    }
  }

  async deleteMockExamContent(langCode: string): Promise<void> {
    if (langCode === 'en') return;
    const localPath = this.getLocalMockFilePath(langCode);
    if (await RNFS.exists(localPath)) {
      await RNFS.unlink(localPath);
    }
    const legacyPath = this.getLegacyLocalMockFilePath(langCode);
    if (await RNFS.exists(legacyPath)) {
      await RNFS.unlink(legacyPath);
    }
  }

  async deleteChapterQuestionsContent(langCode: string): Promise<void> {
    if (langCode === 'en') return;
    const localPath = this.getLocalChapterQuestionsFilePath(langCode);
    if (await RNFS.exists(localPath)) {
      await RNFS.unlink(localPath);
    }
  }

  /**
   * Deletes a downloaded language file to free up space.
   * Deletes exam content for the selected language.
   */
  async deleteLanguage(langCode: string): Promise<void> {
    await this.deleteExamContent(langCode);
    await this.deleteMockExamContent(langCode);
    await this.deleteChapterQuestionsContent(langCode);

    // Also remove from versions
    const versions = await this.getLocalVersions();
    if (versions[langCode]) {
      delete versions[langCode];
      await RNFS.writeFile(this.getVersionsFilePath(), JSON.stringify(versions), 'utf8');
    }
    const mockKey = `mock_${langCode}`;
    if (versions[mockKey]) {
      delete versions[mockKey];
      await RNFS.writeFile(this.getVersionsFilePath(), JSON.stringify(versions), 'utf8');
    }
    const chapterKey = `chapter_${langCode}`;
    if (versions[chapterKey]) {
      delete versions[chapterKey];
      await RNFS.writeFile(this.getVersionsFilePath(), JSON.stringify(versions), 'utf8');
    }
  }
}

export const languageManager = new LanguageManager();
