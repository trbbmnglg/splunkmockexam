/**
 * agentValidator.js — Layer 1: Self-Validation & Refinement Agent
 */

import { fetchWithRetry } from './api.js';

const MAX_RETRY_CYCLES = 2;

export const validateQuestions = async (questions, examType, blueprintLevel, apiKey) => {
  if (!questions || questions.length === 0) return [];

  const validationPrompt = `You are a strict Splunk certification exam quality reviewer.

Exam: "${examType}" — Level: ${blueprintLevel || 'Intermediate'}

Review the following questions and identify every question that fails ANY of these rules:

RULE 1 — Answer match: The "answer" field must be an exact character-for-character match of one element in "options". Flag if it does not match.
RULE 2 — No duplicates: No two questions may test the same specific concept, command, or scenario. Flag the later duplicate (higher index).
RULE 3 — Option formatting: All 4 options must be grammatically parallel (all noun phrases, or all sentences — not mixed). Flag if options vary wildly in structure or length (more than ~15 words difference between shortest and longest).
RULE 4 — No forbidden phrases: Options must not contain "All of the above", "None of the above", "Both A and B", or similar. Flag if found.
RULE 5 — Difficulty match: For a ${blueprintLevel || 'Intermediate'} exam, questions must match the expected cognitive level. Flag questions that are clearly too easy (pure recall/definition for Expert level) or clearly too hard (deep cluster architecture for Entry level).
RULE 6 — Question integrity: The question must be a complete, unambiguous question or scenario. Flag if the question text is malformed, truncated, or does not make sense.

Questions to review:
${JSON.stringify(questions.map((q, i) => ({ index: i, question: q.question, options: q.options, answer: q.answer, topic: q.topic })), null, 2)}

Return ONLY a valid JSON array of failures. If a question fails multiple rules, include all reasons.
If all questions pass, return an empty array.

Format:
[
  { "index": 2, "rules_failed": [1, 3], "reason": "answer field 'indexer' does not match any option; options mix sentences with single words" },
  { "index": 5, "rules_failed": [2], "reason": "duplicate of question at index 1 — both test the default Splunk web port" }
]`;

  try {
    const response = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a strict exam quality reviewer. Return only valid JSON arrays, no markdown, no explanation.' },
          { role: 'user', content: validationPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    let text = response.choices?.[0]?.message?.content || '[]';
    text = text.replace(/```json|```/g, '').trim();
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    const failures = JSON.parse(text.substring(start, end + 1));
    return Array.isArray(failures) ? failures : [];
  } catch (err) {
    console.warn('[Validator] Validation call failed, skipping:', err.message);
    return [];
  }
};

const regenerateFailedQuestions = async (failures, originalQuestions, examType, blueprintLevel, apiKey) => {
  if (failures.length === 0) return [];

  const failedDetails = failures.map(f => ({
    index: f.index,
    original: originalQuestions[f.index],
    reason: f.reason,
    rules_failed: f.rules_failed
  }));

  const regenerationPrompt = `You are a Splunk certification exam author fixing ${failures.length} question(s) that failed quality review.

Exam: "${examType}" — Level: ${blueprintLevel || 'Intermediate'}

For each failed question below, generate a REPLACEMENT question on the same topic.
The replacement must fix the specific issue described and must NOT reproduce the original question in any form.

Failed questions to replace:
${JSON.stringify(failedDetails, null, 2)}

REQUIREMENTS for each replacement:
- Same topic as the original
- Fixes all listed rule failures
- Tests a DIFFERENT specific concept within that topic than the original
- 4 options that are grammatically parallel and similar in length (within ~10 words)
- Answer must be an exact character-for-character match of one option
- Appropriate difficulty for ${blueprintLevel || 'Intermediate'} level

Return ONLY a JSON array with exactly ${failures.length} replacement(s), in the same order as the failed questions above.
Each object must have: "original_index" (the index from above), "question", "options" (array of 4), "answer", "topic".

Example:
[
  {
    "original_index": 2,
    "question": "Which file controls index retention settings in Splunk Enterprise?",
    "options": [
      "indexes.conf, located in $SPLUNK_HOME/etc/system/local",
      "inputs.conf, located in $SPLUNK_HOME/etc/apps",
      "transforms.conf, located in $SPLUNK_HOME/etc/system",
      "outputs.conf, located in $SPLUNK_HOME/etc/deployment-apps"
    ],
    "answer": "indexes.conf, located in $SPLUNK_HOME/etc/system/local",
    "topic": "Splunk Indexes"
  }
]`;

  try {
    const response = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a Splunk certification exam author. Return only valid JSON arrays.' },
          { role: 'user', content: regenerationPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    let text = response.choices?.[0]?.message?.content || '[]';
    text = text.replace(/```json|```/g, '').trim();
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    const replacements = JSON.parse(text.substring(start, end + 1));
    return Array.isArray(replacements) ? replacements : [];
  } catch (err) {
    console.warn('[Validator] Regeneration call failed:', err.message);
    return [];
  }
};

const mergeReplacements = (questions, replacements) => {
  const merged = [...questions];
  for (const replacement of replacements) {
    const idx = replacement.original_index;
    if (idx !== undefined && idx >= 0 && idx < merged.length) {
      merged[idx] = {
        question: replacement.question,
        options: replacement.options,
        answer: replacement.answer,
        topic: replacement.topic
      };
    }
  }
  return merged;
};

export const runValidationPipeline = async (questions, examType, blueprintLevel, apiKey, onProgress) => {
  let current = [...questions];
  const log = [];

  for (let cycle = 1; cycle <= MAX_RETRY_CYCLES; cycle++) {
    onProgress?.(`Validating question quality (pass ${cycle}/${MAX_RETRY_CYCLES})...`);
    const failures = await validateQuestions(current, examType, blueprintLevel, apiKey);
    log.push({ cycle, failureCount: failures.length, failures });

    if (failures.length === 0) {
      onProgress?.('All questions passed quality review ✓');
      break;
    }

    onProgress?.(`Refining ${failures.length} question(s) that failed review...`);
    const replacements = await regenerateFailedQuestions(failures, current, examType, blueprintLevel, apiKey);

    if (replacements.length > 0) {
      current = mergeReplacements(current, replacements);
    } else {
      console.warn(`[Validator] Cycle ${cycle}: regeneration produced no replacements, keeping originals.`);
      break;
    }
  }

  return { questions: current, validationLog: log };
};
