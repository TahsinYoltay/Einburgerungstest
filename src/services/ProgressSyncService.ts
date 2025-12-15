import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

import { firebaseAuth, firebaseFirestore } from '../config/firebase';
import type { NormalizedQuestion, ExamAttempt } from '../types/exam';
import type {
  ExamAttemptDocV1,
  ExamInProgressDocV1,
  ExamProgressSummaryDocV1,
  FirestoreBoolMap,
} from '../types/progressSync';
import type { PersistedExamInProgressV1, PersistedExamProgressV1 } from '../types/localProgress';

type Identity = {
  uid: string;
  isAnonymous: boolean;
};

type AnswerMap = Record<string, string[]>;

type ExamQuestionStats = PersistedExamProgressV1['questionStats'];

type ExamInProgressState = Record<
  string,
  {
    examId: string;
    attemptId: string | null;
    questions: NormalizedQuestion[];
    currentQuestionIndex: number;
    answers: AnswerMap;
    flaggedQuestions: string[];
    startTime: string | null;
    timeRemaining: number;
    timeSpentInSeconds: number;
    examCompleted: boolean;
    examStarted: boolean;
    lastSaved: string | null;
  }
>;

type CurrentExamState = {
  examId: string | null;
  attemptId: string | null;
  questions: NormalizedQuestion[];
  currentQuestionIndex: number;
  answers: AnswerMap;
  flaggedQuestions: string[];
  startTime: string | null;
  timeRemaining: number;
  timeSpentInSeconds: number;
  examCompleted: boolean;
  examStarted: boolean;
  lastSaved: string | null;
};

export type ExamHydrationPayload = {
  examHistory: ExamAttempt[];
  favoriteQuestions: string[];
  questionStats: ExamQuestionStats;
  inProgress: ExamInProgressState;
  currentExam: CurrentExamState;
};

const EXAM_PROGRESS_STORAGE_PREFIX = 'exam_progress_v1';
const EXAM_OUTBOX_STORAGE_PREFIX = 'progress_sync_outbox_v1';

function examProgressStorageKey(uid: string) {
  return `${EXAM_PROGRESS_STORAGE_PREFIX}::${uid}`;
}

