/**
 * worker/routes/profile.js
 *
 * GET  /api/profile?userId=xxx&examType=yyy
 *   → Shape: { sessions, lastUpdated, topics: { [name]: { attempts, errors, lastScore, trend, scoreHistory, graduatedAt } } }
 *
 * POST /api/profile
 *   → Upserts each topic row, appends sessionScore to score_history (capped at 7),
 *     recalculates rolling trend, checks graduation criteria, increments sessions.
 *
 * Graduation criteria (server-side):
 *   A topic graduates when the last GRADUATION_WINDOW consecutive scores in score_history
 *   ALL meet or exceed GRADUATION_THRESHOLD. graduated_at is set to now.
 *   A topic UN-graduates if the latest score drops below GRADUATION_THRESHOLD — the
 *   adaptive agent re-engages immediately.
 */

const SCORE_HISTORY_WINDOW   = 7;
const GRADUATION_WINDOW      = 4;    // last N sessions must all be strong
const GRADUATION_THRESHOLD   = 80;   // each session score must be ≥ this

// ─── Rolling trend from score history ────────────────────────────────────────
function computeTrend(scoreHistory) {
  if (!Array.isArray(scoreHistory) || scoreHistory.length < 2) return 'new';
  const mid    = Math.floor(scoreHistory.length / 2);
  const older  = scoreHistory.slice(0, mid);
  const recent = scoreHistory.slice(mid);
  const avgOlder  = older.reduce((s, v) => s + v, 0) / older.length;
  const avgRecent = recent.reduce((s, v) => s + v, 0) / recent.length;
  const delta = avgRecent - avgOlder;
  if (delta > 10)  return 'improving';
  if (delta < -10) return 'declining';
  return 'stable';
}

// ─── Append score to history, capped at window size ───────────────────────────
function appendScore(existingHistoryJson, newScore) {
  let history = [];
  try {
    history = JSON.parse(existingHistoryJson || '[]');
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }
  history.push(newScore);
  if (history.length > SCORE_HISTORY_WINDOW) {
    history = history.slice(history.length - SCORE_HISTORY_WINDOW);
  }
  return JSON.stringify(history);
}

// ─── Graduation check ─────────────────────────────────────────────────────────
// Returns ISO timestamp if topic should be graduated now, or null if not.
// Un-graduates if the latest score is below threshold regardless of history.
function computeGraduatedAt(scoreHistory, existingGraduatedAt, now) {
  if (!Array.isArray(scoreHistory) || scoreHistory.length < GRADUATION_WINDOW) return null;

  const latestScore = scoreHistory[scoreHistory.length - 1];

  // Un-graduate immediately if latest session dipped below threshold
  if (latestScore < GRADUATION_THRESHOLD) return null;

  // Check last GRADUATION_WINDOW scores all meet threshold
  const window = scoreHistory.slice(-GRADUATION_WINDOW);
  const allStrong = window.every(s => s >= GRADUATION_THRESHOLD);

  if (allStrong) {
    // Keep original graduation date if already graduated — don't reset the clock
    return existingGraduatedAt || now;
  }

  return null;
}

export async function handleProfile(request, env, ok, err) {
  if (request.method === 'GET')    return getProfile(request, env, ok, err);
  if (request.method === 'POST')   return postProfile(request, env, ok, err);
  if (request.method === 'DELETE') return deleteProfile(request, env, ok, err);
  return err('Method not allowed', 405);
}

// ─── GET /api/profile ────────────────────────────────────────────────────────
async function getProfile(request, env, ok, err) {
  const url      = new URL(request.url);
  const userId   = url.searchParams.get('userId');
  const examType = url.searchParams.get('examType');

  if (!userId || !examType) return err('userId and examType are required', 400);

  const rows = await env.DB.prepare(
    `SELECT topic, attempts, errors, last_score, trend, score_history, graduated_at, sessions, last_updated
     FROM topic_profiles
     WHERE user_id = ? AND exam_type = ?
     ORDER BY errors DESC`
  ).bind(userId, examType).all();

  if (!rows.results || rows.results.length === 0) {
    return ok({ sessions: 0, lastUpdated: null, topics: {} });
  }

  const topics = {};
  let totalSessions = 0;
  let lastUpdated   = null;

  for (const row of rows.results) {
    let scoreHistory = [];
    try {
      scoreHistory = JSON.parse(row.score_history || '[]');
      if (!Array.isArray(scoreHistory)) scoreHistory = [];
    } catch { scoreHistory = []; }

    topics[row.topic] = {
      attempts:     row.attempts,
      errors:       row.errors,
      lastScore:    row.last_score,
      trend:        row.trend,
      scoreHistory,
      graduatedAt:  row.graduated_at || null,
    };
    totalSessions = Math.max(totalSessions, row.sessions);
    if (!lastUpdated || row.last_updated > lastUpdated) lastUpdated = row.last_updated;
  }

  return ok({ sessions: totalSessions, lastUpdated, topics });
}

