/**
 * worker/routes/usage.js
 *
 * GET  /api/usage?userId=xxx
 *   → Returns today's exam count for this user
 *   → Shape: { count, limit, remaining, resetAt }
 *
 * POST /api/usage
 *   → Body: { userId }
 *   → Increments today's count and returns updated state
 *   → Returns 429 if limit exceeded
 *
 * Rules:
 *   - Limit applies ONLY to shared-key users (checked client-side before calling)
 *   - 10 exams per UTC day
 *   - Review sessions do NOT call this endpoint (they don't use shared quota)
 *   - Resets automatically at UTC midnight — no cron needed
 */

const DAILY_LIMIT = 10;

// ── Dev/owner bypass ──────────────────────────────────────────────────────────
// Add your userId (from localStorage key 'splunkUserId') here to bypass the limit.
// Get it from DevTools → Application → Local Storage → splunkUserId.
// Set via Cloudflare dashboard → Worker → Settings → Variables → USAGE_BYPASS_IDS
// Format: comma-separated list of userId values, e.g. "u_abc123,u_def456"
function isBypassed(userId, env) {
  const raw = env.USAGE_BYPASS_IDS || '';
  if (!raw.trim()) return false;
  return raw.split(',').map(s => s.trim()).includes(userId);
}

function todayUTC() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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

export async function handleUsage(request, env, ok, err) {
  if (request.method === 'GET') {
    return getUsage(request, env, ok, err);
  }
  if (request.method === 'POST') {
    return incrementUsage(request, env, ok, err);
  }
  return err('Method not allowed', 405);
}

// ─── GET /api/usage ───────────────────────────────────────────────────────────
async function getUsage(request, env, ok, err) {
  const url    = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) return err('userId is required', 400);

  // Bypass for owner/dev accounts
  if (isBypassed(userId, env)) {
    return ok({ count: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, resetAt: nextMidnightUTC(), exceeded: false, bypassed: true });
  }

  const today = todayUTC();

  const row = await env.DB.prepare(
    `SELECT exam_count FROM usage_limits WHERE user_id = ? AND exam_date = ?`
  ).bind(userId, today).first();

  const count     = row?.exam_count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - count);

  return ok({
    count,
    limit:     DAILY_LIMIT,
    remaining,
    resetAt:   nextMidnightUTC(),
    exceeded:  count >= DAILY_LIMIT,
  });
}

// ─── POST /api/usage ──────────────────────────────────────────────────────────
async function incrementUsage(request, env, ok, err) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const { userId } = body;
  if (!userId) return err('userId is required', 400);

  // Bypass for owner/dev accounts — don't touch D1 at all
  if (isBypassed(userId, env)) {
    return ok({ count: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, resetAt: nextMidnightUTC(), exceeded: false, bypassed: true });
  }

  const today = todayUTC();
  const now   = new Date().toISOString();

  // Upsert: insert or increment
  await env.DB.prepare(`
    INSERT INTO usage_limits (user_id, exam_date, exam_count, last_updated)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(user_id, exam_date) DO UPDATE SET
      exam_count   = usage_limits.exam_count + 1,
      last_updated = excluded.last_updated
  `).bind(userId, today, now).run();

  // Read back the new count
  const row = await env.DB.prepare(
    `SELECT exam_count FROM usage_limits WHERE user_id = ? AND exam_date = ?`
  ).bind(userId, today).first();

  const count     = row?.exam_count ?? 1;
  const remaining = Math.max(0, DAILY_LIMIT - count);
  const exceeded  = count > DAILY_LIMIT;

  if (exceeded) {
    // Decrement back — don't count a blocked attempt
    await env.DB.prepare(`
      UPDATE usage_limits
      SET exam_count = exam_count - 1, last_updated = ?
      WHERE user_id = ? AND exam_date = ?
    `).bind(now, userId, today).run();

    return err(JSON.stringify({
      code:      'DAILY_LIMIT_EXCEEDED',
      count:     DAILY_LIMIT,
      limit:     DAILY_LIMIT,
      remaining: 0,
      resetAt:   nextMidnightUTC(),
    }), 429);
  }

  return ok({
    count,
    limit:     DAILY_LIMIT,
    remaining,
    resetAt:   nextMidnightUTC(),
    exceeded:  false,
  });
}
