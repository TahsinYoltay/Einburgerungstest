import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuth, firebaseFirestore } from '../config/firebase';

export type SectionStatus = 'in_progress' | 'done';

export interface SectionProgress {
  status: SectionStatus;
  lastReadAt: string; // ISO string
  timeSpentSec: number;
  scrollProgress: number; // 0-1
  updatedAt: number; // epoch ms
}

export interface BookProgressState {
  bookId: string;
  userId: string;
  sections: Record<string, SectionProgress>;
  aggregates: {
    completedCount: number;
    totalCount?: number;
    lastSectionId?: string;
  };
  updatedAt: number; // epoch ms
}

type SyncMode = 'local-only' | 'local+remote';

const STORAGE_PREFIX = 'reading_progress_v2';
const DEFAULT_USER = 'local';
const REMOTE_FETCH_TTL_MS = 60_000;
const REMOTE_PUSH_DEBOUNCE_MS = 8_000;

const storageKey = (bookId: string, userId: string) =>
  `${STORAGE_PREFIX}::${bookId}::${userId || DEFAULT_USER}`;

const inMemoryCache = new Map<string, BookProgressState>();
const lastRemoteFetchAt = new Map<string, number>();
const pendingRemotePush = new Map<string, BookProgressState>();
const remotePushTimers = new Map<string, ReturnType<typeof setTimeout>>();

type RemoteFetchResult =
  | { status: 'success'; progress: BookProgressState | null }
  | { status: 'error' };

function isRemoteSyncEligible(userId: string): boolean {
  if (!userId || userId === DEFAULT_USER) return false;
  const currentUser = firebaseAuth.currentUser;
  return !!currentUser && !currentUser.isAnonymous && currentUser.uid === userId;
}

async function loadLocalProgress(bookId: string, userId: string): Promise<BookProgressState | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(bookId, userId));
    return raw ? (JSON.parse(raw) as BookProgressState) : null;
  } catch (error) {
    console.warn('readingProgressService: failed to load local progress', error);
    return null;
  }
}

async function saveLocalProgress(progress: BookProgressState): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(progress.bookId, progress.userId), JSON.stringify(progress));
  } catch (error) {
    console.warn('readingProgressService: failed to save local progress', error);
  }
}

async function clearLocalProgress(bookId: string, userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(bookId, userId));
  } catch (error) {
    console.warn('readingProgressService: failed to clear local progress', error);
  }
}

function clearInMemoryProgress(bookId: string, userId: string) {
  const key = storageKey(bookId, userId);

  inMemoryCache.delete(key);
  lastRemoteFetchAt.delete(key);

  pendingRemotePush.delete(key);
  const existing = remotePushTimers.get(key);
  if (existing) clearTimeout(existing);
  remotePushTimers.delete(key);
}

async function fetchRemoteProgress(bookId: string, userId: string): Promise<RemoteFetchResult> {
  if (!userId || userId === DEFAULT_USER) return { status: 'success', progress: null };
  if (!isRemoteSyncEligible(userId)) {
    return { status: 'error' };
  }
  try {
    const docRef = firebaseFirestore
      .collection('users')
      .doc(userId)
      .collection('books')
      .doc(bookId);
    const snap = await docRef.get();
    if (!snap.exists()) return { status: 'success', progress: null };
    const data = snap.data() as BookProgressState;
    return { status: 'success', progress: data || null };
  } catch (error) {
    console.warn('readingProgressService: failed to fetch remote progress', error);
    return { status: 'error' };
  }
}

async function pushRemoteProgress(progress: BookProgressState): Promise<boolean> {
  if (!progress.userId || progress.userId === DEFAULT_USER) return false;
  if (!isRemoteSyncEligible(progress.userId)) {
    return false;
  }
  try {
    const docRef = firebaseFirestore
      .collection('users')
      .doc(progress.userId)
      .collection('books')
      .doc(progress.bookId);
    await docRef.set(progress, { merge: true });
    return true;
  } catch (error) {
    console.warn('readingProgressService: failed to push remote progress', error);
    return false;
  }
}

