/**
 * agentExplainer.js — Answer Explanation Agent
 *
 * Generates a concise, doc-grounded explanation for a single wrong answer.
 * Called lazily — only when the user clicks "Why?" on a specific question.
 *
 * RAG grounding:
 *   Before calling the LLM, retrieves the most relevant Splunk doc passage
 *   from Vectorize via /api/retrieve for this topic. The passage is injected
 *   directly into the explanation prompt so the answer is anchored to real
 *   documentation text, not just LLM memory.
 *   Falls back gracefully to LLM-only if retrieval fails or returns nothing.
 *
 * Depth escalation:
 *   1 miss  → basic
 *   2 misses → detailed
 *   3+ misses → first-principles with analogy
 */

import { fetchWithRetry } from './api.js';

const BASE_URL = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development'
  ? '/api'
  : 'https://splunkmockexam.gtaad-innovations.com/api';

// ─── retrievePassageForTopic ──────────────────────────────────────────────────
async function retrievePassageForTopic(topic, examType) {
  try {
    const params = new URLSearchParams({
      examType,
      'topics[]': topic,
    });
    const res = await fetch(`${BASE_URL}/retrieve?${params}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const passages = data.passages || [];

    const best = passages.find(p => p.text && p.text.trim().length > 50 && !p.text.includes('googletagmanager') && !p.text.includes('display:none'));
    if (!best) return null;

    return {
      text:  best.text.slice(0, 800).trim(),
      url:   best.url || '',
      score: best.score,
    };
  } catch {
    return null;
  }
}

// ─── safeJsonParse ────────────────────────────────────────────────────────────
// JSON.parse is strict: literal newlines/tabs inside string values are invalid.
// Models sometimes emit these anyway. This function sanitizes before parsing.
function safeJsonParse(text) {
  // Step 1: strip markdown fences
  let cleaned = text.replace(/```json|```/gi, '').trim();

  // Step 2: extract the JSON object boundaries
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in response');
  cleaned = cleaned.substring(start, end + 1);

  // Step 3: try parsing as-is (fast path — usually works)
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Step 4: sanitize bare control characters inside string values.
    // These are never valid in JSON strings and models occasionally emit them.
    const sanitized = cleaned
      .replace(/\r\n/g, '\\n')  // Windows line endings
      .replace(/\r/g, '\\n')    // Old Mac line endings
      .replace(/\n/g, '\\n')    // Unix line endings
      .replace(/\t/g, '\\t');   // Tabs

    return JSON.parse(sanitized);
  }
}

// ─── fetchExplanation ─────────────────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.question
 * @param {string} params.yourAnswer
 * @param {string} params.correctAnswer
 * @param {Array}  params.allOptions
 * @param {string} params.topic
 * @param {string} params.examType
 * @param {string} params.blueprintLevel
 * @param {number} params.timesMissed     — from D1 wrong_answers.times_missed
 * @param {string} params.docSource       — URL from question generation (may be empty)
 * @param {string} apiKey
 */
export const fetchExplanation = async (
  { question, yourAnswer, correctAnswer, allOptions, topic, examType, blueprintLevel, timesMissed = 1, docSource = '' },
  apiKey
) => {
  if (!apiKey) {
    throw new Error('No API key available for explanation generation.');
  }

  // ── Depth tier ──────────────────────────────────────────────────────────────
  const depthTier = timesMissed >= 3 ? 'deep' : timesMissed >= 2 ? 'detailed' : 'basic';

  const depthInstructions = {
    basic: `Write a clear, accessible explanation suitable for a first encounter with this concept.
- Confirm what the correct answer is and precisely why it is correct
- Explain why the student's choice is incorrect and what misconception it reflects
- Mention the specific Splunk concept, component, or configuration involved
- Keep it to 3-4 sentences total — concise and direct`,

    detailed: `The student has missed this concept before. Go deeper than a surface explanation.
- Explain the underlying mechanism, not just the surface answer
- Describe WHY Splunk works this way — the design reason behind the behavior
- Contrast the correct answer against the wrong choice with specific technical detail
- If relevant, mention what would actually happen if you used the wrong answer in practice
- Keep it to 4-5 sentences — more thorough than a first explanation`,

    deep: `The student has missed this concept ${timesMissed} times. Explain it from first principles.
- Start from the foundational concept this question is testing, then build up to the answer
- Use a concrete real-world Splunk scenario or analogy to make it memorable
- Explain the misconception explicitly — why this particular wrong answer is an understandable mistake
- Give the student a mental model they can use to answer similar questions in the future
- Keep it to 5-6 sentences — this is a persistent gap that needs a lasting explanation`,
  };

  // ── RAG retrieval ───────────────────────────────────────────────────────────
  const ragPassage = await retrievePassageForTopic(topic, examType);

  // ── Build prompt ────────────────────────────────────────────────────────────
  const ragSection = ragPassage
    ? `\nREFERENCE DOCUMENTATION — Ground your explanation in this official Splunk doc excerpt:\n---\n${ragPassage.text}\n---\nSource: ${ragPassage.url || docSource || 'Splunk documentation'}\n\nYour explanation MUST be consistent with this documentation. If the correct answer is supported by the passage above, reference what the doc says. Do not contradict the documentation.\n`
    : (docSource
        ? `\nNote: This question is sourced from: ${docSource}\n`
        : '');

  const prompt = `You are a Splunk certification study coach explaining a wrong answer to a student.

Exam: "${examType}" (${blueprintLevel || 'Intermediate-Level'})
Topic: ${topic}
Times this concept has been missed: ${timesMissed}
Explanation depth required: ${depthTier.toUpperCase()}
${ragSection}
Question:
"${question}"

All options presented:
${allOptions.map((o, i) => `  ${String.fromCharCode(65 + i)}. ${o}`).join('\n')}

Student selected: "${yourAnswer}"
Correct answer:   "${correctAnswer}"

INSTRUCTIONS FOR THIS EXPLANATION (${depthTier} depth):
${depthInstructions[depthTier]}

Do NOT be condescending. Do NOT repeat the question text verbatim.
${ragPassage ? 'Reference the documentation excerpt above where relevant.' : ''}
End with one memorable takeaway sentence starting with "Remember:".

CRITICAL: Return ONLY valid JSON. Every string value must be on a single line — do not put literal newline characters inside any string value. Use \\n if you need line breaks within a string.

{
  "explanation": "string — explanation at ${depthTier} depth",
  "keyTakeaway": "string — one memorable sentence starting with 'Remember:'",
  "docHint": "string — e.g. 'Review: Splunk Docs → Getting Data In → Forwarder Configuration'"
}`;

  try {
    const response = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a Splunk certification study coach. Return only valid JSON with no markdown fences. All string values must be single-line — never include literal newline characters inside a JSON string value.',
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: depthTier === 'deep' ? 900 : depthTier === 'detailed' ? 800 : 650,
      })
    }, 2, 15000);

    const text = response.choices?.[0]?.message?.content || '{}';

    // safeJsonParse handles unescaped control characters that models sometimes
    // emit inside JSON string values, causing standard JSON.parse to throw.
    const parsed = safeJsonParse(text);

    const resolvedDocUrl = ragPassage?.url || docSource || '';

    return {
      explanation: parsed.explanation || 'Explanation unavailable.',
      keyTakeaway: parsed.keyTakeaway || '',
      docHint:     parsed.docHint     || `Review: Splunk Docs → ${topic}`,
      docSource:   resolvedDocUrl,
      depthTier,
      ragGrounded: !!ragPassage,
    };
  } catch (err) {
    console.error('[Explainer] Failed:', err.message);
    throw new Error('Could not generate explanation. Please try again.');
  }
};
