/**
 * Builds the full system prompt sent to the AI provider for question generation.
 * Combines exam blueprint, topic distribution, adaptive context, RAG passages,
 * and seen-concept deduplication into a single prompt string.
 */
import { EXAM_BLUEPRINTS, YEAR_RANGE, PRODUCT_CONTEXT_MAP } from './constants';
import { buildAdaptiveContext } from './agentAdaptive';

/** Difficulty guidance keyed by blueprint level. */
const LEVEL_GUIDANCE = {
  'Foundational-Level': 'Questions should test basic recognition and recall. Avoid deep configuration syntax. Focus on concepts, definitions, and basic UI interactions a new user would encounter.',
  'Entry-Level':        'Questions should test practical understanding — not just definitions. Include some "what would you do" scenarios but keep them straightforward. Avoid multi-step troubleshooting.',
  'Intermediate-Level': 'Questions should require applied knowledge. Mix conceptual and scenario-based questions. Include some troubleshooting and configuration scenarios with realistic but clear context.',
  'Professional-Level': 'Questions should test real-world administration tasks. Include configuration-file-level details, troubleshooting multi-step scenarios, and architectural decisions.',
  'Expert-Level':       'Questions should test expert architectural decisions, cluster-level troubleshooting, sizing trade-offs, and edge-case scenarios an experienced practitioner would face.',
};

/**
 * Compute the topic → question-count distribution for the prompt.
 * @param {string[]} topics - User-selected topics (may be empty).
 * @param {number} num - Total questions to generate.
 * @param {string} type - Exam type key (e.g. "User", "Power User").
 * @param {object|undefined} bp - Exam blueprint from EXAM_BLUEPRINTS[type].
 * @returns {string} Formatted distribution text for the prompt.
 */
function buildTopicDistribution(topics, num, type, bp) {
  if (topics.length > 0) {
    const base = Math.floor(num / topics.length);
    const rem  = num % topics.length;
    const dist = topics.map((t, i) => {
      const count = base + (i < rem ? 1 : 0);
      return `  - "${t}": ${count} question${count !== 1 ? 's' : ''}`;
    }).join('\n');
    return `The candidate has chosen to focus on these specific topics. Distribute the ${num} questions using these exact counts:\n${dist}\n\nCRITICAL DIVERSITY RULE: Each question must test a DIFFERENT specific concept, command, setting, or scenario. If a topic has multiple questions, they must cover different sub-concepts. Never generate two questions that differ only in a number, threshold, or port value.`;
  }

  if (bp) {
    const topicCounts = bp.topics.map(t => ({ name: t.name, count: Math.max(1, Math.round((t.pct / 100) * num)) }));
    let total = topicCounts.reduce((s, t) => s + t.count, 0);
    let i = 0;
    while (total < num) { topicCounts[i % topicCounts.length].count++; total++; i++; }
    while (total > num) { const idx = topicCounts.findIndex(t => t.count > 1); if (idx >= 0) { topicCounts[idx].count--; total--; } else break; }
    const dist = topicCounts.map(t => `  - "${t.name}": ${t.count} question${t.count !== 1 ? 's' : ''}`).join('\n');
    return `Distribute the ${num} questions according to the OFFICIAL exam blueprint percentages:\n${dist}\n\nThis distribution is mandatory — do not deviate from these counts.`;
  }

  return `Distribute questions broadly and evenly across all major topics of the ${type} certification.`;
}

/**
 * Build the seen-concepts exclusion section for the prompt.
 * @param {{ topic: string, hint: string }[]} seenConcepts - Previously seen question concepts.
 * @returns {string} Formatted exclusion text, or empty string.
 */
function buildSeenConceptsSection(seenConcepts) {
  if (!seenConcepts || seenConcepts.length === 0) return '';

  const byTopic = {};
  for (const c of seenConcepts) {
    const t = c.topic || 'General';
    if (!byTopic[t]) byTopic[t] = [];
    byTopic[t].push(c.hint);
  }
  const lines = Object.entries(byTopic)
    .map(([topic, hints]) => `  [${topic}]\n${hints.map(h => `    - "${h}"`).join('\n')}`)
    .join('\n');

  return `
CROSS-SESSION DUPLICATE PREVENTION — MANDATORY:
The candidate has already seen questions on these exact concepts in previous sessions.
You MUST NOT generate questions that test the same specific scenario, command syntax,
or concept as any item listed below. Approach each topic from a completely different angle.

${lines}

This list contains ${seenConcepts.length} previously seen concept${seenConcepts.length !== 1 ? 's' : ''}.
Treat each item as a hard exclusion — if your question would have the same correct answer
or test the same sub-concept as a listed item, discard it and generate a different question.`;
}

/**
 * Build the forbidden-topic boundary section for the prompt.
 * @param {string} type - Exam type key.
 * @returns {string} Formatted boundary text.
 */
