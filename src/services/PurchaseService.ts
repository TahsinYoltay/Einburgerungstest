import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { SubscriptionState } from '../store/slices/subscriptionSlice';
// @ts-ignore
import { GOOGLE_API_KEY, APPLE_API_KEY } from '@env';

const API_KEYS = {
  apple: APPLE_API_KEY,
  google: GOOGLE_API_KEY,
};

export const ENTITLEMENT_ID = 'pro_access';

class PurchaseService {
  private static instance: PurchaseService;
  private isConfigured = false;

  private constructor() {}

  static getInstance(): PurchaseService {
    if (!PurchaseService.instance) {
      PurchaseService.instance = new PurchaseService();
    }
    return PurchaseService.instance;
  }

  /**
   * Configure RevenueCat with optional user ID
   * @param firebaseUid - Firebase UID for authenticated users, undefined for anonymous
   */
  async configureWithUser(firebaseUid?: string): Promise<void> {
    if (this.isConfigured) {
      console.log('[PurchaseService] Already configured, skipping');
      return;
    }

    const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
    
    if (!apiKey) {
      console.error('[PurchaseService] RevenueCat API Key is missing! Check .env file.');
      throw new Error('RevenueCat API Key missing');
    }

    console.log('[PurchaseService] Configuring RevenueCat...');
    console.log('[PurchaseService] Platform:', Platform.OS);
    console.log('[PurchaseService] User ID:', firebaseUid || 'anonymous');

    if (firebaseUid) {
      // Authenticated user: set appUserID to Firebase UID
      Purchases.configure({ apiKey: apiKey.trim(), appUserID: firebaseUid });
      console.log('[PurchaseService] ✅ Configured with authenticated user:', firebaseUid);
    } else {
      // Anonymous user: let RevenueCat generate anonymous ID
      Purchases.configure({ apiKey: apiKey.trim() });
      console.log('[PurchaseService] ✅ Configured for anonymous user');
    }
    
    this.isConfigured = true;
  }

  /**
   * Legacy configure method for backward compatibility
   * @deprecated Use configureWithUser instead
   */
  async configure(): Promise<void> {
    return this.configureWithUser();
  }

  /**
   * Login user to RevenueCat (Design Spec Section 4.3, 4.4)
   * @param firebaseUid - Firebase UID of the user
   * @returns CustomerInfo after login
   */
  async loginUser(firebaseUid: string): Promise<CustomerInfo> {
    if (!this.isConfigured) {
      console.log('[PurchaseService] Not configured, configuring now...');
      await this.configureWithUser();
    }
    
    console.log('[PurchaseService] 🔐 Logging in user to RevenueCat:', firebaseUid);
    
    // Invalidate cache before login for fresh data
    try {
      await Purchases.invalidateCustomerInfoCache();
      console.log('[PurchaseService] ✅ Cache invalidated');
    } catch (e) {
      console.warn('[PurchaseService] Cache invalidation warning:', e);
    }
    
    const { customerInfo } = await Purchases.logIn(firebaseUid);
    console.log('[PurchaseService] ✅ Login success. Original ID:', customerInfo.originalAppUserId);
    
    return customerInfo;
  }

  /**
   * Logout user from RevenueCat (Design Spec Section 4.6)
   * @returns CustomerInfo of new anonymous user
   */
  async logoutUser(): Promise<CustomerInfo> {
    if (!this.isConfigured) {
      throw new Error('PurchaseService not configured');
    }
    
    console.log('[PurchaseService] 🚪 Logging out from RevenueCat');
    
    const customerInfo = await Purchases.logOut();
    await Purchases.invalidateCustomerInfoCache();
    
    console.log('[PurchaseService] ✅ Logged out. New anonymous ID:', customerInfo.originalAppUserId);
    
    return customerInfo;
  }

  /**
   * Sync user attributes and purchases to RevenueCat
   * @param email - User email
   * @param displayName - User display name
   */
  async syncUserAttributes(email?: string, displayName?: string): Promise<void> {
    if (!this.isConfigured) return;
    
    try {
      if (email) {
        await Purchases.setEmail(email);
        console.log('[PurchaseService] ✅ Email synced');
      }
      if (displayName) {
        await Purchases.setDisplayName(displayName);
        console.log('[PurchaseService] ✅ Display name synced');
      }
      
      // Sync purchases to ensure any store transactions are reflected
      try {
        await Purchases.syncPurchases();
        console.log('[PurchaseService] ✅ Purchases synced');
      } catch (e) {
        console.warn('[PurchaseService] Sync purchases warning:', e);
      }
    } catch (error) {
      console.error('[PurchaseService] ❌ Error syncing attributes:', error);
    }
  }

