/**
 * worker/routes/wrongAnswers.js
 *
 * POST /api/wrong-answers
 *   → Body: { userId, token, timestamp, examType, wrongAnswers: [ { topic, question, correctAnswer } ] }
 *   → Upserts wrong answer rows, increments times_missed, advances next_review date
 *   → Uses a simple spaced repetition schedule: 1, 3, 7, 14, 30, 60 days
 *
 * GET /api/wrong-answers?userId=xxx&examType=yyy&dueOnly=true
 *   → Returns wrong answers due for review (next_review <= today)
 *   → Or all wrong answers if dueOnly is not set
 */

import { verifyAuthedBody, verifyAuthedRequest } from './_auth.js';

// Simple spaced repetition intervals (days) based on times_missed
const SR_INTERVALS = [1, 3, 7, 14, 30, 60];

function nextReviewDate(timesMissed) {
  const days = SR_INTERVALS[Math.min(timesMissed - 1, SR_INTERVALS.length - 1)];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// SHA-256 dedup hash (16-hex prefix = 64 bits) — prior 32-bit simpleHash was
// both collision-prone AND truncated input at 200 chars, which would merge
// two genuinely-different questions that happened to share a common prefix.
async function questionHash(question) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(question));
  const bytes = new Uint8Array(digest).slice(0, 8);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function handleWrongAnswers(request, env, ok, err) {
  if (request.method === 'GET') {
    return getWrongAnswers(request, env, ok, err);
  }
  if (request.method === 'POST') {
    return postWrongAnswers(request, env, ok, err);
  }
  if (request.method === 'DELETE') {
    return deleteWrongAnswers(request, env, ok, err);
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

  const auth = await verifyAuthedRequest(request, env, userId);
  if (!auth.ok) return err(auth.message, auth.status);

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

  // Signed-payload auth — otherwise any caller could poison a victim's bank.
  const auth = await verifyAuthedBody(body, env);
  if (!auth.ok) return err(auth.message, auth.status);
  const userId = auth.userId;

  const { examType, wrongAnswers } = body;
  if (!examType || !Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
    return err('examType and wrongAnswers[] are required', 400);
  }
  if (wrongAnswers.length > 100) {
    return err('wrongAnswers must have at most 100 entries', 400);
  }

  const now = new Date().toISOString();
  const hashes = await Promise.all(wrongAnswers.map(w => questionHash(w.question || '')));

  const statements = wrongAnswers.map(({ topic, question, correctAnswer }, i) => {
    return env.DB.prepare(`
      INSERT INTO wrong_answers (user_id, exam_type, topic, question_hash, question, correct_answer, times_missed, last_missed, next_review)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(user_id, exam_type, topic, question_hash)
      DO UPDATE SET
        times_missed = wrong_answers.times_missed + 1,
        last_missed  = excluded.last_missed,
        next_review  = excluded.next_review
    `).bind(
      userId, examType, topic, hashes[i], question, correctAnswer,
      now,
      nextReviewDate(1) // Will be recalculated properly on conflict via trigger workaround below
    );
  });

  // D1 doesn't support computed values in ON CONFLICT — run a second pass
  // to fix next_review based on actual times_missed after upsert
  await env.DB.batch(statements);

  // Fix next_review for all affected rows
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

// ─── DELETE /api/wrong-answers ────────────────────────────────────────────────
// Called after a review session to clear questions that were successfully reviewed
async function deleteWrongAnswers(request, env, ok, err) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const auth = await verifyAuthedBody(body, env);
  if (!auth.ok) return err(auth.message, auth.status);
  const userId = auth.userId;

  const { examType, questionHashes } = body;
  if (!examType) return err('examType is required', 400);

  if (Array.isArray(questionHashes) && questionHashes.length > 0) {
    // Delete specific questions by hash
    const statements = questionHashes.map(hash =>
      env.DB.prepare(
        `DELETE FROM wrong_answers WHERE user_id = ? AND exam_type = ? AND question_hash = ?`
      ).bind(userId, examType, hash)
    );
    await env.DB.batch(statements);
    return ok({ success: true, deleted: questionHashes.length });
  } else {
    // Delete all wrong answers for this user + exam
    await env.DB.prepare(
      `DELETE FROM wrong_answers WHERE user_id = ? AND exam_type = ?`
    ).bind(userId, examType).run();
    return ok({ success: true, deleted: 'all' });
  }
}
