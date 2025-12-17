/**
 * Global Application Configuration
 * 
 * This file contains static configuration values for the application.
 * These values are public and included in the application bundle.
 * Do NOT store secrets (API keys, passwords) here.
 */

export const APP_CONFIG = {
  // Bundle IDs / Package Names (Found in build.gradle / project.pbxproj)
  ANDROID_PACKAGE_NAME: 'com.eywasoft.lifeintheuk',
  IOS_BUNDLE_ID: 'org.eywasoft.LIF',

  // Store IDs
  // TODO: Replace this with your actual Apple App ID from App Store Connect (e.g., '1234567890')
  // This is the 9-10 digit number found in the App Store URL: https://apps.apple.com/app/id<YOUR_ID>
  IOS_APP_ID: '1599283418', 

  // URLs
  PRIVACY_POLICY_URL: 'https://eywasoft.co.uk/mobile/privacy/', 
  TERMS_URL: 'https://eywasoft.co.uk/mobile/rumi/end-user-license-agreement/', 
  SUPPORT_EMAIL: 'support@eywasoft.co.uk', 

  // Firebase / Google Sign-In
  // TODO: Verify this matches Firebase Console -> Authentication -> Sign-in method -> Google -> Web SDK configuration
  WEB_CLIENT_ID: '482157943468-uq0vuabptkv6mdsk2nssp6ct1d2dlb0v.apps.googleusercontent.com',
};
