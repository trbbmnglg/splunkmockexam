/**
 * worker/routes/retrieve.js
 *
 * GET /api/retrieve?examType=xxx&topics[]=yyy&topics[]=zzz
 *
 * 3-step retrieval pipeline:
 *
 *   Step 1 — Vectorize (Drafting)
 *     bge-small-en-v1.5 embeds the query, cosine similarity search returns
 *     top-15 candidates with score > 0.5. Broader net, precision handled by
 *     the reranker.
 *
 *   Step 2 — Jina Reranker (Sorting)
 *     jina-reranker-v2-base-multilingual re-scores the 15 candidates against
 *     the original query for exact contextual relevance, returns top-5.
 *     Graceful fallback: if Jina times out or errors, falls back to the top-5
 *     by Vectorize cosine score so exam generation always continues.
 *
 *   Step 3 — Return top-5 passages
 *     Only the 5 surgically filtered passages are returned to the frontend
 *     for injection into the Groq generation prompt. Reduces "lost in the
 *     middle" noise and lowers Layer 1 validation failure rates.
 *
 * Bindings required in wrangler.toml:
 *   [ai]          binding = "AI"
 *   [[vectorize]] binding = "VECTORIZE"  index_name = "splunk-docs-index"
 *
 * Secrets required in Cloudflare dashboard:
 *   JINA_API_KEY  — from jina.ai, used for the reranker step
 */

const TOP_K_VECTORIZE = 15;  // broad net from Vectorize
const TOP_K_RERANKED  = 5;   // precision cut after reranking
const SCORE_THRESHOLD = 0.5; // raised from 0.3 — drops obvious misses early

export async function handleRetrieve(request, env, ok, err) {
  if (request.method !== 'GET') {
    return err('Method not allowed', 405);
  }

  if (!env.AI) {
    return err('Workers AI binding not configured. Add [ai] binding = "AI" to wrangler.toml.', 503);
  }

  if (!env.VECTORIZE) {
    return err('Vectorize binding not configured. Add [[vectorize]] to wrangler.toml.', 503);
  }

  const url      = new URL(request.url);
  const examType = url.searchParams.get('examType');
  const topics   = url.searchParams.getAll('topics[]');

  if (!examType) {
    return err('examType is required', 400);
  }

  // Build a descriptive query that captures what we want to retrieve
  const topicList = topics.length > 0 ? topics.join(', ') : examType;
  const query     = `Splunk ${examType} certification: ${topicList}`;

  try {
    // ── Step 1: Vectorize — embed + cosine search ───────────────────────────
    const embedResult = await env.AI.run('@cf/baai/bge-small-en-v1.5', {
      text: [query]
    });

    const queryVector = embedResult.data[0];
    if (!queryVector || queryVector.length === 0) {
      return err('Embedding returned empty vector', 500);
    }

    // Query with cert filter, fall back to unfiltered if sparse
    const queryOptions = {
      topK:           TOP_K_VECTORIZE,
      returnMetadata: 'all',
      filter:         { certType: { $eq: examType } },
    };

    let vectorResults = await env.VECTORIZE.query(queryVector, queryOptions);
    let matches       = vectorResults.matches || [];

    if (matches.length < 3) {
      const fallbackResults = await env.VECTORIZE.query(queryVector, {
        topK:           TOP_K_VECTORIZE,
        returnMetadata: 'all',
      });
      matches = fallbackResults.matches || [];
    }

    // Apply score threshold — drop obvious misses before sending to reranker
    const candidates = matches.filter(
      m => m.metadata?.text && m.score > SCORE_THRESHOLD
    );

    // If too few candidates after threshold, relax so reranker has material
    const pool = candidates.length >= 3
      ? candidates
      : matches.filter(m => m.metadata?.text).slice(0, TOP_K_VECTORIZE);

    if (pool.length === 0) {
      return ok({ passages: [], query, reranked: false });
    }

    // Format pool into passage objects for reranking + final return
    const poolPassages = pool.map(m => ({
      text:  m.metadata.text,
      title: m.metadata.topic || examType,
      url:   m.metadata.url   || 'https://docs.splunk.com',
      topic: m.metadata.topic || examType,
      score: Math.round(m.score * 100) / 100,
    }));

    // ── Step 2: Jina Reranker — re-score for contextual relevance ──────────
    // Graceful fallback: if Jina is unavailable, return top-5 by Vectorize score
    let finalPassages;
    let reranked = false;

    if (env.JINA_API_KEY && poolPassages.length > 0) {
      try {
        const jinaResponse = await fetch('https://api.jina.ai/v1/rerank', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${env.JINA_API_KEY}`,
          },
          body: JSON.stringify({
            model:     'jina-reranker-v2-base-multilingual',
            query,
            documents: poolPassages.map(p => p.text),
            top_n:     TOP_K_RERANKED,
          }),
          // 5s timeout — reranker must not block exam generation
          signal: AbortSignal.timeout(5000),
        });

        if (jinaResponse.ok) {
          const jinaData = await jinaResponse.json();
          const results  = jinaData.results || [];

          // Map reranked results back to full passage objects via the
          // index Jina returns (index into the documents array we sent)
          finalPassages = results.map(r => ({
            ...poolPassages[r.index],
            score: Math.round(r.relevance_score * 100) / 100,
          }));

          reranked = true;
          console.log(
            `[Retrieve] Reranked ${pool.length} candidates → top ${finalPassages.length} passages`
          );
        } else {
          const errText = await jinaResponse.text();
          console.warn(
            `[Retrieve] Jina reranker returned ${jinaResponse.status}: ${errText} — falling back to Vectorize top-5`
          );
        }
      } catch (jinaErr) {
        console.warn(
          `[Retrieve] Jina reranker failed (${jinaErr.message}) — falling back to Vectorize top-5`
        );
      }
    }

    // Fallback: top-5 by Vectorize cosine score (already sorted desc)
    if (!finalPassages) {
      finalPassages = poolPassages.slice(0, TOP_K_RERANKED);
    }

    // ── Step 3: Return final passages ───────────────────────────────────────
    return ok({
      passages:       finalPassages,
      query,
      reranked,
      candidateCount: pool.length,
    });

  } catch (e) {
    console.error('[Retrieve] Error:', e.message);
    // Non-fatal — return empty passages so exam generation still continues
    return ok({ passages: [], query, error: e.message, reranked: false });
  }
}