function mergeProgress(a: BookProgressState | null, b: BookProgressState | null): BookProgressState | null {
  if (!a) return b;
  if (!b) return a;

  const sections: Record<string, SectionProgress> = {};
  const allKeys = new Set([...Object.keys(a.sections || {}), ...Object.keys(b.sections || {})]);
  allKeys.forEach(sectionId => {
    const left = a.sections?.[sectionId];
    const right = b.sections?.[sectionId];
    if (!left) {
      if (right) sections[sectionId] = right;
      return;
    }
    if (!right) {
      if (left) sections[sectionId] = left;
      return;
    }
    sections[sectionId] = left.updatedAt >= right.updatedAt ? left : right;
  });

  const completedCount = Object.values(sections).filter(s => s.status === 'done').length;
  const totalCount = a.aggregates?.totalCount ?? b.aggregates?.totalCount;
  const lastSectionId =
    Object.entries(sections).sort(([, sa], [, sb]) => (sb.updatedAt || 0) - (sa.updatedAt || 0))[0]?.[0] ??
    a.aggregates?.lastSectionId ??
    b.aggregates?.lastSectionId;

  const updatedAt = Math.max(
    a.updatedAt || 0,
    b.updatedAt || 0,
    ...Object.values(sections).map(s => s.updatedAt || 0)
  );

  return {
    bookId: a.bookId,
    userId: a.userId,
    sections,
    aggregates: { completedCount, totalCount, lastSectionId },
    updatedAt,
  };
}

function ensureDefaults(bookId: string, userId: string, totalCount?: number): BookProgressState {
  return {
    bookId,
    userId: userId || DEFAULT_USER,
    sections: {},
    aggregates: { completedCount: 0, totalCount },
    updatedAt: Date.now(),
  };
}

export async function loadProgress(options: {
  bookId: string;
  userId?: string;
  totalSections?: number;
  syncMode?: SyncMode;
}): Promise<BookProgressState> {
  const userId = options.userId || DEFAULT_USER;
  const totalSections = options.totalSections;
  const syncMode = options.syncMode || 'local-only';
  const cacheKey = storageKey(options.bookId, userId);
  const cached = inMemoryCache.get(cacheKey);

  const local = cached ?? (await loadLocalProgress(options.bookId, userId));
  const shouldFetchRemote =
    syncMode === 'local+remote' &&
    userId !== DEFAULT_USER &&
    (lastRemoteFetchAt.get(cacheKey) == null || Date.now() - (lastRemoteFetchAt.get(cacheKey) || 0) > REMOTE_FETCH_TTL_MS);

  const remoteResult: RemoteFetchResult = shouldFetchRemote
    ? await fetchRemoteProgress(options.bookId, userId)
    : { status: 'success', progress: null };
  const remote = remoteResult.status === 'success' ? remoteResult.progress : null;
  if (shouldFetchRemote && remoteResult.status === 'success') lastRemoteFetchAt.set(cacheKey, Date.now());

  const merged = mergeProgress(local, remote) || ensureDefaults(options.bookId, userId, totalSections);

  inMemoryCache.set(cacheKey, merged);

  const shouldBootstrapRemote =
    syncMode === 'local+remote' &&
    userId !== DEFAULT_USER &&
    shouldFetchRemote &&
    remoteResult.status === 'success' &&
    !!local &&
    Object.keys(local.sections || {}).length > 0 &&
    (!remote || (local.updatedAt || 0) > (remote.updatedAt || 0));

  if (shouldBootstrapRemote) {
    scheduleRemotePush(merged);
  }

  if (remote) {
    const shouldPersistMerged = !local
      ? true
      : merged.updatedAt !== local.updatedAt ||
        Object.keys(merged.sections || {}).length !== Object.keys(local.sections || {}).length;
    if (shouldPersistMerged) {
      await saveLocalProgress(merged);
    }
  }

  return merged;
}

