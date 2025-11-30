import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseFirestore } from '../config/firebase';

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

const storageKey = (bookId: string, userId: string) =>
  `${STORAGE_PREFIX}::${bookId}::${userId || DEFAULT_USER}`;

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

async function fetchRemoteProgress(bookId: string, userId: string): Promise<BookProgressState | null> {
  if (!userId || userId === DEFAULT_USER) return null;
  try {
    const docRef = firebaseFirestore
      .collection('users')
      .doc(userId)
      .collection('books')
      .doc(bookId);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    const data = snap.data() as BookProgressState;
    return data || null;
  } catch (error) {
    console.warn('readingProgressService: failed to fetch remote progress', error);
    return null;
  }
}

async function pushRemoteProgress(progress: BookProgressState): Promise<void> {
  if (!progress.userId || progress.userId === DEFAULT_USER) return;
  try {
    const docRef = firebaseFirestore
      .collection('users')
      .doc(progress.userId)
      .collection('books')
      .doc(progress.bookId);
    await docRef.set(progress, { merge: true });
  } catch (error) {
    console.warn('readingProgressService: failed to push remote progress', error);
  }
}

function mergeProgress(a: BookProgressState | null, b: BookProgressState | null): BookProgressState | null {
  if (!a) return b;
  if (!b) return a;
  return a.updatedAt >= b.updatedAt ? a : b;
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

  const local = await loadLocalProgress(options.bookId, userId);
  const remote = syncMode === 'local+remote' ? await fetchRemoteProgress(options.bookId, userId) : null;
  const merged = mergeProgress(local, remote) || ensureDefaults(options.bookId, userId, totalSections);

  if (remote && (!local || remote.updatedAt > (local?.updatedAt || 0))) {
    await saveLocalProgress(merged);
  }

  return merged;
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
    markDone = false,
    totalSections,
  } = options;
  const userId = options.userId || DEFAULT_USER;
  const syncMode = options.syncMode || 'local-only';

  const current = await loadProgress({ bookId, userId, totalSections, syncMode });
  const existing = current.sections[sectionId];
  const now = Date.now();
  const nextStatus: SectionStatus = markDone ? 'done' : existing?.status || 'in_progress';
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
  if (syncMode === 'local+remote') {
    await pushRemoteProgress(current);
  }

  return current;
}

export async function clearProgress(bookId: string, userId?: string): Promise<void> {
  await clearLocalProgress(bookId, userId || DEFAULT_USER);
  if (userId && userId !== DEFAULT_USER) {
    try {
      await firebaseFirestore.collection('users').doc(userId).collection('books').doc(bookId).delete();
    } catch (error) {
      console.warn('readingProgressService: failed to clear remote progress', error);
    }
  }
}
