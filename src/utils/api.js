const getEnvVar = (viteKey, fallback = '') => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) 
      return import.meta.env[viteKey];
  } catch (e) { /* Ignore */ }
  return fallback;
};

/**
 * DEFAULT_GROQ_KEY — read from VITE_GROQ_TOKEN, which Vite bakes into the
 * JS bundle at build time from the Cloudflare "Variables and secrets" dashboard.
 *
 * In Cloudflare dashboard → your Worker → Settings → Variables and secrets:
 *   Name:  VITE_GROQ_TOKEN
 *   Value: gsk_your_actual_groq_key
 *   Type:  Variable (NOT Secret — must be available at build time)
 *
 * For local dev, create a .env file:
 *   VITE_GROQ_TOKEN=gsk_your_actual_groq_key
 */
export const DEFAULT_GROQ_KEY = getEnvVar('VITE_GROQ_TOKEN', '');
export const CF_WEBHOOK_URL = getEnvVar('VITE_CF_WEBHOOK_URL', '');
export const CF_WEBHOOK_TOKEN = getEnvVar('VITE_CF_WEBHOOK_TOKEN', '');

export const fetchWithRetry = async (url, options, maxRetries = 5, timeoutMs = 30000) => {
  const delays = [1000, 2000, 4000, 8000];
  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

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
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: "You output valid JSON ONLY." }, { role: "user", content: prompt }],
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

export const getFallbackQuestions = (examType, targetCount) => {
  const fallbackQuestions = [
    { question: "What is the default port for Splunk Web?", options: ["8000", "8089", "9997", "514"], answer: "8000", topic: "Splunk Basics" },
    { question: "Which Splunk component forwards data to an indexer?", options: ["Universal Forwarder", "Search Head", "Deployment Server", "License Master"], answer: "Universal Forwarder", topic: "Splunk Components" },
    { question: "Which SPL command is used to filter events?", options: ["search", "where", "filter", "select"], answer: "search", topic: "Basic SPL" }
  ];
  const result = [...fallbackQuestions];
  let index = result.length;
  while (result.length < targetCount) {
    result.push({
      question: `[Fallback] ${examType} Question ${index + 1}: Please check your API key configuration.`,
      options: ["Correct Answer", "Incorrect Option 1", "Incorrect Option 2", "Incorrect Option 3"],
      answer: "Correct Answer",
      topic: "System Fallback"
    });
    index++;
  }
  return result.slice(0, targetCount);
};

export const generateDynamicQuestions = async (examType, config, apiKey) => {
  const provider = config.aiProvider;
  // For llama: always fall back to the baked-in DEFAULT_GROQ_KEY if user hasn't entered their own
  const effectiveKey = provider === 'llama' ? (apiKey || DEFAULT_GROQ_KEY) : apiKey;

  if (!effectiveKey) {
    return {
      questions: getFallbackQuestions(examType, config.numQuestions),
      error: `API Key for ${provider.toUpperCase()} is missing. Please provide one in Advanced Settings.\n\nLoading fallback practice questions instead.`
    };
  }

  const promptText = `${config.customPrompt}
  
CRITICAL OUTPUT REQUIREMENT:
Output MUST be a raw JSON array of objects ONLY. Do not include markdown formatting like \`\`\`json, introductions, or explanations.
Each object must have the following exact keys:
- "question": (string) The exam question text
- "options": (array of exactly 4 strings) The multiple choice options
- "answer": (string) The correct answer (MUST exactly match one of the options)
- "topic": (string) The specific exam topic this question covers`;

  try {
    let responseText = "";

    if (provider === 'perplexity') {
      const data = await fetchWithRetry(`https://api.perplexity.ai/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
        body: JSON.stringify({ model: "sonar-pro", messages: [{ role: "system", content: "You output JSON arrays ONLY." }, { role: "user", content: promptText }] })
      });
      responseText = data.choices?.[0]?.message?.content;
    } else if (provider === 'llama') {
      const data = await fetchWithRetry(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: "You output valid JSON arrays ONLY." }, { role: "user", content: promptText }] })
      });
      responseText = data.choices?.[0]?.message?.content;
    } else if (provider === 'qwen') {
      const data = await fetchWithRetry(`https://openrouter.ai/api/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : '',
          'X-Title': 'Splunk Mock Exam Generator'
        },
        body: JSON.stringify({ model: "qwen/qwen-2.5-72b-instruct", messages: [{ role: "system", content: "You output valid JSON arrays ONLY." }, { role: "user", content: promptText }] })
      });
      responseText = data.choices?.[0]?.message?.content;
    } else if (provider === 'gemini') {
      const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!responseText) throw new Error("No content generated");

    let cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const arrayStart = cleanedText.indexOf('[');
    const arrayEnd = cleanedText.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      cleanedText = cleanedText.substring(arrayStart, arrayEnd + 1);
    }

    let questions;
    try {
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      throw new Error(`Invalid JSON returned by AI: ${parseError.message}`);
    }

    if (!Array.isArray(questions)) {
      const foundArray = Object.values(questions).find(val => Array.isArray(val));
      if (foundArray) questions = foundArray;
      else throw new Error("Parsed JSON does not contain a question array.");
    }

    return { questions: questions.slice(0, config.numQuestions), error: null };
  } catch (error) {
    console.error(`Failed to generate questions with ${provider}:`, error);
    return {
      questions: getFallbackQuestions(examType, config.numQuestions),
      error: `Failed to generate questions using ${provider.toUpperCase()}.\n\nPlease check your API key and internet connection. (Error: ${error.message})\n\nLoading fallback practice questions instead.`
    };
  }
};
