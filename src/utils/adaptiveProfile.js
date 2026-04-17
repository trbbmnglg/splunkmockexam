/**
 * Profile loading, updating, readiness scoring, and summary.
 */
import { isTrackingEnabled, signedBody, authHeaders } from './privacyToken.js';
import { BASE_URL } from './baseUrl';
import {
  getUserId, loadLocalProfile, saveLocalProfile,
  SCORE_HISTORY_WINDOW, GRADUATION_WINDOW, GRADUATION_THRESHOLD,
} from './adaptiveStorage';

// ─── Rolling trend from score history ────────────────────────────────────────
// Exported so unit tests can verify the graduation / trend logic without
// needing a DOM, localStorage, or network mock.
export const computeRollingTrend = (scoreHistory, lastScore, prevScore) => {
  if (Array.isArray(scoreHistory) && scoreHistory.length >= 2) {
    const mid       = Math.floor(scoreHistory.length / 2);
    const older     = scoreHistory.slice(0, mid);
    const recent    = scoreHistory.slice(mid);
    const avgOlder  = older.reduce((s, v) => s + v, 0) / older.length;
    const avgRecent = recent.reduce((s, v) => s + v, 0) / recent.length;
    const delta     = avgRecent - avgOlder;
    if (delta > 10)  return 'improving';
    if (delta < -10) return 'declining';
    return 'stable';
  }
  if (typeof lastScore === 'number' && typeof prevScore === 'number') {
    if (lastScore > prevScore + 10) return 'improving';
    if (lastScore < prevScore - 10) return 'declining';
    return 'stable';
  }
  return 'new';
};

// ─── Client-side graduation check ────────────────────────────────────────────
export const computeGraduatedAt = (scoreHistory, existingGraduatedAt, now) => {
  if (!Array.isArray(scoreHistory) || scoreHistory.length < GRADUATION_WINDOW) return null;
  const latestScore = scoreHistory[scoreHistory.length - 1];
  if (latestScore < GRADUATION_THRESHOLD) return null;
  const window    = scoreHistory.slice(-GRADUATION_WINDOW);
  const allStrong = window.every(s => s >= GRADUATION_THRESHOLD);
  if (allStrong) return existingGraduatedAt || now;
  return null;
};

// ─── Append score to local history ───────────────────────────────────────────
export const appendToHistory = (existingHistory, newScore) => {
  const history = Array.isArray(existingHistory) ? [...existingHistory] : [];
  history.push(newScore);
  if (history.length > SCORE_HISTORY_WINDOW) {
    return history.slice(history.length - SCORE_HISTORY_WINDOW);
  }
  return history;
};

// ─── Compute per-topic validation failure rates ───────────────────────────────
const computeTopicValidationFailures = (validationLog, questions) => {
  if (!validationLog || validationLog.length === 0) return {};
  const firstCycle = validationLog[0];
  if (!firstCycle || !firstCycle.failures || firstCycle.failures.length === 0) return {};

  const indexToTopic = {};
  questions.forEach((q, i) => { indexToTopic[i] = q.topic || 'General'; });

  const topicFailCounts  = {};
  const topicTotalCounts = {};

  firstCycle.failures.forEach(f => {
    const topic = indexToTopic[f.index] || 'General';
    topicFailCounts[topic] = (topicFailCounts[topic] || 0) + 1;
  });
  questions.forEach(q => {
    const topic = q.topic || 'General';
    topicTotalCounts[topic] = (topicTotalCounts[topic] || 0) + 1;
  });

  const result = {};
  for (const topic of Object.keys(topicFailCounts)) {
    const total = topicTotalCounts[topic] || 1;
    result[topic] = Math.round((topicFailCounts[topic] / total) * 100);
  }
  return result;
};

/**
 * Load the user's adaptive profile for an exam type.
 * Tries the remote D1 store first, falls back to localStorage.
 * @param {string} examType - Exam type key (e.g. "User", "Power User").
 * @returns {Promise<object>} Profile with `sessions`, `lastUpdated`, and `topics` map.
 */
