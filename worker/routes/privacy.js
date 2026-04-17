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

import { verifyToken, isTimestampFresh } from './_auth.js';

const MAX_OPS_PER_DAY = 3;

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

// ── Main handler ──────────────────────────────────────────────────────────────
export async function handlePrivacy(request, env, ok, err) {
  if (request.method !== 'POST') return err('Method not allowed', 405);

  const url      = new URL(request.url);
  const action   = url.pathname.split('/').pop(); // 'register-token' | 'download' | 'delete-all'

  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON body', 400); }

  // ── Register token (first-write-wins — no auth required) ───────────────────
  // CRITICAL: DO NOT allow overwriting an existing token. Previously this
  // used ON CONFLICT DO UPDATE, which let any unauthenticated caller register
  // a new hash for any userId and lock the real owner out of delete-all /
  // download. Token rotation must go through a different endpoint that
  // requires proof of the old token.
  if (action === 'register-token') {
    const { userId, tokenHash } = body;
    if (!userId || !tokenHash) return err('userId and tokenHash are required', 400);

    // Validate hash looks like a SHA-256 hex string
    if (!/^[0-9a-f]{64}$/.test(tokenHash)) return err('Invalid token hash format', 400);

    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO privacy_tokens (user_id, token_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO NOTHING
    `).bind(userId, tokenHash, now, now).run();

    return ok({ success: true });
  }

  // ── Rotate token (requires proof of existing token) ────────────────────────
  // Allows clients to legitimately replace their token (e.g. after clearing
  // localStorage) without reopening the takeover vector above.
  if (action === 'rotate-token') {
    const { userId, token, timestamp, newTokenHash } = body;
    if (!userId || !token || !newTokenHash) {
      return err('userId, token, and newTokenHash are required', 400);
    }
    if (!/^[0-9a-f]{64}$/.test(newTokenHash)) {
      return err('Invalid token hash format', 400);
    }
    if (!isTimestampFresh(timestamp)) {
      return err('Request expired — generate a fresh request and try again', 401);
    }
    const valid = await verifyToken(env, userId, token);
    if (!valid) return err('Unauthorized', 401);
    const allowed = await checkAndIncrementRateLimit(env, userId);
    if (!allowed) return err(`Rate limit reached — max ${MAX_OPS_PER_DAY} data operations per day`, 429);

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE privacy_tokens SET token_hash = ?, updated_at = ? WHERE user_id = ?`
    ).bind(newTokenHash, now, userId).run();
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
