/**
 * worker/routes/profile.js
 *
 * GET  /api/profile?userId=xxx&examType=yyy
 *   → Returns the full topic profile for this user + exam
 *   → Shape: { sessions, lastUpdated, topics: { [name]: { attempts, errors, lastScore, trend } } }
 *
 * POST /api/profile
 *   → Body: { userId, examType, sessionResults: [ { topic, attempts, errors, sessionScore } ] }
 *   → Upserts each topic row, recalculates trend, increments sessions
 *   → Also updates community_stats (anonymized aggregate)
 */

export async function handleProfile(request, env, ok, err) {
  if (request.method === 'GET') {
    return getProfile(request, env, ok, err);
  }
  if (request.method === 'POST') {
    return postProfile(request, env, ok, err);
  }
  if (request.method === 'DELETE') {
    return deleteProfile(request, env, ok, err);
  }
  return err('Method not allowed', 405);
}

// ─── GET /api/profile ────────────────────────────────────────────────────────
async function getProfile(request, env, ok, err) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const examType = url.searchParams.get('examType');

  if (!userId || !examType) {
    return err('userId and examType are required', 400);
  }

  // Get all topic rows for this user + exam
  const rows = await env.DB.prepare(
    `SELECT topic, attempts, errors, last_score, trend, sessions, last_updated
     FROM topic_profiles
     WHERE user_id = ? AND exam_type = ?
     ORDER BY errors DESC`
  ).bind(userId, examType).all();

  if (!rows.results || rows.results.length === 0) {
    return ok({ sessions: 0, lastUpdated: null, topics: {} });
  }

  // Reconstruct the profile shape agentAdaptive.js expects
  const topics = {};
  let totalSessions = 0;
  let lastUpdated = null;

  for (const row of rows.results) {
    topics[row.topic] = {
      attempts:   row.attempts,
      errors:     row.errors,
      lastScore:  row.last_score,
      trend:      row.trend,
    };
    // sessions is stored per-row (same value for all rows of same user+exam)
    totalSessions = Math.max(totalSessions, row.sessions);
    if (!lastUpdated || row.last_updated > lastUpdated) {
      lastUpdated = row.last_updated;
    }
  }

  return ok({ sessions: totalSessions, lastUpdated, topics });
}

// ─── POST /api/profile ───────────────────────────────────────────────────────
async function postProfile(request, env, ok, err) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const { userId, examType, sessionResults } = body;

  if (!userId || !examType || !Array.isArray(sessionResults)) {
    return err('userId, examType, and sessionResults[] are required', 400);
  }

  const now = new Date().toISOString();

  // Get current session count for this user+exam (any row will do)
  const existing = await env.DB.prepare(
    `SELECT sessions FROM topic_profiles WHERE user_id = ? AND exam_type = ? LIMIT 1`
  ).bind(userId, examType).first();

  const newSessionCount = (existing?.sessions ?? 0) + 1;

  // Upsert each topic row
  const statements = sessionResults.map(({ topic, attempts, errors, sessionScore }) => {
    // Calculate trend by comparing to previous lastScore
    // We do this in the upsert using a CASE expression
    return env.DB.prepare(`
      INSERT INTO topic_profiles (user_id, exam_type, topic, attempts, errors, last_score, trend, sessions, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)
      ON CONFLICT(user_id, exam_type, topic) DO UPDATE SET
        attempts     = topic_profiles.attempts + excluded.attempts,
        errors       = topic_profiles.errors   + excluded.errors,
        trend        = CASE
                         WHEN excluded.last_score > topic_profiles.last_score + 10 THEN 'improving'
                         WHEN excluded.last_score < topic_profiles.last_score - 10 THEN 'declining'
                         ELSE 'stable'
                       END,
        last_score   = excluded.last_score,
        sessions     = excluded.sessions,
        last_updated = excluded.last_updated
    `).bind(userId, examType, topic, attempts, errors, sessionScore, newSessionCount, now);
  });

  // Also update community stats (anonymized)
  const communityStatements = sessionResults.map(({ topic, attempts, errors }) => {
    return env.DB.prepare(`
      INSERT INTO community_stats (exam_type, topic, total_attempts, total_errors, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(exam_type, topic) DO UPDATE SET
        total_attempts = community_stats.total_attempts + excluded.total_attempts,
        total_errors   = community_stats.total_errors   + excluded.total_errors,
        updated_at     = excluded.updated_at
    `).bind(examType, topic, attempts, errors, now);
  });

  // Execute all upserts in a single batch
  await env.DB.batch([...statements, ...communityStatements]);

  return ok({ success: true, sessions: newSessionCount });
}

// ─── DELETE /api/profile ─────────────────────────────────────────────────────
async function deleteProfile(request, env, ok, err) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const { userId, examType } = body;
  if (!userId) return err('userId is required', 400);

  if (examType) {
    // Delete only this exam type's profile
    await env.DB.prepare(
      `DELETE FROM topic_profiles WHERE user_id = ? AND exam_type = ?`
    ).bind(userId, examType).run();
  } else {
    // Delete all profiles for this user
    await env.DB.prepare(
      `DELETE FROM topic_profiles WHERE user_id = ?`
    ).bind(userId).run();
  }

  return ok({ success: true, deleted: true });
}
