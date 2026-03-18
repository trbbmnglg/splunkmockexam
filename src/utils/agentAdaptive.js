/**
 * agentAdaptive.js — Layer 3: Adaptive Difficulty Agent
 *
 * Week 2 upgrade: profile data now persists to Cloudflare D1 via the Worker
 * API. localStorage is kept as a fallback — if the API is unreachable, the
 * tool works exactly as before. On new devices, D1 is the source of truth.
 *
 * API endpoints used:
 *   GET  /api/profile?userId=&examType=  → read profile
 *   POST /api/profile                    → write profile after exam
 *   POST /api/wrong-answers              → persist missed questions
 *   GET  /api/community?examType=        → community heatmap
 */

const LOCAL_KEY   = 'splunkAdaptiveProfile';
const USER_ID_KEY = 'splunkUserId';

// ─── User ID — anonymous persistent UUID ─────────────────────────────────────
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

// ─── localStorage helpers (fallback) ─────────────────────────────────────────
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
  fetch('/api/profile', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, examType })
  }).catch(() => {});
  const local = loadLocalProfile();
  if (examType) delete local[examType];
  else Object.keys(local).forEach(k => delete local[k]);
  saveLocalProfile(local);
};

// ─── Load profile — D1 first, localStorage fallback ─────────────────────────
export const loadProfile = async (examType) => {
  const userId = getUserId();
  try {
    const res = await fetch(
      `/api/profile?userId=${encodeURIComponent(userId)}&examType=${encodeURIComponent(examType)}`,
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

// ─── Update profile after exam ───────────────────────────────────────────────
export const updateProfile = async (examType, questions, userAnswers) => {
  const userId = getUserId();
  const sessionTopicStats = {};
  questions.forEach((q, idx) => {
    const topic = q.topic || 'General';
    if (!sessionTopicStats[topic]) sessionTopicStats[topic] = { attempts: 0, errors: 0 };
    sessionTopicStats[topic].attempts += 1;
    if (userAnswers[idx] !== q.correctIndex) sessionTopicStats[topic].errors += 1;
  });

  const sessionResults = Object.entries(sessionTopicStats).map(([topic, stats]) => ({
    topic,
    attempts: stats.attempts,
    errors: stats.errors,
    sessionScore: Math.round(((stats.attempts - stats.errors) / stats.attempts) * 100)
  }));

  // D1 write (non-blocking)
  fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, examType, sessionResults })
  }).catch(err => console.warn('[Adaptive] D1 write failed:', err.message));

  // Wrong answers write (non-blocking)
  const wrongAnswers = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q, idx }) => userAnswers[idx] !== q.correctIndex)
    .map(({ q }) => ({
      topic: q.topic || 'General',
      question: q.question,
      correctAnswer: q.options[q.correctIndex]
    }));

  if (wrongAnswers.length > 0) {
    fetch('/api/wrong-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, examType, wrongAnswers })
    }).catch(err => console.warn('[Adaptive] Wrong answers write failed:', err.message));
  }

  // localStorage fallback write (always)
  const local = loadLocalProfile();
  if (!local[examType]) local[examType] = { sessions: 0, lastUpdated: null, topics: {} };
  const examProfile = local[examType];
  examProfile.sessions += 1;
  examProfile.lastUpdated = new Date().toISOString();

  for (const { topic, attempts, errors, sessionScore } of sessionResults) {
    const prev = examProfile.topics[topic];
    if (!prev) {
      examProfile.topics[topic] = { attempts, errors, lastScore: sessionScore, trend: 'new' };
    } else {
      const prevScore = prev.lastScore ?? 50;
      let trend = 'stable';
      if (sessionScore > prevScore + 10) trend = 'improving';
      else if (sessionScore < prevScore - 10) trend = 'declining';
      examProfile.topics[topic] = {
        attempts: prev.attempts + attempts,
        errors: prev.errors + errors,
        lastScore: sessionScore,
        trend
      };
    }
  }
  saveLocalProfile(local);
  return examProfile;
};

// ─── Build adaptive prompt context (synchronous — reads localStorage cache) ──
export const buildAdaptiveContext = (examType, numQuestions, blueprintTopics) => {
  const local = loadLocalProfile();
  const examProfile = local[examType];
  if (!examProfile || examProfile.sessions === 0 || Object.keys(examProfile.topics).length === 0) {
    return { adaptivePromptSection: '', adaptiveSummary: null };
  }

  const scored = Object.entries(examProfile.topics).map(([name, stats]) => {
    const errorRate = stats.attempts > 0 ? stats.errors / stats.attempts : 0;
    const recencyFactor = stats.trend === 'declining' ? 1.4 : stats.trend === 'improving' ? 0.7 : 1.0;
    return { name, errorRate: Math.round(errorRate * 100), trend: stats.trend, priority: errorRate * recencyFactor, lastScore: stats.lastScore };
  }).sort((a, b) => b.priority - a.priority);

  const weakTopics = scored.filter(t => t.errorRate > 40);
  const strongTopics = scored.filter(t => t.errorRate <= 20 && t.trend !== 'new');
  if (weakTopics.length === 0 && strongTopics.length === 0) return { adaptivePromptSection: '', adaptiveSummary: null };

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

  const weakList = weakTopics.map(t => `  - "${t.name}" (${t.errorRate}% error rate, trend: ${t.trend})`).join('\n');
  const distList = distribution.map(t => `  - "${t.name}": ${t.adaptiveCount} question${t.adaptiveCount !== 1 ? 's' : ''}`).join('\n');

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
- Maintain coverage but reduce count as shown above`,
    adaptiveSummary: {
      sessions: examProfile.sessions,
      weakTopics: weakTopics.map(t => ({ name: t.name, errorRate: t.errorRate, trend: t.trend })),
      strongTopics: strongTopics.map(t => ({ name: t.name, errorRate: t.errorRate, trend: t.trend })),
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
    name, lastScore: stats.lastScore, attempts: stats.attempts, errors: stats.errors,
    trend: stats.trend,
    errorRate: stats.attempts > 0 ? Math.round((stats.errors / stats.attempts) * 100) : 0
  })).sort((a, b) => b.errorRate - a.errorRate);
  return { examType, sessions: examProfile.sessions, lastUpdated: examProfile.lastUpdated, topics };
};

export const getCommunityStats = async (examType) => {
  try {
    const res = await fetch(`/api/community?examType=${encodeURIComponent(examType)}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch { /* non-fatal */ }
  return null;
};

export const getWrongAnswerBank = async (examType, dueOnly = false) => {
  const userId = getUserId();
  try {
    const url = `/api/wrong-answers?userId=${encodeURIComponent(userId)}&examType=${encodeURIComponent(examType)}&dueOnly=${dueOnly}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch { /* non-fatal */ }
  return { wrongAnswers: [], dueCount: 0 };
};

// ─── Clear reviewed wrong answers from D1 after review session ───────────────
export const clearReviewedAnswers = (examType, questionHashes) => {
  const userId = getUserId();
  fetch('/api/wrong-answers', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, examType, questionHashes })
  }).catch(err => console.warn('[Adaptive] Clear reviewed answers failed:', err.message));
};
