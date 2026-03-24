/**
 * Adaptive profile: user ID, localStorage helpers, clear/reset.
 */
import { BASE_URL } from './baseUrl';

const LOCAL_KEY   = 'splunkAdaptiveProfile';
const USER_ID_KEY = 'splunkUserId';

export const SCORE_HISTORY_WINDOW = 7;
export const GRADUATION_WINDOW   = 4;
export const GRADUATION_THRESHOLD = 80;

// ─── User ID ──────────────────────────────────────────────────────────────────
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

// ─── localStorage helpers ─────────────────────────────────────────────────────
export const loadLocalProfile = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

export const saveLocalProfile = (profile) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[Adaptive] Could not save local profile:', err.message);
  }
};

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
