import storage from '@react-native-firebase/storage';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { ExamManifestEntry, LanguageOption } from '../types/exam';

const CONFIG_DIR = `${RNFS.DocumentDirectoryPath}/config`;
const REMOTE_PATH_PREFIX = 'exam/config';

class ContentManager {
  private async ensureDirExists() {
    const exists = await RNFS.exists(CONFIG_DIR);
    if (!exists) {
      await RNFS.mkdir(CONFIG_DIR);
    }
  }

  private getLocalPath(filename: string): string {
    return `${CONFIG_DIR}/${filename}`;
  }

  /**
   * Fetches the list of available languages from Firebase.
   * Falls back to local cache if offline/error.
   * Returns null if neither is available (caller should use hardcoded fallback).
   */
  async getLanguagesManifest(): Promise<LanguageOption[] | null> {
    const filename = 'languages.json';
    const localPath = this.getLocalPath(filename);
    const remotePath = `${REMOTE_PATH_PREFIX}/${filename}`;

    try {
      await this.ensureDirExists();
      // Attempt to download fresh config
      const reference = storage().ref(remotePath);
      await reference.writeToFile(localPath);
      
      const content = await RNFS.readFile(localPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('ContentManager: Failed to fetch remote languages manifest', error);
      // Try local cache
      if (await RNFS.exists(localPath)) {
         try {
           const content = await RNFS.readFile(localPath, 'utf8');
           return JSON.parse(content);
         } catch (readError) {
           console.error('ContentManager: Failed to read local languages manifest', readError);
         }
      }
      return null;
    }
  }

  /**
   * Fetches the list of exams (manifest) from Firebase.
   * Falls back to local cache if offline/error.
   * Returns null if neither is available.
   */
  async getExamsManifest(): Promise<ExamManifestEntry[] | null> {
    const filename = 'exams.json';
    const localPath = this.getLocalPath(filename);
    const remotePath = `${REMOTE_PATH_PREFIX}/${filename}`;

    try {
      await this.ensureDirExists();
      const reference = storage().ref(remotePath);
      await reference.writeToFile(localPath);
      
      const content = await RNFS.readFile(localPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('ContentManager: Failed to fetch remote exams manifest', error);
      if (await RNFS.exists(localPath)) {
        try {
          const content = await RNFS.readFile(localPath, 'utf8');
          return JSON.parse(content);
        } catch (readError) {
          console.error('ContentManager: Failed to read local exams manifest', readError);
        }
      }
      return null;
    }
  }
}

export const contentManager = new ContentManager();
