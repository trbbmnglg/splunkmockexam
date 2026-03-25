/**
 * Adaptive profile: user ID, localStorage helpers, clear/reset.
 */
import { BASE_URL } from './baseUrl';

const LOCAL_KEY   = 'splunkAdaptiveProfile';
const USER_ID_KEY = 'splunkUserId';

export const SCORE_HISTORY_WINDOW = 7;
export const GRADUATION_WINDOW   = 5;
export const GRADUATION_THRESHOLD = 85;

/**
 * Get or create a persistent anonymous user ID stored in localStorage.
 * @returns {string} User ID string (e.g. "u_abc123_xyz789"), or "anonymous" on storage failure.
 */
export const getUserId = () => {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
};

/**
 * Load the full adaptive profile object from localStorage.
 * @returns {object} Profile keyed by exam type, or empty object on failure.
 */
export const loadLocalProfile = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

/**
 * Persist the full adaptive profile object to localStorage.
 * @param {object} profile - Profile object keyed by exam type.
 */
export const saveLocalProfile = (profile) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[Adaptive] Could not save local profile:', err.message);
  }
};

/**
 * Clear adaptive profile data for a specific exam type (or all types).
 * Deletes from both the remote D1 store and localStorage.
 * @param {string} [examType] - Exam type to clear. If omitted, clears all types.
 */
export const clearProfile = (examType) => {
  const userId = getUserId();
  fetch(`${BASE_URL}/profile`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ userId, examType })
  }).catch(() => {});
  const local = loadLocalProfile();
  if (examType) delete local[examType];
  else Object.keys(local).forEach(k => delete local[k]);
  saveLocalProfile(local);
};