function examOutboxStorageKey(uid: string) {
  return `${EXAM_OUTBOX_STORAGE_PREFIX}::${uid}`;
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function toBoolMap(ids: string[]): FirestoreBoolMap {
  return ids.reduce<FirestoreBoolMap>((acc, id) => {
    acc[id] = true;
    return acc;
  }, {});
}

function fromBoolMap(map: FirestoreBoolMap | undefined): string[] {
  if (!map) return [];
  return Object.entries(map)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
}

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

function createQuestionIndex(chaptersData: unknown): Record<string, NormalizedQuestion> {
  const chaptersDataAny = chaptersData as any;
  const data = chaptersDataAny?.data as Record<string, { questions: NormalizedQuestion[] }> | undefined;
  if (!data) return {};

  const index: Record<string, NormalizedQuestion> = {};
  Object.values(data).forEach(chapter => {
    chapter.questions.forEach(question => {
      index[question.id] = question;
    });
  });
  return index;
}

function materializeQuestions(questionIds: string[], chaptersData: unknown): NormalizedQuestion[] {
  const index = createQuestionIndex(chaptersData);
  const questions: NormalizedQuestion[] = [];
  questionIds.forEach(id => {
    const question = index[id];
    if (question) questions.push(question);
  });
  return questions;
}

function nowMs() {
  return Date.now();
}

export class ProgressSyncService {
  private identity: Identity | null = null;
  private summaryClientUpdatedAtByUid = new Map<string, number>();

  private summaryDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSummaryPatch: Record<string, unknown> = {};
  private pendingSummaryClientUpdatedAt: number | null = null;
  private summaryDebounceMs = 2500;

  private inProgressThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingInProgressDocByExamId: Record<string, ExamInProgressDocV1> = {};
  private inProgressThrottleMs = 60_000;
  private lastInProgressFlushAt: number | null = null;

  setIdentity(identity: Identity | null) {
    const previousUid = this.identity?.uid ?? null;
    const nextUid = identity?.uid ?? null;
    if (previousUid !== nextUid) {
      if (this.summaryDebounceTimer) clearTimeout(this.summaryDebounceTimer);
      if (this.inProgressThrottleTimer) clearTimeout(this.inProgressThrottleTimer);
      this.summaryDebounceTimer = null;
      this.inProgressThrottleTimer = null;
      this.pendingSummaryPatch = {};
      this.pendingSummaryClientUpdatedAt = null;
      this.pendingInProgressDocByExamId = {};
      this.lastInProgressFlushAt = null;
    }

    this.identity = identity;
  }

  getIdentity() {
    return this.identity;
  }

  isCloudSyncEnabled() {
    return !!this.identity && !this.identity.isAnonymous;
  }

  async loadLocalExamProgress(uid: string): Promise<PersistedExamProgressV1 | null> {
    const raw = await AsyncStorage.getItem(examProgressStorageKey(uid));
    const parsed = safeParseJson<PersistedExamProgressV1>(raw);
    if (!parsed) return null;
    if (parsed.schemaVersion !== 1) return null;
    this.summaryClientUpdatedAtByUid.set(uid, parsed.summaryClientUpdatedAt);
    return parsed;
  }

  async saveLocalExamProgress(uid: string, snapshot: PersistedExamProgressV1): Promise<void> {
    try {
      this.summaryClientUpdatedAtByUid.set(uid, snapshot.summaryClientUpdatedAt);
      await AsyncStorage.setItem(examProgressStorageKey(uid), JSON.stringify(snapshot));
    } catch (error) {
      console.warn('ProgressSyncService: failed to save local exam progress', error);
    }
  }

  private async readOutbox(uid: string): Promise<any[]> {
    const raw = await AsyncStorage.getItem(examOutboxStorageKey(uid));
    const parsed = safeParseJson<any[]>(raw);
    return Array.isArray(parsed) ? parsed : [];
  }

  private async writeOutbox(uid: string, items: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(examOutboxStorageKey(uid), JSON.stringify(items));
    } catch (error) {
      console.warn('ProgressSyncService: failed to write outbox', error);
    }
  }

  private async enqueueOutboxItem(uid: string, item: any): Promise<void> {
    const existing = await this.readOutbox(uid);
    await this.writeOutbox(uid, [...existing, item]);
  }

  private async flushOutbox(uid: string): Promise<void> {
    if (!this.isCloudSyncEnabled()) return;

    const items = await this.readOutbox(uid);
    if (!items.length) return;

    const remaining: any[] = [];

    for (const item of items) {
      if (item?.type !== 'examAttempt') {
        remaining.push(item);
        continue;
      }

      try {
        const attemptRef = firebaseFirestore
          .collection('users')
          .doc(uid)
          .collection('examAttempts')
          .doc(item.attemptDoc.attemptId);
        const summaryRef = firebaseFirestore.collection('users').doc(uid).collection('progress').doc('exam');

        const batch = firebaseFirestore.batch();
        batch.set(attemptRef, { ...item.attemptDoc, createdAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
        batch.set(summaryRef, { ...item.summaryDoc, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });

        if (item.clearInProgressExamId) {
          const inProgressRef = firebaseFirestore
            .collection('users')
            .doc(uid)
            .collection('examInProgress')
            .doc(item.clearInProgressExamId);
          batch.delete(inProgressRef);
        }

        await batch.commit();
      } catch (error) {
        console.warn('ProgressSyncService: failed to flush outbox item', error);
        remaining.push(item);
      }
    }

    await this.writeOutbox(uid, remaining);
  }

  getSummaryClientUpdatedAt(uid: string): number | null {
    return this.summaryClientUpdatedAtByUid.get(uid) ?? null;
  }

  touchSummaryClientUpdatedAt(uid: string): number {
    const next = nowMs();
    this.summaryClientUpdatedAtByUid.set(uid, next);
    return next;
  }

  buildLocalExamSnapshot(params: {
    examHistory: ExamAttempt[];
    favoriteQuestions: string[];
    questionStats: ExamQuestionStats;
    inProgress: ExamInProgressState;
    currentExam: CurrentExamState;
    currentLanguage: string;
    summaryClientUpdatedAt?: number;
  }): PersistedExamProgressV1 {
    const savedAt = nowMs();

    const inProgressPersisted: Record<string, PersistedExamInProgressV1> = {};
    Object.entries(params.inProgress || {}).forEach(([examId, progress]) => {
      const questionIds = progress.questions.map(q => q.id);
      inProgressPersisted[examId] = {
        examId: progress.examId,
        attemptId: progress.attemptId,
        questionIds,
        currentQuestionIndex: progress.currentQuestionIndex,
        answers: progress.answers,
        flaggedQuestions: progress.flaggedQuestions,
        startTime: progress.startTime,
        timeRemaining: progress.timeRemaining,
        timeSpentInSeconds: progress.timeSpentInSeconds,
        examCompleted: progress.examCompleted,
        examStarted: progress.examStarted,
        lastSaved: progress.lastSaved,
        examLanguage: params.currentLanguage,
        clientUpdatedAt: savedAt,
      };
    });

    const currentExamPersisted: PersistedExamInProgressV1 | null =
      params.currentExam?.examId && params.currentExam.examStarted && !params.currentExam.examCompleted
        ? {
            examId: params.currentExam.examId,
            attemptId: params.currentExam.attemptId,
            questionIds: params.currentExam.questions.map(q => q.id),
            currentQuestionIndex: params.currentExam.currentQuestionIndex,
            answers: params.currentExam.answers,
            flaggedQuestions: params.currentExam.flaggedQuestions,
            startTime: params.currentExam.startTime,
            timeRemaining: params.currentExam.timeRemaining,
            timeSpentInSeconds: params.currentExam.timeSpentInSeconds,
            examCompleted: params.currentExam.examCompleted,
            examStarted: params.currentExam.examStarted,
            lastSaved: params.currentExam.lastSaved,
            examLanguage: params.currentLanguage,
            clientUpdatedAt: savedAt,
          }
        : null;

    return {
      schemaVersion: 1,
      savedAt,
      summaryClientUpdatedAt: params.summaryClientUpdatedAt ?? savedAt,
      favoriteQuestions: params.favoriteQuestions || [],
      questionStats: params.questionStats || {},
      examHistory: params.examHistory || [],
      inProgress: inProgressPersisted,
      currentExam: currentExamPersisted,
    };
  }

  materializeExamHydrationPayload(params: {
    snapshot: PersistedExamProgressV1;
    chaptersData: unknown;
  }): ExamHydrationPayload {
    const { snapshot, chaptersData } = params;

    const inProgress: ExamInProgressState = {};
    Object.entries(snapshot.inProgress || {}).forEach(([examId, persisted]) => {
      const questions = materializeQuestions(persisted.questionIds, chaptersData);
      if (!questions.length) return;
      inProgress[examId] = {
        examId: persisted.examId,
        attemptId: persisted.attemptId,
        questions,
        currentQuestionIndex: clampIndex(persisted.currentQuestionIndex, questions.length),
        answers: persisted.answers || {},
        flaggedQuestions: persisted.flaggedQuestions || [],
        startTime: persisted.startTime,
        timeRemaining: persisted.timeRemaining,
        timeSpentInSeconds: persisted.timeSpentInSeconds,
        examCompleted: persisted.examCompleted,
        examStarted: persisted.examStarted,
        lastSaved: persisted.lastSaved,
      };
    });

    const currentExam: CurrentExamState = snapshot.currentExam
      ? (() => {
          const questions = materializeQuestions(snapshot.currentExam!.questionIds, chaptersData);
          return {
            examId: snapshot.currentExam!.examId,
            attemptId: snapshot.currentExam!.attemptId,
            questions,
            currentQuestionIndex: clampIndex(snapshot.currentExam!.currentQuestionIndex, questions.length),
            answers: snapshot.currentExam!.answers || {},
            flaggedQuestions: snapshot.currentExam!.flaggedQuestions || [],
            startTime: snapshot.currentExam!.startTime,
            timeRemaining: snapshot.currentExam!.timeRemaining,
            timeSpentInSeconds: snapshot.currentExam!.timeSpentInSeconds,
            examCompleted: snapshot.currentExam!.examCompleted,
            examStarted: snapshot.currentExam!.examStarted,
            lastSaved: snapshot.currentExam!.lastSaved,
          };
        })()
      : {
          examId: null,
          attemptId: null,
          questions: [],
          currentQuestionIndex: 0,
          answers: {},
          flaggedQuestions: [],
          startTime: null,
          timeRemaining: 45 * 60,
          timeSpentInSeconds: 0,
          examCompleted: false,
          examStarted: false,
          lastSaved: null,
        };

    return {
      examHistory: snapshot.examHistory || [],
      favoriteQuestions: snapshot.favoriteQuestions || [],
      questionStats: snapshot.questionStats || {},
      inProgress,
      currentExam,
    };
  }

  scheduleExamSummaryPatch(patch: Record<string, unknown>) {
    if (!this.identity) return;
    if (!this.isCloudSyncEnabled()) return;

    const clientUpdatedAt = nowMs();
    this.pendingSummaryClientUpdatedAt = clientUpdatedAt;
    Object.entries(patch).forEach(([key, value]) => {
      const existing = this.pendingSummaryPatch[key];
      const canMergeObjects =
        existing &&
        typeof existing === 'object' &&
        !Array.isArray(existing) &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value);
      this.pendingSummaryPatch[key] = canMergeObjects ? { ...(existing as any), ...(value as any) } : value;
    });

    if (this.summaryDebounceTimer) {
      clearTimeout(this.summaryDebounceTimer);
    }

    this.summaryDebounceTimer = setTimeout(() => {
      void this.flushExamSummaryUpdates();
    }, this.summaryDebounceMs);
  }

  private async flushExamSummaryUpdates() {
    if (!this.identity) return;
    if (!this.isCloudSyncEnabled()) return;
    if (!this.pendingSummaryClientUpdatedAt) return;

    const uid = this.identity.uid;
    const updates = this.pendingSummaryPatch;
    const clientUpdatedAt = this.pendingSummaryClientUpdatedAt;

    this.pendingSummaryPatch = {};
    this.pendingSummaryClientUpdatedAt = null;
    if (this.summaryDebounceTimer) {
      clearTimeout(this.summaryDebounceTimer);
      this.summaryDebounceTimer = null;
    }

    try {
      const docRef = firebaseFirestore.collection('users').doc(uid).collection('progress').doc('exam');
      await docRef.set(
        {
          schemaVersion: 1,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          clientUpdatedAt,
          ...updates,
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('ProgressSyncService: failed to flush exam summary updates', error);
      // Re-queue best-effort (last write wins)
      Object.entries(updates).forEach(([key, value]) => {
        const existing = this.pendingSummaryPatch[key];
        const canMergeObjects =
          existing &&
          typeof existing === 'object' &&
          !Array.isArray(existing) &&
          value &&
          typeof value === 'object' &&
          !Array.isArray(value);
        this.pendingSummaryPatch[key] = canMergeObjects ? { ...(existing as any), ...(value as any) } : value;
      });
      this.pendingSummaryClientUpdatedAt = clientUpdatedAt;
    }
  }

  scheduleExamInProgressCheckpoint(params: {
    examId: string;
    attemptId: string;
    questionIds: string[];
    answers: AnswerMap;
    flaggedQuestions: string[];
    currentQuestionIndex: number;
    startedAt: string;
    timeRemaining: number;
    timeSpentInSeconds: number;
    examLanguage: string;
  }) {
    if (!this.identity) return;
    if (!this.isCloudSyncEnabled()) return;

    const doc: ExamInProgressDocV1 = {
      schemaVersion: 1,
      examId: params.examId,
      attemptId: params.attemptId,
      questionIds: params.questionIds,
      answers: params.answers,
      flaggedQuestions: params.flaggedQuestions,
      currentQuestionIndex: params.currentQuestionIndex,
      startedAt: params.startedAt,
      timeRemaining: params.timeRemaining,
      timeSpentInSeconds: params.timeSpentInSeconds,
      content: { examLanguage: params.examLanguage },
      updatedAt: firestore.FieldValue.serverTimestamp(),
      clientUpdatedAt: nowMs(),
    };

    this.pendingInProgressDocByExamId[params.examId] = doc;

    const now = nowMs();
    const lastFlushAt = this.lastInProgressFlushAt ?? 0;
    const dueIn = Math.max(0, this.inProgressThrottleMs - (now - lastFlushAt));

    if (this.inProgressThrottleTimer) {
      // keep existing timer; latest doc overwrote pending
      return;
    }

    this.inProgressThrottleTimer = setTimeout(() => {
      void this.flushExamInProgressCheckpoints();
    }, dueIn);
  }

  async flushExamInProgressCheckpoints() {
    if (!this.identity) return;
    if (!this.isCloudSyncEnabled()) return;

    const uid = this.identity.uid;
    const pending = this.pendingInProgressDocByExamId;
    this.pendingInProgressDocByExamId = {};

    if (this.inProgressThrottleTimer) {
      clearTimeout(this.inProgressThrottleTimer);
      this.inProgressThrottleTimer = null;
    }

    const examIds = Object.keys(pending);
    if (!examIds.length) return;

    try {
      const batch = firebaseFirestore.batch();
      examIds.forEach(examId => {
        const docRef = firebaseFirestore.collection('users').doc(uid).collection('examInProgress').doc(examId);
        batch.set(docRef, pending[examId], { merge: true });
      });

      await batch.commit();
      this.lastInProgressFlushAt = nowMs();
    } catch (error) {
      console.warn('ProgressSyncService: failed to flush exam in-progress checkpoints', error);
      // Re-queue best-effort
      this.pendingInProgressDocByExamId = { ...pending, ...this.pendingInProgressDocByExamId };
    }
  }

  async clearRemoteExamInProgress(examId: string) {
    if (!this.identity) return;
    if (!this.isCloudSyncEnabled()) return;

    try {
      await firebaseFirestore
        .collection('users')
        .doc(this.identity.uid)
        .collection('examInProgress')
        .doc(examId)
        .delete();
    } catch (error) {
      console.warn('ProgressSyncService: failed to clear remote exam in-progress', error);
    }
  }

  private resetPendingCloudStateForUid(uid: string) {
    if (this.identity?.uid !== uid) return;

    if (this.summaryDebounceTimer) clearTimeout(this.summaryDebounceTimer);
    if (this.inProgressThrottleTimer) clearTimeout(this.inProgressThrottleTimer);

    this.summaryDebounceTimer = null;
    this.inProgressThrottleTimer = null;
    this.pendingSummaryPatch = {};
    this.pendingSummaryClientUpdatedAt = null;
    this.pendingInProgressDocByExamId = {};
    this.lastInProgressFlushAt = null;
  }

  private async deleteDocsInBatches(docRefs: Array<{ delete: () => Promise<void> } | any>): Promise<void> {
    const BATCH_LIMIT = 450;

    for (let i = 0; i < docRefs.length; i += BATCH_LIMIT) {
      const batch = firebaseFirestore.batch();
      docRefs.slice(i, i + BATCH_LIMIT).forEach(ref => {
        batch.delete(ref);
      });
      await batch.commit();
    }
  }

  async clearRemoteExamProgress(params: { uid: string; mode: 'history' | 'everything'; examId?: string }): Promise<boolean> {
    const uid = params.uid;
    if (!uid) return false;

    const user = firebaseAuth.currentUser;
    if (!user || user.isAnonymous || user.uid !== uid) return false;

    this.resetPendingCloudStateForUid(uid);

    try {
      await this.writeOutbox(uid, []);
    } catch (error) {
      console.warn('ProgressSyncService: failed to clear exam outbox', error);
    }

    const userRef = firebaseFirestore.collection('users').doc(uid);
    const attemptsRef = userRef.collection('examAttempts');
    const inProgressRef = userRef.collection('examInProgress');
    const summaryRef = userRef.collection('progress').doc('exam');

    const deleteAttempts = async () => {
      const snap = params.examId ? await attemptsRef.where('examId', '==', params.examId).get() : await attemptsRef.get();
      if (!snap.empty) {
        await this.deleteDocsInBatches(snap.docs.map(d => d.ref));
      }
    };

    const deleteInProgress = async () => {
      if (params.examId) {
        try {
          await inProgressRef.doc(params.examId).delete();
        } catch (error) {
          console.warn('ProgressSyncService: failed to delete remote exam in-progress doc', error);
        }
        return;
      }

      const snap = await inProgressRef.get();
      if (!snap.empty) {
        await this.deleteDocsInBatches(snap.docs.map(d => d.ref));
      }
    };

    const updateSummary = async () => {
      if (params.mode === 'everything') {
        try {
          await summaryRef.delete();
        } catch (error) {
          console.warn('ProgressSyncService: failed to delete remote exam summary doc', error);
        }
        return;
      }

      const patch: Record<string, unknown> = params.examId
        ? { [`examSummaries.${params.examId}`]: firestore.FieldValue.delete() }
        : { examSummaries: {} };

      try {
        await summaryRef.set(
          {
            schemaVersion: 1,
            updatedAt: firestore.FieldValue.serverTimestamp(),
            ...patch,
          },
          { merge: true }
        );
      } catch (error) {
        console.warn('ProgressSyncService: failed to update remote exam summary doc', error);
      }
    };

    try {
      await Promise.all([deleteAttempts(), deleteInProgress(), updateSummary()]);
      return true;
    } catch (error) {
      console.warn('ProgressSyncService: failed to clear remote exam progress', error);
      return false;
    }
  }

  async pushExamAttemptAndSummary(params: {
    attempt: ExamAttempt;
    questionIds: string[];
    answers: AnswerMap;
    examLanguage: string;
    favoriteQuestions: string[];
    hiddenFromIncorrect: string[];
    examHistory: ExamAttempt[];
    clearInProgressExamId?: string;
  }) {
    if (!this.identity) return;
    if (!this.isCloudSyncEnabled()) return;

    const uid = this.identity.uid;
    const clientCreatedAt = nowMs();
    const attemptId = params.attempt.id;

    const attemptDocForQueue: Omit<ExamAttemptDocV1, 'createdAt'> = {
      schemaVersion: 1,
      attemptId,
      examId: params.attempt.examId,
      startedAt: params.attempt.startTime,
      completedAt: params.attempt.endTime || new Date().toISOString(),
      status: params.attempt.status,
      score: params.attempt.score ?? 0,
      totalQuestions: params.attempt.totalQuestions,
      correctAnswers: params.attempt.correctAnswers,
      timeSpentInSeconds: params.attempt.timeSpentInSeconds,
      flaggedQuestions: params.attempt.flaggedQuestions || [],
      questionIds: params.questionIds,
      answers: params.answers,
      content: { examLanguage: params.examLanguage },
      clientCreatedAt,
    };

    const summaryDocForQueue: Omit<ExamProgressSummaryDocV1, 'updatedAt'> = {
      schemaVersion: 1,
      favorites: toBoolMap(params.favoriteQuestions),
      hiddenFromIncorrect: toBoolMap(params.hiddenFromIncorrect),
      examSummaries: this.buildExamSummaries(params.examHistory),
    };

    const attemptRef = firebaseFirestore.collection('users').doc(uid).collection('examAttempts').doc(attemptId);
    const summaryRef = firebaseFirestore.collection('users').doc(uid).collection('progress').doc('exam');

    try {
      const batch = firebaseFirestore.batch();
      batch.set(
        attemptRef,
        { ...attemptDocForQueue, createdAt: firestore.FieldValue.serverTimestamp() } as ExamAttemptDocV1,
        { merge: true }
      );
      batch.set(
        summaryRef,
        { ...summaryDocForQueue, updatedAt: firestore.FieldValue.serverTimestamp() } as ExamProgressSummaryDocV1,
        { merge: true }
      );

      if (params.clearInProgressExamId) {
        const inProgressRef = firebaseFirestore
          .collection('users')
          .doc(uid)
          .collection('examInProgress')
          .doc(params.clearInProgressExamId);
        batch.delete(inProgressRef);
      }
      await batch.commit();
    } catch (error) {
      console.warn('ProgressSyncService: failed to push exam attempt + summary', error);
      await this.enqueueOutboxItem(uid, {
        type: 'examAttempt',
        attemptDoc: attemptDocForQueue,
        summaryDoc: summaryDocForQueue,
        clearInProgressExamId: params.clearInProgressExamId,
        queuedAt: nowMs(),
      });
    }
  }

  private buildExamSummaries(examHistory: ExamAttemptDocV1[] | ExamAttempt[]) {
    const perExam: Record<string, ExamAttempt[]> = {};
    (examHistory as ExamAttempt[]).forEach(attempt => {
      if (!perExam[attempt.examId]) perExam[attempt.examId] = [];
      perExam[attempt.examId].push(attempt);
    });

    const summaries: Record<string, any> = {};
    Object.entries(perExam).forEach(([examId, attempts]) => {
      const completed = attempts
        .filter(a => !!a.endTime)
        .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime());
      if (!completed.length) return;
      const last = completed[0];
      const bestScore = completed.reduce((acc, a) => Math.max(acc, a.score ?? 0), 0);
      summaries[examId] = {
        attemptCount: attempts.length,
        lastAttemptId: last.id,
        lastStatus: last.status,
        lastScore: last.score ?? 0,
        lastCompletedAt: last.endTime!,
        bestScore,
      };
    });

    return summaries;
  }

  async pullRemoteExamProgress(uid: string): Promise<{
    summary: ExamProgressSummaryDocV1 | null;
    attempts: ExamAttemptDocV1[];
    inProgress: ExamInProgressDocV1[];
  }> {
    const summaryRef = firebaseFirestore.collection('users').doc(uid).collection('progress').doc('exam');

    const [summarySnap, attemptsSnap, inProgressSnap] = await Promise.all([
      summaryRef.get(),
      firebaseFirestore.collection('users').doc(uid).collection('examAttempts').get(),
      firebaseFirestore.collection('users').doc(uid).collection('examInProgress').get(),
    ]);

    const summary = summarySnap.exists() ? (summarySnap.data() as ExamProgressSummaryDocV1) : null;
    const attempts = attemptsSnap.docs.map(d => d.data() as ExamAttemptDocV1);
    const inProgress = inProgressSnap.docs.map(d => d.data() as ExamInProgressDocV1);

    return { summary, attempts, inProgress };
  }

  mergeExamProgress(params: {
    local: PersistedExamProgressV1;
    remote: {
      summary: ExamProgressSummaryDocV1 | null;
      attempts: ExamAttemptDocV1[];
      inProgress: ExamInProgressDocV1[];
    };
  }): PersistedExamProgressV1 {
    const { local, remote } = params;

    const mergedAttempts = this.mergeAttempts(local.examHistory || [], remote.attempts || []);
    const mergedQuestionStats = local.questionStats || {};

    const remoteSummaryClientUpdatedAt = remote.summary?.clientUpdatedAt ?? 0;
    const localSummaryClientUpdatedAt = local.summaryClientUpdatedAt ?? 0;
    const useRemoteSummary = remoteSummaryClientUpdatedAt >= localSummaryClientUpdatedAt;

    const favoriteQuestions = useRemoteSummary
      ? fromBoolMap(remote.summary?.favorites)
      : local.favoriteQuestions || [];

    const hiddenFromIncorrect = useRemoteSummary
      ? fromBoolMap(remote.summary?.hiddenFromIncorrect)
      : Object.entries(mergedQuestionStats)
          .filter(([, stats]) => stats.hiddenFromIncorrectList)
          .map(([questionId]) => questionId);

    // Apply hidden flags to questionStats (authoritative set)
    const nextQuestionStats: ExamQuestionStats = { ...mergedQuestionStats };
    Object.entries(nextQuestionStats).forEach(([questionId, stats]) => {
      nextQuestionStats[questionId] = { ...stats, hiddenFromIncorrectList: false };
    });
    hiddenFromIncorrect.forEach(questionId => {
      if (!nextQuestionStats[questionId]) {
        nextQuestionStats[questionId] = { attempts: 0, correct: 0, incorrect: 0, hiddenFromIncorrectList: true };
        return;
      }
      nextQuestionStats[questionId] = { ...nextQuestionStats[questionId], hiddenFromIncorrectList: true };
    });

    const mergedInProgress = this.mergeInProgress(local, remote.inProgress || []);

    return {
      schemaVersion: 1,
      savedAt: nowMs(),
      summaryClientUpdatedAt: Math.max(localSummaryClientUpdatedAt, remoteSummaryClientUpdatedAt),
      favoriteQuestions,
      questionStats: nextQuestionStats,
      examHistory: mergedAttempts,
      inProgress: mergedInProgress.inProgress,
      currentExam: mergedInProgress.currentExam,
    };
  }

  private mergeAttempts(localAttempts: ExamAttempt[], remoteAttempts: ExamAttemptDocV1[]): ExamAttempt[] {
    const map = new Map<string, ExamAttempt>();
    localAttempts.forEach(attempt => {
      map.set(attempt.id, attempt);
    });

    remoteAttempts.forEach(remoteAttempt => {
      const attempt: ExamAttempt = {
        id: remoteAttempt.attemptId,
        examId: remoteAttempt.examId,
        startTime: remoteAttempt.startedAt,
        endTime: remoteAttempt.completedAt,
        status: remoteAttempt.status,
        answers: Object.entries(remoteAttempt.answers || {}).map(([questionId, selectedAnswers]) => ({
          questionId,
          selectedAnswers,
        })),
        score: remoteAttempt.score,
        totalQuestions: remoteAttempt.totalQuestions,
        correctAnswers: remoteAttempt.correctAnswers,
        flaggedQuestions: remoteAttempt.flaggedQuestions || [],
        timeSpentInSeconds: remoteAttempt.timeSpentInSeconds,
      };

      if (!map.has(attempt.id)) {
        map.set(attempt.id, attempt);
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  private mergeInProgress(
    local: PersistedExamProgressV1,
    remoteInProgress: ExamInProgressDocV1[]
  ): {
    inProgress: Record<string, PersistedExamInProgressV1>;
    currentExam: PersistedExamInProgressV1 | null;
  } {
    const localByExamId: Record<string, PersistedExamInProgressV1> = { ...(local.inProgress || {}) };

    remoteInProgress.forEach(doc => {
      const existing = localByExamId[doc.examId];
      const incoming: PersistedExamInProgressV1 = {
        examId: doc.examId,
        attemptId: doc.attemptId,
        questionIds: doc.questionIds || [],
        currentQuestionIndex: doc.currentQuestionIndex || 0,
        answers: doc.answers || {},
        flaggedQuestions: doc.flaggedQuestions || [],
        startTime: doc.startedAt,
        timeRemaining: doc.timeRemaining,
        timeSpentInSeconds: doc.timeSpentInSeconds,
        examCompleted: false,
        examStarted: true,
        lastSaved: new Date(doc.clientUpdatedAt).toISOString(),
        examLanguage: doc.content?.examLanguage || 'en',
        clientUpdatedAt: doc.clientUpdatedAt,
      };

      if (!existing || incoming.clientUpdatedAt > existing.clientUpdatedAt) {
        localByExamId[doc.examId] = incoming;
      }
    });

    // Prefer keeping currentExam as-is unless it matches one of the in-progress entries.
    // This avoids clobbering active UI state unexpectedly.
    return {
      inProgress: localByExamId,
      currentExam: local.currentExam || null,
    };
  }

  async flushAll() {
    if (this.identity && this.isCloudSyncEnabled()) {
      await this.flushOutbox(this.identity.uid);
    }

    await Promise.all([this.flushExamSummaryUpdates(), this.flushExamInProgressCheckpoints()]);
  }
}

export const progressSyncService = new ProgressSyncService();
