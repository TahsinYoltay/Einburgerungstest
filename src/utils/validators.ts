/**
 * Validation Utilities
 * Common validation functions for forms and user input
 */

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns true if email format is valid
 */
export const isEmailValid = (email: string): boolean => {
  if (!email || email.trim().length === 0) {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns true if password meets minimum requirements (6+ characters)
 */
export const isPasswordValid = (password: string): boolean => {
  return !!password && password.length >= 6;
};

/**
 * Validate display name
 * @param name - Display name to validate
 * @returns true if name is not empty and has reasonable length
 */
export const isDisplayNameValid = (name: string): boolean => {
  if (!name || name.trim().length === 0) {
    return false;
  }
  
  // Name should be between 1 and 50 characters
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 50;
};

/**
 * Check if two passwords match
 * @param password - First password
 * @param confirmPassword - Confirmation password
 * @returns true if passwords match
 */
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};
