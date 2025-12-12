/**
 * Authentication Provider Constants
 * Centralized provider identifiers for Firebase Auth
 */

export const AUTH_PROVIDERS = {
  PASSWORD: 'password',
  GOOGLE: 'google.com',
  APPLE: 'apple.com',
  FACEBOOK: 'facebook.com',
  PHONE: 'phone',
  ANONYMOUS: 'anonymous',
} as const;

export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];

/**
 * User-friendly provider names for display
 */
export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  [AUTH_PROVIDERS.PASSWORD]: 'Email/Password',
  [AUTH_PROVIDERS.GOOGLE]: 'Google',
  [AUTH_PROVIDERS.APPLE]: 'Apple',
  [AUTH_PROVIDERS.FACEBOOK]: 'Facebook',
  [AUTH_PROVIDERS.PHONE]: 'Phone',
  [AUTH_PROVIDERS.ANONYMOUS]: 'Anonymous',
};

/**
 * Check if provider requires password
 */
export const isPasswordProvider = (provider: string): boolean => {
  return provider === AUTH_PROVIDERS.PASSWORD;
};

/**
 * Check if provider is social (OAuth)
 */
export const isSocialProvider = (provider: string): boolean => {
  const socialProviders: string[] = [
    AUTH_PROVIDERS.GOOGLE,
    AUTH_PROVIDERS.APPLE,
    AUTH_PROVIDERS.FACEBOOK,
  ];
  return socialProviders.includes(provider);
};
