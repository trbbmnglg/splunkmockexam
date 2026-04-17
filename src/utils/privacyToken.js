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
 * Uses crypto.getRandomValues() for 256 bits of cryptographic entropy.
 */
export function getOrCreateToken() {
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      const bytes = new Uint8Array(32); // 256 bits
      crypto.getRandomValues(bytes);
      token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
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

/**
 * Convenience wrapper — every mutating fetch to a user-scoped worker route
 * must sign its body with userId + raw token + fresh timestamp. Returns
 * the combined body ready to JSON.stringify, or null if no token (caller
 * should skip the write when tracking is disabled).
 */
export function signedBody(userId, extra = {}) {
  const token = getOrCreateToken();
  if (!token || !userId) return null;
  return { userId, token, timestamp: Date.now(), ...extra };
}

/**
 * Header-based variant for GET endpoints — the Worker reads the raw token
 * from X-Auth-Token and the timestamp from X-Auth-Timestamp. Returns null
 * if the client has no token yet (caller should fall back to public mode).
 */
export function authHeaders() {
  const token = getOrCreateToken();
  if (!token) return null;
  return {
    'X-Auth-Token':     token,
    'X-Auth-Timestamp': String(Date.now()),
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
 *
 * After clearing, a new privacy token is immediately generated so that
 * subsequent sensitive operations don't fail with an unregistered token.
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
    // Pre-generate a new token so getOrCreateToken() is ready immediately
    getOrCreateToken();
  } catch { /* non-fatal */ }
}

// ── Auto-recovery from a stale token / mismatched userId ──────────────────────
//
// The worker's privacy_tokens table is first-write-wins — once a row exists
// for a given userId, the stored hash is immutable without proof of the old
// token. If the user's localStorage state drifts from D1 (cleared storage,
// different device, older visit), every auth'd request will 401.
//
// rotateIdentity() handles that case by minting a fresh userId + token pair,
// re-registering the hash, and effectively abandoning the orphaned D1 row.

let rotationPromise = null;
let lastRotationAt = 0;
const MIN_ROTATION_INTERVAL_MS = 10 * 1000;

/**
 * Mint a fresh userId + token, register the new token, return the new userId.
 * Safe to call concurrently — the first caller does the work, all other
 * in-flight callers await the same promise. Throttled so a burst of parallel
 * 401s only triggers one rotation.
 * @param {string} baseUrl - e.g. BASE_URL from utils/baseUrl
 * @returns {Promise<string|null>} The new userId, or null if unavailable.
 */
export function rotateIdentity(baseUrl) {
  if (rotationPromise) return rotationPromise;
  if (Date.now() - lastRotationAt < MIN_ROTATION_INTERVAL_MS) {
    try { return Promise.resolve(localStorage.getItem('splunkUserId')); }
    catch { return Promise.resolve(null); }
  }

  rotationPromise = (async () => {
    try {
      // Nuke identity keys; keep UI prefs (consent, tracking, API keys)
      // so the user isn't dropped back to onboarding.
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('splunkUserId');
        localStorage.removeItem('splunkAdaptiveProfile');
      } catch { /* non-fatal */ }

      // Fresh userId (mirrors adaptiveStorage.js format)
      const newUserId = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      try { localStorage.setItem('splunkUserId', newUserId); } catch { /* non-fatal */ }

      // Fresh token and registration
      const token = getOrCreateToken();
      if (!token || !baseUrl) return newUserId;
      const tokenHash = await hashToken(token);

      await fetch(`${baseUrl}/privacy/register-token`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: newUserId, tokenHash }),
        signal:  AbortSignal.timeout(8000),
      }).catch(() => { /* non-fatal — next auth call will retry */ });

      lastRotationAt = Date.now();
      return newUserId;
    } finally {
      rotationPromise = null;
    }
  })();

  return rotationPromise;
}
