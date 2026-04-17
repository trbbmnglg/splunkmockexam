/**
 * worker/routes/_auth.js
 *
 * Shared authentication primitives for user-scoped worker routes.
 *
 * Signed-payload contract (same shape every caller uses):
 *   { userId: string, token: string, timestamp: number, ...rest }
 *
 * The Worker verifies by:
 *   1. Timestamp freshness (< 5 minutes old) — replay-attack prevention.
 *   2. SHA-256 hash of the raw token matches the stored hash in D1.
 *   3. Constant-time string compare — timing-attack resistant.
 *
 * Use verifyAuthedBody() at the top of every mutating route that touches
 * a user_id-scoped table, so we never again have cross-user writes.
 */

export const MAX_TIMESTAMP_AGE = 5 * 60 * 1000; // 5 minutes

// ── SHA-256 hex digest ────────────────────────────────────────────────────────
export async function hashToken(token) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Timestamp freshness ───────────────────────────────────────────────────────
export function isTimestampFresh(timestamp) {
  if (typeof timestamp !== 'number') return false;
  const age = Date.now() - timestamp;
  return age >= 0 && age < MAX_TIMESTAMP_AGE;
}

// ── Token verification ────────────────────────────────────────────────────────
export async function verifyToken(env, userId, rawToken) {
  if (!userId || !rawToken) return false;

  const row = await env.DB.prepare(
    `SELECT token_hash FROM privacy_tokens WHERE user_id = ?`
  ).bind(userId).first();

  if (!row) return false;

  const incoming = await hashToken(rawToken);

  // Constant-time compare to prevent timing attacks
  if (incoming.length !== row.token_hash.length) return false;
  let diff = 0;
  for (let i = 0; i < incoming.length; i++) {
    diff |= incoming.charCodeAt(i) ^ row.token_hash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifies a request body carries a fresh, valid signed payload.
 * Returns { ok: true, userId } on success, { ok: false, status, message }
 * on failure. Caller should return err(message, status) on failure.
 *
 * Usage:
 *   const auth = await verifyAuthedBody(body, env);
 *   if (!auth.ok) return err(auth.message, auth.status);
 *   // use auth.userId instead of body.userId
 */
export async function verifyAuthedBody(body, env) {
  const { userId, token, timestamp } = body || {};
  if (!userId || !token) {
    return { ok: false, status: 400, message: 'userId and token are required' };
  }
  if (!isTimestampFresh(timestamp)) {
    return { ok: false, status: 401, message: 'Request expired — generate a fresh request and try again' };
  }
  const valid = await verifyToken(env, userId, token);
  if (!valid) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }
  return { ok: true, userId };
}

/**
 * Header-based variant for GET endpoints that read user-scoped data.
 * Required headers:
 *   X-Auth-Token:     <raw token>
 *   X-Auth-Timestamp: <ms epoch>
 * The userId is still in the query string — headers only carry proof.
 */
export async function verifyAuthedRequest(request, env, userId) {
  if (!userId) {
    return { ok: false, status: 400, message: 'userId is required' };
  }
  const token     = request.headers.get('X-Auth-Token');
  const tsHeader  = request.headers.get('X-Auth-Timestamp');
  const timestamp = tsHeader ? Number(tsHeader) : null;

  if (!token) {
    return { ok: false, status: 401, message: 'X-Auth-Token header required' };
  }
  if (!isTimestampFresh(timestamp)) {
    return { ok: false, status: 401, message: 'Request expired — refresh and try again' };
  }
  const valid = await verifyToken(env, userId, token);
  if (!valid) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }
  return { ok: true, userId };
}

// ── SHA-256-based IP hash (replaces the old 32-bit simpleHash) ────────────────
// Uses a cheap truncated SHA-256 (16 hex chars = 64 bits) so collisions drop
// from ~1-in-4B to ~1-in-1.8×10^19. Still not reversible without the full
// IPv4/IPv6 dictionary, same as before — but vastly stronger against
// bucket-grinding attacks against rate limits.
export async function hashIp(ip) {
  if (!ip || ip === 'unknown') return null;
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode('ip:' + ip));
  const bytes = new Uint8Array(digest).slice(0, 8); // 64-bit prefix
  return 'ip_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
