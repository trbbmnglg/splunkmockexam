/**
 * agentAdaptive.js — Layer 3: Adaptive Difficulty Agent
 *
 * Rolling trend detection (v2):
 *   - D1 stores score_history (last 7 session scores) per topic.
 *   - computeRollingTrend() uses half-split average comparison.
 *
 * Exam-readiness score (v3):
 *   - computeExamReadiness() returns a 0-100 weighted score against blueprint.
 *   - Graduated topics show 100% accuracy in the readiness breakdown.
 *
 * Topic confidence graduation (v4):
 *   - A topic is graduated when the last 4 consecutive sessions all score ≥ 80%.
 *   - Server computes and stores graduated_at in D1.
 *   - buildAdaptiveContext() gives graduated topics a floor of 1 question
 *     instead of adaptive weighting — still covered, no longer over-weighted.
 *   - Un-graduation is automatic: if latest score drops below threshold,
 *     graduated_at is cleared server-side and the topic re-enters weighting.
 */

const LOCAL_KEY              = 'splunkAdaptiveProfile';
const USER_ID_KEY            = 'splunkUserId';
const SCORE_HISTORY_WINDOW   = 7;
const GRADUATION_WINDOW      = 4;
const GRADUATION_THRESHOLD   = 80;

const BASE_URL = import.meta.env.MODE === 'development'
  ? '/api'
  : 'https://splunkmockexam.gtaad-innovations.com/api';

// ─── User ID ──────────────────────────────────────────────────────────────────
export const getUserId = () => {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
};

// ─── Rolling trend from score history ────────────────────────────────────────
const computeRollingTrend = (scoreHistory, lastScore, prevScore) => {
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

// ─── Client-side graduation check (mirrors server logic) ─────────────────────
// Used to update localStorage immediately after a session without waiting
// for the next D1 sync. Server is authoritative; this keeps localStorage fresh.
const computeGraduatedAt = (scoreHistory, existingGraduatedAt, now) => {
  if (!Array.isArray(scoreHistory) || scoreHistory.length < GRADUATION_WINDOW) return null;
  const latestScore = scoreHistory[scoreHistory.length - 1];
  if (latestScore < GRADUATION_THRESHOLD) return null;
  const window    = scoreHistory.slice(-GRADUATION_WINDOW);
  const allStrong = window.every(s => s >= GRADUATION_THRESHOLD);
  if (allStrong) return existingGraduatedAt || now;
  return null;
};

// ─── Append score to local history, capped at window size ─────────────────────
const appendToHistory = (existingHistory, newScore) => {
  const history = Array.isArray(existingHistory) ? [...existingHistory] : [];
  history.push(newScore);
  if (history.length > SCORE_HISTORY_WINDOW) {
    return history.slice(history.length - SCORE_HISTORY_WINDOW);
  }
  return history;
};

// ─── localStorage helpers ─────────────────────────────────────────────────────
const loadLocalProfile = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveLocalProfile = (profile) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[Adaptive] Could not save local profile:', err.message);
  }
};

export const clearProfile = (examType) => {
  const userId = getUserId();
  fetch(`${BASE_URL}/profile`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ userId, examType })
  }).catch(() => {});
  const local = loadLocalProfile();
  if (examType) delete local[examType];
  else Object.keys(local).forEach(k => delete local[k]);
  saveLocalProfile(local);
};

