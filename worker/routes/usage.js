/**
 * worker/routes/usage.js
 *
 * GET  /api/usage?userId=xxx
 *   → Returns today's exam count for this user
 *   → Shape: { count, limit, remaining, resetAt, exceeded }
 *
 * POST /api/usage
 *   → Body: { userId, token, timestamp }  (signed-payload contract)
 *   → Requires a valid privacy token — otherwise an unauthenticated caller
 *     could DoS any victim by pushing their counter to the daily limit.
 *   → Checks BOTH userId and IP — whichever is higher wins.
 *   → Increments both on success.
 *   → Returns 429 if either hits the limit.
 *
 * Bypass gap analysis:
 *   - Clear localStorage → new userId + new token, IP still tracked → blocked after 10
 *   - VPN/proxy          → new IP, same userId                      → blocked after 10
 *   - Both               → genuinely gets a fresh 10 (acceptable, requires effort)
 *
 * Owner bypass:
 *   Set USAGE_BYPASS_IDS env var in Cloudflare dashboard (comma-separated userIds).
 *   Bypassed users skip ALL checks and D1 writes.
 */

import { verifyAuthedBody, hashIp } from './_auth.js';

const DAILY_LIMIT = 10;

function todayUTC() {
  return new Date().toISOString().split('T')[0];
}

function nextMidnightUTC() {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0
  ));
  return midnight.toISOString();
}

function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

function isBypassed(userId, env) {
  const raw = env.USAGE_BYPASS_IDS || '';
  if (!raw.trim()) return false;
  return raw.split(',').map(s => s.trim()).includes(userId);
}

function buildLimitError(resetAt) {
  const resetTime = new Date(resetAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone: 'UTC',
  });
  return JSON.stringify({
    code: 'DAILY_LIMIT_EXCEEDED', limit: DAILY_LIMIT, remaining: 0, resetAt, resetTime,
  });
}

async function getCount(env, key, today) {
  const row = await env.DB.prepare(
    `SELECT exam_count FROM usage_limits WHERE user_id = ? AND exam_date = ?`
  ).bind(key, today).first();
  return row?.exam_count ?? 0;
}

async function upsertCount(env, key, today, now) {
  await env.DB.prepare(`
    INSERT INTO usage_limits (user_id, exam_date, exam_count, last_updated)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(user_id, exam_date) DO UPDATE SET
      exam_count   = usage_limits.exam_count + 1,
      last_updated = excluded.last_updated
  `).bind(key, today, now).run();
}

export async function handleUsage(request, env, ok, err) {
  if (request.method === 'GET')  return getUsage(request, env, ok, err);
  if (request.method === 'POST') return incrementUsage(request, env, ok, err);
  return err('Method not allowed', 405);
}

async function getUsage(request, env, ok, err) {
  const url    = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return err('userId is required', 400);

  if (isBypassed(userId, env)) {
    return ok({ count: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, resetAt: nextMidnightUTC(), exceeded: false, bypassed: true });
  }

  const today  = todayUTC();
  const ipHash = await hashIp(getClientIp(request));

  const [userCount, ipCount] = await Promise.all([
    getCount(env, userId, today),
    ipHash ? getCount(env, ipHash, today) : Promise.resolve(0),
  ]);

  const count     = Math.max(userCount, ipCount);
  const remaining = Math.max(0, DAILY_LIMIT - count);

  return ok({ count, limit: DAILY_LIMIT, remaining, resetAt: nextMidnightUTC(), exceeded: count >= DAILY_LIMIT });
}

async function incrementUsage(request, env, ok, err) {
  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON body', 400); }

  // Require a signed payload — otherwise any unauthenticated caller could
  // burn a victim's daily quota to DoS them.
  const auth = await verifyAuthedBody(body, env);
  if (!auth.ok) return err(auth.message, auth.status);
  const userId = auth.userId;

  if (isBypassed(userId, env)) {
    return ok({ count: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, resetAt: nextMidnightUTC(), exceeded: false, bypassed: true });
  }

  const today   = todayUTC();
  const now     = new Date().toISOString();
  const ipHash  = await hashIp(getClientIp(request));
  const resetAt = nextMidnightUTC();

  // Check both before incrementing
  const [userCount, ipCount] = await Promise.all([
    getCount(env, userId, today),
    ipHash ? getCount(env, ipHash, today) : Promise.resolve(0),
  ]);

  if (userCount >= DAILY_LIMIT || (ipHash && ipCount >= DAILY_LIMIT)) {
    return err(buildLimitError(resetAt), 429);
  }

  // Both under limit — increment both
  const writes = [upsertCount(env, userId, today, now)];
  if (ipHash) writes.push(upsertCount(env, ipHash, today, now));
  await Promise.all(writes);

  const count     = Math.max(userCount + 1, ipHash ? ipCount + 1 : 0);
  const remaining = Math.max(0, DAILY_LIMIT - count);

  return ok({ count, limit: DAILY_LIMIT, remaining, resetAt, exceeded: false });
}
