import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseStorage } from '../config/firebase';

export interface ImageDownloadResult {
  success: boolean;
  url?: string;
  error?: string;
  fromCache?: boolean;
}

export interface BatchDownloadResult {
  successful: Array<{ path: string; url: string; fromCache?: boolean }>;
  failed: Array<{ path: string; error: string }>;
}

interface CachedImage {
  url: string;
  timestamp: number;
  expiresAt: number;
}

interface ImageCache {
  [key: string]: CachedImage;
}

class FirebaseImageService {
  private static instance: FirebaseImageService;
  private cache: ImageCache = {};
  private readonly CACHE_PREFIX = 'firebase_image_';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private pendingRequests: Map<string, Promise<ImageDownloadResult>> = new Map();

  private constructor() {
    this.loadCacheFromStorage();
  }

  public static getInstance(): FirebaseImageService {
    if (!FirebaseImageService.instance) {
      FirebaseImageService.instance = new FirebaseImageService();
    }
    return FirebaseImageService.instance;
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      if (imageKeys.length > 0) {
        const items = await AsyncStorage.multiGet(imageKeys);
        
        items.forEach(([key, value]) => {
          if (value) {
            try {
              const cached: CachedImage = JSON.parse(value);
              const imagePath = key.replace(this.CACHE_PREFIX, '');
              
              // Check if cache entry is still valid
              if (Date.now() < cached.expiresAt) {
                this.cache[imagePath] = cached;
              } else {
                // Remove expired cache entry
                AsyncStorage.removeItem(key);
              }
            } catch (error) {
              console.warn('Failed to parse cached image data:', error);
              AsyncStorage.removeItem(key);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load image cache from storage:', error);
    }
  }

  private async saveCacheToStorage(imagePath: string, cached: CachedImage): Promise<void> {
    try {
      const key = this.CACHE_PREFIX + imagePath;
      await AsyncStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to save image cache to storage:', error);
    }
  }

  private async removeCacheFromStorage(imagePath: string): Promise<void> {
    try {
      const key = this.CACHE_PREFIX + imagePath;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove image cache from storage:', error);
    }
  }

  private getCacheKey(imagePath: string): string {
    return imagePath.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private isValidCacheEntry(cached: CachedImage): boolean {
    return Date.now() < cached.expiresAt;
  }

  private async fetchImageWithRetry(imagePath: string, attempt: number = 1): Promise<ImageDownloadResult> {
    try {
      // Construct Firebase Storage URL
      const storageBucket = firebaseStorage.app.options.storageBucket;
      if (!storageBucket) {
        throw new Error('Firebase storage bucket is not configured');
      }
      const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/`;
      const encodedPath = encodeURIComponent(imagePath);
      const url = `${baseUrl}${encodedPath}?alt=media`;

      // Test if the URL is accessible
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Cache the successful result
      const cached: CachedImage = {
        url,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION,
      };

      this.cache[imagePath] = cached;
      await this.saveCacheToStorage(imagePath, cached);

      return {
        success: true,
        url,
        fromCache: false,
      };
    } catch (error) {
      console.warn(`Image fetch attempt ${attempt} failed for ${imagePath}:`, error);

      if (attempt < this.MAX_RETRIES) {
        // Wait before retrying
        await new Promise<void>(resolve => setTimeout(() => resolve(), this.RETRY_DELAY * attempt));
        return this.fetchImageWithRetry(imagePath, attempt + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  public async getImageUrl(imagePath: string): Promise<ImageDownloadResult> {
    try {
      // Check if there's already a pending request for this image
      if (this.pendingRequests.has(imagePath)) {
        return await this.pendingRequests.get(imagePath)!;
      }

      // Check cache first
      const cached = this.cache[imagePath];
      if (cached && this.isValidCacheEntry(cached)) {
        return {
          success: true,
          url: cached.url,
          fromCache: true,
        };
      }

      // Create and store the pending request
      const requestPromise = this.fetchImageWithRetry(imagePath);
      this.pendingRequests.set(imagePath, requestPromise);

      try {
        const result = await requestPromise;
        return result;
      } finally {
        // Remove the pending request when done
        this.pendingRequests.delete(imagePath);
      }
    } catch (error) {
      console.error('Error in getImageUrl:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  public async getMultipleImageUrls(imagePaths: string[]): Promise<BatchDownloadResult> {
    const results = await Promise.allSettled(
      imagePaths.map(path => this.getImageUrl(path))
    );

    const successful: Array<{ path: string; url: string; fromCache?: boolean }> = [];
    const failed: Array<{ path: string; error: string }> = [];

    results.forEach((result, index) => {
      const imagePath = imagePaths[index];
      
      if (result.status === 'fulfilled' && result.value.success) {
        successful.push({
          path: imagePath,
          url: result.value.url!,
          fromCache: result.value.fromCache,
        });
      } else {
        const error = result.status === 'rejected' 
          ? result.reason?.message || 'Promise rejected'
          : result.value.error || 'Unknown error';
        
        failed.push({
          path: imagePath,
          error,
        });
      }
    });

    return { successful, failed };
  }

  public async clearCache(imagePath?: string): Promise<void> {
    try {
      if (imagePath) {
        // Clear specific image cache
        delete this.cache[imagePath];
        await this.removeCacheFromStorage(imagePath);
      } else {
        // Clear all cache
        this.cache = {};
        const keys = await AsyncStorage.getAllKeys();
        const imageKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
        if (imageKeys.length > 0) {
          await AsyncStorage.multiRemove(imageKeys);
        }
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  public getCacheStatus(): { totalEntries: number; validEntries: number; expiredEntries: number } {
    const entries = Object.values(this.cache);
    const now = Date.now();
    
    const validEntries = entries.filter(entry => entry.expiresAt > now).length;
    const expiredEntries = entries.length - validEntries;

    return {
      totalEntries: entries.length,
      validEntries,
      expiredEntries,
    };
  }

  public async cleanupExpiredCache(): Promise<void> {
    const now = Date.now();
    const expiredPaths: string[] = [];

    Object.entries(this.cache).forEach(([path, cached]) => {
      if (cached.expiresAt <= now) {
        expiredPaths.push(path);
      }
    });

    if (expiredPaths.length > 0) {
      // Remove from memory cache
      expiredPaths.forEach(path => {
        delete this.cache[path];
      });

      // Remove from storage
      const storageKeys = expiredPaths.map(path => this.CACHE_PREFIX + path);
      try {
        await AsyncStorage.multiRemove(storageKeys);
      } catch (error) {
        console.warn('Failed to remove expired cache from storage:', error);
      }
    }
  }
}

// Export singleton instance
export const firebaseImageService = FirebaseImageService.getInstance(); 