// ─── POST /api/profile ───────────────────────────────────────────────────────
async function postProfile(request, env, ok, err) {
  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON body', 400); }

  const { userId, examType, sessionResults } = body;
  if (!userId || !examType || !Array.isArray(sessionResults)) {
    return err('userId, examType, and sessionResults[] are required', 400);
  }

  const now = new Date().toISOString();

  // Fetch current score_history AND graduated_at for each topic
  const existing = await env.DB.prepare(
    `SELECT topic, sessions, score_history, graduated_at FROM topic_profiles
     WHERE user_id = ? AND exam_type = ?`
  ).bind(userId, examType).all();

  const existingMap = {};
  let maxSessions = 0;
  for (const row of (existing.results || [])) {
    existingMap[row.topic] = {
      scoreHistory: row.score_history || '[]',
      graduatedAt:  row.graduated_at  || null,
    };
    maxSessions = Math.max(maxSessions, row.sessions || 0);
  }

  const newSessionCount = maxSessions + 1;

  const statements = sessionResults.map(({ topic, attempts, errors, sessionScore }) => {
    const prev           = existingMap[topic] || { scoreHistory: '[]', graduatedAt: null };
    const newHistoryJson = appendScore(prev.scoreHistory, sessionScore);

    let newHistory = [];
    try { newHistory = JSON.parse(newHistoryJson); } catch { newHistory = [sessionScore]; }

    const newTrend       = computeTrend(newHistory);
    const newGraduatedAt = computeGraduatedAt(newHistory, prev.graduatedAt, now);

    return env.DB.prepare(`
      INSERT INTO topic_profiles
        (user_id, exam_type, topic, attempts, errors, last_score, trend, score_history, graduated_at, sessions, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, exam_type, topic) DO UPDATE SET
        attempts      = topic_profiles.attempts + excluded.attempts,
        errors        = topic_profiles.errors   + excluded.errors,
        last_score    = excluded.last_score,
        trend         = excluded.trend,
        score_history = excluded.score_history,
        graduated_at  = excluded.graduated_at,
        sessions      = excluded.sessions,
        last_updated  = excluded.last_updated
    `).bind(
      userId, examType, topic,
      attempts, errors, sessionScore,
      newTrend, newHistoryJson, newGraduatedAt,
      newSessionCount, now
    );
  });

  // Community stats (anonymized)
  const communityStatements = sessionResults.map(({ topic, attempts, errors }) =>
    env.DB.prepare(`
      INSERT INTO community_stats (exam_type, topic, total_attempts, total_errors, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(exam_type, topic) DO UPDATE SET
        total_attempts = community_stats.total_attempts + excluded.total_attempts,
        total_errors   = community_stats.total_errors   + excluded.total_errors,
        updated_at     = excluded.updated_at
    `).bind(examType, topic, attempts, errors, now)
  );

  await env.DB.batch([...statements, ...communityStatements]);

  return ok({ success: true, sessions: newSessionCount });
}

// ─── DELETE /api/profile ─────────────────────────────────────────────────────
async function deleteProfile(request, env, ok, err) {
  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON body', 400); }

  const { userId, examType } = body;
  if (!userId) return err('userId is required', 400);

  if (examType) {
    await env.DB.prepare(
      `DELETE FROM topic_profiles WHERE user_id = ? AND exam_type = ?`
    ).bind(userId, examType).run();
  } else {
    await env.DB.prepare(
      `DELETE FROM topic_profiles WHERE user_id = ?`
    ).bind(userId).run();
  }

  return ok({ success: true, deleted: true });
}
