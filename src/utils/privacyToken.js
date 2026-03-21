/**
 * src/utils/privacyToken.js
 *
 * Manages the client-side privacy/deletion token.
 *
 * Security model:
 *   - A random 256-bit token is generated once and stored in localStorage.
 *   - Its SHA-256 hash is registered with the Worker and stored in D1.
 *   - Sensitive operations (download, delete-all) require userId + raw token
 *     + a fresh timestamp. The Worker hashes the token and compares to D1.
 *   - The raw token never leaves the client except in HTTPS request bodies.
 *   - Requests older than 5 minutes are rejected (replay attack prevention).
 *   - Rate limiting on the Worker side: max 3 sensitive ops per userId per day.
 *
 * Tracking preference:
 *   - Stored in localStorage as 'splunkTrackingEnabled' ('true'/'false').
 *   - Defaults to true (opt-in on first use via ConsentModal).
 *   - All D1 writes in agentAdaptive.js check this before proceeding.
 */

const TOKEN_KEY    = 'splunkPrivacyToken';
const TRACKING_KEY = 'splunkTrackingEnabled';

// ── Token management ──────────────────────────────────────────────────────────

/**
 * Returns the existing token from localStorage, or generates + stores a new one.
 * Uses crypto.randomUUID() for 122 bits of entropy.
 */
export function getOrCreateToken() {
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID() + '-' + crypto.randomUUID(); // ~244 bits
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * SHA-256 hash of the raw token, hex-encoded.
 * This is what gets stored in D1 — never the raw token.
 */
export async function hashToken(token) {
  const enc    = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Builds a signed request payload for sensitive Worker operations.
 * Includes userId, raw token, and a fresh timestamp.
 * Worker rejects if timestamp > 5 minutes old.
 */
export function buildSignedPayload(userId, token, extra = {}) {
  return {
    userId,
    token,                        // Worker hashes this and compares to D1
    timestamp: Date.now(),        // replay prevention — Worker checks < 5 min
    ...extra,
  };
}

// ── Tracking preference ───────────────────────────────────────────────────────

/**
 * Returns true if tracking is enabled (default: true).
 * Call this before every D1 write in agentAdaptive.js.
 */
export function isTrackingEnabled() {
  try {
    const val = localStorage.getItem(TRACKING_KEY);
    if (val === null) return true;   // default on — user consented via ConsentModal
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Sets tracking preference.
 * @param {boolean} enabled
 */
export function setTrackingEnabled(enabled) {
  try {
    localStorage.setItem(TRACKING_KEY, enabled ? 'true' : 'false');
  } catch { /* non-fatal */ }
}

/**
 * Completely removes all local data:
 *   - Privacy token (new one generated on next sensitive op)
 *   - Tracking preference
 *   - Adaptive profile
 *   - User ID (new one generated on next app load)
 * Call this AFTER the D1 wipe has succeeded.
 */
export function clearAllLocalData() {
  try {
    const keysToRemove = [
      TOKEN_KEY,
      TRACKING_KEY,
      'splunkAdaptiveProfile',
      'splunkUserId',
      'splunkExamConsent',
      'splunkMockExamApiKeys',
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* non-fatal */ }
}
