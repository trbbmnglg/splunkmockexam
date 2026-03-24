/**
 * Barrel re-export — keeps all existing `import { … } from './api'` working.
 *
 * The actual implementations now live in:
 *   apiConfig.js   — env vars, schema, trace factory
 *   apiFetch.js    — fetchWithRetry
 *   apiValidate.js — answer validation, docSource filtering, response parsing, AI submission validation
 *   apiGenerate.js — generateDynamicQuestions, getFallbackQuestions
 */
export { DEFAULT_GROQ_KEY, CF_WEBHOOK_URL, CF_WEBHOOK_TOKEN, FEEDBACK_EMAIL, QUESTION_SCHEMA, createTrace } from './apiConfig';
export { fetchWithRetry } from './apiFetch';
export { validateAnswerOptions, filterDocSources, parseQuestionsFromResponse, validateSubmissionWithAI } from './apiValidate';
export { getFallbackQuestions, generateDynamicQuestions } from './apiGenerate';
