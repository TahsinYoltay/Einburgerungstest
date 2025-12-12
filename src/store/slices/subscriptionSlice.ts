import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

/**
 * Subscription State Structure
 * Following design spec Section 2.3
 */

export type SubscriptionStatus = 'none' | 'active' | 'expired' | 'billingIssue' | 'unknown' | 'loading';
export type RenewalType = 'auto-renewing' | 'non-renewing' | null;

export interface SubscriptionState {
  status: SubscriptionStatus;
  productId: string | null;
  renewalType: RenewalType;
  expiresAt: string | null; // ISO date string
  source: 'revenuecat';
  error: string | null;
}

const initialState: SubscriptionState = {
  status: 'loading',
  productId: null,
  renewalType: null,
  expiresAt: null,
  source: 'revenuecat',
  error: null,
};

export const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionLoading: (state, action: PayloadAction<boolean>) => {
      state.status = action.payload ? 'loading' : state.status;
      if (action.payload) {
        state.error = null;
      }
    },

    setSubscriptionActive: (
      state,
      action: PayloadAction<{
        productId: string;
        renewalType: 'auto-renewing' | 'non-renewing';
        expiresAt: string | null;
      }>
    ) => {
      state.status = 'active';
      state.productId = action.payload.productId;
      state.renewalType = action.payload.renewalType;
      state.expiresAt = action.payload.expiresAt;
      state.error = null;
    },

    setSubscriptionExpired: (state) => {
      state.status = 'expired';
      state.renewalType = null;
      state.error = null;
    },

    setSubscriptionNone: (state) => {
      state.status = 'none';
      state.productId = null;
      state.renewalType = null;
      state.expiresAt = null;
      state.error = null;
    },

    setSubscriptionBillingIssue: (state) => {
      state.status = 'billingIssue';
      state.error = 'There is an issue with your subscription billing';
    },

    setSubscriptionUnknown: (state) => {
      state.status = 'unknown';
    },

    setSubscriptionError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.status = 'unknown';
      }
    },

    clearSubscription: (state) => {
      state.status = 'none';
      state.productId = null;
      state.renewalType = null;
      state.expiresAt = null;
      state.error = null;
    },
  },
});

// Actions
export const {
  setSubscriptionLoading,
  setSubscriptionActive,
  setSubscriptionExpired,
  setSubscriptionNone,
  setSubscriptionBillingIssue,
  setSubscriptionUnknown,
  setSubscriptionError,
  clearSubscription,
} = subscriptionSlice.actions;

// Selectors
export const selectSubscriptionState = (state: RootState) => state.subscription;
export const selectSubscriptionStatus = (state: RootState) => state.subscription.status;
export const selectHasActiveSubscription = (state: RootState) => state.subscription.status === 'active';
export const selectProductId = (state: RootState) => state.subscription.productId;
export const selectRenewalType = (state: RootState) => state.subscription.renewalType;
export const selectExpiresAt = (state: RootState) => state.subscription.expiresAt;
export const selectSubscriptionError = (state: RootState) => state.subscription.error;

export default subscriptionSlice.reducer;
