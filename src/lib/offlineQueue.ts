/**
 * Offline Resilience & Answer Queue for IKSHOVIA
 * 
 * Provides temporary client-side persistence and background synchronization
 * for active mock test answers and attempt submissions during network interruptions.
 * Does NOT create a second permanent database; uses localStorage as a temporary queue.
 */

import { api } from './api.js';

export interface QueuedMockAnswer {
  attemptId: string;
  questionId: string;
  userAnswer: string;
  timeSpentSeconds: number;
  markedForReview?: boolean;
  timestamp: number;
}

export interface QueuedMockSubmission {
  mockTestId: string;
  answers: Record<string, string>;
  timeTakenSeconds: number;
  userId?: string;
  timestamp: number;
}

const PENDING_ANSWERS_STORAGE_KEY = 'ikshovia_pending_mock_answers';
const PENDING_SUBMISSIONS_STORAGE_KEY = 'ikshovia_pending_mock_submissions';

/**
 * Get all currently queued mock answers from local storage.
 */
export function getQueuedAnswers(): QueuedMockAnswer[] {
  try {
    const raw = localStorage.getItem(PENDING_ANSWERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[OfflineQueue] Failed to parse queued answers:', e);
    return [];
  }
}

/**
 * Queue or update a mock test answer for offline persistence.
 * Deduplicates by attemptId + questionId to prevent redundant network transmissions.
 */
export function queueMockAnswer(answer: QueuedMockAnswer): void {
  try {
    const queue = getQueuedAnswers();
    // Remove any older queued answer for the same attempt and question
    const filtered = queue.filter(
      item => !(item.attemptId === answer.attemptId && item.questionId === answer.questionId)
    );
    filtered.push(answer);
    localStorage.setItem(PENDING_ANSWERS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('[OfflineQueue] Failed to queue mock answer:', e);
  }
}

/**
 * Remove a specific queued answer after successful synchronization.
 */
export function removeQueuedAnswer(attemptId: string, questionId: string): void {
  try {
    const queue = getQueuedAnswers();
    const updated = queue.filter(
      item => !(item.attemptId === attemptId && item.questionId === questionId)
    );
    localStorage.setItem(PENDING_ANSWERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[OfflineQueue] Failed to remove queued answer:', e);
  }
}

/**
 * Synchronize all queued answers with the backend.
 * Returns the count of successfully synchronized answers.
 */
export async function syncQueuedAnswers(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0;
  }

  const queue = getQueuedAnswers();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remainingQueue: QueuedMockAnswer[] = [];

  for (const item of queue) {
    try {
      const res = await api.saveMockAnswer(
        item.attemptId,
        item.questionId,
        item.userAnswer,
        item.timeSpentSeconds,
        item.markedForReview
      );
      if (res !== null) {
        syncedCount++;
      } else {
        remainingQueue.push(item);
      }
    } catch {
      remainingQueue.push(item);
    }
  }

  try {
    localStorage.setItem(PENDING_ANSWERS_STORAGE_KEY, JSON.stringify(remainingQueue));
  } catch {}

  // Also sync pending submissions if any
  await syncQueuedSubmissions();

  return syncedCount;
}

/**
 * Queue a final test submission if network fails at the final submit step.
 */
export function queueMockSubmission(submission: QueuedMockSubmission): void {
  try {
    const raw = localStorage.getItem(PENDING_SUBMISSIONS_STORAGE_KEY);
    const list: QueuedMockSubmission[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(item => item.mockTestId !== submission.mockTestId);
    filtered.push(submission);
    localStorage.setItem(PENDING_SUBMISSIONS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('[OfflineQueue] Failed to queue mock submission:', e);
  }
}

/**
 * Synchronize queued mock submissions when connection is restored.
 */
export async function syncQueuedSubmissions(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  try {
    const raw = localStorage.getItem(PENDING_SUBMISSIONS_STORAGE_KEY);
    if (!raw) return 0;
    const list: QueuedMockSubmission[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return 0;

    let synced = 0;
    const remaining: QueuedMockSubmission[] = [];

    for (const item of list) {
      try {
        await api.submitMockTest(item.mockTestId, item.answers, item.timeTakenSeconds, item.userId);
        synced++;
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem(PENDING_SUBMISSIONS_STORAGE_KEY, JSON.stringify(remaining));
    return synced;
  } catch {
    return 0;
  }
}

/**
 * Setup automatic network connectivity listeners.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncQueuedAnswers().catch(() => {});
  });
}
