/**
 * worker/routes/retrieve.js
 *
 * GET /api/retrieve?examType=xxx&topics[]=yyy&topics[]=zzz
 *
 * 1. Builds a query string from examType + topics
 * 2. Embeds the query via Cloudflare AI (bge-small-en-v1.5)
 * 3. Queries Vectorize for top-K most similar doc passages
 * 4. Returns passages with metadata for prompt injection
 *
 * Shape returned:
 * {
 *   passages: [
 *     {
 *       text:     string  — the doc passage text
 *       title:    string  — page title / topic name
 *       url:      string  — source URL
 *       topic:    string  — blueprint topic this passage belongs to
 *       score:    number  — cosine similarity score (0-1)
 *     }
 *   ]
 * }
 *
 * Bindings required in wrangler.toml:
 *   [ai]          binding = "AI"
 *   [[vectorize]] binding = "VECTORIZE"  index_name = "splunk-docs-index"
 */

const TOP_K = 15; // number of passages to retrieve per exam generation

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

  const url = new URL(request.url);
  const examType = url.searchParams.get('examType');
  const topics   = url.searchParams.getAll('topics[]');

  if (!examType) {
    return err('examType is required', 400);
  }

  // Build a descriptive query that captures what we want to retrieve
  const topicList = topics.length > 0 ? topics.join(', ') : examType;
  const query = `Splunk ${examType} certification: ${topicList}`;

  try {
    // 1. Embed the query
    const embedResult = await env.AI.run('@cf/baai/bge-small-en-v1.5', {
      text: [query]
    });

    const queryVector = embedResult.data[0];

    if (!queryVector || queryVector.length === 0) {
      return err('Embedding returned empty vector', 500);
    }

    // 2. Query Vectorize — filter by examType if topics are specified
    const queryOptions = {
      topK: TOP_K,
      returnMetadata: 'all',
    };

    // Add filter to prefer passages matching the exam type
    // Vectorize metadata filtering — only return passages for this cert
    if (examType) {
      queryOptions.filter = { certType: { $eq: examType } };
    }

    const vectorResults = await env.VECTORIZE.query(queryVector, queryOptions);

    // 3. If filtered results are sparse, fall back to unfiltered
    let matches = vectorResults.matches || [];
    if (matches.length < 3 && examType) {
      const fallback = await env.VECTORIZE.query(queryVector, {
        topK: TOP_K,
        returnMetadata: 'all',
      });
      matches = fallback.matches || [];
    }

    // 4. Format passages for prompt injection
    const passages = matches
      .filter(m => m.metadata?.text && m.score > 0.3) // filter low-relevance results
      .map(m => ({
        text:  m.metadata.text,
        title: m.metadata.topic || examType,
        url:   m.metadata.url   || 'https://docs.splunk.com',
        topic: m.metadata.topic || examType,
        score: Math.round(m.score * 100) / 100,
      }));

    return ok({ passages, query, topK: TOP_K });

  } catch (e) {
    console.error('[Retrieve] Error:', e.message);
    // Non-fatal — return empty passages so exam generation still works
    return ok({ passages: [], query, error: e.message });
  }
}
