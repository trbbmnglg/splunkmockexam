/**
 * Question generation: provider dispatching, fallback questions.
 */
import { DEFAULT_GROQ_KEY, createTrace } from './apiConfig';
import { fetchWithRetry } from './apiFetch';
import { validateAnswerOptions, filterDocSources, parseQuestionsFromResponse } from './apiValidate';

/**
 * Generate a set of static fallback questions when AI generation fails.
 * Pads with placeholder questions if fewer than `targetCount` are available.
 * @param {string} examType - Exam type key (used in placeholder text).
 * @param {number} targetCount - Number of questions to return.
 * @returns {object[]} Array of question objects.
 */
export const getFallbackQuestions = (examType, targetCount) => {
  const fallbackQuestions = [
    {
      question:  "What is the default port for Splunk Web?",
      options:   ["8000", "8089", "9997", "514"],
      answer:    "8000",
      topic:     "Splunk Basics",
      docSource: ""
    },
    {
      question:  "Which Splunk component forwards data to an indexer?",
      options:   ["Universal Forwarder", "Search Head", "Deployment Server", "License Master"],
      answer:    "Universal Forwarder",
      topic:     "Splunk Components",
      docSource: ""
    },
    {
      question:  "Which SPL command is used to filter events?",
      options:   ["search", "where", "filter", "select"],
      answer:    "search",
      topic:     "Basic SPL",
      docSource: ""
    }
  ];
  const result = [...fallbackQuestions];
  let index    = result.length;
  while (result.length < targetCount) {
    result.push({
      question:  `[Fallback] ${examType} Question ${index + 1}: Please check your API key configuration.`,
      options:   ["Correct Answer", "Incorrect Option 1", "Incorrect Option 2", "Incorrect Option 3"],
      answer:    "Correct Answer",
      topic:     "System Fallback",
      docSource: ""
    });
    index++;
  }
  return result.slice(0, targetCount);
};

/**
 * Generate exam questions by dispatching to the configured AI provider.
 * Handles Groq (Llama), Perplexity, Gemini, and Qwen/OpenRouter.
 * Falls back to static questions on failure.
 * @param {string} examType - Exam type key.
 * @param {object} config - Exam config with `aiProvider`, `numQuestions`, `customPrompt`, `passages`.
 * @param {string} apiKey - API key for the selected provider.
 * @returns {Promise<{ questions: object[], error: string|null, trace: object|null }>}
 */
