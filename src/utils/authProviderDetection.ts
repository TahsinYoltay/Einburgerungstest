/**
 * Authentication Provider Detection Utility
 * Enterprise-level provider conflict detection and resolution
 */

import auth from '@react-native-firebase/auth';
import { AUTH_PROVIDERS, PROVIDER_DISPLAY_NAMES } from '../constants/authProviders';

export interface ProviderDetectionResult {
  exists: boolean;
  providers: string[];
  hasPassword: boolean;
  hasGoogle: boolean;
  hasApple: boolean;
  primaryProvider: string | null;
  suggestionKey: string | null; // Translation key for user-facing message
}

/**
 * Detects which authentication providers are registered for an email
 * @param email - Email address to check
 * @returns Provider detection result
 */
export const detectProvidersForEmail = async (email: string): Promise<ProviderDetectionResult> => {
  try {
    // Fetch all sign-in methods for this email
    const providers = await auth().fetchSignInMethodsForEmail(email);
    
    console.log('[ProviderDetection] Email:', email, 'Providers:', providers);
    
    const hasPassword = providers.includes(AUTH_PROVIDERS.PASSWORD);
    const hasGoogle = providers.includes(AUTH_PROVIDERS.GOOGLE);
    const hasApple = providers.includes(AUTH_PROVIDERS.APPLE);
    
    // Determine primary provider (first non-anonymous)
    const primaryProvider = providers[0] || null;
    
    // Determine suggestion key for translation
    let suggestionKey: string | null = null;
    if (providers.length > 0) {
      if (hasGoogle) {
        suggestionKey = 'auth.providerConflict.useGoogle';
      } else if (hasApple) {
        suggestionKey = 'auth.providerConflict.useApple';
      } else if (hasPassword) {
        suggestionKey = 'auth.providerConflict.usePassword';
      }
    }
    
    return {
      exists: providers.length > 0,
      providers,
      hasPassword,
      hasGoogle,
      hasApple,
      primaryProvider,
      suggestionKey,
    };
  } catch (error) {
    console.error('[ProviderDetection] Error:', error);
    // If detection fails, assume email doesn't exist
    return {
      exists: false,
      providers: [],
      hasPassword: false,
      hasGoogle: false,
      hasApple: false,
      primaryProvider: null,
      suggestionKey: null,
    };
  }
};

/**
 * Checks if email/password registration is allowed for this email
 * @param email - Email address to check
 * @returns Object with allowed status and reason key
 */
export const canRegisterWithPassword = async (
  email: string
): Promise<{ allowed: boolean; reasonKey?: string; provider?: string }> => {
  const detection = await detectProvidersForEmail(email);
  
  if (!detection.exists) {
    // Email doesn't exist, registration allowed
    return { allowed: true };
  }
  
  if (detection.hasPassword) {
    // Already has password, should sign in instead
    return {
      allowed: false,
      reasonKey: 'auth.providerConflict.alreadyHasPassword',
    };
  }
  
  // Email exists with other provider (Google, Apple, etc.)
  if (detection.hasGoogle) {
    return {
      allowed: false,
      reasonKey: 'auth.providerConflict.registeredWithGoogle',
      provider: 'Google',
    };
  }
  
  if (detection.hasApple) {
    return {
      allowed: false,
      reasonKey: 'auth.providerConflict.registeredWithApple',
      provider: 'Apple',
    };
  }
  
  // Email exists with another provider
  return {
    allowed: false,
    reasonKey: 'auth.providerConflict.registeredWithOther',
    provider: detection.primaryProvider || 'another method',
  };
};

/**
 * Checks if email/password sign-in is possible for this email
 * @param email - Email address to check
 * @returns Object with possible status and suggestion key
 */
export const canSignInWithPassword = async (
  email: string
): Promise<{ possible: boolean; suggestionKey?: string; provider?: string }> => {
  const detection = await detectProvidersForEmail(email);
  
  if (!detection.exists) {
    // Email doesn't exist at all
    return {
      possible: false,
      suggestionKey: 'auth.providerConflict.accountNotFound',
    };
  }
  
  if (detection.hasPassword) {
    // Has password, sign-in is possible
    return { possible: true };
  }
  
  // Email exists but no password provider
  if (detection.hasGoogle) {
    return {
      possible: false,
      suggestionKey: 'auth.providerConflict.useGoogle',
      provider: 'Google',
    };
  }
  
  if (detection.hasApple) {
    return {
      possible: false,
      suggestionKey: 'auth.providerConflict.useApple',
      provider: 'Apple',
    };
  }
  
  return {
    possible: false,
    suggestionKey: 'auth.providerConflict.useOtherMethod',
  };
};
