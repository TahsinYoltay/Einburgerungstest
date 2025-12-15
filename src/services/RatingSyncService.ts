import firestore from '@react-native-firebase/firestore';

import { firebaseAuth, firebaseFirestore } from '../config/firebase';
import type { RatingProgressDocV1 } from '../types/progressSync';
import type { PromptOutcome, RatingState, RatingStatus } from '../store/slices/ratingSlice';

export type RatingStatePayloadV1 = Omit<RatingState, 'ownerUid'>;

const REMOTE_PUSH_DEBOUNCE_MS = 3_000;

const RATING_STATUSES: readonly RatingStatus[] = [
  'not_eligible',
  'eligible_not_asked',
  'asked_ignored',
  'asked_remind_later',
  'completed_flow',
  'negative_feedback_given',
  'opted_out',
];

const PROMPT_OUTCOMES: readonly Exclude<PromptOutcome, null>[] = [
  'ignored',
  'remind_later',
  'positive_flow',
  'negative_feedback',
  'opted_out',
];

function nowMs() {
  return Date.now();
}

function isRatingStatus(value: unknown): value is RatingStatus {
  return typeof value === 'string' && (RATING_STATUSES as readonly string[]).includes(value);
}

function isPromptOutcome(value: unknown): value is PromptOutcome {
  if (value === null) return true;
  return typeof value === 'string' && (PROMPT_OUTCOMES as readonly string[]).includes(value);
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function toNonNegativeInt(value: unknown): number {
  const parsed = toFiniteNumber(value);
  if (parsed == null) return 0;
  return Math.max(0, Math.floor(parsed));
}

function toEpochMillisOrNull(value: unknown): number | null {
  if (value === null) return null;
  const parsed = toFiniteNumber(value);
  if (parsed == null) return null;
  return Math.max(0, Math.floor(parsed));
}

function normalizePayload(input: unknown): RatingStatePayloadV1 {
  const raw = (input && typeof input === 'object') ? (input as Record<string, unknown>) : {};

  const installDate = toFiniteNumber(raw.installDate);

  return {
    status: isRatingStatus(raw.status) ? raw.status : 'not_eligible',
    installDate: installDate != null ? Math.max(0, Math.floor(installDate)) : nowMs(),
    firstEligibilityDate: toEpochMillisOrNull(raw.firstEligibilityDate),
    lastPromptDate: toEpochMillisOrNull(raw.lastPromptDate),
    totalPromptCount: toNonNegativeInt(raw.totalPromptCount),
    lastOutcome: isPromptOutcome(raw.lastOutcome) ? (raw.lastOutcome as PromptOutcome) : null,
    examsCompletedSinceLastPrompt: toNonNegativeInt(raw.examsCompletedSinceLastPrompt),
    chaptersCompletedSinceLastPrompt: toNonNegativeInt(raw.chaptersCompletedSinceLastPrompt),
    totalExamsCompleted: toNonNegativeInt(raw.totalExamsCompleted),
    totalChaptersCompleted: toNonNegativeInt(raw.totalChaptersCompleted),
  };
}

function maxNullable(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

function minNullable(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.min(a, b);
}

function isMeaningful(payload: RatingStatePayloadV1): boolean {
  if (payload.status !== 'not_eligible') return true;
  if (payload.lastOutcome !== null) return true;
  if (payload.lastPromptDate != null) return true;
  if (payload.totalPromptCount > 0) return true;
  if (payload.totalExamsCompleted > 0) return true;
  if (payload.totalChaptersCompleted > 0) return true;
  return false;
}

function applyTerminalStatus(local: RatingStatePayloadV1, remote: RatingStatePayloadV1): Pick<RatingStatePayloadV1, 'status' | 'lastOutcome'> | null {
  if (local.status === 'completed_flow' || remote.status === 'completed_flow') {
    return { status: 'completed_flow', lastOutcome: 'positive_flow' };
  }
  if (local.status === 'opted_out' || remote.status === 'opted_out') {
    return { status: 'opted_out', lastOutcome: 'opted_out' };
  }
  return null;
}

function mergePayloads(params: {
  local: RatingStatePayloadV1 | null;
  remote: RatingStatePayloadV1 | null;
}): RatingStatePayloadV1 {
  if (!params.local && !params.remote) return normalizePayload({});
  if (!params.local) return normalizePayload(params.remote);
  if (!params.remote) return normalizePayload(params.local);

  const local = normalizePayload(params.local);
  const remote = normalizePayload(params.remote);

  const localPromptAt = local.lastPromptDate ?? 0;
  const remotePromptAt = remote.lastPromptDate ?? 0;
  const base = remotePromptAt > localPromptAt ? remote : local;

  const merged: RatingStatePayloadV1 = {
    ...base,
    installDate: Math.min(local.installDate, remote.installDate),
    firstEligibilityDate: minNullable(local.firstEligibilityDate, remote.firstEligibilityDate),
    lastPromptDate: maxNullable(local.lastPromptDate, remote.lastPromptDate),
    totalPromptCount: Math.max(local.totalPromptCount, remote.totalPromptCount),
    totalExamsCompleted: Math.max(local.totalExamsCompleted, remote.totalExamsCompleted),
    totalChaptersCompleted: Math.max(local.totalChaptersCompleted, remote.totalChaptersCompleted),
  };

  const terminal = applyTerminalStatus(local, remote);
  if (terminal) {
    merged.status = terminal.status;
    merged.lastOutcome = terminal.lastOutcome;
  }

  merged.examsCompletedSinceLastPrompt = Math.min(merged.examsCompletedSinceLastPrompt, merged.totalExamsCompleted);
  merged.chaptersCompletedSinceLastPrompt = Math.min(merged.chaptersCompletedSinceLastPrompt, merged.totalChaptersCompleted);

  return merged;
}

function isRemoteSyncEligible(uid: string): boolean {
  if (!uid) return false;
  const user = firebaseAuth.currentUser;
  return !!user && !user.isAnonymous && user.uid === uid;
}

function docRef(uid: string) {
  return firebaseFirestore.collection('users').doc(uid).collection('progress').doc('rating');
}

class RatingSyncService {
  private pendingByUid = new Map<string, RatingStatePayloadV1>();
  private pushTimers = new Map<string, ReturnType<typeof setTimeout>>();

  mergeRatingState(params: { local: RatingStatePayloadV1 | null; remote: RatingStatePayloadV1 | null }) {
    return mergePayloads(params);
  }

  normalizeRatingState(input: unknown): RatingStatePayloadV1 {
    return normalizePayload(input);
  }

  isMeaningfulState(payload: RatingStatePayloadV1): boolean {
    return isMeaningful(payload);
  }

  async pullRemoteRatingState(uid: string): Promise<RatingStatePayloadV1 | null> {
    if (!isRemoteSyncEligible(uid)) return null;

    try {
      const snap = await docRef(uid).get();
      if (!snap.exists) return null;

      const data = snap.data() as Partial<RatingProgressDocV1> | undefined;
      if (!data || data.schemaVersion !== 1) return null;

      return normalizePayload(data.state);
    } catch (error) {
      console.warn('RatingSyncService: failed to pull remote rating state', error);
      return null;
    }
  }

  async pushRemoteRatingState(uid: string, payload: RatingStatePayloadV1): Promise<boolean> {
    if (!isRemoteSyncEligible(uid)) return false;

    const now = nowMs();
    const doc: RatingProgressDocV1 = {
      schemaVersion: 1,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      clientUpdatedAt: now,
      state: normalizePayload(payload),
    };

    try {
      await docRef(uid).set(doc, { merge: true });
      return true;
    } catch (error) {
      console.warn('RatingSyncService: failed to push remote rating state', error);
      return false;
    }
  }

  scheduleRemoteRatingStatePush(uid: string, payload: RatingStatePayloadV1) {
    if (!uid) return;
    const normalized = normalizePayload(payload);
    this.pendingByUid.set(uid, normalized);

    if (!isRemoteSyncEligible(uid)) return;

    const existing = this.pushTimers.get(uid);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      void this.flushRemoteRatingState(uid);
    }, REMOTE_PUSH_DEBOUNCE_MS);

    this.pushTimers.set(uid, timer);
  }

  async flushRemoteRatingState(uid: string): Promise<void> {
    const pending = this.pendingByUid.get(uid);
    if (!pending) return;
    if (!isRemoteSyncEligible(uid)) return;

    const existing = this.pushTimers.get(uid);
    if (existing) clearTimeout(existing);
    this.pushTimers.delete(uid);

    const ok = await this.pushRemoteRatingState(uid, pending);
    if (ok) {
      this.pendingByUid.delete(uid);
    }
  }
}

export const ratingSyncService = new RatingSyncService();

