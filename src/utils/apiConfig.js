/**
 * API configuration: env vars, schema definitions, trace factory.
 */

const getEnvVar = (viteKey, fallback = '') => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey])
      return import.meta.env[viteKey];
  } catch (e) { /* Ignore */ }
  return fallback;
};

export const DEFAULT_GROQ_KEY    = getEnvVar('VITE_GROQ_TOKEN', '');
export const CF_WEBHOOK_URL      = getEnvVar('VITE_CF_WEBHOOK_URL', '');
export const CF_WEBHOOK_TOKEN    = getEnvVar('VITE_CF_WEBHOOK_TOKEN', '');
export const FEEDBACK_EMAIL      = getEnvVar('VITE_FEEDBACK_EMAIL', '');

/** JSON Schema describing the expected shape of AI-generated question responses. */
export const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question:  { type: 'string', minLength: 10, maxLength: 2000 },
          options: {
            type: 'array',
            items: { type: 'string', minLength: 2, maxLength: 500 },
            minItems: 4,
            maxItems: 4,
          },
          answer:    { type: 'string', minLength: 2, maxLength: 500 },
          topic:     { type: 'string', minLength: 2, maxLength: 200 },
          docSource: { type: 'string', maxLength: 500 },
        },
        required: ['question', 'options', 'answer', 'topic', 'docSource'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

/**
 * Create a fresh telemetry trace object for an API generation call.
 * @param {string} provider - AI provider key (e.g. "llama", "gemini").
 * @param {string} model - Model identifier string.
 * @returns {object} Mutable trace with token counts, latency, retries, and error fields.
 */
export const createTrace = (provider, model) => ({
  provider,
  model,
  promptTokens:     0,
  completionTokens: 0,
  latencyMs:        0,
  schemaEnforced:   false,
  parseStrategy:    'regex_fallback',
  retries:          0,
  error:            null,
});