export const generateDynamicQuestions = async (examType, config, apiKey) => {
  const provider    = config.aiProvider;
  const effectiveKey = provider === 'llama' ? (apiKey || DEFAULT_GROQ_KEY) : apiKey;

  if (!effectiveKey) {
    return {
      questions: getFallbackQuestions(examType, config.numQuestions),
      error:     `API Key for ${provider.toUpperCase()} is missing. Please provide one in Advanced Settings.\n\nLoading fallback practice questions instead.`,
      trace:     null,
    };
  }

  const MODEL_STRINGS = {
    llama:      'llama-3.3-70b-versatile',
    perplexity: 'sonar-pro',
    gemini:     'gemini-1.5-flash',
    qwen:       'qwen/qwen-2.5-72b-instruct',
  };
  const modelString = MODEL_STRINGS[provider] || provider;
  const trace = createTrace(provider, modelString);

  const outputTokens = Math.max(4096, Math.ceil(config.numQuestions * 500 * 1.3));

  const promptText = `${config.customPrompt}

OUTPUT FORMAT — return ONLY a raw JSON object with a single key "questions" whose value is an array.
Do NOT wrap in markdown fences. Do NOT add any text before or after the JSON.

The object must look exactly like this:
{
  "questions": [
    {
      "question": "string — the question text only, no option labels embedded",
      "options":  ["string", "string", "string", "string"],
      "answer":   "string — must be an exact character-for-character copy of one element in options",
      "topic":    "string — the blueprint topic this question covers",
      "docSource":"string — source URL from REFERENCE DOCUMENTATION above, or empty string"
    }
  ]
}

CRITICAL: The "answer" value must be byte-for-byte identical to one of the four "options" strings.
Do not paraphrase, abbreviate, or reword the answer — copy it exactly.`;

  try {
    let rawData      = null;
    let responseText = null;
    const t0         = Date.now();

    if (provider === 'llama') {
      rawData = await fetchWithRetry(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
          body: JSON.stringify({
            model:           modelString,
            max_tokens:      outputTokens,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'You are a Splunk certification exam author. Return only valid JSON — a single object with a "questions" array. No markdown, no extra text.' },
              { role: 'user',   content: promptText }
            ],
          })
        },
        5, 30000, trace
      );
      trace.schemaEnforced = true;
      if (rawData?.usage) {
        trace.promptTokens     = rawData.usage.prompt_tokens     ?? 0;
        trace.completionTokens = rawData.usage.completion_tokens ?? 0;
      }
      responseText = rawData?.choices?.[0]?.message?.content;

    } else if (provider === 'perplexity') {
      rawData = await fetchWithRetry(
        'https://api.perplexity.ai/chat/completions',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
          body: JSON.stringify({
            model:      modelString,
            max_tokens: outputTokens,
            messages: [
              { role: 'system', content: 'You are a Splunk certification exam author. Follow the user instructions precisely and return only valid JSON.' },
              { role: 'user',   content: promptText }
            ],
          })
        },
        5, 30000, trace
      );
      responseText = rawData?.choices?.[0]?.message?.content;

    } else if (provider === 'qwen') {
      rawData = await fetchWithRetry(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${effectiveKey}`,
            'HTTP-Referer':  typeof window !== 'undefined' ? window.location.href : '',
            'X-Title':       'Splunk Mock Exam Generator',
          },
          body: JSON.stringify({
            model:           modelString,
            max_tokens:      outputTokens,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'You are a Splunk certification exam author. Return only valid JSON — a single object with a "questions" array. No markdown, no extra text.' },
              { role: 'user',   content: promptText }
            ],
          })
        },
        5, 30000, trace
      );
      trace.schemaEnforced = true;
      if (rawData?.usage) {
        trace.promptTokens     = rawData.usage.prompt_tokens     ?? 0;
        trace.completionTokens = rawData.usage.completion_tokens ?? 0;
      }
      responseText = rawData?.choices?.[0]?.message?.content;

    } else if (provider === 'gemini') {
      rawData = await fetchWithRetry(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': effectiveKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: 'application/json', maxOutputTokens: outputTokens },
          })
        },
        5, 30000, trace
      );
      trace.schemaEnforced = true;
      if (rawData?.usageMetadata) {
        trace.promptTokens     = rawData.usageMetadata.promptTokenCount     ?? 0;
        trace.completionTokens = rawData.usageMetadata.candidatesTokenCount ?? 0;
      }
      const part = rawData?.candidates?.[0]?.content?.parts?.[0];
      responseText = part?.text ?? part ?? null;
    }

    trace.latencyMs = Date.now() - t0;

    if (!responseText) throw new Error("No content returned from provider");

    const parsed = parseQuestionsFromResponse(responseText, trace);

    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Provider returned valid JSON but no questions array was found.");
    }

    const answerValidated = validateAnswerOptions(parsed);
    const docSourceFiltered = filterDocSources(answerValidated, config.passages || []);

    const filteredCount = answerValidated.filter((q, i) =>
      q.docSource && !docSourceFiltered[i].docSource
    ).length;

    console.info(
      `[API] ${provider} — ${docSourceFiltered.length}q | ` +
      `${trace.promptTokens}+${trace.completionTokens} tokens | ` +
      `${trace.latencyMs}ms | parse: ${trace.parseStrategy} | ` +
      `schema: ${trace.schemaEnforced} | retries: ${trace.retries}` +
      (filteredCount > 0 ? ` | docSource filtered: ${filteredCount}` : '')
    );

    return {
      questions: docSourceFiltered.slice(0, config.numQuestions),
      error:     null,
      trace,
    };

  } catch (error) {
    trace.error     = error.message;
    trace.latencyMs = trace.latencyMs || 0;
    console.error(`[API] Failed to generate questions with ${provider}:`, error);

    const safeMessage = error.name === 'AbortError'
      ? 'Request timed out — the AI provider may be slow. Try again or switch providers.'
      : error.message?.includes('status: 401')
        ? 'Invalid API key — please check your key in Advanced Settings.'
        : error.message?.includes('status: 403')
          ? 'Access denied — your API key may lack permissions for this model.'
          : error.message?.includes('status: 429')
            ? 'Rate limited — too many requests. Wait a moment and try again.'
            : error.message?.includes('HTTP error')
              ? 'The AI provider returned an error. Please try again or switch providers.'
              : 'An unexpected error occurred. Check your internet connection and try again.';

    return {
      questions: getFallbackQuestions(examType, config.numQuestions),
      error:
        `Failed to generate questions using ${provider.toUpperCase()}.\n\n` +
        `Please check your API key and internet connection. (${safeMessage})\n\n` +
        `Loading fallback practice questions instead.`,
      trace,
    };
  }
};
