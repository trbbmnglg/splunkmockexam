export async function handleTraces(request, env, ok, err) {
  if (request.method !== 'POST') return err('Method not allowed', 405);
  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON body', 400); }

  const { userId, examType, trace } = body;
  if (!userId || !examType || !trace) return err('Missing fields', 400);

  await env.DB.prepare(`
    INSERT INTO generation_traces
      (user_id, exam_type, provider, model, prompt_tokens, completion_tokens,
       latency_ms, schema_enforced, parse_strategy, retries, error,
       question_count, validation_cycles, validation_failures, rag_passage_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId, examType,
    trace.provider        || '',
    trace.model           || '',
    trace.promptTokens    || 0,
    trace.completionTokens|| 0,
    trace.latencyMs       || 0,
    trace.schemaEnforced  ? 1 : 0,
    trace.parseStrategy   || 'regex_fallback',
    trace.retries         || 0,
    trace.error           || null,
    trace.questionCount   || 0,
    trace.validationCycles|| 0,
    trace.validationFailures || 0,
    trace.ragPassageCount || 0,
    new Date().toISOString()
  ).run();

  return ok({ success: true });
}
