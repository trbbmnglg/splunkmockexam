/**
 * Build the adaptive prompt context injected into AI generation prompts.
 */
import { loadLocalProfile, SCORE_HISTORY_WINDOW } from './adaptiveStorage';

export const buildAdaptiveContext = (examType, numQuestions, blueprintTopics) => {
  const local       = loadLocalProfile();
  const examProfile = local[examType];
  if (!examProfile || examProfile.sessions === 0 || Object.keys(examProfile.topics).length === 0) {
    return { adaptivePromptSection: '', adaptiveSummary: null };
  }

  const scored = Object.entries(examProfile.topics).map(([name, stats]) => {
    const errorRate     = stats.attempts > 0 ? stats.errors / stats.attempts : 0;
    const recencyFactor = stats.trend === 'declining' ? 1.4 : stats.trend === 'improving' ? 0.7 : 1.0;
    const isGraduated   = !!(stats.graduatedAt);
    return {
      name,
      errorRate:             Math.round(errorRate * 100),
      trend:                 stats.trend,
      priority:              isGraduated ? -1 : errorRate * recencyFactor,
      lastScore:             stats.lastScore,
      scoreHistory:          stats.scoreHistory || [],
      validationFailureRate: stats.validationFailureRate ?? 0,
      graduated:             isGraduated,
      graduatedAt:           stats.graduatedAt || null,
    };
  }).sort((a, b) => b.priority - a.priority);

  const graduatedTopics = scored.filter(t => t.graduated);
  const activeTopics    = scored.filter(t => !t.graduated);
  const weakTopics      = activeTopics.filter(t => t.errorRate > 40);
  const strongTopics    = activeTopics.filter(t => t.errorRate <= 20 && t.trend !== 'new');
  const highValidationFailureTopics = activeTopics.filter(t => t.validationFailureRate >= 30);

  if (activeTopics.length === 0 && graduatedTopics.length === 0) {
    return { adaptivePromptSection: '', adaptiveSummary: null };
  }

  const graduatedAllocation = graduatedTopics.length;
  const remainingQuestions  = Math.max(1, numQuestions - graduatedAllocation);
  const baseWeight          = remainingQuestions / Math.max(activeTopics.length, 1);

  const distribution = [
    ...activeTopics.map(t => {
      let count;
      if (t.errorRate > 60)                                  count = Math.ceil(baseWeight * 1.8);
      else if (t.errorRate > 40)                             count = Math.ceil(baseWeight * 1.4);
      else if (t.errorRate <= 20 && t.trend === 'improving') count = Math.floor(baseWeight * 0.6);
      else if (t.errorRate <= 20)                            count = Math.floor(baseWeight * 0.8);
      else                                                   count = Math.round(baseWeight);
      return { ...t, adaptiveCount: Math.max(1, count) };
    }),
    ...graduatedTopics.map(t => ({ ...t, adaptiveCount: 1 })),
  ];

  let total = distribution.reduce((s, t) => s + t.adaptiveCount, 0);
  let i = 0;
  const activeIndices = distribution.map((t, idx) => (!t.graduated ? idx : -1)).filter(idx => idx >= 0);
  while (total < numQuestions && activeIndices.length > 0) {
    distribution[activeIndices[i % activeIndices.length]].adaptiveCount++;
    total++; i++;
  }
  while (total > numQuestions) {
    const idx = distribution.slice().reverse().findIndex(t => !t.graduated && t.adaptiveCount > 1);
    if (idx >= 0) { distribution[distribution.length - 1 - idx].adaptiveCount--; total--; }
    else break;
  }

  const weakList = weakTopics.map(t =>
    `  - "${t.name}" (${t.errorRate}% error rate, trend: ${t.trend}, sessions tracked: ${t.scoreHistory.length})`
  ).join('\n');

  const graduatedList = graduatedTopics.length > 0
    ? `\nGraduated topics (mastered — receiving minimum 1 question each):\n${
        graduatedTopics.map(t => `  - "${t.name}" (graduated ${new Date(t.graduatedAt).toLocaleDateString()})`).join('\n')
      }`
    : '';

  const distList = distribution.map(t =>
    `  - "${t.name}": ${t.adaptiveCount} question${t.adaptiveCount !== 1 ? 's' : ''}${t.graduated ? ' (mastered)' : ''}`
  ).join('\n');

  const validationWarning = highValidationFailureTopics.length > 0
    ? `
GENERATION QUALITY WARNING — Based on historical validation data, the following topics
have produced high question failure rates in past sessions. Apply extra care:
${highValidationFailureTopics.map(t =>
  `  - "${t.name}": ${t.validationFailureRate}% of generated questions failed quality review`
).join('\n')}
For these topics specifically:
- Ensure the "answer" field is an EXACT character-for-character copy of one option string
- Keep all 4 options grammatically parallel and within ~10 words of each other
- Double-check that no option contains "All of the above" or "None of the above"
`
    : '';

  return {
    adaptivePromptSection: `
ADAPTIVE LEARNING CONTEXT — This candidate has taken ${examProfile.sessions} previous session(s).
Based on their rolling performance history (up to last ${SCORE_HISTORY_WINDOW} sessions), adjust question generation as follows:

Weak areas requiring extra focus (${weakTopics.length} topic${weakTopics.length !== 1 ? 's' : ''}):
${weakList || '  (none identified yet)'}
${graduatedList}
ADAPTIVE QUESTION DISTRIBUTION — follow these counts exactly:
${distList}

For weak topics (error rate > 40%):
- Vary question angles — approach from a different angle than last time
- Do NOT re-ask questions they have likely already seen
- Slightly increase conceptual depth to reinforce understanding

For mastered/graduated topics (1 question each):
- Ask a single representative question to maintain recall
- Do not over-focus — this topic is already strong
${validationWarning}`,
    adaptiveSummary: {
      sessions:       examProfile.sessions,
      weakTopics:     weakTopics.map(t  => ({ name: t.name, errorRate: t.errorRate, trend: t.trend, scoreHistory: t.scoreHistory })),
      strongTopics:   strongTopics.map(t => ({ name: t.name, errorRate: t.errorRate, trend: t.trend, scoreHistory: t.scoreHistory })),
      graduatedTopics: graduatedTopics.map(t => ({ name: t.name, graduatedAt: t.graduatedAt })),
      highValidationFailureTopics: highValidationFailureTopics.map(t => ({
        name: t.name, validationFailureRate: t.validationFailureRate,
      })),
      distribution: distribution.map(t => ({ name: t.name, count: t.adaptiveCount, graduated: t.graduated })),
    },
  };
};
