/**
 * agentExplainer.js — Week 1: Answer Explanation Agent
 *
 * Generates a concise, doc-grounded explanation for a single wrong answer.
 * Called lazily — only when the user clicks "Why was I wrong?" on a specific
 * question. Never called in bulk on page load.
 *
 * Returns:
 *   {
 *     yourAnswer:    string  — what the user picked
 *     correctAnswer: string  — the right answer
 *     explanation:   string  — why it's correct, grounded in Splunk concepts
 *     keyTakeaway:   string  — one-line summary to remember
 *     docHint:       string  — which area of Splunk docs to study
 *   }
 */

import { fetchWithRetry } from './api.js';

/**
 * Fetch an explanation for a single wrong answer.
 *
 * @param {object} params
 * @param {string} params.question       - The question text
 * @param {string} params.yourAnswer     - What the user selected (full option text)
 * @param {string} params.correctAnswer  - The correct option text
 * @param {Array}  params.allOptions     - All 4 option strings
 * @param {string} params.topic          - Blueprint topic this question covers
 * @param {string} params.examType       - e.g. "Cloud Admin"
 * @param {string} params.blueprintLevel - e.g. "Professional-Level"
 * @param {string} apiKey                - Groq API key
 * @returns {Promise<object>}            - Explanation object or error state
 */
export const fetchExplanation = async (
  { question, yourAnswer, correctAnswer, allOptions, topic, examType, blueprintLevel },
  apiKey
) => {
  if (!apiKey) {
    throw new Error('No API key available for explanation generation.');
  }

  const prompt = `You are a Splunk certification study coach explaining a wrong answer to a student.

Exam: "${examType}" (${blueprintLevel || 'Intermediate-Level'})
Topic: ${topic}

Question:
"${question}"

All options presented:
${allOptions.map((o, i) => `  ${String.fromCharCode(65 + i)}. ${o}`).join('\n')}

Student selected: "${yourAnswer}"
Correct answer:   "${correctAnswer}"

Write a clear, helpful explanation that:
1. Confirms what the correct answer is and precisely why it is correct
2. Explains why the student's choice is incorrect — what misconception it represents
3. Mentions the specific Splunk concept, component, configuration file, or behavior involved
4. Keeps the explanation focused on what a ${blueprintLevel || 'Intermediate-Level'} candidate needs to know
5. Ends with a single memorable takeaway sentence

Do NOT be condescending. Do NOT repeat the question text verbatim.
Keep total length to 3-5 sentences for the explanation, 1 sentence for the takeaway.

Return ONLY valid JSON, no markdown:
{
  "explanation": "string — 3-5 sentence explanation",
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
        max_tokens: 600
      })
    }, 2, 15000); // maxRetries=2, timeout=15s — explainer is non-critical, fail fast

    let text = response.choices?.[0]?.message?.content || '{}';
    text = text.replace(/```json|```/g, '').trim();

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object in response');

    const parsed = JSON.parse(text.substring(start, end + 1));

    return {
      explanation: parsed.explanation || 'Explanation unavailable.',
      keyTakeaway: parsed.keyTakeaway || '',
      docHint: parsed.docHint || `Review: Splunk Docs → ${topic}`
    };
  } catch (err) {
    console.error('[Explainer] Failed:', err.message);
    throw new Error('Could not generate explanation. Please try again.');
  }
};
