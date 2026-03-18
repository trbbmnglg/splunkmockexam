/**
 * worker/routes/wrongAnswers.js
 *
 * POST /api/wrong-answers
 *   → Body: { userId, examType, wrongAnswers: [ { topic, question, correctAnswer } ] }
 *   → Upserts wrong answer rows, increments times_missed, advances next_review date
 *   → Uses a simple spaced repetition schedule: 1, 3, 7, 14, 30 days
 *
 * GET /api/wrong-answers?userId=xxx&examType=yyy&dueOnly=true
 *   → Returns wrong answers due for review (next_review <= today)
 *   → Or all wrong answers if dueOnly is not set
 */

// Simple spaced repetition intervals (days) based on times_missed
const SR_INTERVALS = [1, 3, 7, 14, 30, 60];

function nextReviewDate(timesMissed) {
  const days = SR_INTERVALS[Math.min(timesMissed - 1, SR_INTERVALS.length - 1)];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Simple hash function for question deduplication (no crypto needed)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 200); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export async function handleWrongAnswers(request, env, ok, err) {
  if (request.method === 'GET') {
    return getWrongAnswers(request, env, ok, err);
  }
  if (request.method === 'POST') {
    return postWrongAnswers(request, env, ok, err);
  }
  return err('Method not allowed', 405);
}

// ─── GET /api/wrong-answers ──────────────────────────────────────────────────
async function getWrongAnswers(request, env, ok, err) {
  const url = new URL(request.url);
  const userId   = url.searchParams.get('userId');
  const examType = url.searchParams.get('examType');
  const dueOnly  = url.searchParams.get('dueOnly') === 'true';
  const limit    = parseInt(url.searchParams.get('limit') || '20');

  if (!userId || !examType) {
    return err('userId and examType are required', 400);
  }

  const today = new Date().toISOString().split('T')[0];

  const query = dueOnly
    ? `SELECT * FROM wrong_answers
       WHERE user_id = ? AND exam_type = ? AND next_review <= ?
       ORDER BY times_missed DESC, next_review ASC
       LIMIT ?`
    : `SELECT * FROM wrong_answers
       WHERE user_id = ? AND exam_type = ?
       ORDER BY times_missed DESC, last_missed DESC
       LIMIT ?`;

  const params = dueOnly
    ? [userId, examType, today, limit]
    : [userId, examType, limit];

  const rows = await env.DB.prepare(query).bind(...params).all();

  return ok({
    wrongAnswers: rows.results || [],
    dueCount: dueOnly ? (rows.results?.length ?? 0) : null
  });
}

// ─── POST /api/wrong-answers ─────────────────────────────────────────────────
async function postWrongAnswers(request, env, ok, err) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const { userId, examType, wrongAnswers } = body;

  if (!userId || !examType || !Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
    return err('userId, examType, and wrongAnswers[] are required', 400);
  }

  const now = new Date().toISOString();

  const statements = wrongAnswers.map(({ topic, question, correctAnswer }) => {
    const hash = simpleHash(question);

    return env.DB.prepare(`
      INSERT INTO wrong_answers (user_id, exam_type, topic, question_hash, question, correct_answer, times_missed, last_missed, next_review)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(user_id, exam_type, topic, question_hash)
      DO UPDATE SET
        times_missed = wrong_answers.times_missed + 1,
        last_missed  = excluded.last_missed,
        next_review  = excluded.next_review
    `).bind(
      userId, examType, topic, hash, question, correctAnswer,
      now,
      nextReviewDate(1) // Will be recalculated properly on conflict via trigger workaround below
    );
  });

  // D1 doesn't support computed values in ON CONFLICT — run a second pass
  // to fix next_review based on actual times_missed after upsert
  await env.DB.batch(statements);

  // Fix next_review for all affected rows
  const hashes = wrongAnswers.map(w => simpleHash(w.question));
  const fixStatements = hashes.map(hash =>
    env.DB.prepare(`
      UPDATE wrong_answers
      SET next_review = CASE times_missed
        WHEN 1 THEN date('now', '+1 day')
        WHEN 2 THEN date('now', '+3 days')
        WHEN 3 THEN date('now', '+7 days')
        WHEN 4 THEN date('now', '+14 days')
        WHEN 5 THEN date('now', '+30 days')
        ELSE         date('now', '+60 days')
      END
      WHERE user_id = ? AND exam_type = ? AND question_hash = ?
    `).bind(userId, examType, hash)
  );

  await env.DB.batch(fixStatements);

  return ok({ success: true, saved: wrongAnswers.length });
}
