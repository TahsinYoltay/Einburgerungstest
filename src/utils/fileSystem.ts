import * as RNFS from '@dr.pogodin/react-native-fs';

export interface FileSystemOptions {
  fileName: string;
  content: string;
  encoding?: 'utf8' | 'ascii' | 'base64';
}

export interface DownloadOptions {
  fromUrl: string;
  toFile: string;
  progressDivider?: number;
  progressInterval?: number;
}

export interface FileInfo {
  path: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  mtime: Date;
  ctime: Date;
}

/**
 * File System Utility Class using react-native-fs
 */
export class FileSystemUtils {
  // Document Directory Path
  static get DocumentDirectoryPath(): string {
    return RNFS.DocumentDirectoryPath;
  }

  // Cache Directory Path
  static get CacheDirectoryPath(): string {
    return RNFS.CachesDirectoryPath;
  }

  // External Storage Directory Path (Android only)
  static get ExternalStorageDirectoryPath(): string | null {
    return RNFS.ExternalStorageDirectoryPath || null;
  }

  /**
   * Write content to a file
   */
  static async writeFile(options: FileSystemOptions): Promise<void> {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${options.fileName}`;
      await RNFS.writeFile(filePath, options.content, options.encoding || 'utf8');
    } catch (error) {
      throw new Error(`Failed to write file: ${error}`);
    }
  }

  /**
   * Read content from a file
   */
  static async readFile(fileName: string, encoding: 'utf8' | 'ascii' | 'base64' = 'utf8'): Promise<string> {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      return await RNFS.readFile(filePath, encoding);
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  /**
   * Check if file exists
   */
  static async exists(fileName: string): Promise<boolean> {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      return await RNFS.exists(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a file
   */
  static async deleteFile(fileName: string): Promise<void> {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const fileExists = await RNFS.exists(filePath);
      if (fileExists) {
        await RNFS.unlink(filePath);
      }
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Create a directory
   */
  static async createDirectory(dirName: string): Promise<void> {
    try {
      const dirPath = `${RNFS.DocumentDirectoryPath}/${dirName}`;
      await RNFS.mkdir(dirPath);
    } catch (error) {
      throw new Error(`Failed to create directory: ${error}`);
    }
  }

  /**
   * Read directory contents
   */
  static async readDirectory(dirName?: string): Promise<string[]> {
    try {
      const dirPath = dirName ? `${RNFS.DocumentDirectoryPath}/${dirName}` : RNFS.DocumentDirectoryPath;
      const result = await RNFS.readDir(dirPath);
      return result.map((item: any) => item.name);
    } catch (error) {
      throw new Error(`Failed to read directory: ${error}`);
    }
  }

  /**
   * Get file/directory stats
   */
  static async getFileInfo(fileName: string): Promise<FileInfo> {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const stats = await RNFS.stat(filePath);
      
      return {
        path: stats.path,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        mtime: new Date(stats.mtime),
        ctime: new Date(stats.ctime),
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error}`);
    }
  }

  /**
   * Download a file from URL
   */
  static async downloadFile(options: DownloadOptions): Promise<void> {
    try {
      const downloadOptions = {
        fromUrl: options.fromUrl,
        toFile: options.toFile,
        progressDivider: options.progressDivider || 1,
        progressInterval: options.progressInterval || 100,
      };

      const result = RNFS.downloadFile(downloadOptions);
      await result.promise;
    } catch (error) {
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  /**
   * Copy a file
   */
  static async copyFile(fromPath: string, toPath: string): Promise<void> {
    try {
      await RNFS.copyFile(fromPath, toPath);
    } catch (error) {
      throw new Error(`Failed to copy file: ${error}`);
    }
  }

  /**
   * Move a file
   */
  static async moveFile(fromPath: string, toPath: string): Promise<void> {
    try {
      await RNFS.moveFile(fromPath, toPath);
    } catch (error) {
      throw new Error(`Failed to move file: ${error}`);
    }
  }

  /**
   * Get free storage space
   */
  static async getFreeSpace(): Promise<number> {
    try {
      const freeSpace = await RNFS.getFSInfo();
      return freeSpace.freeSpace;
    } catch (error) {
      throw new Error(`Failed to get free space: ${error}`);
    }
  }

  /**
   * Get total storage space
   */
  static async getTotalSpace(): Promise<number> {
    try {
      const fsInfo = await RNFS.getFSInfo();
      return fsInfo.totalSpace;
    } catch (error) {
      throw new Error(`Failed to get total space: ${error}`);
    }
  }
} 