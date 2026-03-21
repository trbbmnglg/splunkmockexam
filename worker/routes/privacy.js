/**
 * worker/routes/privacy.js
 *
 * Handles all data privacy operations under GDPR, PDPA, and CCPA.
 *
 * Routes:
 *   POST /api/privacy/register-token
 *     → Registers a new token hash for a userId (called on first app load)
 *     → Body: { userId, tokenHash }
 *
 *   POST /api/privacy/download
 *     → Returns all D1 data for a userId as JSON
 *     → Body: { userId, token, timestamp }
 *
 *   POST /api/privacy/delete-all
 *     → Wipes all D1 data for a userId across all tables
 *     → Body: { userId, token, timestamp }
 *
 * Security guards on all sensitive operations:
 *   1. userId + token required — token is hashed and compared to D1
 *   2. Timestamp must be < 5 minutes old (replay attack prevention)
 *   3. Rate limited — max 3 sensitive ops per userId per day
 *   4. Token hash never logged or returned in responses
 */

const MAX_OPS_PER_DAY  = 3;
const MAX_TIMESTAMP_AGE = 5 * 60 * 1000; // 5 minutes in ms

// ── SHA-256 hash (mirrors client-side hashToken) ──────────────────────────────
async function hashToken(token) {
  const enc    = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Timestamp validation ──────────────────────────────────────────────────────
function isTimestampFresh(timestamp) {
  if (typeof timestamp !== 'number') return false;
  const age = Date.now() - timestamp;
  return age >= 0 && age < MAX_TIMESTAMP_AGE;
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
async function checkAndIncrementRateLimit(env, userId) {
  const today = new Date().toISOString().split('T')[0];
  const key   = `privacy_${userId}`;

  const row = await env.DB.prepare(
    `SELECT exam_count FROM usage_limits WHERE user_id = ? AND exam_date = ?`
  ).bind(key, today).first();

  const count = row?.exam_count ?? 0;
  if (count >= MAX_OPS_PER_DAY) return false;

  await env.DB.prepare(`
    INSERT INTO usage_limits (user_id, exam_date, exam_count, last_updated)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(user_id, exam_date) DO UPDATE SET
      exam_count   = usage_limits.exam_count + 1,
      last_updated = excluded.last_updated
  `).bind(key, today, new Date().toISOString()).run();

  return true;
}

// ── Token verification ────────────────────────────────────────────────────────
async function verifyToken(env, userId, rawToken) {
  if (!userId || !rawToken) return false;

  const row = await env.DB.prepare(
    `SELECT token_hash FROM privacy_tokens WHERE user_id = ?`
  ).bind(userId).first();

  if (!row) return false;

  const incoming = await hashToken(rawToken);

  // Constant-time comparison to prevent timing attacks
  if (incoming.length !== row.token_hash.length) return false;
  let diff = 0;
  for (let i = 0; i < incoming.length; i++) {
    diff |= incoming.charCodeAt(i) ^ row.token_hash.charCodeAt(i);
  }
  return diff === 0;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function handlePrivacy(request, env, ok, err) {
  if (request.method !== 'POST') return err('Method not allowed', 405);

  const url      = new URL(request.url);
  const action   = url.pathname.split('/').pop(); // 'register-token' | 'download' | 'delete-all'

  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON body', 400); }

  // ── Register token (no auth required — just stores the hash) ───────────────
  if (action === 'register-token') {
    const { userId, tokenHash } = body;
    if (!userId || !tokenHash) return err('userId and tokenHash are required', 400);

    // Validate hash looks like a SHA-256 hex string
    if (!/^[0-9a-f]{64}$/.test(tokenHash)) return err('Invalid token hash format', 400);

    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO privacy_tokens (user_id, token_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        token_hash = excluded.token_hash,
        updated_at = excluded.updated_at
    `).bind(userId, tokenHash, now, now).run();

    return ok({ success: true });
  }

  // ── Shared validation for sensitive operations ─────────────────────────────
  const { userId, token, timestamp } = body;

  if (!userId || !token) return err('userId and token are required', 400);

  // 1. Timestamp freshness — prevents replay attacks
  if (!isTimestampFresh(timestamp)) {
    return err('Request expired — generate a fresh request and try again', 401);
  }

  // 2. Token verification — constant-time comparison
  const tokenValid = await verifyToken(env, userId, token);
  if (!tokenValid) {
    return err('Unauthorized', 401);
  }

  // 3. Rate limiting
  const allowed = await checkAndIncrementRateLimit(env, userId);
  if (!allowed) {
    return err(`Rate limit reached — max ${MAX_OPS_PER_DAY} data operations per day`, 429);
  }

  // ── Download ───────────────────────────────────────────────────────────────
  if (action === 'download') {
    const [profiles, wrongAnswers, seenConcepts, usageLimits] = await Promise.all([
      env.DB.prepare(`SELECT exam_type, topic, attempts, errors, last_score, trend, score_history, graduated_at, sessions, last_updated FROM topic_profiles WHERE user_id = ?`).bind(userId).all(),
      env.DB.prepare(`SELECT exam_type, topic, question, correct_answer, times_missed, last_missed, next_review FROM wrong_answers WHERE user_id = ?`).bind(userId).all(),
      env.DB.prepare(`SELECT exam_type, concept_hint, topic, created_at FROM seen_concepts WHERE user_id = ?`).bind(userId).all(),
      env.DB.prepare(`SELECT exam_date, exam_count FROM usage_limits WHERE user_id = ? AND user_id NOT LIKE 'privacy_%'`).bind(userId).all(),
    ]);

    return ok({
      exportedAt:   new Date().toISOString(),
      userId,
      notice:       'This is all data stored about you in our system. Raw token hashes and IP hashes are excluded for security.',
      profiles:     profiles.results     || [],
      wrongAnswers: wrongAnswers.results || [],
      seenConcepts: seenConcepts.results || [],
      usageLimits:  usageLimits.results  || [],
    });
  }

  // ── Delete all ─────────────────────────────────────────────────────────────
  if (action === 'delete-all') {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM topic_profiles      WHERE user_id = ?`).bind(userId),
      env.DB.prepare(`DELETE FROM wrong_answers        WHERE user_id = ?`).bind(userId),
      env.DB.prepare(`DELETE FROM seen_concepts        WHERE user_id = ?`).bind(userId),
      env.DB.prepare(`DELETE FROM generation_traces    WHERE user_id = ?`).bind(userId),
      env.DB.prepare(`DELETE FROM privacy_tokens       WHERE user_id = ?`).bind(userId),
      // Also clear rate limit keys for this user
      env.DB.prepare(`DELETE FROM usage_limits         WHERE user_id = ?`).bind(userId),
      env.DB.prepare(`DELETE FROM usage_limits         WHERE user_id = ?`).bind(`privacy_${userId}`),
    ]);

    // Note: community_stats is anonymized aggregate data — no userId stored there,
    // so nothing to delete. feedback_submissions uses ip_hash only — also no userId.

    return ok({ success: true, deleted: true });
  }

  return err('Unknown action', 400);
}