function buildTopicBoundary(type) {
  const boundaries = {
    'User': `- Any question about indexer clusters, search head clusters, deployment servers, or forwarders — those are Enterprise Admin topics
- Any question about security, threat detection, SIEM, or Splunk ES — those are Cybersecurity topics
- Any question about CIM, data models, macros, or workflow actions — those are Power User topics
- Any question about metrics, detectors, or OpenTelemetry — those are O11y topics`,
    'Power User': `- Any question about indexer clusters, license management, or Splunk infrastructure — those are Enterprise Admin topics
- Any question about security, threat detection, or Splunk ES — those are Cybersecurity topics
- Any question about SmartStore, multisite clusters, or capacity planning — those are Architect topics`,
    'Cloud Admin': `- Any question about on-premises Enterprise clustering or indexer cluster manager nodes — those are Enterprise Architect topics
- Any question about security threat detection or Splunk ES — those are Cybersecurity topics`,
    'Enterprise Admin': `- Any question about multisite indexer clusters or SmartStore — those are Enterprise Architect topics
- Any question about security threat detection or Splunk ES — those are Cybersecurity topics`,
  };
  return boundaries[type] || '';
}

/**
 * Build the complete system prompt for AI question generation.
 *
 * @param {string} type - Exam type (e.g. "User", "Power User").
 * @param {number} num - Number of questions to generate.
 * @param {string[]} topics - User-selected focus topics (may be empty).
 * @param {string} provider - AI provider key ("llama", "perplexity", "gemini", "qwen").
 * @param {{ topic: string, url: string, text: string }[]} [passages=[]] - RAG doc passages.
 * @param {{ topic: string, hint: string }[]} [seenConcepts=[]] - Previously seen question concepts.
 * @returns {string} The fully assembled prompt string.
 */
export function buildAgenticPrompt(type, num, topics, provider, passages = [], seenConcepts = []) {
  if (!type) return '';

  const bp             = EXAM_BLUEPRINTS[type];
  const productContext = PRODUCT_CONTEXT_MAP[type] || 'Splunk Enterprise and Splunk Cloud Platform';
  const providerContext = provider === 'perplexity'
    ? `Use your live web search to verify answers against the latest ${YEAR_RANGE} Splunk documentation.`
    : `Draw from your deep knowledge of the Splunk product suite and official documentation.`;

  const difficulty        = bp ? (LEVEL_GUIDANCE[bp.level] || LEVEL_GUIDANCE['Intermediate-Level']) : LEVEL_GUIDANCE['Entry-Level'];
  const topicDistribution = buildTopicDistribution(topics, num, type, bp);
  const { adaptivePromptSection } = buildAdaptiveContext(type, num, bp?.topics || []);
  const seenConceptsSection       = buildSeenConceptsSection(seenConcepts);
  const topicBoundary             = buildTopicBoundary(type);

  const ragSection = passages.length > 0
    ? `\nREFERENCE DOCUMENTATION — Base your questions on these official Splunk documentation passages.\nEvery question MUST be grounded in the content below. For each question, include a "docSource" field\nwith the URL of the passage that most directly supports that question.\n\n${passages.slice(0, 12).map((p, i) => `[DOC ${i + 1}] Topic: ${p.topic}\nSource: ${p.url}\n---\n${p.text.slice(0, 600)}\n---`).join('\n\n')}\n\n`
    : '';

  return `You are a Splunk certification exam author creating a mock exam for the "${type}" certification (${bp ? bp.level : 'intermediate'}).

EXAM CONTEXT:
- Certification: ${type}
- Level: ${bp ? bp.level : 'Intermediate'}
- Product Scope: ${productContext}
- Total Questions to Generate: ${num}
${providerContext}

DIFFICULTY CALIBRATION — strictly follow this for every question:
${difficulty}

TOPIC DISTRIBUTION — follow these counts exactly:
${topicDistribution}
${adaptivePromptSection}
${ragSection}${seenConceptsSection}

STRICT TOPIC BOUNDARY — this is the most important rule:
You MUST generate questions ONLY within the topics listed in the TOPIC DISTRIBUTION section above.
Do NOT introduce any topic, concept, or Splunk feature that belongs to a different certification exam.
Examples of what is FORBIDDEN for this exam ("${type}"):
${topicBoundary}
Every question's "topic" field must exactly match one of the topic names in the TOPIC DISTRIBUTION above.

QUESTION QUALITY RULES — every question must follow ALL of these:
1. Each question tests ONE specific, distinct concept. No two questions may test the same concept, even if the topic is the same.
2. Options must be grammatically parallel and similar in length (within ~10 words of each other). Never mix full sentences with single words as options.
3. All 4 options must be plausible to someone with partial knowledge — distractors should reflect real common misconceptions, not obvious wrong answers.
4. NEVER use "All of the above", "None of the above", or "Both A and B".
5. The correct answer must be verifiable against official Splunk documentation.
6. Do NOT repeat the exam type, certification name, or meta-information in the question text.
7. Questions must match the difficulty level above — do not make Entry-Level questions read like Expert-Level questions.
8. For ${num <= 5 ? 'small' : 'larger'} question sets, ensure maximum topic variety — do not repeat similar scenarios.`;
}
