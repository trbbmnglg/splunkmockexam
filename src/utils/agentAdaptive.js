/**
 * agentAdaptive.js — Layer 3: Adaptive Difficulty Agent
 *
 * Tracks performance across sessions and autonomously adjusts the
 * next exam's topic distribution and difficulty based on the
 * candidate's persistent weak areas.
 *
 * Data is stored in localStorage under key: "splunkAdaptiveProfile"
 *
 * Profile shape:
 * {
 *   [examType]: {
 *     sessions: number,
 *     lastUpdated: ISO string,
 *     topics: {
 *       [topicName]: {
 *         attempts: number,       — total questions seen
 *         errors:   number,       — total questions missed
 *         lastScore: number,      — % correct in most recent session (0-100)
 *         trend: 'improving' | 'stable' | 'declining' | 'new'
 *       }
 *     }
 *   }
 * }
 */

const STORAGE_KEY = 'splunkAdaptiveProfile';

// ─── Storage helpers ─────────────────────────────────────────────────────────
export const loadProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveProfile = (profile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[Adaptive] Could not save profile:', err.message);
  }
};

export const clearProfile = (examType) => {
  const profile = loadProfile();
  if (examType) {
    delete profile[examType];
  } else {
    Object.keys(profile).forEach(k => delete profile[k]);
  }
  saveProfile(profile);
};

// ─── Update profile after an exam session ───────────────────────────────────
/**
 * Called after exam submission with the results data.
 *
 * @param {string} examType
 * @param {Array}  questions     - The full question set
 * @param {Object} userAnswers   - { questionIndex: selectedOptionIndex }
 */
export const updateProfile = (examType, questions, userAnswers) => {
  const profile = loadProfile();
  if (!profile[examType]) {
    profile[examType] = { sessions: 0, lastUpdated: null, topics: {} };
  }

  const examProfile = profile[examType];
  examProfile.sessions += 1;
  examProfile.lastUpdated = new Date().toISOString();

  // Tally per-topic results for this session
  const sessionTopicStats = {};
  questions.forEach((q, idx) => {
    const topic = q.topic || 'General';
    if (!sessionTopicStats[topic]) sessionTopicStats[topic] = { attempts: 0, errors: 0 };
    sessionTopicStats[topic].attempts += 1;
    if (userAnswers[idx] !== q.correctIndex) {
      sessionTopicStats[topic].errors += 1;
    }
  });

  // Merge session stats into persistent profile
  for (const [topic, stats] of Object.entries(sessionTopicStats)) {
    const prev = examProfile.topics[topic];
    const sessionScore = Math.round(((stats.attempts - stats.errors) / stats.attempts) * 100);

    if (!prev) {
      examProfile.topics[topic] = {
        attempts: stats.attempts,
        errors: stats.errors,
        lastScore: sessionScore,
        trend: 'new'
      };
    } else {
      const prevScore = prev.lastScore ?? 50;
      let trend = 'stable';
      if (sessionScore > prevScore + 10) trend = 'improving';
      else if (sessionScore < prevScore - 10) trend = 'declining';

      examProfile.topics[topic] = {
        attempts: prev.attempts + stats.attempts,
        errors: prev.errors + stats.errors,
        lastScore: sessionScore,
        trend
      };
    }
  }

  saveProfile(profile);
  return examProfile;
};

// ─── Build adaptive context for the prompt ───────────────────────────────────
/**
 * Returns a string to inject into the generation prompt that tells the AI
 * how to weight questions based on the candidate's history.
 *
 * @param {string} examType
 * @param {number} numQuestions
 * @param {Array}  blueprintTopics  - from EXAM_BLUEPRINTS[examType].topics
 * @returns {{ adaptivePromptSection: string, adaptiveSummary: object }}
 */
export const buildAdaptiveContext = (examType, numQuestions, blueprintTopics) => {
  const profile = loadProfile();
  const examProfile = profile[examType];

  // No history yet — return empty (first session runs normally)
  if (!examProfile || examProfile.sessions === 0 || Object.keys(examProfile.topics).length === 0) {
    return {
      adaptivePromptSection: '',
      adaptiveSummary: null
    };
  }

  const topicStats = examProfile.topics;

  // Score each topic: lower score = higher priority weight
  const scored = Object.entries(topicStats).map(([name, stats]) => {
    const errorRate = stats.attempts > 0 ? stats.errors / stats.attempts : 0;
    const recencyFactor = stats.trend === 'declining' ? 1.4
      : stats.trend === 'stable' ? 1.0
      : stats.trend === 'improving' ? 0.7
      : 1.0; // 'new'
    const priority = errorRate * recencyFactor;
    return { name, errorRate: Math.round(errorRate * 100), trend: stats.trend, priority, lastScore: stats.lastScore };
  }).sort((a, b) => b.priority - a.priority);

  const weakTopics = scored.filter(t => t.errorRate > 40);
  const strongTopics = scored.filter(t => t.errorRate <= 20 && t.trend !== 'new');
  const newTopics = scored.filter(t => t.trend === 'new');

  if (weakTopics.length === 0 && strongTopics.length === 0) {
    return { adaptivePromptSection: '', adaptiveSummary: null };
  }

  // Build adaptive distribution — boost weak, reduce strong
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

  // Normalize to exactly numQuestions
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

  const adaptivePromptSection = `
ADAPTIVE LEARNING CONTEXT — This candidate has taken ${examProfile.sessions} previous session(s).
Based on their performance history, adjust question generation as follows:

Weak areas requiring extra focus (${weakTopics.length} topic${weakTopics.length !== 1 ? 's' : ''}):
${weakList || '  (none identified yet)'}

ADAPTIVE QUESTION DISTRIBUTION — follow these counts instead of the blueprint defaults:
${distList}

For weak topics (error rate > 40%):
- Vary question angles — if they missed concept A last time, test concept B within the same topic
- Do NOT re-ask questions they have likely already seen; approach the topic from a different angle
- Slightly increase conceptual depth to reinforce understanding, not just recall

For strong topics (error rate ≤ 20%, improving trend):
- Maintain coverage but reduce count as shown above
- Keep difficulty appropriate — do not make these trivially easy`;

  return {
    adaptivePromptSection,
    adaptiveSummary: {
      sessions: examProfile.sessions,
      weakTopics: weakTopics.map(t => ({ name: t.name, errorRate: t.errorRate, trend: t.trend })),
      strongTopics: strongTopics.map(t => ({ name: t.name, errorRate: t.errorRate, trend: t.trend })),
      distribution: distribution.map(t => ({ name: t.name, count: t.adaptiveCount }))
    }
  };
};

// ─── UI helper: get a readable summary of the adaptive profile ───────────────
export const getProfileSummary = (examType) => {
  const profile = loadProfile();
  const examProfile = profile[examType];
  if (!examProfile) return null;

  const topics = Object.entries(examProfile.topics).map(([name, stats]) => ({
    name,
    lastScore: stats.lastScore,
    attempts: stats.attempts,
    errors: stats.errors,
    trend: stats.trend,
    errorRate: stats.attempts > 0 ? Math.round((stats.errors / stats.attempts) * 100) : 0
  })).sort((a, b) => b.errorRate - a.errorRate);

  return {
    examType,
    sessions: examProfile.sessions,
    lastUpdated: examProfile.lastUpdated,
    topics
  };
};
