/**
 * Barrel re-export — keeps all existing `import { … } from './agentAdaptive'` working.
 *
 * The actual implementations now live in:
 *   adaptiveStorage.js — getUserId, localStorage helpers, clearProfile
 *   adaptiveProfile.js — loadProfile, updateProfile, computeExamReadiness, getProfileSummary
 *   adaptiveRemote.js  — getCommunityStats, wrong answers, seen concepts
 *   adaptiveContext.js  — buildAdaptiveContext
 */
export { getUserId, clearProfile } from './adaptiveStorage';
export { loadProfile, updateProfile, computeExamReadiness, getProfileSummary } from './adaptiveProfile';
export { getCommunityStats, getWrongAnswerBank, clearReviewedAnswers, saveSeenConcepts, getRecentSeenConcepts } from './adaptiveRemote';
export { buildAdaptiveContext } from './adaptiveContext';
