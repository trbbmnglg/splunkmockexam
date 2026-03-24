/**
 * Validation utilities: answer-option matching, docSource filtering,
 * response parsing, and AI-based submission validation.
 */
import { DEFAULT_GROQ_KEY } from './apiConfig';
import { fetchWithRetry } from './apiFetch';
import { normalizeString } from './helpers';

/**
 * Ensure each question's `answer` field exactly matches one of its `options`.
 * Falls back to normalized string comparison when an exact match isn't found.
 * @param {object[]} questions - Array of raw question objects from the AI provider.
 * @returns {object[]} Questions with corrected `answer` fields where possible.
 */
export const validateAnswerOptions = (questions) => {
  return questions.map(q => {
    if (!Array.isArray(q.options) || q.options.length !== 4) return q;
    if (q.options.includes(q.answer)) return q;
    const normAnswer = normalizeString(q.answer || '');
    const matchedOption = q.options.find(o => normalizeString(o || '') === normAnswer);
    if (matchedOption) return { ...q, answer: matchedOption };
    console.warn(`[API] Answer-option mismatch after schema parse: "${q.answer}" not in options`);
    return q;
  });
};

/**
 * Strip any `docSource` URL that wasn't present in the injected RAG passages.
 * Prevents the AI from hallucinating documentation URLs.
 * @param {object[]} questions - Array of question objects.
 * @param {object[]} passages - RAG passages that were injected into the prompt.
 * @returns {object[]} Questions with invalid docSource fields cleared to empty string.
 */
export const filterDocSources = (questions, passages) => {
  if (!passages || passages.length === 0) {
    return questions.map(q => ({ ...q, docSource: '' }));
  }

  const validUrls = new Set(passages.map(p => p.url).filter(Boolean));

  return questions.map(q => {
    const src = q.docSource || '';
    if (!src) return q;
    if (validUrls.has(src)) return q;

    const looseMatch = [...validUrls].some(u => src.startsWith(u) || u.startsWith(src));
    if (looseMatch) return q;

    console.info(`[API] docSource filtered (not in injected passages): "${src}"`);
    return { ...q, docSource: '' };
  });
};

/**
 * Parse a questions array from an AI provider's response text.
 * Tries three strategies in order: direct object access, JSON.parse, and regex extraction.
 * @param {string|object} text - Raw response content (string or pre-parsed object).
 * @param {object} [trace] - Optional mutable trace to record which parse strategy succeeded.
 * @returns {object[]|null} Array of question objects, or null if parsing fails entirely.
 */
export const parseQuestionsFromResponse = (text, trace) => {
  if (typeof text === 'object' && text !== null) {
    const arr = text.questions ?? (Array.isArray(text) ? text : null);
    if (arr) {
      if (trace) trace.parseStrategy = 'schema';
      return arr;
    }
  }

  try {
    const cleaned = (text || '').replace(/```json|```/gi, '').trim();
    const parsed  = JSON.parse(cleaned);
    if (parsed?.questions && Array.isArray(parsed.questions)) {
      if (trace) trace.parseStrategy = 'json_object';
      return parsed.questions;
    }
    if (Array.isArray(parsed)) {
      if (trace) trace.parseStrategy = 'json_object';
      return parsed;
    }
  } catch (_) { /* fall through */ }

  const str = typeof text === 'string' ? text : JSON.stringify(text || '');
  const cleaned = str.replace(/```json|```/gi, '').trim();
  const start   = cleaned.indexOf('[');
  const end     = cleaned.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try {
      const arr = JSON.parse(cleaned.substring(start, end + 1));
      if (Array.isArray(arr)) {
        if (trace) trace.parseStrategy = 'regex_fallback';
        return arr;
      }
    } catch (_) { /* fall through */ }
  }

  return null;
};

/**
 * Validate a user's exam result submission using AI (Groq/Llama).
 * Checks whether the pasted evidence supports the claimed pass/fail status.
 * @param {{ exam: string, status: string, evidence: string, feedback: string }} data - Submission payload.
 * @param {string} apiKey - Groq API key (falls back to shared key).
 * @returns {Promise<{ isValid: boolean, confidenceScore: number, reason: string }>}
 * @throws {Error} If validation call fails.
 */
export const validateSubmissionWithAI = async (data, apiKey) => {
  const effectiveKey = apiKey || DEFAULT_GROQ_KEY;
  if (!effectiveKey) {
    throw new Error("No Groq API key found. Please provide one in Advanced Settings.");
  }

  const prompt = `You are a strict validation AI for a Splunk Certification community.
A user is submitting an official exam result with feedback.

User's Claimed Exam: ${data.exam}
User's Claimed Status: ${data.status}
Pasted Exam Evidence: "${data.evidence}"
User Feedback Provided: "${data.feedback}"

TASK: Verify if the "Pasted Exam Evidence" logically supports their claimed status (Pass/Fail) and matches the domain of a Splunk exam. Also verify if the feedback is coherent.
OUTPUT REQUIREMENT: Output ONLY valid JSON, no markdown.
{
  "isValid": boolean,
  "confidenceScore": number (0-100),
  "reason": "Short explanation of your assessment"
}`;

  try {
    const response = await fetchWithRetry(`https://api.groq.com/openai/v1/chat/completions`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
      body: JSON.stringify({
        model:           "llama-3.3-70b-versatile",
        max_tokens:      256,
        response_format: { type: 'json_object' },
        messages: [
          { role: "system", content: "You output valid JSON ONLY." },
          { role: "user",   content: prompt }
        ],
        temperature: 0.1
      })
    });
    let text = response.choices?.[0]?.message?.content || "{}";
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Validation AI Error:", err);
    throw new Error("Failed to validate submission with AI.");
  }
};
