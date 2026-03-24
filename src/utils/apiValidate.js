/**
 * Validation utilities: answer-option matching, docSource filtering,
 * response parsing, and AI-based submission validation.
 */
import { DEFAULT_GROQ_KEY } from './apiConfig';
import { fetchWithRetry } from './apiFetch';

// ─── validateAnswerOptions ────────────────────────────────────────────────────
export const validateAnswerOptions = (questions) => {
  return questions.map(q => {
    if (!Array.isArray(q.options) || q.options.length !== 4) return q;
    if (q.options.includes(q.answer)) return q;
    const normalise = s => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const normAnswer = normalise(q.answer);
    const matchedOption = q.options.find(o => normalise(o) === normAnswer);
    if (matchedOption) return { ...q, answer: matchedOption };
    console.warn(`[API] Answer-option mismatch after schema parse: "${q.answer}" not in options`);
    return q;
  });
};

// ─── filterDocSources ─────────────────────────────────────────────────────────
// Strips any docSource URL that wasn't actually in the injected passages.
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

// ─── parseQuestionsFromResponse ───────────────────────────────────────────────
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

// ─── validateSubmissionWithAI ─────────────────────────────────────────────────
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
