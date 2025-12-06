import storage from '@react-native-firebase/storage';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { ExamManifestEntry, LanguageOption } from '../types/exam';
import { PrivacyPolicyData, HelpContentData, MasterManifest, LocalVersionMap, ContentModuleConfig } from '../types/content';

const CONFIG_DIR = `${RNFS.DocumentDirectoryPath}/config`;
const REMOTE_CONFIG_PATH = 'config'; // For manifests
// Note: Content path is dynamic based on manifest, but usually 'content/' or 'exam/config/'

const MANIFEST_FILENAME = 'manifest.json';
const MODULE_VERSIONS_FILENAME = 'module_versions.json';

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

  // --- Version Management ---

  private async getLocalModuleVersions(): Promise<LocalVersionMap> {
    const path = this.getLocalPath(MODULE_VERSIONS_FILENAME);
    if (await RNFS.exists(path)) {
      try {
        const content = await RNFS.readFile(path, 'utf8');
        return JSON.parse(content);
      } catch (e) {
        console.warn('ContentManager: Failed to read module versions', e);
      }
    }
    return {};
  }

  private async saveLocalModuleVersion(key: string, version: number) {
    try {
      const versions = await this.getLocalModuleVersions();
      versions[key] = version;
      await RNFS.writeFile(
        this.getLocalPath(MODULE_VERSIONS_FILENAME), 
        JSON.stringify(versions), 
        'utf8'
      );
    } catch (e) {
      console.error('ContentManager: Failed to save module versions', e);
    }
  }

  // --- Manifest Fetching ---

  /**
   * Fetches the Master Manifest (manifest.json).
   * Used to check versions of all dynamic content modules.
   */
  async getMasterManifest(): Promise<MasterManifest | null> {
    const localPath = this.getLocalPath(MANIFEST_FILENAME);
    const remotePath = `${REMOTE_CONFIG_PATH}/${MANIFEST_FILENAME}`;

    try {
      await this.ensureDirExists();
      // Always try to fetch fresh manifest
      const reference = storage().ref(remotePath);
      await reference.writeToFile(localPath);
      
      const content = await RNFS.readFile(localPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('ContentManager: Failed to fetch remote master manifest', error);
      // Fallback to cache
      if (await RNFS.exists(localPath)) {
        try {
          const content = await RNFS.readFile(localPath, 'utf8');
          return JSON.parse(content);
        } catch (readError) {
          console.error('ContentManager: Failed to read local master manifest', readError);
        }
      }
      return null;
    }
  }

  // --- Legacy / Specific Manifests ---

  async getLanguagesManifest(): Promise<LanguageOption[] | null> {
    // This could also be refactored to use MasterManifest if we wanted,
    // but keeping as is for backward compatibility / existing logic.
    const filename = 'languages.json';
    const localPath = this.getLocalPath(filename);
    const remotePath = `${REMOTE_CONFIG_PATH}/${filename}`;

    try {
      await this.ensureDirExists();
      const reference = storage().ref(remotePath);
      await reference.writeToFile(localPath);
      const content = await RNFS.readFile(localPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (await RNFS.exists(localPath)) {
         try {
           const content = await RNFS.readFile(localPath, 'utf8');
           return JSON.parse(content);
         } catch (e) {}
      }
      return null;
    }
  }

  async getExamsManifest(): Promise<ExamManifestEntry[] | null> {
    const filename = 'exams.json';
    const localPath = this.getLocalPath(filename);
    const remotePath = `${REMOTE_CONFIG_PATH}/${filename}`;

    try {
      await this.ensureDirExists();
      const reference = storage().ref(remotePath);
      await reference.writeToFile(localPath);
      const content = await RNFS.readFile(localPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (await RNFS.exists(localPath)) {
        try {
          const content = await RNFS.readFile(localPath, 'utf8');
          return JSON.parse(content);
        } catch (e) {}
      }
      return null;
    }
  }

  // --- Dynamic Content Fetching ---

  /**
   * Fetches Privacy Policy with Versioning Strategy.
   * 1. Check Master Manifest for latest version.
   * 2. Compare with local version.
   * 3. Download if newer or missing.
   */
  async getPrivacyPolicy(languageCode: string = 'en'): Promise<PrivacyPolicyData | null> {
    await this.ensureDirExists();
    
    // 1. Get Manifest
    const manifest = await this.getMasterManifest();
    
    // Default fallback config if manifest fails or module missing
    let targetVersion = 1;
    let remotePathTemplate = 'content/privacy_policy/privacy_policy_{lang}.json';
    
    if (manifest && manifest.modules && manifest.modules.privacy) {
      targetVersion = manifest.modules.privacy.version;
      remotePathTemplate = manifest.modules.privacy.path;
    } else {
      console.warn('ContentManager: Privacy module not found in manifest, using defaults.');
    }

    // 2. Check Local Version
    // We track version per language: 'privacy_en', 'privacy_es'
    const versionKey = `privacy_${languageCode}`;
    const localVersions = await this.getLocalModuleVersions();
    const currentVersion = localVersions[versionKey] || 0;

    // Determine filename
    // We use the language code to construct the filename
    // Example: privacy_policy_en.json
    const filename = `privacy_policy_${languageCode}.json`;
    const localPath = this.getLocalPath(filename);
    const remotePath = remotePathTemplate.replace('{lang}', languageCode);

    // 3. Update Decision
    const fileExists = await RNFS.exists(localPath);
    const shouldUpdate = (targetVersion > currentVersion) || !fileExists;

    if (shouldUpdate) {
      console.log(`ContentManager: Updating Privacy Policy (${languageCode}) from v${currentVersion} to v${targetVersion}`);
      try {
        const reference = storage().ref(remotePath);
        await reference.writeToFile(localPath);
        
        // Update local version registry
        await this.saveLocalModuleVersion(versionKey, targetVersion);
        
        const content = await RNFS.readFile(localPath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.warn('ContentManager: Failed to download privacy policy update', error);
        // Fallback: Try reading existing file if download failed
        if (fileExists) {
          const content = await RNFS.readFile(localPath, 'utf8');
          return JSON.parse(content);
        }
      }
    } else {
      // Load local
      try {
        const content = await RNFS.readFile(localPath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.error('ContentManager: Failed to read local privacy policy', error);
      }
    }

    // Last Resort: Fallback to 'en' or default bundle if you had one (we don't have bundled json here, so return null)
    // Optionally try 'en' if the requested language failed
    if (languageCode !== 'en') {
       return this.getPrivacyPolicy('en');
    }

    return null;
  }

  /**
   * Fetches Help & Support Content with Versioning Strategy.
   * Supports multiple help topics (e.g., 'help' for Exams, 'getting_started').
   */
  async getHelpSupport(languageCode: string = 'en', topic: 'help' | 'getting_started' = 'help'): Promise<HelpContentData | null> {
    await this.ensureDirExists();
    
    // 1. Get Manifest
    const manifest = await this.getMasterManifest();
    
    // Determine config based on topic
    let targetVersion = 1;
    let remotePathTemplate = '';
    let manifestModule: ContentModuleConfig | undefined;

    if (topic === 'help') {
        // Legacy/Default Exam Help
        remotePathTemplate = 'content/help/exam_help.{lang}.json';
        if (manifest?.modules?.help) {
            manifestModule = manifest.modules.help;
        }
    } else if (topic === 'getting_started') {
        remotePathTemplate = 'content/help/getting_started_help.{lang}.json';
        if (manifest?.modules?.getting_started) {
            manifestModule = manifest.modules.getting_started;
        }
    }

    if (manifestModule) {
      targetVersion = manifestModule.version;
      remotePathTemplate = manifestModule.path;
    } else {
      console.warn(`ContentManager: Module '${topic}' not found in manifest, using defaults.`);
    }

    // 2. Check Local Version
    const versionKey = `${topic}_${languageCode}`;
    const localVersions = await this.getLocalModuleVersions();
    const currentVersion = localVersions[versionKey] || 0;

    // Determine filename
    // e.g. exam_help.en.json or getting_started_help.en.json
    const prefix = topic === 'help' ? 'exam_help' : 'getting_started_help';
    const filename = `${prefix}.${languageCode}.json`;
    const localPath = this.getLocalPath(filename);
    const remotePath = remotePathTemplate.replace('{lang}', languageCode);

    // 3. Update Decision
    const fileExists = await RNFS.exists(localPath);
    const shouldUpdate = (targetVersion > currentVersion) || !fileExists;

    if (shouldUpdate) {
      console.log(`ContentManager: Updating ${topic} (${languageCode}) from v${currentVersion} to v${targetVersion}`);
      try {
        const reference = storage().ref(remotePath);
        await reference.writeToFile(localPath);
        
        // Update local version registry
        await this.saveLocalModuleVersion(versionKey, targetVersion);
        
        const content = await RNFS.readFile(localPath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.warn(`ContentManager: Failed to download ${topic} update`, error);
        // Fallback: Try reading existing file if download failed
        if (fileExists) {
          const content = await RNFS.readFile(localPath, 'utf8');
          return JSON.parse(content);
        }
      }
    } else {
      // Load local
      try {
        const content = await RNFS.readFile(localPath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.error(`ContentManager: Failed to read local ${topic}`, error);
      }
    }

    // Last Resort: Fallback to 'en'
    if (languageCode !== 'en') {
       return this.getHelpSupport('en', topic);
    }

    return null;
  }
}

export const contentManager = new ContentManager();