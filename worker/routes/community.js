/**
 * worker/routes/community.js
 *
 * GET /api/community?examType=yyy
 *   → Returns anonymized aggregated error rates per topic for this exam
 *   → Used to show community difficulty heatmap on the menu/results pages
 *   → Shape: { topics: [ { topic, errorRate, totalAttempts } ] }
 */

export async function handleCommunity(request, env, ok, err) {
  if (request.method !== 'GET') {
    return err('Method not allowed', 405);
  }

  const url = new URL(request.url);
  const examType = url.searchParams.get('examType');

  if (!examType) {
    return err('examType is required', 400);
  }

  const rows = await env.DB.prepare(`
    SELECT
      topic,
      total_attempts,
      total_errors,
      CASE
        WHEN total_attempts = 0 THEN 0
        ELSE ROUND((total_errors * 100.0) / total_attempts)
      END as error_rate
    FROM community_stats
    WHERE exam_type = ?
      AND total_attempts >= 3   -- Lowered from 10 for early usage; raise once traffic grows
    ORDER BY error_rate DESC
  `).bind(examType).all();

  return ok({
    examType,
    topics: (rows.results || []).map(r => ({
      topic:         r.topic,
      errorRate:     r.error_rate,
      totalAttempts: r.total_attempts
    }))
  });
}
