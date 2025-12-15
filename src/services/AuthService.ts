import { GoogleSignin, statusCodes, isSuccessResponse, isErrorWithCode } from '@react-native-google-signin/google-signin';
import auth, { 
  FirebaseAuthTypes, 
  getAuth, 
  signInWithCredential, 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
  GoogleAuthProvider,
  EmailAuthProvider
} from '@react-native-firebase/auth';
import Purchases from 'react-native-purchases';
import { APP_CONFIG } from '../config/appConfig';
import { getAuthErrorMessage, getErrorCode } from '../utils/authErrorMessages';
import { canRegisterWithPassword, canSignInWithPassword } from '../utils/authProviderDetection';

// Configure Google Signin
GoogleSignin.configure({
  webClientId: APP_CONFIG.WEB_CLIENT_ID,
  offlineAccess: true,
});

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Links a Google account to the current anonymous user or signs in.
   * Note: This method does NOT sync with RevenueCat; AuthProvider handles that via onAuthStateChanged.
   * @returns success, error, and previousUid if account was switched (for purchase transfer)
   */
  async linkGoogleAccount(): Promise<{ success: boolean; error?: string; previousUid?: string; uidChanged?: boolean }> {
    try {
      console.log('[AuthService] Starting Google account linking...');
      
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
          const { idToken } = response.data;
          
          if (!idToken) {
            throw new Error('No ID token returned from Google');
          }

          const googleCredential = GoogleAuthProvider.credential(idToken);
          const authInstance = getAuth();
          const currentUser = authInstance.currentUser;
          
          if (!currentUser) {
            throw new Error('No current user found');
          }

          console.log('[AuthService] Current user:', currentUser.uid, 'isAnonymous:', currentUser.isAnonymous);
          const previousUid = currentUser.uid; // Store for potential transfer
          let uidChanged = false;
          
          if (currentUser.isAnonymous) {
              try {
                  await currentUser.linkWithCredential(googleCredential);
                  console.log('[AuthService] ✅ Successfully linked Google account to anonymous user (UID preserved)');
              } catch (linkError: any) {
                  console.log('[AuthService] Link error:', linkError.code);
                  
                  if (linkError.code === 'auth/credential-already-in-use') {
                      console.log('[AuthService] ⚠️ Google account already exists, signing in with existing account...');
                      console.log('[AuthService] 🔄 UID will change from:', previousUid);
                      await signInWithCredential(authInstance, googleCredential);
                      uidChanged = true;
                      console.log('[AuthService] ✅ Signed in with existing Google account (NEW UID)');
                      console.log('[AuthService] 💡 Purchase transfer will be needed!');
                  } else if (linkError.code === 'auth/provider-already-linked') {
                      console.log('[AuthService] ⚠️ Provider already linked');
                  } else {
                      throw linkError;
                  }
              }
          } else {
              console.log('[AuthService] User already logged in, attempting re-authentication...');
              await signInWithCredential(authInstance, googleCredential);
              console.log('[AuthService] ✅ Re-authenticated with Google');
          }

          return { 
            success: true, 
            previousUid: uidChanged ? previousUid : undefined,
            uidChanged 
          };
      } else {
          console.log('[AuthService] Google sign-in cancelled');
          return { success: false, error: 'Sign in cancelled' };
      }

    } catch (error: any) {
      console.error('[AuthService] Google Link Error:', error);
      
      let errorMessage: string;
      
      if (isErrorWithCode(error)) {
        // Handle Google Sign-In specific errors
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            errorMessage = 'Sign in already in progress';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage = 'Play services not available';
            break;
          default:
            // Try to get Firebase auth error message
            errorMessage = getAuthErrorMessage(getErrorCode(error));
        }
      } else {
        // Firebase auth error
        errorMessage = getAuthErrorMessage(getErrorCode(error));
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Signs in with Google.
   */
  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
      try {
        console.log('[AuthService] Starting Google sign-in...');
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        
        if (isSuccessResponse(response)) {
            const { idToken } = response.data;
            if (!idToken) throw new Error('No ID token');
            
            const authInstance = getAuth();
            const googleCredential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(authInstance, googleCredential);
            
            console.log('[AuthService] Google sign-in successful');
            return { success: true };
        } else {
             console.log('[AuthService] Google sign-in cancelled');
             return { success: false, error: 'Sign in cancelled' };
        }
      } catch (error: any) {
        console.error('[AuthService] Google sign-in error:', error);
        
        let errorMessage: string;
        
        if (isErrorWithCode(error)) {
          // Handle Google Sign-In specific errors
          switch (error.code) {
            case statusCodes.IN_PROGRESS:
              errorMessage = 'Sign in already in progress';
              break;
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
              errorMessage = 'Play services not available';
              break;
            default:
              errorMessage = getAuthErrorMessage(getErrorCode(error));
          }
        } else {
          // Firebase auth error
          errorMessage = getAuthErrorMessage(getErrorCode(error));
        }
        
        return { success: false, error: errorMessage };
      }
  }

  /**
   * Signs in with email and password.
   * Includes provider detection for better error messages.
   */
  async signInWithEmailAndPassword(email: string, password: string): Promise<{ success: boolean; error?: string; suggestionKey?: string }> {
    try {
      console.log('[AuthService] Email/password sign-in...');
      
      // Check if email/password sign-in is possible
      const providerCheck = await canSignInWithPassword(email);
      
      if (!providerCheck.possible && providerCheck.suggestionKey) {
        console.log('[AuthService] ⚠️ Provider conflict:', providerCheck.suggestionKey);
        return {
          success: false,
          suggestionKey: providerCheck.suggestionKey,
        };
      }
      
      const authInstance = getAuth();
      await firebaseSignInWithEmailAndPassword(authInstance, email, password);
      console.log('[AuthService] Email sign-in successful');
      return { success: true };
    } catch (error: any) {
      console.error('[AuthService] Email sign-in error:', error);
      const errorMessage = getAuthErrorMessage(getErrorCode(error));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Creates a new account with email and password.
   * Includes provider detection to prevent conflicts.
   * IMPORTANT: Links to anonymous user to preserve subscriptions (same as Google flow).
   * @returns success, error, suggestionKey, and uidChanged flag for auto-restore
   */
  async createUserWithEmailAndPassword(email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string; suggestionKey?: string; previousUid?: string; uidChanged?: boolean }> {
    try {
      console.log('[AuthService] Creating account with email...');
      
      // Check if registration is allowed (detect provider conflicts)
      const registrationCheck = await canRegisterWithPassword(email);
      
      if (!registrationCheck.allowed && registrationCheck.reasonKey) {
        console.log('[AuthService] ⚠️ Registration blocked:', registrationCheck.reasonKey);
        return {
          success: false,
          suggestionKey: registrationCheck.reasonKey,
        };
      }
      
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;
      
      if (!currentUser) {
        throw new Error('No current user found');
      }
      
      console.log('[AuthService] Current user:', currentUser.uid, 'isAnonymous:', currentUser.isAnonymous);
      const previousUid = currentUser.uid;
      let uidChanged = false;
      
      // If anonymous, try to LINK the email credential (preserves UID and subscription)
      if (currentUser.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        
        try {
          await currentUser.linkWithCredential(credential);
          if (displayName) {
            await currentUser.updateProfile({ displayName });
          }
          console.log('[AuthService] ✅ Successfully linked email to anonymous user (UID preserved)');
          return { success: true };
        } catch (linkError: any) {
          console.log('[AuthService] Link error:', linkError.code);
          
          if (linkError.code === 'auth/email-already-in-use') {
            // Email exists - try to sign in with it
            console.log('[AuthService] ⚠️ Email already exists, attempting sign in...');
            console.log('[AuthService] 🔄 UID will change from:', previousUid);
            
            try {
              await firebaseSignInWithEmailAndPassword(authInstance, email, password);
              uidChanged = true;
              console.log('[AuthService] ✅ Signed in with existing email account (NEW UID)');
              console.log('[AuthService] 💡 Purchase transfer will be needed!');
              return { success: true, previousUid, uidChanged };
            } catch (signInError: any) {
              console.error('[AuthService] Sign in failed:', signInError.code);
              // Wrong password or other error
              const errorMessage = getAuthErrorMessage(getErrorCode(signInError));
              return { success: false, error: errorMessage };
            }
          } else if (linkError.code === 'auth/provider-already-linked') {
            console.log('[AuthService] ⚠️ Provider already linked');
            return { success: false, error: 'Email provider is already linked to this account' };
          } else {
            throw linkError;
          }
        }
      } else {
        // Already authenticated (non-anonymous) - just create new account
        // This shouldn't happen in normal flow but handle it
        console.log('[AuthService] User already authenticated, creating new account...');
        
        try {
          await firebaseCreateUserWithEmailAndPassword(authInstance, email, password);
          console.log('[AuthService] ✅ Account created successfully');
          return { success: true };
        } catch (createError: any) {
          if (createError.code === 'auth/email-already-in-use') {
            return {
              success: false,
              suggestionKey: 'auth.providerConflict.alreadyHasPassword',
            };
          }
          throw createError;
        }
      }
    } catch (error: any) {
      console.error('[AuthService] Registration error:', error);
      const errorMessage = getAuthErrorMessage(getErrorCode(error));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send password reset email
   * Design Spec Section 4.9: Forgot Password
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AuthService] Sending password reset email to:', email);
      const authInstance = getAuth();
      await firebaseSendPasswordResetEmail(authInstance, email);
      console.log('[AuthService] ✅ Password reset email sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[AuthService] Password reset error:', error);
      const errorMessage = getAuthErrorMessage(getErrorCode(error));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Signs out and returns to anonymous mode.
   * @deprecated Use AuthProvider.signOut() instead for proper flow
   * This method is kept for backward compatibility but AuthProvider handles the complete flow
   */
  async signOut(): Promise<void> {
      console.log('[AuthService] ⚠️ Using deprecated signOut - prefer AuthProvider.signOut()');
      console.log('[AuthService] Signing out...');
      
      try {
          await GoogleSignin.signOut();
      } catch (e) {
          console.log('[AuthService] Google Sign out error (ignorable):', e);
      }

      try {
          await Purchases.logOut();
          console.log('[AuthService] RevenueCat logged out');
          Purchases.invalidateCustomerInfoCache();
          // Small delay to ensure state clears
          await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
          console.error('[AuthService] RevenueCat Log out error:', e);
      }

      try {
          const authInstance = getAuth();
          await firebaseSignOut(authInstance);
          console.log('[AuthService] Firebase signed out');
      } catch (e) {
          console.error('[AuthService] Firebase Sign out error:', e);
      }

      try {
          const anonResult = await firebaseSignInAnonymously(authInstance);
          console.log('[AuthService] Signed in anonymously:', anonResult.user.uid);
      } catch (e) {
          console.error('[AuthService] Anonymous sign-in error:', e);
      }
  }
}

export const authService = AuthService.getInstance();
