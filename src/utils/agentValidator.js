/**
 * agentValidator.js — Layer 1: Self-Validation & Refinement Agent
 *
 * Changes from original:
 *   - runValidationPipeline now accepts an optional maxCycles parameter.
 *     Pass 1 for a lightweight single-pass check (used when running on the
 *     shared Groq key). Defaults to MAX_CYCLES (4) for users with own keys.
 *   - Both LLM calls use response_format: { type: 'json_object' }.
 *   - The regeneration prompt wraps output in { "replacements": [...] }.
 */

import { fetchWithRetry } from './api.js';

const QUALITY_THRESHOLD = 0.10;
const MAX_CYCLES        = 4;

// ─── validateQuestions ────────────────────────────────────────────────────────
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
${JSON.stringify(questions.map((q, i) => ({
  index: i, question: q.question, options: q.options, answer: q.answer, topic: q.topic
})), null, 2)}

Return a JSON object with a single key "failures" whose value is an array.
If a question fails multiple rules, include all reasons for that question.
If all questions pass, return { "failures": [] }.

Format:
{
  "failures": [
    { "index": 2, "rules_failed": [1, 3], "reason": "answer field does not match any option; options mix sentences with single words" },
    { "index": 5, "rules_failed": [2], "reason": "duplicate of question at index 1 — both test the default Splunk web port" }
  ]
}`;

  const trace = { retries: 0 };

  try {
    const response = await fetchWithRetry(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model:           'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          messages: [
            {
              role:    'system',
              content: 'You are a strict exam quality reviewer. Return only valid JSON — a single object with a "failures" array. No markdown, no extra text.'
            },
            { role: 'user', content: validationPrompt }
          ],
          temperature: 0.1,
          max_tokens:  1200,
        })
      },
      3, 20000, trace
    );

    const text = response?.choices?.[0]?.message?.content || '{"failures":[]}';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      const clean = text.replace(/```json|```/gi, '').trim();
      parsed = JSON.parse(clean);
    }

    const failures = parsed?.failures;
    return Array.isArray(failures) ? failures : [];

  } catch (err) {
    console.warn('[Validator] Validation call failed, skipping:', err.message);
    // Return null (not empty array) so the pipeline knows validation was skipped
    // rather than thinking all questions passed.
    return null;
  }
};

// ─── regenerateFailedQuestions ────────────────────────────────────────────────
const regenerateFailedQuestions = async (failures, originalQuestions, examType, blueprintLevel, apiKey) => {
  if (failures.length === 0) return [];

  const failedDetails = failures.map(f => ({
    index:        f.index,
    original:     originalQuestions[f.index],
    reason:       f.reason,
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
- "answer" must be a byte-for-byte copy of one of the 4 option strings
- Appropriate difficulty for ${blueprintLevel || 'Intermediate'} level

Return a JSON object with a single key "replacements" whose value is an array of exactly ${failures.length} item(s), in the same order as the failed questions above.
Each item must have: "original_index", "question", "options" (array of 4), "answer", "topic".

{
  "replacements": [
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
  ]
}`;

  const trace = { retries: 0 };

  try {
    const response = await fetchWithRetry(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model:           'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          messages: [
            {
              role:    'system',
              content: 'You are a Splunk certification exam author. Return only valid JSON — a single object with a "replacements" array. No markdown, no extra text.'
            },
            { role: 'user', content: regenerationPrompt }
          ],
          temperature: 0.7,
          max_tokens:  2000,
        })
      },
      3, 30000, trace
    );

    const text = response?.choices?.[0]?.message?.content || '{"replacements":[]}';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      const clean = text.replace(/```json|```/gi, '').trim();
      parsed = JSON.parse(clean);
    }

    const replacements = parsed?.replacements;
    return Array.isArray(replacements) ? replacements : [];

  } catch (err) {
    console.warn('[Validator] Regeneration call failed:', err.message);
    return [];
  }
};

// ─── mergeReplacements ────────────────────────────────────────────────────────
const mergeReplacements = (questions, replacements) => {
  const merged = [...questions];
  for (const replacement of replacements) {
    const idx = replacement.original_index;
    if (idx !== undefined && idx >= 0 && idx < merged.length) {
      merged[idx] = {
        question:  replacement.question,
        options:   replacement.options,
        answer:    replacement.answer,
        topic:     replacement.topic,
        docSource: replacement.docSource || '',
      };
    }
  }
  return merged;
};

// ─── runValidationPipeline ────────────────────────────────────────────────────
// maxCycles: optional override. Pass 1 for a lightweight single-pass check
// (used when running on the shared Groq key to protect quota).
// Defaults to MAX_CYCLES (4) for full validation.
export const runValidationPipeline = async (
  questions,
  examType,
  blueprintLevel,
  apiKey,
  onProgress,
  maxCycles = MAX_CYCLES
) => {
  let current = [...questions];
  const log   = [];
  const limit  = Math.min(maxCycles, MAX_CYCLES);

  for (let cycle = 1; cycle <= limit; cycle++) {
    const cycleLabel = limit === 1
      ? 'Running quality check...'
      : `Validating question quality (pass ${cycle}/${limit})...`;
    onProgress?.(cycleLabel);

    const failures = await validateQuestions(current, examType, blueprintLevel, apiKey);

    // null means the validation call itself failed — skip this cycle entirely
    if (failures === null) {
      console.warn(`[Validator] Cycle ${cycle}: validation call failed, skipping refinement.`);
      onProgress?.('Quality check skipped (validation unavailable)');
      break;
    }

    const failureRate = failures.length / current.length;
    log.push({
      cycle,
      failureCount: failures.length,
      failureRate:  Math.round(failureRate * 100),
      failures,
    });

    if (failures.length === 0) {
      onProgress?.('All questions passed quality review ✓');
      break;
    }

    if (failureRate <= QUALITY_THRESHOLD) {
      onProgress?.(`Quality threshold met (${failures.length} minor issue${failures.length !== 1 ? 's' : ''} remaining) ✓`);
      break;
    }

    // On the last allowed cycle, report but don't attempt another regeneration
    if (cycle === limit) {
      const remaining = failures.length;
      const isLightweightPass = limit === 1;
      // Info not warn — on shared key this is expected (1-cycle limit by design)
      console.info(
        isLightweightPass
          ? `[Validator] Lightweight pass complete — ${remaining} question${remaining !== 1 ? 's' : ''} flagged (add your own Groq key for full refinement)`
          : `[Validator] Max cycles (${limit}) reached — ${remaining} question${remaining !== 1 ? 's' : ''} could not be fully refined`
      );
      onProgress?.('Quality check done ✓');
      break;
    }

    onProgress?.(`Refining ${failures.length} question${failures.length !== 1 ? 's' : ''} that failed review (${Math.round(failureRate * 100)}% failure rate)...`);

    const replacements = await regenerateFailedQuestions(failures, current, examType, blueprintLevel, apiKey);

    if (replacements.length === 0) {
      console.warn(`[Validator] Cycle ${cycle}: regeneration produced no replacements, keeping originals.`);
      break;
    }

    current = mergeReplacements(current, replacements);
  }

  return { questions: current, validationLog: log };
};
