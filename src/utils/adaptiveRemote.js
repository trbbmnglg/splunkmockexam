/**
 * Remote D1 operations: community stats, wrong answers, seen concepts.
 */
import { isTrackingEnabled } from './privacyToken.js';
import { BASE_URL } from './baseUrl';
import { getUserId } from './adaptiveStorage';

export const getCommunityStats = async (examType) => {
  try {
    const res = await fetch(`${BASE_URL}/community?examType=${encodeURIComponent(examType)}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('[Adaptive] getCommunityStats failed:', err.message);
  }
  return null;
};

export const getWrongAnswerBank = async (examType, dueOnly = false) => {
  const userId = getUserId();
  try {
    const url = `${BASE_URL}/wrong-answers?userId=${encodeURIComponent(userId)}&examType=${encodeURIComponent(examType)}&dueOnly=${dueOnly}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('[Adaptive] getWrongAnswerBank failed:', err.message);
  }
  return { wrongAnswers: [], dueCount: 0 };
};

export const clearReviewedAnswers = (examType, questionHashes) => {
  const userId = getUserId();
  fetch(`${BASE_URL}/wrong-answers`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ userId, examType, questionHashes })
  }).catch(err => console.warn('[Adaptive] Clear reviewed answers failed:', err.message));
};

// ─── Cross-session duplicate detection ───────────────────────────────────────
function hashConcept(str) {
  let hash = 0;
  const s = str || '';
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export const saveSeenConcepts = (examType, questions) => {
  if (!isTrackingEnabled()) {
    console.info('[Adaptive] Tracking disabled — skipping seen concepts write');
    return;
  }

  const userId = getUserId();
  if (!questions || questions.length === 0) return;

  const concepts = questions.map(q => ({
    hash:  hashConcept(q.question),
    hint:  (q.question || '').slice(0, 80),
    topic: q.topic || 'General',
  }));

  fetch(`${BASE_URL}/seen-concepts`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ userId, examType, concepts }),
  }).catch(err => console.warn('[Adaptive] saveSeenConcepts failed:', err.message));
};

export const getRecentSeenConcepts = async (examType) => {
  const userId = getUserId();
  try {
    const res = await fetch(
      `${BASE_URL}/seen-concepts?userId=${encodeURIComponent(userId)}&examType=${encodeURIComponent(examType)}&limit=50`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      return data.concepts || [];
    }
  } catch (err) {
    console.warn('[Adaptive] getRecentSeenConcepts failed:', err.message);
  }
  return [];
};
