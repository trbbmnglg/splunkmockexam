/**
 * worker/routes/seenConcepts.js
 *
 * POST /api/seen-concepts
 *   → Body: { userId, examType, concepts: [{ hash, hint, topic }] }
 *   → Upserts concept rows — if already seen, just updates created_at
 *   → Keeps last 100 concepts per user per exam (trims oldest on insert)
 *
 * GET /api/seen-concepts?userId=xxx&examType=yyy&limit=50
 *   → Returns recent concept hints for injection into generation prompt
 *   → Shape: { concepts: [{ hash, hint, topic }] }
 */

const MAX_CONCEPTS = 100;

export async function handleSeenConcepts(request, env, ok, err) {
  if (request.method === 'GET')  return getSeenConcepts(request, env, ok, err);
  if (request.method === 'POST') return postSeenConcepts(request, env, ok, err);
  return err('Method not allowed', 405);
}

async function getSeenConcepts(request, env, ok, err) {
  const url      = new URL(request.url);
  const userId   = url.searchParams.get('userId');
  const examType = url.searchParams.get('examType');
  const limit    = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  if (!userId || !examType) return err('userId and examType are required', 400);

  const rows = await env.DB.prepare(`
    SELECT concept_hash, concept_hint, topic
    FROM seen_concepts
    WHERE user_id = ? AND exam_type = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(userId, examType, limit).all();

  return ok({ concepts: rows.results || [] });
}

async function postSeenConcepts(request, env, ok, err) {
  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON body', 400); }

  const { userId, examType, concepts } = body;
  if (!userId || !examType || !Array.isArray(concepts) || concepts.length === 0) {
    return err('userId, examType, and concepts[] are required', 400);
  }

  const now = new Date().toISOString();

  const statements = concepts.map(({ hash, hint, topic }) =>
    env.DB.prepare(`
      INSERT INTO seen_concepts (user_id, exam_type, concept_hash, concept_hint, topic, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, exam_type, concept_hash) DO UPDATE SET
        created_at = excluded.created_at
    `).bind(userId, examType, hash, (hint || '').slice(0, 80), topic || 'General', now)
  );

  await env.DB.batch(statements);

  // Trim to MAX_CONCEPTS — keep the most recent, delete the oldest
  await env.DB.prepare(`
    DELETE FROM seen_concepts
    WHERE user_id = ? AND exam_type = ?
      AND concept_hash NOT IN (
        SELECT concept_hash FROM seen_concepts
        WHERE user_id = ? AND exam_type = ?
        ORDER BY created_at DESC
        LIMIT ?
      )
  `).bind(userId, examType, userId, examType, MAX_CONCEPTS).run();

  return ok({ success: true, saved: concepts.length });
}