// ─── Load profile — D1 first, localStorage fallback ──────────────────────────
export const loadProfile = async (examType) => {
  const userId = getUserId();
  try {
    const res = await fetch(
      `${BASE_URL}/profile?userId=${encodeURIComponent(userId)}&examType=${encodeURIComponent(examType)}`,
      { signal: AbortSignal.timeout(5000) }
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

// ─── Compute per-topic validation failure rates from validationLog ────────────
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

// ─── Update profile after exam ────────────────────────────────────────────────
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

  // D1 write (non-blocking) — server handles graduation authoritatively
  fetch(`${BASE_URL}/profile`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ userId, examType, sessionResults, overallFailureRate })
  }).catch(err => console.warn('[Adaptive] D1 write failed:', err.message));

  // Wrong answers write (non-blocking)
  const wrongAnswers = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q, idx }) => userAnswers[idx] !== q.correctIndex)
    .map(({ q }) => ({
      topic:         q.topic || 'General',
      question:      q.question,
      correctAnswer: q.options[q.correctIndex],
    }));

  if (wrongAnswers.length > 0) {
    fetch(`${BASE_URL}/wrong-answers`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, examType, wrongAnswers })
    }).catch(err => console.warn('[Adaptive] Wrong answers write failed:', err.message));
  }

  // localStorage write — mirror D1 graduation logic client-side so UI is
  // immediately up to date without waiting for the next loadProfile() call
  const local = loadLocalProfile();
  if (!local[examType]) local[examType] = { sessions: 0, lastUpdated: null, topics: {} };
  const examProfile       = local[examType];
  examProfile.sessions   += 1;
  examProfile.lastUpdated = now;

  for (const { topic, attempts, errors, sessionScore, validationFailureRate } of sessionResults) {
    const prev = examProfile.topics[topic];

    if (!prev) {
      examProfile.topics[topic] = {
        attempts,
        errors,
        lastScore:             sessionScore,
        trend:                 'new',
        scoreHistory:          [sessionScore],
        graduatedAt:           null,
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

// ─── Exam-readiness score ─────────────────────────────────────────────────────
// Graduated topics contribute 100% accuracy to the readiness score — they are
// fully mastered and no longer drag the score down.
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

    // Graduated topics are treated as 100% accurate
    const accuracy     = isGrad ? 100 : (errorRate !== null ? Math.max(0, 100 - errorRate) : 50);
    const contribution = accuracy * weight;

    weightedSum   += contribution;
    if (errorRate !== null || isGrad) coveredWeight += weight;

    return {
      name,
      pct,
      accuracy,
      errorRate,
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
    score,
    label,
    labelColor,
    labelBg,
    coveredPct,
    breakdown,
    graduatedCount,
    sessions: examProfile?.sessions || 0,
  };
};

// ─── Build adaptive prompt context ───────────────────────────────────────────
// Graduated topics receive exactly 1 question (floor allocation) instead of
// the normal adaptive weighting. This frees up allocation for weak topics.
export const buildAdaptiveContext = (examType, numQuestions, blueprintTopics) => {
  const local       = loadLocalProfile();
  const examProfile = local[examType];
  if (!examProfile || examProfile.sessions === 0 || Object.keys(examProfile.topics).length === 0) {
    return { adaptivePromptSection: '', adaptiveSummary: null };
  }

  const scored = Object.entries(examProfile.topics).map(([name, stats]) => {
    const errorRate     = stats.attempts > 0 ? stats.errors / stats.attempts : 0;
    const recencyFactor = stats.trend === 'declining' ? 1.4 : stats.trend === 'improving' ? 0.7 : 1.0;
    const isGraduated   = !!(stats.graduatedAt);
    return {
      name,
      errorRate:             Math.round(errorRate * 100),
      trend:                 stats.trend,
      priority:              isGraduated ? -1 : errorRate * recencyFactor, // graduated always sort last
      lastScore:             stats.lastScore,
      scoreHistory:          stats.scoreHistory || [],
      validationFailureRate: stats.validationFailureRate ?? 0,
      graduated:             isGraduated,
      graduatedAt:           stats.graduatedAt || null,
    };
  }).sort((a, b) => b.priority - a.priority);

  const graduatedTopics = scored.filter(t => t.graduated);
  const activeTopics    = scored.filter(t => !t.graduated);
  const weakTopics      = activeTopics.filter(t => t.errorRate > 40);
  const strongTopics    = activeTopics.filter(t => t.errorRate <= 20 && t.trend !== 'new');
  const highValidationFailureTopics = activeTopics.filter(t => t.validationFailureRate >= 30);

  if (activeTopics.length === 0 && graduatedTopics.length === 0) {
    return { adaptivePromptSection: '', adaptiveSummary: null };
  }

  // Graduated topics: floor of 1 question each
  const graduatedAllocation = graduatedTopics.length; // 1 per graduated topic
  const remainingQuestions  = Math.max(1, numQuestions - graduatedAllocation);

  // Active topics share the remaining budget
  const baseWeight   = remainingQuestions / Math.max(activeTopics.length, 1);
  const distribution = [
    // Active topics — normal adaptive weighting on remaining budget
    ...activeTopics.map(t => {
      let count;
      if (t.errorRate > 60)                                  count = Math.ceil(baseWeight * 1.8);
      else if (t.errorRate > 40)                             count = Math.ceil(baseWeight * 1.4);
      else if (t.errorRate <= 20 && t.trend === 'improving') count = Math.floor(baseWeight * 0.6);
      else if (t.errorRate <= 20)                            count = Math.floor(baseWeight * 0.8);
      else                                                   count = Math.round(baseWeight);
      return { ...t, adaptiveCount: Math.max(1, count) };
    }),
    // Graduated topics — exactly 1 question each
    ...graduatedTopics.map(t => ({ ...t, adaptiveCount: 1 })),
  ];

  // Adjust active topics to hit exact total
  let total = distribution.reduce((s, t) => s + t.adaptiveCount, 0);
  let i = 0;
  const activeIndices = distribution.map((t, idx) => (!t.graduated ? idx : -1)).filter(idx => idx >= 0);
  while (total < numQuestions && activeIndices.length > 0) {
    distribution[activeIndices[i % activeIndices.length]].adaptiveCount++;
    total++; i++;
  }
  while (total > numQuestions) {
    const idx = distribution.slice().reverse().findIndex(t => !t.graduated && t.adaptiveCount > 1);
    if (idx >= 0) { distribution[distribution.length - 1 - idx].adaptiveCount--; total--; }
    else break;
  }

  const weakList = weakTopics.map(t =>
    `  - "${t.name}" (${t.errorRate}% error rate, trend: ${t.trend}, sessions tracked: ${t.scoreHistory.length})`
  ).join('\n');

  const graduatedList = graduatedTopics.length > 0
    ? `\nGraduated topics (mastered — receiving minimum 1 question each):\n${
        graduatedTopics.map(t => `  - "${t.name}" (graduated ${new Date(t.graduatedAt).toLocaleDateString()})`).join('\n')
      }`
    : '';

  const distList = distribution.map(t =>
    `  - "${t.name}": ${t.adaptiveCount} question${t.adaptiveCount !== 1 ? 's' : ''}${t.graduated ? ' (mastered)' : ''}`
  ).join('\n');

  const validationWarning = highValidationFailureTopics.length > 0
    ? `
GENERATION QUALITY WARNING — Based on historical validation data, the following topics
have produced high question failure rates in past sessions. Apply extra care:
${highValidationFailureTopics.map(t =>
  `  - "${t.name}": ${t.validationFailureRate}% of generated questions failed quality review`
).join('\n')}
For these topics specifically:
- Ensure the "answer" field is an EXACT character-for-character copy of one option string
- Keep all 4 options grammatically parallel and within ~10 words of each other
- Double-check that no option contains "All of the above" or "None of the above"
`
    : '';

  return {
    adaptivePromptSection: `
ADAPTIVE LEARNING CONTEXT — This candidate has taken ${examProfile.sessions} previous session(s).
Based on their rolling performance history (up to last ${SCORE_HISTORY_WINDOW} sessions), adjust question generation as follows:

Weak areas requiring extra focus (${weakTopics.length} topic${weakTopics.length !== 1 ? 's' : ''}):
${weakList || '  (none identified yet)'}
${graduatedList}
ADAPTIVE QUESTION DISTRIBUTION — follow these counts exactly:
${distList}

For weak topics (error rate > 40%):
- Vary question angles — approach from a different angle than last time
- Do NOT re-ask questions they have likely already seen
- Slightly increase conceptual depth to reinforce understanding

For mastered/graduated topics (1 question each):
- Ask a single representative question to maintain recall
- Do not over-focus — this topic is already strong
${validationWarning}`,
    adaptiveSummary: {
      sessions:       examProfile.sessions,
      weakTopics:     weakTopics.map(t  => ({ name: t.name,  errorRate: t.errorRate, trend: t.trend, scoreHistory: t.scoreHistory })),
      strongTopics:   strongTopics.map(t => ({ name: t.name, errorRate: t.errorRate, trend: t.trend, scoreHistory: t.scoreHistory })),
      graduatedTopics: graduatedTopics.map(t => ({ name: t.name, graduatedAt: t.graduatedAt })),
      highValidationFailureTopics: highValidationFailureTopics.map(t => ({
        name: t.name, validationFailureRate: t.validationFailureRate,
      })),
      distribution: distribution.map(t => ({ name: t.name, count: t.adaptiveCount, graduated: t.graduated })),
    },
  };
};

// ─── UI helpers ───────────────────────────────────────────────────────────────
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

export const getCommunityStats = async (examType) => {
  try {
    const res = await fetch(`${BASE_URL}/community?examType=${encodeURIComponent(examType)}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch { /* non-fatal */ }
  return null;
};

export const getWrongAnswerBank = async (examType, dueOnly = false) => {
  const userId = getUserId();
  try {
    const url = `${BASE_URL}/wrong-answers?userId=${encodeURIComponent(userId)}&examType=${encodeURIComponent(examType)}&dueOnly=${dueOnly}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch { /* non-fatal */ }
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
