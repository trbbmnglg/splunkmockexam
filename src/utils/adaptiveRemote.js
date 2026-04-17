/**
 * Remote D1 operations: community stats, wrong answers, seen concepts.
 *
 * All user-scoped writes use signedBody() + all user-scoped GETs use
 * authHeaders() — the Worker verifies ownership via the privacy token
 * before touching D1. Community stats is the one exception (aggregate,
 * anonymized — intentionally public).
 */
import { isTrackingEnabled, signedBody, authHeaders, rotateIdentity } from './privacyToken.js';
import { BASE_URL } from './baseUrl';
import { getUserId } from './adaptiveStorage';

/**
 * Fetch aggregated community performance stats for an exam type from D1.
 * @param {string} examType - Exam type key.
 * @returns {Promise<object|null>} Community stats object, or null on failure.
 */
export const getCommunityStats = async (examType) => {
  try {
    const res = await fetch(`${BASE_URL}/community?examType=${encodeURIComponent(examType)}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('[Adaptive] getCommunityStats failed:', err.message);
  }
  return null;
};

/**
 * Retrieve the user's wrong-answer bank for review sessions.
 * @param {string} examType - Exam type key.
 * @param {boolean} [dueOnly=false] - If true, only return answers due for spaced repetition.
 * @returns {Promise<{ wrongAnswers: object[], dueCount: number }>} Wrong answers and due count.
 */
export const getWrongAnswerBank = async (examType, dueOnly = false) => {
  const userId = getUserId();
  const headers = authHeaders();
  if (!headers) return { wrongAnswers: [], dueCount: 0 };
  try {
    const url = `${BASE_URL}/wrong-answers?userId=${encodeURIComponent(userId)}&examType=${encodeURIComponent(examType)}&dueOnly=${dueOnly}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
    if (res.status === 401) rotateIdentity(BASE_URL).catch(() => {});
  } catch (err) {
    console.warn('[Adaptive] getWrongAnswerBank failed:', err.message);
  }
  return { wrongAnswers: [], dueCount: 0 };
};

/**
 * Remove reviewed questions from the wrong-answer bank (fire-and-forget).
 * @param {string} examType - Exam type key.
 * @param {string[]} questionHashes - Hashes of questions to clear.
 */
export const clearReviewedAnswers = (examType, questionHashes) => {
  const userId = getUserId();
  const body = signedBody(userId, { examType, questionHashes });
  if (!body) return;
  fetch(`${BASE_URL}/wrong-answers`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  }).catch(err => console.warn('[Adaptive] Clear reviewed answers failed:', err.message));
};

// ─── Cross-session duplicate detection ───────────────────────────────────────
/**
 * Hash a question string using SHA-256 (async, via Web Crypto API).
 * Falls back to a simple 32-bit hash if crypto.subtle is unavailable.
 * @param {string} str - Question text to hash.
 * @returns {Promise<string>} Base-36 hash string.
 */
async function hashConcept(str) {
  const s = str || '';
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(s);
    const buffer  = await crypto.subtle.digest('SHA-256', encoded);
    const bytes   = new Uint8Array(buffer);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: simple 32-bit hash for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Save question concepts to D1 for cross-session duplicate prevention (fire-and-forget).
 * Skipped if tracking is disabled.
 * @param {string} examType - Exam type key.
 * @param {object[]} questions - Array of question objects from the session.
 */
export const saveSeenConcepts = async (examType, questions) => {
  if (!isTrackingEnabled()) {
    console.info('[Adaptive] Tracking disabled — skipping seen concepts write');
    return;
  }

  const userId = getUserId();
  if (!questions || questions.length === 0) return;

  const concepts = await Promise.all(questions.map(async q => ({
    hash:  await hashConcept(q.question),
    hint:  (q.question || '').slice(0, 80),
    topic: q.topic || 'General',
  })));

  const body = signedBody(userId, { examType, concepts });
  if (!body) return;
  fetch(`${BASE_URL}/seen-concepts`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  }).catch(err => console.warn('[Adaptive] saveSeenConcepts failed:', err.message));
};

/**
 * Fetch recently seen question concepts for deduplication in prompt generation.
 * @param {string} examType - Exam type key.
 * @returns {Promise<{ topic: string, hint: string }[]>} Array of seen concept objects, or empty array on failure.
 */
export const getRecentSeenConcepts = async (examType) => {
  const userId = getUserId();
  const headers = authHeaders();
  if (!headers) return [];
  try {
    const res = await fetch(
      `${BASE_URL}/seen-concepts?userId=${encodeURIComponent(userId)}&examType=${encodeURIComponent(examType)}&limit=50`,
      { headers, signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      return data.concepts || [];
    }
    if (res.status === 401) rotateIdentity(BASE_URL).catch(() => {});
  } catch (err) {
    console.warn('[Adaptive] getRecentSeenConcepts failed:', err.message);
  }
  return [];
};
