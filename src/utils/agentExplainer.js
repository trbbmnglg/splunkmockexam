/**
 * agentExplainer.js — Answer Explanation Agent
 *
 * Generates a concise, doc-grounded explanation for a single wrong answer.
 * Called lazily — only when the user clicks "Why?" on a specific question.
 *
 * Depth escalates automatically based on times_missed from D1:
 *   1 miss  → basic: clear surface explanation of the correct answer
 *   2 misses → detailed: goes deeper into the underlying mechanism
 *   3+ misses → deep: first-principles reasoning with analogy and real scenario
 *
 * Returns:
 *   {
 *     explanation:   string  — why the correct answer is correct
 *     keyTakeaway:   string  — one memorable sentence
 *     docHint:       string  — which Splunk docs area to study
 *   }
 */

import { fetchWithRetry } from './api.js';

/**
 * @param {object} params
 * @param {string} params.question
 * @param {string} params.yourAnswer
 * @param {string} params.correctAnswer
 * @param {Array}  params.allOptions
 * @param {string} params.topic
 * @param {string} params.examType
 * @param {string} params.blueprintLevel
 * @param {number} params.timesMissed     — from D1 wrong_answers.times_missed, defaults to 1
 * @param {string} apiKey
 */
export const fetchExplanation = async (
  { question, yourAnswer, correctAnswer, allOptions, topic, examType, blueprintLevel, timesMissed = 1 },
  apiKey
) => {
  if (!apiKey) {
    throw new Error('No API key available for explanation generation.');
  }

  // ── Depth tier based on how many times this concept has been missed ──────
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
- Keep it to 5-6 sentences — this is a persistent gap that needs a lasting explanation`
  };

  const prompt = `You are a Splunk certification study coach explaining a wrong answer to a student.

Exam: "${examType}" (${blueprintLevel || 'Intermediate-Level'})
Topic: ${topic}
Times this concept has been missed: ${timesMissed}
Explanation depth required: ${depthTier.toUpperCase()}

Question:
"${question}"

All options presented:
${allOptions.map((o, i) => `  ${String.fromCharCode(65 + i)}. ${o}`).join('\n')}

Student selected: "${yourAnswer}"
Correct answer:   "${correctAnswer}"

INSTRUCTIONS FOR THIS EXPLANATION (${depthTier} depth):
${depthInstructions[depthTier]}

Do NOT be condescending. Do NOT repeat the question text verbatim.
End with one memorable takeaway sentence starting with "Remember:".

Return ONLY valid JSON, no markdown:
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
            content: 'You are a Splunk certification study coach. Return only valid JSON, no markdown fences.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: depthTier === 'deep' ? 800 : depthTier === 'detailed' ? 700 : 600
      })
    }, 2, 15000);

    let text = response.choices?.[0]?.message?.content || '{}';
    text = text.replace(/```json|```/g, '').trim();

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object in response');

    const parsed = JSON.parse(text.substring(start, end + 1));

    return {
      explanation: parsed.explanation || 'Explanation unavailable.',
      keyTakeaway: parsed.keyTakeaway || '',
      docHint: parsed.docHint || `Review: Splunk Docs → ${topic}`,
      depthTier // pass back so UI can show what tier was used if needed
    };
  } catch (err) {
    console.error('[Explainer] Failed:', err.message);
    throw new Error('Could not generate explanation. Please try again.');
  }
};
