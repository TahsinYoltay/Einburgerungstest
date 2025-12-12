import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import auth, { FirebaseAuthTypes, getAuth, onAuthStateChanged, signOut, signInAnonymously } from '@react-native-firebase/auth';
import Purchases from 'react-native-purchases';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAppDispatch } from '../store/hooks';
import { 
  setAuthLoading,
  setAuthenticatedUser, 
  setAnonymousUser,
  clearAuth,
  AuthProvider as AuthProviderType
} from '../store/slices/authSlice';
import { 
  setSubscriptionActive,
  setSubscriptionNone,
  setSubscriptionLoading,
  setSubscriptionError 
} from '../store/slices/subscriptionSlice';
import { authService } from '../services/AuthService';
import { purchaseService } from '../services/PurchaseService';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueCatConfigured, setRevenueCatConfigured] = useState(false);
  const dispatch = useAppDispatch();
  
  // Initialize RevenueCat on mount (BEFORE auth listener)
  // RevenueCat Best Practice: Configure once at app startup, let it create anonymous ID
  // Then use logIn() when Firebase user is detected
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        await purchaseService.configureWithUser();
        setRevenueCatConfigured(true);
      } catch (error) {
        console.error('[AuthProvider] ❌ RevenueCat configuration error:', error);
        setRevenueCatConfigured(true);
      }
    };
    
    initRevenueCat();
  }, []);
  
  // Auth state listener (runs AFTER RevenueCat is configured)
  useEffect(() => {
    if (!revenueCatConfigured) {
      return;
    }
    
    const authInstance = getAuth();
    const subscriber = onAuthStateChanged(authInstance, async (currentUser) => {
      
      // Fix: If user has providers but isAnonymous is true (stale state after linking), force reload
      if (currentUser && currentUser.isAnonymous && currentUser.providerData.length > 0) {
        console.log('[AuthProvider] ⚠️ Detected providers on anonymous user, reloading profile...');
        try {
          await currentUser.reload();
          // Get the fresh user instance after reload
          currentUser = authInstance.currentUser; 
        } catch (e) {
          console.error('[AuthProvider] User reload failed:', e);
        }
      }

      setUser(currentUser);
      
      if (currentUser) {
        // Determine auth provider
        let authProvider: AuthProviderType = 'none';
        if (!currentUser.isAnonymous && currentUser.providerData.length > 0) {
          const providerId = currentUser.providerData[0]?.providerId;
          if (providerId === 'google.com') {
            authProvider = 'google';
          } else if (providerId === 'password') {
            authProvider = 'email';
          }
        }

        // 1. IMMEDIATE REDUX UPDATE: Update auth state
        if (currentUser.isAnonymous) {
          dispatch(setAnonymousUser({ firebaseUid: currentUser.uid }));
        } else {
          dispatch(setAuthenticatedUser({
            firebaseUid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            authProvider,
          }));
        }

        // 2. BACKGROUND REVENUECAT SYNC
        try {
          dispatch(setSubscriptionLoading(true));
          
          // Login to RevenueCat with Firebase UID (handles cache invalidation internally)
          await purchaseService.loginUser(currentUser.uid);
          
          // Sync user attributes
          await purchaseService.syncUserAttributes(
            currentUser.email || undefined,
            currentUser.displayName || undefined
          );
          
          // Sync device info (platform, OS version)
          await purchaseService.syncDeviceInfo();
          
          // Sync user behavior data (auth provider, last active)
          await purchaseService.syncUserBehaviorData({
            authProvider: currentUser.isAnonymous ? 'none' : authProvider,
            lastActiveDate: new Date().toISOString(),
          });
          
          // 3. Fetch and update subscription state
          const subscriptionState = await purchaseService.fetchAndUpdateEntitlements();
          
          if (subscriptionState.status === 'active') {
            dispatch(setSubscriptionActive({
              productId: subscriptionState.productId!,
              renewalType: subscriptionState.renewalType!,
              expiresAt: subscriptionState.expiresAt,
            }));
          } else if (subscriptionState.status === 'none' && !currentUser.isAnonymous) {
            // If authenticated user has no subscription, try restoring purchases
            // This handles cases where subscription is tied to a different App User ID
            
            try {
              const restored = await purchaseService.restorePurchases();
              if (restored) {
                const updatedState = await purchaseService.fetchAndUpdateEntitlements();
                
                if (updatedState.status === 'active') {
                  dispatch(setSubscriptionActive({
                    productId: updatedState.productId!,
                    renewalType: updatedState.renewalType!,
                    expiresAt: updatedState.expiresAt,
                  }));
                } else {
                  dispatch(setSubscriptionNone());
                }
              } else {
                dispatch(setSubscriptionNone());
              }
            } catch (restoreError) {
              console.error('[AuthProvider] ⚠️ Auto-restore failed:', restoreError);
              dispatch(setSubscriptionNone());
            }
          } else if (subscriptionState.status === 'none') {
            dispatch(setSubscriptionNone());
          } else {
            dispatch(setSubscriptionError(subscriptionState.error));
          }
          
        } catch (error: any) {
          console.error('[AuthProvider] ❌ RevenueCat Error:', error);
          dispatch(setSubscriptionError(error?.message || 'Failed to sync subscription'));
        }
      } else {
        dispatch(clearAuth());
        dispatch(setSubscriptionNone());
      }
      
      setLoading(false);
    });

    return subscriber;
  }, [dispatch, revenueCatConfigured]);

  // Entitlement refresh on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user && !user.isAnonymous) {
        try {
          const subscriptionState = await purchaseService.fetchAndUpdateEntitlements();
          
          if (subscriptionState.status === 'active') {
            dispatch(setSubscriptionActive({
              productId: subscriptionState.productId!,
              renewalType: subscriptionState.renewalType!,
              expiresAt: subscriptionState.expiresAt,
            }));
          } else if (subscriptionState.status === 'none') {
            dispatch(setSubscriptionNone());
          } else if (subscriptionState.error) {
            dispatch(setSubscriptionError(subscriptionState.error));
          }
        } catch (error: any) {
          console.error('[AuthProvider] ❌ Entitlement refresh error:', error);
        }
      }
    });
    
    return () => subscription.remove();
  }, [user, dispatch]);

  /**
   * Sign out method (Design Spec Section 4.6)
   * Proper sequence: RevenueCat → Google → Firebase → Anonymous
   */
  const signOutUser = async () => {
    setLoading(true);
    
    try {
      const authInstance = getAuth();
      
      // 1. Logout from RevenueCat first
      try {
        await purchaseService.logoutUser();
      } catch (e) {
        console.error('[AuthProvider] RevenueCat logout error:', e);
      }
      
      // 2. Logout from Google if applicable
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignorable
      }
      
      // 3. Logout from Firebase
      await signOut(authInstance);
      
      // 4. Sign in anonymously
      await signInAnonymously(authInstance);
    } catch (error) {
      console.error('[AuthProvider] ❌ Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
