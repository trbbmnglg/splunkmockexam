/**
 * Pure helper functions for useExamSession — no React, no state, no side effects.
 */
import {
  SECONDS_PER_QUESTION,
  FUZZY_MATCH_THRESHOLD,
  MAX_QUESTION_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_DOCSOURCE_LENGTH,
  FETCH_TIMEOUT_MS,
} from '../utils/constants';
import { getUserId } from '../utils/agentAdaptive';
import { normalizeString, clampString } from '../utils/helpers';

/**
 * Build 4 options from a correct answer + random distractors.
 * @param {string} correctAnswer - The correct answer text.
 * @returns {string[]} Array of 4 options (correct + 3 distractors, unshuffled).
 */
export function shuffleWithCorrect(correctAnswer) {
  const distractors = [
    'This is configured automatically by Splunk at startup',
    'This setting is managed exclusively through the Splunk Web UI',
    'This requires a restart of the Splunk service to take effect',
    'This is handled by the deployment server and cannot be manually set',
    'This option is only available in Splunk Cloud, not Splunk Enterprise',
    'This is defined in the outputs.conf file, not the inputs.conf file',
  ];
  const picked = distractors
    .filter(d => d.toLowerCase() !== correctAnswer.toLowerCase())
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return [correctAnswer, ...picked];
}

/**
 * Fetch RAG documentation passages for grounding question generation.
 * @param {string} baseUrl - API base URL.
 * @param {string} type - Exam type.
 * @param {string[]} topics - Selected topics.
 * @returns {Promise<object[]>} Array of passage objects, or empty array on failure.
 */
export async function fetchDocPassages(baseUrl, type, topics) {
  try {
    const topicParams = topics.length > 0
      ? topics.map(t => `topics[]=${encodeURIComponent(t)}`).join('&')
      : '';
    const url = `${baseUrl}/retrieve?examType=${encodeURIComponent(type)}${topicParams ? '&' + topicParams : ''}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (res.ok) return (await res.json()).passages || [];
  } catch (err) {
    console.warn('[Layer2] Doc retrieval failed, continuing without RAG:', err.message);
  }
  return [];
}

/**
 * Check and increment the shared-key usage counter. Returns whether the user is allowed to proceed.
 * @param {string} baseUrl - API base URL.
 * @returns {Promise<{ allowed: boolean, remaining: number|null, message?: string }>}
 */
export async function checkAndIncrementUsage(baseUrl) {
  try {
    const userId = getUserId();
    const res = await fetch(`${baseUrl}/usage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId }),
      signal:  AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status === 429) {
      const data = await res.json();
      let parsed = {};
      try { parsed = JSON.parse(data.error); } catch { parsed = data; }
      const resetTime = parsed.resetAt
        ? new Date(parsed.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
        : 'midnight UTC';
      return {
        allowed: false,
        message: `You've reached the daily limit of 10 free exams (resets at ${resetTime}).\n\nTo keep practising, add your own free Groq API key in Advanced Settings — it takes 30 seconds to get one at console.groq.com/keys`,
      };
    }
    if (res.ok) {
      const data = await res.json();
      return { allowed: true, remaining: data.remaining };
    }
    return { allowed: true, remaining: null };
  } catch {
    return { allowed: true, remaining: null };
  }
}

/**
 * Sanitise and shuffle a raw AI-generated question into a safe, randomised form.
 * Handles missing/malformed fields, clamps string lengths, and performs
 * exact + fuzzy answer matching against the shuffled options.
 *
 * @param {object} q - Raw question object from the AI provider.
 * @returns {object} Sanitised question with `correctIndex`, clamped fields, and shuffled options.
 */
export function randomizeQuestion(q) {
  const safeQuestion = clampString(typeof q.question === 'string' ? q.question : JSON.stringify(q?.question || 'Missing question text'), MAX_QUESTION_LENGTH);
  const safeAnswer   = clampString(typeof q.answer   === 'string' ? q.answer   : JSON.stringify(q?.answer   || 'Missing answer text'), MAX_OPTION_LENGTH);

  let safeOptions = q.options;
  if (!Array.isArray(safeOptions)) {
    safeOptions = (typeof safeOptions === 'object' && safeOptions !== null)
      ? Object.values(safeOptions)
      : [String(safeOptions || 'Option A'), 'Option B', 'Option C', 'Option D'];
  }
  safeOptions = safeOptions.map(opt => clampString(typeof opt === 'string' ? opt : JSON.stringify(opt || ''), MAX_OPTION_LENGTH));
  while (safeOptions.length < 4) safeOptions.push(`Dummy Option ${safeOptions.length + 1}`);

  const shuffledOptions = [...safeOptions].sort(() => Math.random() - 0.5);

  // 1st pass: exact normalize match
  let correctIndex = shuffledOptions.findIndex(opt => normalizeString(opt) === normalizeString(safeAnswer));

  // 2nd pass: fuzzy — find option with most shared words (handles model rewording)
  if (correctIndex === -1) {
    const answerWords = new Set(normalizeString(safeAnswer).split(/\s+/));
    const scores = shuffledOptions.map(opt => {
      const optWords = normalizeString(opt).split(/\s+/);
      const shared = optWords.filter(w => answerWords.has(w)).length;
      return shared / Math.max(answerWords.size, optWords.length);
    });
    const best = scores.indexOf(Math.max(...scores));
    if (scores[best] >= FUZZY_MATCH_THRESHOLD) {
      console.info('[Question] Fuzzy matched answer:', safeAnswer, '→', shuffledOptions[best], `(${Math.round(scores[best]*100)}%)`);
      correctIndex = best;
    } else {
      console.warn('[Question] Answer-option mismatch (fuzzy also failed):', safeAnswer, '| options:', shuffledOptions, '| scores:', scores);
    }
  }

  return {
    ...q,
    question:     safeQuestion,
    options:      shuffledOptions,
    correctIndex: correctIndex !== -1 ? correctIndex : 0,
    answer:       shuffledOptions[correctIndex !== -1 ? correctIndex : 0],
    topic:        clampString(typeof q.topic     === 'string' ? q.topic     : JSON.stringify(q?.topic     || 'General'), MAX_TOPIC_LENGTH),
    docSource:    clampString(typeof q.docSource === 'string' ? q.docSource : '', MAX_DOCSOURCE_LENGTH),
  };
}