function scheduleRemotePush(progress: BookProgressState) {
  const cacheKey = storageKey(progress.bookId, progress.userId);
  pendingRemotePush.set(cacheKey, progress);
  if (!isRemoteSyncEligible(progress.userId)) return;

  const existing = remotePushTimers.get(cacheKey);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    remotePushTimers.delete(cacheKey);
    const latest = pendingRemotePush.get(cacheKey);
    if (!latest) return;
    if (!isRemoteSyncEligible(latest.userId)) return;
    const ok = await pushRemoteProgress(latest);
    if (ok) {
      pendingRemotePush.delete(cacheKey);
      return;
    }
    scheduleRemotePush(latest);
  }, REMOTE_PUSH_DEBOUNCE_MS);

  remotePushTimers.set(cacheKey, timer);
}

export async function flushPendingRemotePushes(): Promise<void> {
  Array.from(remotePushTimers.values()).forEach(timer => clearTimeout(timer));
  remotePushTimers.clear();

  const entries = Array.from(pendingRemotePush.entries());
  await Promise.all(
    entries.map(async ([cacheKey, progress]) => {
      if (!isRemoteSyncEligible(progress.userId)) return;
      const ok = await pushRemoteProgress(progress);
      if (ok) {
        pendingRemotePush.delete(cacheKey);
        return;
      }
      scheduleRemotePush(progress);
    })
  );
}

export async function updateSectionProgress(options: {
  bookId: string;
  userId?: string;
  sectionId: string;
  timeSpentSec?: number;
  scrollProgress?: number;
  markDone?: boolean;
  totalSections?: number;
  syncMode?: SyncMode;
}): Promise<BookProgressState> {
  const {
    bookId,
    sectionId,
    timeSpentSec = 0,
    scrollProgress = 0,
    markDone,
    totalSections,
  } = options;
  const userId = options.userId || DEFAULT_USER;
  const syncMode = options.syncMode || 'local-only';

  const current = await loadProgress({ bookId, userId, totalSections, syncMode });
  const existing = current.sections[sectionId];
  const now = Date.now();
  
  let nextStatus: SectionStatus = existing?.status || 'in_progress';
  if (markDone === true) nextStatus = 'done';
  if (markDone === false) nextStatus = 'in_progress';

  const nextScroll = markDone ? 1 : Math.max(existing?.scrollProgress || 0, scrollProgress);
  const nextTime = (existing?.timeSpentSec || 0) + Math.max(0, timeSpentSec);

  current.sections[sectionId] = {
    status: nextStatus,
    lastReadAt: new Date().toISOString(),
    timeSpentSec: nextTime,
    scrollProgress: nextScroll,
    updatedAt: now,
  };

  const completedCount = Object.values(current.sections).filter(s => s.status === 'done').length;
  current.aggregates = {
    completedCount,
    totalCount: totalSections ?? current.aggregates.totalCount,
    lastSectionId: sectionId,
  };
  current.updatedAt = now;

  await saveLocalProgress(current);
  inMemoryCache.set(storageKey(bookId, userId), current);
  if (syncMode === 'local+remote') {
    scheduleRemotePush(current);
  }

  return current;
}

export async function clearLocalOnlyProgress(bookId: string, userId?: string): Promise<void> {
  const resolvedUserId = userId || DEFAULT_USER;
  clearInMemoryProgress(bookId, resolvedUserId);
  await clearLocalProgress(bookId, resolvedUserId);
}

export async function clearProgress(bookId: string, userId?: string): Promise<void> {
  const resolvedUserId = userId || DEFAULT_USER;
  clearInMemoryProgress(bookId, resolvedUserId);
  await clearLocalProgress(bookId, resolvedUserId);
  if (resolvedUserId !== DEFAULT_USER) {
    try {
      await firebaseFirestore.collection('users').doc(resolvedUserId).collection('books').doc(bookId).delete();
    } catch (error) {
      console.warn('readingProgressService: failed to clear remote progress', error);
    }
  }
}