  /**
   * Set custom user attributes for analytics and segmentation
   * RevenueCat allows tracking custom attributes for better user insights
   * 
   * @param attributes - Object containing custom attributes to track
   * 
   * Recommended attributes:
   * - platform: 'ios' | 'android'
   * - osVersion: string (e.g., '17.2')
   * - appVersion: string (e.g., '1.0.5')
   * - language: string (e.g., 'en', 'tr')
   * - authProvider: 'none' | 'email' | 'google'
   * - accountAge: number (days since account creation)
   * - examDownloaded: boolean
   * - bookDownloaded: boolean
   * - lastActiveDate: string (ISO date)
   * - totalExamsTaken: number
   * - totalQuestionsAnswered: number
   */
  async setCustomAttributes(attributes: Record<string, string | number | boolean>): Promise<void> {
    if (!this.isConfigured) return;
    
    try {
      for (const [key, value] of Object.entries(attributes)) {
        await Purchases.setAttributes({ [key]: String(value) });
      }
      console.log('[PurchaseService] ✅ Custom attributes synced:', Object.keys(attributes).join(', '));
    } catch (error) {
      console.error('[PurchaseService] ❌ Error setting custom attributes:', error);
    }
  }

  /**
   * Sync device and platform information to RevenueCat
   * This helps track which devices/OS versions are most common among users
   * 
   * Tracked attributes:
   * - platform: 'ios' | 'android'
   * - osVersion: OS version string
   * - deviceModel: Device model (e.g., 'iPhone 15 Pro', 'Samsung Galaxy S23')
   * - deviceBrand: Device manufacturer (e.g., 'Apple', 'Samsung')
   * - appVersion: App version from package.json
   * - buildNumber: Build number
   */
  async syncDeviceInfo(): Promise<void> {
    if (!this.isConfigured) return;
    
    try {
      const deviceAttributes: Record<string, string> = {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        deviceModel: await DeviceInfo.getDeviceName(), // e.g., "iPhone 15 Pro"
        deviceBrand: DeviceInfo.getBrand(), // e.g., "Apple"
        deviceId: DeviceInfo.getModel(), // e.g., "iPhone16,1"
        systemName: DeviceInfo.getSystemName(), // e.g., "iOS"
        systemVersion: DeviceInfo.getSystemVersion(), // e.g., "17.2"
        appVersion: DeviceInfo.getVersion(), // e.g., "1.0.0"
        buildNumber: DeviceInfo.getBuildNumber(), // e.g., "123"
      };

      await this.setCustomAttributes(deviceAttributes);
      console.log('[PurchaseService] ✅ Device info synced:', {
        model: deviceAttributes.deviceModel,
        brand: deviceAttributes.deviceBrand,
        os: `${deviceAttributes.systemName} ${deviceAttributes.systemVersion}`,
      });
    } catch (error) {
      console.error('[PurchaseService] ❌ Error syncing device info:', error);
    }
  }