export const loadProfile = async (examType) => {
  const userId = getUserId();
  const headers = authHeaders();
  // If no token yet (first load), skip the remote read — localStorage
  // fallback still serves as the offline / unverified source of truth.
  if (!headers) {
    const local = loadLocalProfile();
    return local[examType] || { sessions: 0, lastUpdated: null, topics: {} };
  }
  try {
    const res = await fetch(
      `${BASE_URL}/profile?userId=${encodeURIComponent(userId)}&examType=${encodeURIComponent(examType)}`,
      { headers, signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.topics && Object.keys(data.topics).length > 0) {
        const local = loadLocalProfile();
        local[examType] = {
          sessions:    data.sessions,
          lastUpdated: data.lastUpdated,
          topics:      Object.fromEntries(
            Object.entries(data.topics).map(([name, t]) => [name, {
              attempts:              t.attempts,
              errors:                t.errors,
              lastScore:             t.lastScore,
              trend:                 t.trend,
              scoreHistory:          t.scoreHistory          || [],
              graduatedAt:           t.graduatedAt           || null,
              validationFailureRate: t.validationFailureRate ?? 0,
            }])
          ),
        };
        saveLocalProfile(local);
      }
      return data;
    }
  } catch (err) {
    console.warn('[Adaptive] D1 read failed, using localStorage:', err.message);
  }
  const local       = loadLocalProfile();
  const examProfile = local[examType];
  if (!examProfile) return { sessions: 0, lastUpdated: null, topics: {} };
  return examProfile;
};

/**
 * Update the adaptive profile after an exam session.
 * Computes per-topic scores, persists to D1 (if tracking enabled) and localStorage,
 * and records wrong answers for the review bank.
 * @param {string} examType - Exam type key.
 * @param {object[]} questions - Array of question objects from the session.
 * @param {object} userAnswers - Map of questionIndex → selected option index.
 * @param {object[]} [validationLog=[]] - Validation pipeline log from agentValidator.
 * @returns {Promise<object>} Updated local exam profile.
 */
export const updateProfile = async (examType, questions, userAnswers, validationLog = []) => {
  const userId = getUserId();
  const now    = new Date().toISOString();

  const sessionTopicStats = {};
  questions.forEach((q, idx) => {
    const topic = q.topic || 'General';
    if (!sessionTopicStats[topic]) sessionTopicStats[topic] = { attempts: 0, errors: 0 };
    sessionTopicStats[topic].attempts += 1;
    if (userAnswers[idx] !== q.correctIndex) sessionTopicStats[topic].errors += 1;
  });

  const topicValidationFailures = computeTopicValidationFailures(validationLog, questions);
  const overallFailureRate      = validationLog[0]?.failureRate ?? 0;

  const sessionResults = Object.entries(sessionTopicStats).map(([topic, stats]) => ({
    topic,
    attempts:              stats.attempts,
    errors:                stats.errors,
    sessionScore:          Math.round(((stats.attempts - stats.errors) / stats.attempts) * 100),
    validationFailureRate: topicValidationFailures[topic] ?? 0,
  }));

  if (isTrackingEnabled()) {
    const profileBody = signedBody(userId, { examType, sessionResults, overallFailureRate });
    if (profileBody) {
      fetch(`${BASE_URL}/profile`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(profileBody),
      }).catch(err => console.warn('[Adaptive] D1 write failed:', err.message));
    }

    const wrongAnswers = questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q, idx }) => userAnswers[idx] !== q.correctIndex)
      .map(({ q }) => ({
        topic:         q.topic || 'General',
        question:      q.question,
        correctAnswer: q.options[q.correctIndex],
      }));

    if (wrongAnswers.length > 0) {
      const waBody = signedBody(userId, { examType, wrongAnswers });
      if (waBody) {
        fetch(`${BASE_URL}/wrong-answers`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(waBody),
        }).catch(err => console.warn('[Adaptive] Wrong answers write failed:', err.message));
      }
    }
  } else {
    console.info('[Adaptive] Tracking disabled — skipping D1 profile + wrong answers write');
  }

  const local = loadLocalProfile();
  if (!local[examType]) local[examType] = { sessions: 0, lastUpdated: null, topics: {} };
  const examProfile       = local[examType];
  examProfile.sessions   += 1;
  examProfile.lastUpdated = now;

  for (const { topic, attempts, errors, sessionScore, validationFailureRate } of sessionResults) {
    const prev = examProfile.topics[topic];

    if (!prev) {
      examProfile.topics[topic] = {
        attempts, errors,
        lastScore: sessionScore, trend: 'new',
        scoreHistory: [sessionScore], graduatedAt: null,
        validationFailureRate,
      };
    } else {
      const updatedHistory = appendToHistory(prev.scoreHistory || [], sessionScore);
      const newTrend       = computeRollingTrend(updatedHistory, sessionScore, prev.lastScore ?? 50);
      const newGraduatedAt = computeGraduatedAt(updatedHistory, prev.graduatedAt, now);

      const prevVfr = prev.validationFailureRate ?? 0;
      const newVfr  = prevVfr > 0
        ? Math.round((prevVfr + validationFailureRate) / 2)
        : validationFailureRate;

      examProfile.topics[topic] = {
        attempts:              prev.attempts + attempts,
        errors:                prev.errors   + errors,
        lastScore:             sessionScore,
        trend:                 newTrend,
        scoreHistory:          updatedHistory,
        graduatedAt:           newGraduatedAt,
        validationFailureRate: newVfr,
      };
    }
  }

  saveLocalProfile(local);
  return examProfile;
};

