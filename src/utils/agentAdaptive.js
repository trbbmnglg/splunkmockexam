/**
 * agentAdaptive.js — Layer 3: Adaptive Difficulty Agent
 *
 * Now also accepts validationLog from Layer 1 (agentValidator.js).
 * Per-topic validation failure rates are stored alongside performance data
 * and fed back into buildAdaptiveContext so the prompt can warn the AI
 * which topics historically produce bad questions.
 *
 * API endpoints used:
 * GET  /api/profile?userId=&examType=  → read profile
 * POST /api/profile                    → write profile after exam
 * POST /api/wrong-answers              → persist missed questions
 * GET  /api/community?examType=        → community heatmap
 */

const LOCAL_KEY   = 'splunkAdaptiveProfile';
const USER_ID_KEY = 'splunkUserId';

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
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, examType })
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
        local[examType] = { sessions: data.sessions, lastUpdated: data.lastUpdated, topics: data.topics };
        saveLocalProfile(local);
      }
      return data;
    }
  } catch (err) {
    console.warn('[Adaptive] D1 read failed, using localStorage:', err.message);
  }
  const local = loadLocalProfile();
  const examProfile = local[examType];
  if (!examProfile) return { sessions: 0, lastUpdated: null, topics: {} };
  return examProfile;
};

// ─── Compute per-topic validation failure rates from validationLog ────────────
// validationLog shape: [{ cycle, failureCount, failureRate, failures: [{ index, topic, ... }] }]
// Returns: { [topic]: highestFailureRate (0-100) }
const computeTopicValidationFailures = (validationLog, questions) => {
  if (!validationLog || validationLog.length === 0) return {};

  // Use cycle 1 failures — that's the raw AI output before any regeneration
  const firstCycle = validationLog[0];
  if (!firstCycle || !firstCycle.failures || firstCycle.failures.length === 0) return {};

  // Map question index → topic
  const indexToTopic = {};
  questions.forEach((q, i) => { indexToTopic[i] = q.topic || 'General'; });

  // Count failures per topic
  const topicFailCounts = {};
  const topicTotalCounts = {};

  firstCycle.failures.forEach(f => {
    const topic = indexToTopic[f.index] || 'General';
    topicFailCounts[topic] = (topicFailCounts[topic] || 0) + 1;
  });

  questions.forEach(q => {
    const topic = q.topic || 'General';
    topicTotalCounts[topic] = (topicTotalCounts[topic] || 0) + 1;
  });

  // Compute failure rate per topic
  const result = {};
  for (const topic of Object.keys(topicFailCounts)) {
    const total = topicTotalCounts[topic] || 1;
    result[topic] = Math.round((topicFailCounts[topic] / total) * 100);
  }
  return result;
};

// ─── Update profile after exam ────────────────────────────────────────────────
// Now accepts optional validationLog from Layer 1 pipeline
export const updateProfile = async (examType, questions, userAnswers, validationLog = []) => {
  const userId = getUserId();

  // ── Compute session performance per topic ──────────────────────────────
  const sessionTopicStats = {};
  questions.forEach((q, idx) => {
    const topic = q.topic || 'General';
    if (!sessionTopicStats[topic]) sessionTopicStats[topic] = { attempts: 0, errors: 0 };
    sessionTopicStats[topic].attempts += 1;
    if (userAnswers[idx] !== q.correctIndex) sessionTopicStats[topic].errors += 1;
  });

  // ── Compute per-topic validation failure rates from Layer 1 ────────────
  const topicValidationFailures = computeTopicValidationFailures(validationLog, questions);
  const overallFailureRate = validationLog[0]?.failureRate ?? 0;

  const sessionResults = Object.entries(sessionTopicStats).map(([topic, stats]) => ({
    topic,
    attempts: stats.attempts,
    errors: stats.errors,
    sessionScore: Math.round(((stats.attempts - stats.errors) / stats.attempts) * 100),
    // Attach validation failure rate for this topic if available
    validationFailureRate: topicValidationFailures[topic] ?? 0
  }));

  // ── D1 write (non-blocking) ────────────────────────────────────────────
  fetch(`${BASE_URL}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, examType, sessionResults, overallFailureRate })
  }).catch(err => console.warn('[Adaptive] D1 write failed:', err.message));

  // ── Wrong answers write (non-blocking) ────────────────────────────────
  const wrongAnswers = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q, idx }) => userAnswers[idx] !== q.correctIndex)
    .map(({ q }) => ({
      topic: q.topic || 'General',
      question: q.question,
      correctAnswer: q.options[q.correctIndex]
    }));

  if (wrongAnswers.length > 0) {
    fetch(`${BASE_URL}/wrong-answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, examType, wrongAnswers })
    }).catch(err => console.warn('[Adaptive] Wrong answers write failed:', err.message));
  }

  // ── localStorage write (always) ───────────────────────────────────────
  const local = loadLocalProfile();
  if (!local[examType]) local[examType] = { sessions: 0, lastUpdated: null, topics: {} };
  const examProfile = local[examType];
  examProfile.sessions += 1;
  examProfile.lastUpdated = new Date().toISOString();

  for (const { topic, attempts, errors, sessionScore, validationFailureRate } of sessionResults) {
    const prev = examProfile.topics[topic];
    if (!prev) {
      examProfile.topics[topic] = {
        attempts,
        errors,
        lastScore: sessionScore,
        trend: 'new',
        validationFailureRate
      };
    } else {
      const prevScore = prev.lastScore ?? 50;
      let trend = 'stable';
      if (sessionScore > prevScore + 10) trend = 'improving';
      else if (sessionScore < prevScore - 10) trend = 'declining';

      // Rolling average of validation failure rate (weight current session equally)
      const prevVfr = prev.validationFailureRate ?? 0;
      const newVfr = prevVfr > 0
        ? Math.round((prevVfr + validationFailureRate) / 2)
        : validationFailureRate;

      examProfile.topics[topic] = {
        attempts: prev.attempts + attempts,
        errors: prev.errors + errors,
        lastScore: sessionScore,
        trend,
        validationFailureRate: newVfr
      };
    }
  }

  saveLocalProfile(local);
  return examProfile;
};

