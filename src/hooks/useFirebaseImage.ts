import { useState, useEffect, useCallback } from 'react';
import { firebaseImageService, ImageDownloadResult, BatchDownloadResult } from '../services/FirebaseImageService';

export interface UseFirebaseImageResult {
  url: string | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  retry: () => void;
}

export interface UseFirebaseImagesResult {
  urls: Record<string, string>;
  loading: boolean;
  error: string | null;
  loadingPaths: string[];
  failedPaths: string[];
  retry: () => void;
  retryPath: (path: string) => void;
}

export interface UseFirebaseImagePreloaderResult {
  preloadImages: (paths: string[]) => Promise<void>;
  preloading: boolean;
  preloadError: string | null;
  preloadProgress: { completed: number; total: number };
}

/**
 * Hook for loading a single image from Firebase Storage
 */
export function useFirebaseImage(
  imagePath: string | null,
  autoLoad: boolean = true
): UseFirebaseImageResult {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const loadImage = useCallback(async () => {
    if (!imagePath) {
      setUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result: ImageDownloadResult = await firebaseImageService.getImageUrl(imagePath);
      
      if (result.success && result.url) {
        setUrl(result.url);
        setFromCache(result.fromCache || false);
        setError(null);
      } else {
        setUrl(null);
        setFromCache(false);
        setError(result.error || 'Failed to load image');
      }
    } catch (err) {
      setUrl(null);
      setFromCache(false);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [imagePath]);

  const retry = useCallback(() => {
    if (imagePath) {
      // Clear cache for this specific image before retrying
      firebaseImageService.clearCache(imagePath);
      loadImage();
    }
  }, [imagePath, loadImage]);

  useEffect(() => {
    if (autoLoad && imagePath) {
      loadImage();
    } else if (!imagePath) {
      setUrl(null);
      setError(null);
      setLoading(false);
      setFromCache(false);
    }
  }, [imagePath, autoLoad, loadImage]);

  return {
    url,
    loading,
    error,
    fromCache,
    retry,
  };
}

/**
 * Hook for loading multiple images from Firebase Storage
 */
export function useFirebaseImages(
  imagePaths: string[],
  autoLoad: boolean = true
): UseFirebaseImagesResult {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPaths, setLoadingPaths] = useState<string[]>([]);
  const [failedPaths, setFailedPaths] = useState<string[]>([]);

  const loadImages = useCallback(async () => {
    if (!imagePaths || imagePaths.length === 0) {
      setUrls({});
      setError(null);
      setLoading(false);
      setLoadingPaths([]);
      setFailedPaths([]);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingPaths([...imagePaths]);
    setFailedPaths([]);

    try {
      const result: BatchDownloadResult = await firebaseImageService.getMultipleImageUrls(imagePaths);
      
      const newUrls: Record<string, string> = {};
      const failed: string[] = [];

      // Process successful downloads
      result.successful.forEach(({ path, url }) => {
        newUrls[path] = url;
      });

      // Process failed downloads
      result.failed.forEach(({ path }) => {
        failed.push(path);
      });

      setUrls(newUrls);
      setFailedPaths(failed);
      
      if (failed.length > 0) {
        setError(`Failed to load ${failed.length} out of ${imagePaths.length} images`);
      } else {
        setError(null);
      }
    } catch (err) {
      setUrls({});
      setFailedPaths([...imagePaths]);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setLoadingPaths([]);
    }
  }, [imagePaths]);

  const retry = useCallback(() => {
    if (imagePaths && imagePaths.length > 0) {
      // Clear cache for failed images before retrying
      failedPaths.forEach(path => {
        firebaseImageService.clearCache(path);
      });
      loadImages();
    }
  }, [imagePaths, failedPaths, loadImages]);

  const retryPath = useCallback(async (path: string) => {
    if (!imagePaths.includes(path)) return;

    setLoadingPaths(prev => [...prev, path]);
    setFailedPaths(prev => prev.filter(p => p !== path));

    try {
      // Clear cache for this specific image
      await firebaseImageService.clearCache(path);
      const result = await firebaseImageService.getImageUrl(path);
      
      if (result.success && result.url) {
        setUrls(prev => ({ ...prev, [path]: result.url! }));
        setError(prev => {
          const remainingFailed = failedPaths.filter(p => p !== path);
          return remainingFailed.length > 0 
            ? `Failed to load ${remainingFailed.length} out of ${imagePaths.length} images`
            : null;
        });
      } else {
        setFailedPaths(prev => [...prev, path]);
        setError(result.error || `Failed to load image: ${path}`);
      }
    } catch (err) {
      setFailedPaths(prev => [...prev, path]);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoadingPaths(prev => prev.filter(p => p !== path));
    }
  }, [imagePaths, failedPaths]);

  useEffect(() => {
    if (autoLoad && imagePaths && imagePaths.length > 0) {
      loadImages();
    } else if (!imagePaths || imagePaths.length === 0) {
      setUrls({});
      setError(null);
      setLoading(false);
      setLoadingPaths([]);
      setFailedPaths([]);
    }
  }, [imagePaths, autoLoad, loadImages]);

  return {
    urls,
    loading,
    error,
    loadingPaths,
    failedPaths,
    retry,
    retryPath,
  };
}

/**
 * Hook for preloading images in the background
 */
export function useFirebaseImagePreloader(): UseFirebaseImagePreloaderResult {
  const [preloading, setPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState<string | null>(null);
  const [preloadProgress, setPreloadProgress] = useState({ completed: 0, total: 0 });

  const preloadImages = useCallback(async (paths: string[]) => {
    if (!paths || paths.length === 0) return;

    setPreloading(true);
    setPreloadError(null);
    setPreloadProgress({ completed: 0, total: paths.length });

    try {
      const result = await firebaseImageService.getMultipleImageUrls(paths);
      
      setPreloadProgress({ 
        completed: result.successful.length, 
        total: paths.length 
      });

      if (result.failed.length > 0) {
        setPreloadError(`Failed to preload ${result.failed.length} out of ${paths.length} images`);
      }
    } catch (err) {
      setPreloadError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setPreloading(false);
    }
  }, []);

  return {
    preloadImages,
    preloading,
    preloadError,
    preloadProgress,
  };
} 