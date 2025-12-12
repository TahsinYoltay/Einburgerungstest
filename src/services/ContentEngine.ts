import storage, { FirebaseStorageTypes, getStorage, ref, writeToFile } from '@react-native-firebase/storage';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { MasterManifest, LocalVersionMap } from '../types/content';

const CONTENT_DIR = `${RNFS.DocumentDirectoryPath}/content`;
const MANIFEST_FILE = 'manifest.json';
const VERSIONS_FILE = 'versions.json';

// Remote path for the master manifest
const REMOTE_MANIFEST_PATH = 'config/manifest.json';

class ContentEngine {
  constructor() {
    this.ensureDirExists(CONTENT_DIR);
  }

  private async ensureDirExists(path: string) {
    const exists = await RNFS.exists(path);
    if (!exists) {
      await RNFS.mkdir(path);
    }
  }

  private getLocalPath(filename: string): string {
    return `${CONTENT_DIR}/${filename}`;
  }

  /**
   * Reads the local version map to know what we currently have installed.
   */
  async getLocalVersions(): Promise<LocalVersionMap> {
    try {
      const path = this.getLocalPath(VERSIONS_FILE);
      if (await RNFS.exists(path)) {
        const content = await RNFS.readFile(path, 'utf8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn('ContentEngine: Failed to read versions', e);
    }
    return {};
  }

  private async saveLocalVersions(versions: LocalVersionMap) {
    await RNFS.writeFile(this.getLocalPath(VERSIONS_FILE), JSON.stringify(versions), 'utf8');
  }

  /**
   * Fetches the Master Manifest from Firebase.
   */
  async fetchMasterManifest(): Promise<MasterManifest | null> {
    const localPath = this.getLocalPath(MANIFEST_FILE);
    try {
      const storageInstance = getStorage();
      const reference = ref(storageInstance, REMOTE_MANIFEST_PATH);
      await writeToFile(reference, localPath);
      const content = await RNFS.readFile(localPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('ContentEngine: Failed to fetch master manifest', error);
      return null;
    }
  }

  /**
   * Generic method to download a specific module's data file.
   */
  async downloadModuleData<T>(moduleId: string, remotePath: string, version: number): Promise<T | null> {
    try {
      // Ensure module directory exists (optional, flat structure for now)
      await this.ensureDirExists(CONTENT_DIR);

      const filename = `${moduleId}.json`;
      const localPath = this.getLocalPath(filename);
      const storageInstance = getStorage();
      const reference = ref(storageInstance, remotePath);

      console.log(`ContentEngine: Downloading ${moduleId} v${version} from ${remotePath}`);
      
      await writeToFile(reference, localPath);
      
      // Update version tracking
      const versions = await this.getLocalVersions();
      versions[moduleId] = version;
      await this.saveLocalVersions(versions);

      const content = await RNFS.readFile(localPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`ContentEngine: Failed to download module ${moduleId}`, error);
      return null;
    }
  }

  /**
   * Loads locally cached data for a module.
   */
  async loadLocalModuleData<T>(moduleId: string): Promise<T | null> {
    try {
      const filename = `${moduleId}.json`;
      const localPath = this.getLocalPath(filename);
      if (await RNFS.exists(localPath)) {
        const content = await RNFS.readFile(localPath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error(`ContentEngine: Failed to read local module ${moduleId}`, error);
    }
    return null;
  }
}

export const contentEngine = new ContentEngine();
