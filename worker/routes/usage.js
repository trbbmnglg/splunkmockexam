/**
 * worker/routes/usage.js
 *
 * GET  /api/usage?userId=xxx
 *   → Returns today's exam count for this user
 *   → Shape: { count, limit, remaining, resetAt, exceeded }
 *
 * POST /api/usage
 *   → Body: { userId }
 *   → Checks BOTH userId and IP — whichever is higher wins
 *   → Increments both on success
 *   → Returns 429 if either hits the limit
 *
 * Bypass gap analysis:
 *   - Clear localStorage → new userId, but IP still tracked → blocked after 10
 *   - Incognito window   → new userId, same IP             → blocked after 10
 *   - Different browser  → new userId, same IP             → blocked after 10
 *   - VPN/proxy          → new IP, same userId             → blocked after 10
 *   - Both               → genuinely gets a fresh 10 (acceptable, requires effort)
 *
 * Owner bypass:
 *   Set USAGE_BYPASS_IDS env var in Cloudflare dashboard (comma-separated userIds).
 *   Bypassed users skip ALL checks and D1 writes.
 */

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

function hashIp(ip) {
  if (!ip || ip === 'unknown') return null;
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'ip_' + Math.abs(hash).toString(36);
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
  const ipHash = hashIp(getClientIp(request));

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

  const { userId } = body;
  if (!userId) return err('userId is required', 400);

  if (isBypassed(userId, env)) {
    return ok({ count: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, resetAt: nextMidnightUTC(), exceeded: false, bypassed: true });
  }

  const today   = todayUTC();
  const now     = new Date().toISOString();
  const ipHash  = hashIp(getClientIp(request));
  const resetAt = nextMidnightUTC();
  const corsHeaders = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  // Check both before incrementing
  const [userCount, ipCount] = await Promise.all([
    getCount(env, userId, today),
    ipHash ? getCount(env, ipHash, today) : Promise.resolve(0),
  ]);

  if (userCount >= DAILY_LIMIT || (ipHash && ipCount >= DAILY_LIMIT)) {
    return new Response(JSON.stringify({ error: buildLimitError(resetAt) }), { status: 429, headers: corsHeaders });
  }

  // Both under limit — increment both
  const writes = [upsertCount(env, userId, today, now)];
  if (ipHash) writes.push(upsertCount(env, ipHash, today, now));
  await Promise.all(writes);

  const count     = Math.max(userCount + 1, ipHash ? ipCount + 1 : 0);
  const remaining = Math.max(0, DAILY_LIMIT - count);

  return new Response(JSON.stringify({ count, limit: DAILY_LIMIT, remaining, resetAt, exceeded: false }), { status: 200, headers: corsHeaders });
}