// ─── Build adaptive prompt context ───────────────────────────────────────────
export const buildAdaptiveContext = (examType, numQuestions, blueprintTopics) => {
  const local = loadLocalProfile();
  const examProfile = local[examType];
  if (!examProfile || examProfile.sessions === 0 || Object.keys(examProfile.topics).length === 0) {
    return { adaptivePromptSection: '', adaptiveSummary: null };
  }

  const scored = Object.entries(examProfile.topics).map(([name, stats]) => {
    const errorRate = stats.attempts > 0 ? stats.errors / stats.attempts : 0;
    const recencyFactor = stats.trend === 'declining' ? 1.4 : stats.trend === 'improving' ? 0.7 : 1.0;
    return {
      name,
      errorRate: Math.round(errorRate * 100),
      trend: stats.trend,
      priority: errorRate * recencyFactor,
      lastScore: stats.lastScore,
      validationFailureRate: stats.validationFailureRate ?? 0
    };
  }).sort((a, b) => b.priority - a.priority);

  const weakTopics = scored.filter(t => t.errorRate > 40);
  const strongTopics = scored.filter(t => t.errorRate <= 20 && t.trend !== 'new');

  // Topics that historically cause the AI to generate poor questions
  const highValidationFailureTopics = scored.filter(t => t.validationFailureRate >= 30);

  if (weakTopics.length === 0 && strongTopics.length === 0 && highValidationFailureTopics.length === 0) {
    return { adaptivePromptSection: '', adaptiveSummary: null };
  }

  const baseWeight = numQuestions / Math.max(scored.length, 1);
  const distribution = scored.map(t => {
    let count;
    if (t.errorRate > 60) count = Math.ceil(baseWeight * 1.8);
    else if (t.errorRate > 40) count = Math.ceil(baseWeight * 1.4);
    else if (t.errorRate <= 20 && t.trend === 'improving') count = Math.floor(baseWeight * 0.6);
    else if (t.errorRate <= 20) count = Math.floor(baseWeight * 0.8);
    else count = Math.round(baseWeight);
    return { ...t, adaptiveCount: Math.max(1, count) };
  });

  let total = distribution.reduce((s, t) => s + t.adaptiveCount, 0);
  let i = 0;
  while (total < numQuestions) { distribution[i % distribution.length].adaptiveCount++; total++; i++; }
  while (total > numQuestions) {
    const idx = distribution.slice().reverse().findIndex(t => t.adaptiveCount > 1);
    if (idx >= 0) { distribution[distribution.length - 1 - idx].adaptiveCount--; total--; }
    else break;
  }

  const weakList = weakTopics.map(t =>
    `  - "${t.name}" (${t.errorRate}% error rate, trend: ${t.trend})`
  ).join('\n');

  const distList = distribution.map(t =>
    `  - "${t.name}": ${t.adaptiveCount} question${t.adaptiveCount !== 1 ? 's' : ''}`
  ).join('\n');

  // ── Layer 1 → Layer 3 cross-layer signal ──────────────────────────────
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
Based on their performance history, adjust question generation as follows:

Weak areas requiring extra focus (${weakTopics.length} topic${weakTopics.length !== 1 ? 's' : ''}):
${weakList || '  (none identified yet)'}

ADAPTIVE QUESTION DISTRIBUTION — follow these counts instead of the blueprint defaults:
${distList}

For weak topics (error rate > 40%):
- Vary question angles — approach from a different angle than last time
- Do NOT re-ask questions they have likely already seen
- Slightly increase conceptual depth to reinforce understanding

For strong topics (error rate ≤ 20%, improving trend):
- Maintain coverage but reduce count as shown above
${validationWarning}`,
    adaptiveSummary: {
      sessions: examProfile.sessions,
      weakTopics: weakTopics.map(t => ({ name: t.name, errorRate: t.errorRate, trend: t.trend })),
      strongTopics: strongTopics.map(t => ({ name: t.name, errorRate: t.errorRate, trend: t.trend })),
      highValidationFailureTopics: highValidationFailureTopics.map(t => ({
        name: t.name,
        validationFailureRate: t.validationFailureRate
      })),
      distribution: distribution.map(t => ({ name: t.name, count: t.adaptiveCount }))
    }
  };
};

// ─── UI helpers ───────────────────────────────────────────────────────────────
export const getProfileSummary = (examType) => {
  const local = loadLocalProfile();
  const examProfile = local[examType];
  if (!examProfile) return null;
  const topics = Object.entries(examProfile.topics).map(([name, stats]) => ({
    name,
    lastScore: stats.lastScore,
    attempts: stats.attempts,
    errors: stats.errors,
    trend: stats.trend,
    validationFailureRate: stats.validationFailureRate ?? 0,
    errorRate: stats.attempts > 0 ? Math.round((stats.errors / stats.attempts) * 100) : 0
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
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, examType, questionHashes })
  }).catch(err => console.warn('[Adaptive] Clear reviewed answers failed:', err.message));
};