/**
 * Compute a weighted exam-readiness score based on the user's topic performance
 * against the official blueprint percentages.
 * @param {string} examType - Exam type key.
 * @param {{ name: string, pct: number }[]} blueprintTopics - Blueprint topic list with weight percentages.
 * @returns {object|null} Readiness object with `score`, `label`, `breakdown`, etc., or null if no blueprint.
 */
export const computeExamReadiness = (examType, blueprintTopics) => {
  if (!blueprintTopics || blueprintTopics.length === 0) return null;

  const local       = loadLocalProfile();
  const examProfile = local[examType];
  const topicStats  = examProfile?.topics || {};

  let weightedSum   = 0;
  let coveredWeight = 0;

  const breakdown = blueprintTopics.map(({ name, pct }) => {
    const weight   = pct / 100;
    const profile  = topicStats[name];
    const isGrad   = !!(profile?.graduatedAt);

    const errorRate = profile && profile.attempts > 0
      ? Math.round((profile.errors / profile.attempts) * 100)
      : null;

    const accuracy     = isGrad ? 100 : (errorRate !== null ? Math.max(0, 100 - errorRate) : 50);
    const contribution = accuracy * weight;

    weightedSum   += contribution;
    if (errorRate !== null || isGrad) coveredWeight += weight;

    return {
      name, pct, accuracy, errorRate,
      attempted:   errorRate !== null || isGrad,
      graduated:   isGrad,
      graduatedAt: profile?.graduatedAt || null,
      trend:       profile?.trend        || 'new',
      scoreHistory: profile?.scoreHistory || [],
    };
  });

  const score      = Math.round(weightedSum);
  const coveredPct = Math.round(coveredWeight * 100);

  let label;
  if (score >= 80)      label = 'Ready';
  else if (score >= 65) label = 'Almost Ready';
  else if (score >= 45) label = 'Getting There';
  else                  label = 'Not Ready';

  const labelColor =
    score >= 80 ? 'text-emerald-600' :
    score >= 65 ? 'text-blue-600'    :
    score >= 45 ? 'text-amber-600'   :
                  'text-red-600';

  const labelBg =
    score >= 80 ? 'bg-emerald-50 border-emerald-200' :
    score >= 65 ? 'bg-blue-50 border-blue-200'       :
    score >= 45 ? 'bg-amber-50 border-amber-200'     :
                  'bg-red-50 border-red-200';

  const graduatedCount = breakdown.filter(t => t.graduated).length;

  return {
    score, label, labelColor, labelBg,
    coveredPct, breakdown, graduatedCount,
    sessions: examProfile?.sessions || 0,
  };
};

/**
 * Build a UI-friendly summary of the user's adaptive profile for a given exam type.
 * @param {string} examType - Exam type key.
 * @returns {object|null} Summary with `sessions`, `lastUpdated`, and sorted `topics` array, or null if no data.
 */
export const getProfileSummary = (examType) => {
  const local       = loadLocalProfile();
  const examProfile = local[examType];
  if (!examProfile) return null;
  const topics = Object.entries(examProfile.topics).map(([name, stats]) => ({
    name,
    lastScore:             stats.lastScore,
    attempts:              stats.attempts,
    errors:                stats.errors,
    trend:                 stats.trend,
    scoreHistory:          stats.scoreHistory  || [],
    graduatedAt:           stats.graduatedAt   || null,
    validationFailureRate: stats.validationFailureRate ?? 0,
    errorRate:             stats.attempts > 0 ? Math.round((stats.errors / stats.attempts) * 100) : 0,
  })).sort((a, b) => b.errorRate - a.errorRate);
  return { examType, sessions: examProfile.sessions, lastUpdated: examProfile.lastUpdated, topics };
};
