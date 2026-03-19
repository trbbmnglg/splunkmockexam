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

export const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question:  { type: 'string', minLength: 10 },
          options: {
            type: 'array',
            items: { type: 'string', minLength: 2 },
            minItems: 4,
            maxItems: 4,
          },
          answer:    { type: 'string', minLength: 2 },
          topic:     { type: 'string', minLength: 2 },
          docSource: { type: 'string' },
        },
        required: ['question', 'options', 'answer', 'topic', 'docSource'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

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

export const fetchWithRetry = async (url, options, maxRetries = 5, timeoutMs = 30000, trace = null) => {
  const baseDelays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitMs = retryAfter
          ? Math.ceil(parseFloat(retryAfter) * 1000)
          : baseDelays[Math.min(i, baseDelays.length - 1)];
        if (trace) trace.retries += 1;
        console.warn(`[API] 429 rate limited — waiting ${(waitMs / 1000).toFixed(1)}s before retry ${i + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelays[Math.min(i, baseDelays.length - 1)]));
    }
  }
  throw new Error(`Max retries (${maxRetries}) exceeded`);
};

// ─── validateAnswerOptions ────────────────────────────────────────────────────
const validateAnswerOptions = (questions) => {
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
// Prevents the model from hallucinating plausible-looking but fake Splunk URLs.
// If passages is empty (no RAG), all docSources are cleared — we can't verify them.
const filterDocSources = (questions, passages) => {
  if (!passages || passages.length === 0) {
    // No passages were injected — any docSource is unverifiable, clear them all
    return questions.map(q => ({ ...q, docSource: '' }));
  }

  // Build a Set of the exact URLs that were injected into the prompt
  const validUrls = new Set(passages.map(p => p.url).filter(Boolean));

  return questions.map(q => {
    const src = q.docSource || '';
    if (!src) return q;

    if (validUrls.has(src)) return q;  // exact match — keep it

    // Partial match: model may have used the right domain/path but with minor differences
    // Accept if the docSource starts with one of the valid URLs (handles trailing slashes etc.)
    const looseMatch = [...validUrls].some(u => src.startsWith(u) || u.startsWith(src));
    if (looseMatch) return q;

    // No match — model hallucinated this URL, clear it
    console.info(`[API] docSource filtered (not in injected passages): "${src}"`);
    return { ...q, docSource: '' };
  });
};

// ─── parseQuestionsFromResponse ───────────────────────────────────────────────
const parseQuestionsFromResponse = (text, trace) => {
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

// ─── getFallbackQuestions ─────────────────────────────────────────────────────
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

// ─── generateDynamicQuestions ─────────────────────────────────────────────────
// config.passages — the RAG passages array passed from App.jsx — used to
// validate docSource URLs after generation. Pass [] if no RAG was used.
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
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

    // Step 1: normalise answer strings
    const answerValidated = validateAnswerOptions(parsed);

    // Step 2: strip hallucinated docSource URLs — only keep URLs that were
    // actually in the injected RAG passages. config.passages is the same
    // array that was used to build the prompt in App.jsx.
    const docSourceFiltered = filterDocSources(answerValidated, config.passages || []);

    // Count how many were filtered for the trace log
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
    return {
      questions: getFallbackQuestions(examType, config.numQuestions),
      error:
        `Failed to generate questions using ${provider.toUpperCase()}.\n\n` +
        `Please check your API key and internet connection. (Error: ${error.message})\n\n` +
        `Loading fallback practice questions instead.`,
      trace,
    };
  }
};
