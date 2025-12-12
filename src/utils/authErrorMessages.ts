/**
 * Auth Error Messages Utility
 * Provides user-friendly error messages for Firebase Auth error codes
 * Design Spec Section 6: Error Handling
 */

export const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    // Network errors
    'auth/network-request-failed': 'No internet connection. Please check your network and try again.',
    
    // Email/Password errors
    'auth/invalid-email': 'Invalid email address',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    
    // Google Sign-In errors
    'auth/account-exists-with-different-credential': 'An account with this email already exists with a different sign-in method',
    'auth/credential-already-in-use': 'This Google account is already linked to another user',
    'auth/provider-already-linked': 'This provider is already linked to your account',
    
    // Rate limiting
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    
    // Password reset
    'auth/expired-action-code': 'Password reset link has expired. Please request a new one.',
    'auth/invalid-action-code': 'Invalid or expired password reset link',
    
    // Linking errors
    'auth/requires-recent-login': 'For security, please sign in again to continue',
    
    // Default
    'unknown': 'An unexpected error occurred. Please try again',
  };
  
  return errorMessages[errorCode] || errorMessages['unknown'];
};

/**
 * Extract error code from Firebase error
 */
export const getErrorCode = (error: any): string => {
  if (error?.code) {
    return error.code;
  }
  return 'unknown';
};

/**
 * Get user-friendly error message from any error object
 */
export const getErrorMessage = (error: any): string => {
  const code = getErrorCode(error);
  return getAuthErrorMessage(code);
};