  /**
   * Sync user behavior and app usage data to RevenueCat
   * Useful for understanding user engagement patterns
   * 
   * @param userData - User-specific data from Redux store or local state
   */
  async syncUserBehaviorData(userData: {
    language?: string;
    authProvider?: string;
    accountCreatedAt?: string;
    examDownloaded?: boolean;
    bookDownloaded?: boolean;
    totalExamsTaken?: number;
    totalQuestionsAnswered?: number;
    lastActiveDate?: string;
  }): Promise<void> {
    if (!this.isConfigured) return;
    
    try {
      const behaviorAttributes: Record<string, string> = {};

      if (userData.language) {
        behaviorAttributes['app_language'] = userData.language;
      }
      
      if (userData.authProvider) {
        behaviorAttributes['auth_provider'] = userData.authProvider;
      }
      
      if (userData.accountCreatedAt) {
        const accountAge = Math.floor(
          (Date.now() - new Date(userData.accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        behaviorAttributes['account_age_days'] = String(accountAge);
      }
      
      if (userData.examDownloaded !== undefined) {
        behaviorAttributes['exam_downloaded'] = String(userData.examDownloaded);
      }
      
      if (userData.bookDownloaded !== undefined) {
        behaviorAttributes['book_downloaded'] = String(userData.bookDownloaded);
      }
      
      if (userData.totalExamsTaken !== undefined) {
        behaviorAttributes['total_exams_taken'] = String(userData.totalExamsTaken);
      }
      
      if (userData.totalQuestionsAnswered !== undefined) {
        behaviorAttributes['total_questions_answered'] = String(userData.totalQuestionsAnswered);
      }
      
      if (userData.lastActiveDate) {
        behaviorAttributes['last_active_date'] = userData.lastActiveDate;
      }

      if (Object.keys(behaviorAttributes).length > 0) {
        await this.setCustomAttributes(behaviorAttributes);
        console.log('[PurchaseService] ✅ User behavior data synced');
      }
    } catch (error) {
      console.error('[PurchaseService] ❌ Error syncing user behavior data:', error);
    }
  }

  /**
   * Fetch entitlements and return SubscriptionState
   * @returns SubscriptionState object
   */
  async fetchAndUpdateEntitlements(): Promise<SubscriptionState> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      
      if (activeEntitlements.includes(ENTITLEMENT_ID)) {
        const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
        return {
          status: 'active',
          productId: entitlement.productIdentifier,
          renewalType: entitlement.willRenew ? 'auto-renewing' : 'non-renewing',
          expiresAt: entitlement.expirationDate || null,
          source: 'revenuecat',
          error: null,
        };
      }
      
      return {
        status: 'none',
        productId: null,
        renewalType: null,
        expiresAt: null,
        source: 'revenuecat',
        error: null,
      };
    } catch (error: any) {
      console.error('[PurchaseService] ❌ Error fetching entitlements:', error);
      return {
        status: 'unknown',
        productId: null,
        renewalType: null,
        expiresAt: null,
        source: 'revenuecat',
        error: error?.message || 'Failed to fetch entitlements',
      };
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    if (!this.isConfigured) {
      try {
        await this.configureWithUser();
      } catch (error) {
        console.error('[PurchaseService] Failed to configure before fetching offerings:', error);
        return null;
      }
    }
    try {
      const offerings = await Purchases.getOfferings();
      const offering = offerings.current ?? offerings.all?.['default'] ?? null;

      if (offering) {
        console.log(
          `[PurchaseService] ✅ Loaded offering "${offering.identifier}" with ${offering.availablePackages?.length ?? 0} package(s)`
        );

        if (Platform.OS === 'android' && (offering.availablePackages?.length ?? 0) === 0) {
          console.warn(
            '[PurchaseService] Android offering has 0 packages. This usually means Play Store products are not active/linked in RevenueCat or the app is not installed from Google Play (Internal Testing/Internal App Sharing).'
          );
        }
      }
      return offering;
    } catch (e) {
      console.error('[PurchaseService] Error fetching offerings:', e);
    }
    return null;
  }

  /**
   * Purchase a package and return subscription state
   * @param pack - RevenueCat package to purchase
   * @returns true if purchase successful, false otherwise
   */
  async purchasePackage(pack: PurchasesPackage): Promise<boolean> {
    if (!this.isConfigured) await this.configureWithUser();
    try {
      console.log('[PurchaseService] 💳 Purchasing package:', pack.identifier);
      const { customerInfo } = await Purchases.purchasePackage(pack);
      const isPro = this.isProMember(customerInfo);
      console.log('[PurchaseService] ✅ Purchase complete. Pro status:', isPro);
      return isPro;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('[PurchaseService] ❌ Error purchasing package:', e);
      } else {
        console.log('[PurchaseService] ℹ️ Purchase cancelled by user');
      }
      return false;
    }
  }

  /**
   * Restore purchases and return subscription state
   * @returns true if active subscription found, false otherwise
   */
  async restorePurchases(): Promise<boolean> {
    if (!this.isConfigured) await this.configureWithUser();
    try {
      console.log('[PurchaseService] 🔄 Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      const isPro = this.isProMember(customerInfo);
      console.log('[PurchaseService] ✅ Restore complete. Pro status:', isPro);
      return isPro;
    } catch (e) {
      console.error('[PurchaseService] ❌ Error restoring purchases:', e);
      return false;
    }
  }

  /**
   * Check if user has active pro subscription
   * @returns true if pro member, false otherwise
   */
  async checkProStatus(): Promise<boolean> {
    if (!this.isConfigured) await this.configureWithUser();
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.isProMember(customerInfo);
    } catch (e) {
      console.error('[PurchaseService] Error checking pro status:', e);
      return false;
    }
  }

  private isProMember(customerInfo: CustomerInfo): boolean {
    if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
      return true;
    }
    return false;
  }

  /**
   * Get current customer info from RevenueCat
   * @returns CustomerInfo or null if error
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (e) {
      console.error('[PurchaseService] Error getting customer info:', e);
      return null;
    }
  }
}

export const purchaseService = PurchaseService.getInstance();
