import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

import { firebaseAuth, firebaseFirestore } from '../config/firebase';
import type { UserProfileDocV1 } from '../types/progressSync';

type EnsureProfileParams = {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

type UpdateProfileParams = {
  displayName: string | null;
  username?: string | null;
};

const USER_PROFILE_LAST_SEEN_PREFIX = 'user_profile_last_seen_v1';
const LAST_SEEN_THROTTLE_MS = 24 * 60 * 60 * 1000;

function lastSeenKey(uid: string) {
  return `${USER_PROFILE_LAST_SEEN_PREFIX}::${uid}`;
}

function nowMs() {
  return Date.now();
}

function platformName(): 'ios' | 'android' | undefined {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return undefined;
}

class UserProfileService {
  async ensureUserProfileDoc(params: EnsureProfileParams, options?: { force?: boolean }): Promise<void> {
    if (!params.uid) return;
    if (params.isAnonymous) return;
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser || currentUser.isAnonymous || currentUser.uid !== params.uid) return;

    const key = lastSeenKey(params.uid);
    const lastSeenRaw = await AsyncStorage.getItem(key);
    const lastSeenAt = lastSeenRaw ? Number(lastSeenRaw) : 0;
    const now = nowMs();
    const shouldWrite = options?.force === true || !lastSeenAt || now - lastSeenAt > LAST_SEEN_THROTTLE_MS;
    if (!shouldWrite) return;

    const docRef = firebaseFirestore.collection('users').doc(params.uid);

    try {
      const snap = await docRef.get();

      const payload: UserProfileDocV1 = {
        schemaVersion: 1,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        lastSeenAt: firestore.FieldValue.serverTimestamp(),
        clientUpdatedAt: now,
        email: params.email,
        profile: {
          displayName: params.displayName,
          photoURL: params.photoURL,
        },
        app: {
          version: DeviceInfo.getVersion(),
          buildNumber: DeviceInfo.getBuildNumber(),
        },
        device: (() => {
          const platform = platformName();
          return platform ? { platform } : undefined;
        })(),
      };

      if (!snap.exists()) {
        await docRef.set(
          {
            ...payload,
            createdAt: firestore.FieldValue.serverTimestamp(),
          } satisfies UserProfileDocV1,
          { merge: true }
        );
      } else {
        await docRef.set(payload, { merge: true });
      }

      await AsyncStorage.setItem(key, String(now));
    } catch (error) {
      console.warn('UserProfileService: failed to ensure user profile doc', error);
    }
  }

  async updateCurrentUserProfile(params: UpdateProfileParams): Promise<{ displayName: string | null; username?: string | null }> {
    const user = firebaseAuth.currentUser;
    if (!user || user.isAnonymous) {
      throw new Error('Profile updates require an authenticated user.');
    }

    const displayName = params.displayName && params.displayName.trim() ? params.displayName.trim() : null;

    await user.updateProfile({ displayName });
    await user.reload();

    const uid = user.uid;
    const now = nowMs();
    const docRef = firebaseFirestore.collection('users').doc(uid);

    const profile: NonNullable<UserProfileDocV1['profile']> = {
      displayName,
      photoURL: user.photoURL ?? null,
    };

    if (params.username !== undefined) {
      profile.username = params.username;
    }

    const patch: Partial<UserProfileDocV1> = {
      schemaVersion: 1,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      clientUpdatedAt: now,
      email: user.email ?? null,
      profile,
    };

    await docRef.set(patch, { merge: true });
    await AsyncStorage.setItem(lastSeenKey(uid), String(now));

    return { displayName, username: params.username };
  }
}

export const userProfileService = new UserProfileService();
