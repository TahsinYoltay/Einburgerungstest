import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedText } from '../types/content';

/**
 * Custom hook to resolve LocalizedText objects based on the current app language.
 * Returns a helper function `getLocalized`.
 */
export const useLocalizedContent = () => {
  const { i18n } = useTranslation();

  const getLocalized = useCallback((content: LocalizedText | undefined | null): string => {
    if (!content) return '';
    
    // Handle legacy/simple string content
    if (typeof content === 'string') return content;
    
    // Resolution strategy:
    // 1. Current Language (e.g., 'es')
    // 2. Fallback to English ('en')
    // 3. Fallback to the first available key
    return content[i18n.language] || content['en'] || Object.values(content)[0] || '';
  }, [i18n.language]);

  return { getLocalized };
};
