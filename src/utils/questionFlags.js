/**
 * Question flagging: submit user flags and fetch aggregated flag patterns
 * for injection into generation prompts.
 */
import { BASE_URL } from './baseUrl';
import { getUserId } from './adaptiveStorage';

const MAX_FLAGS_PER_SESSION = 3;

/**
 * Submit a question flag to D1.
 * @param {object} params
 * @param {string} params.examType - Exam type key.
 * @param {string} params.questionHash - Hash of the flagged question.
 * @param {string} params.question - Full question text (for admin review).
 * @param {string} params.topic - Question topic.
 * @param {string} params.reason - Flag reason code ("wrong-level", "off-topic", "incorrect-answer", "ambiguous").
 * @returns {Promise<{ accepted: boolean, message: string }>}
 */
export const submitQuestionFlag = async ({ examType, questionHash, question, topic, reason }) => {
  const userId = getUserId();
  try {
    const res = await fetch(`${BASE_URL}/question-flags`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, examType, questionHash, question, topic, reason }),
      signal:  AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      return { accepted: true, message: data.message || 'Flag submitted' };
    }
    if (res.status === 429) {
      return { accepted: false, message: 'You have already flagged this question.' };
    }
    return { accepted: false, message: 'Could not submit flag. Try again later.' };
  } catch (err) {
    console.warn('[Flags] Submit failed:', err.message);
    return { accepted: false, message: 'Network error — flag not submitted.' };
  }
};

/**
 * Fetch aggregated flag patterns for a given exam type.
 * Returns topics with high flag counts to inject as warnings into the generation prompt.
 * @param {string} examType - Exam type key.
 * @returns {Promise<{ topic: string, reason: string, count: number }[]>} Flagged patterns (3+ flags from different users).
 */
export const getFlagPatterns = async (examType) => {
  try {
    const res = await fetch(
      `${BASE_URL}/question-flags/patterns?examType=${encodeURIComponent(examType)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      return data.patterns || [];
    }
  } catch (err) {
    console.warn('[Flags] Fetch patterns failed:', err.message);
  }
  return [];
};

/**
 * Build the flag-warning section for the generation prompt.
 * @param {{ topic: string, reason: string, count: number }[]} patterns - Aggregated flag patterns.
 * @returns {string} Formatted warning text, or empty string if no patterns.
 */
export function buildFlagWarningSection(patterns) {
  if (!patterns || patterns.length === 0) return '';

  const reasonLabels = {
    'wrong-level':      'wrong difficulty level',
    'off-topic':        'off-topic for this certification',
    'incorrect-answer': 'incorrect or debatable answer',
    'ambiguous':        'ambiguous or unclear wording',
  };

  const lines = patterns.map(p =>
    `  - "${p.topic}": ${p.count} user${p.count !== 1 ? 's' : ''} flagged for ${reasonLabels[p.reason] || p.reason}`
  ).join('\n');

  return `
USER FLAG WARNINGS — Real users have flagged generated questions in these areas.
Apply extra care to avoid repeating these issues:
${lines}

For flagged topics:
- Double-check that the question matches this certification's scope and level
- Ensure the correct answer is unambiguously verifiable against official docs
- Avoid borderline questions that could belong to a different certification`;
}

export { MAX_FLAGS_PER_SESSION };
