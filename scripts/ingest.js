/**
 * scripts/ingest.js
 *
 * One-time ingestion script — run via GitHub Actions (see setup-vectorize.yml)
 *
 * What it does:
 *   1. Fetches each Splunk doc URL from splunk-urls.js
 *   2. Extracts clean text from HTML
 *   3. Chunks into ~500 token passages with overlap
 *   4. Embeds each chunk via Cloudflare AI (bge-small-en-v1.5, 384 dimensions)
 *   5. Upserts vectors into Cloudflare Vectorize with metadata
 *
 * Environment variables required:
 *   CF_API_TOKEN     — Cloudflare API token (from GitHub secret)
 *   CF_ACCOUNT_ID    — Cloudflare account ID (from GitHub secret)
 *
 * Run:
 *   node scripts/ingest.js
 */

import { SPLUNK_DOC_URLS } from './splunk-urls.js';

const CF_API_TOKEN  = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const INDEX_NAME    = 'splunk-docs-index';
const CHUNK_SIZE    = 400;  // tokens (approx chars / 4)
const CHUNK_OVERLAP = 50;   // overlap between chunks for context continuity
const BATCH_SIZE    = 50;   // vectors per Vectorize upsert call (API limit: 1000)
const EMBED_BATCH   = 10;   // texts per AI embedding call

if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
  console.error('ERROR: CF_API_TOKEN and CF_ACCOUNT_ID environment variables are required.');
  process.exit(1);
}

// ─── Text extraction from HTML ────────────────────────────────────────────────
function extractText(html) {
  // Remove script, style, nav, header, footer, aside tags and their contents
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    // Preserve newlines at block elements
    .replace(/<\/(p|div|h[1-6]|li|tr|td|th|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

// ─── Chunk text into overlapping passages ────────────────────────────────────
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  // Approximate tokens as chars/4 — split on sentence boundaries where possible
  const approxChunkChars = chunkSize * 4;
  const approxOverlapChars = overlap * 4;

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + approxChunkChars;

    if (end < text.length) {
      // Try to end at a sentence boundary (. ! ? or \n\n)
      const boundary = text.lastIndexOf('\n\n', end);
      const sentEnd = Math.max(
        text.lastIndexOf('. ', end),
        text.lastIndexOf('! ', end),
        text.lastIndexOf('? ', end)
      );
      const snap = Math.max(boundary, sentEnd);
      if (snap > start + approxChunkChars * 0.5) {
        end = snap + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) { // skip tiny chunks
      chunks.push(chunk);
    }

    start = end - approxOverlapChars;
    if (start >= text.length) break;
  }

  return chunks;
}

// ─── Cloudflare AI — embed texts ─────────────────────────────────────────────
async function embedTexts(texts) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-small-en-v1.5`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: texts }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI embedding failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(`AI embedding error: ${JSON.stringify(data.errors)}`);

  return data.result.data; // array of float[] vectors
}

// ─── Cloudflare Vectorize — upsert vectors ────────────────────────────────────
async function upsertVectors(vectors) {
  // Vectorize upsert uses NDJSON format
  const ndjson = vectors.map(v => JSON.stringify(v)).join('\n');

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/vectorize/v2/indexes/${INDEX_NAME}/upsert`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/x-ndjson',
      },
      body: ndjson,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Vectorize upsert failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(`Vectorize error: ${JSON.stringify(data.errors)}`);
  return data.result;
}

// ─── Fetch a single URL with retry ────────────────────────────────────────────
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SplunkMockExam-Ingestion/1.0 (educational use)' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`  Retry ${i + 1}/${retries} for ${url}`);
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

// ─── Sleep helper ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Main ingestion pipeline ──────────────────────────────────────────────────
async function ingest() {
  console.log('=== Splunk MockTest — Layer 2 Ingestion ===\n');
  console.log(`Index: ${INDEX_NAME}`);
  console.log(`Total doc entries: ${SPLUNK_DOC_URLS.length}`);
  console.log(`Total URLs: ${SPLUNK_DOC_URLS.reduce((s, e) => s + e.urls.length, 0)}\n`);

  let totalChunks = 0;
  let totalVectors = 0;
  let vectorBuffer = []; // collect vectors before batch upsert
  let vectorId = 0;

  for (const entry of SPLUNK_DOC_URLS) {
    console.log(`\n[${entry.certType}] ${entry.topic}`);

    for (const url of entry.urls) {
      console.log(`  Fetching: ${url}`);

      let html;
      try {
        html = await fetchWithRetry(url);
      } catch (err) {
        console.warn(`  SKIP — fetch failed: ${err.message}`);
        continue;
      }

      // Extract and chunk
      const text = extractText(html);
      if (text.length < 100) {
        console.warn(`  SKIP — extracted text too short (${text.length} chars)`);
        continue;
      }

      const chunks = chunkText(text);
      console.log(`  → ${chunks.length} chunks from ${text.length} chars`);
      totalChunks += chunks.length;

      // Embed in batches
      for (let b = 0; b < chunks.length; b += EMBED_BATCH) {
        const batch = chunks.slice(b, b + EMBED_BATCH);

        let embeddings;
        try {
          embeddings = await embedTexts(batch);
        } catch (err) {
          console.warn(`  SKIP embed batch — ${err.message}`);
          continue;
        }

        // Build vector objects
        for (let j = 0; j < batch.length; j++) {
          vectorId++;
          vectorBuffer.push({
            id: `splunk_${vectorId}`,
            values: embeddings[j],
            metadata: {
              text: batch[j].slice(0, 1000), // store first 1000 chars for retrieval
              certType: entry.certType,
              topic: entry.topic,
              url,
              chunkIndex: b + j,
            }
          });
        }

        // Upsert when buffer reaches batch size
        if (vectorBuffer.length >= BATCH_SIZE) {
          process.stdout.write(`  Upserting ${vectorBuffer.length} vectors... `);
          const result = await upsertVectors(vectorBuffer);
          console.log(`✓ (${result.count} stored)`);
          totalVectors += vectorBuffer.length;
          vectorBuffer = [];
          await sleep(500); // rate limit courtesy pause
        }

        await sleep(200); // pause between embed calls
      }

      await sleep(1000); // pause between URL fetches (be nice to Splunk docs)
    }
  }

  // Flush remaining vectors
  if (vectorBuffer.length > 0) {
    process.stdout.write(`\nFinal upsert: ${vectorBuffer.length} vectors... `);
    const result = await upsertVectors(vectorBuffer);
    console.log(`✓ (${result.count} stored)`);
    totalVectors += vectorBuffer.length;
  }

  console.log('\n=== Ingestion Complete ===');
  console.log(`Total chunks processed: ${totalChunks}`);
  console.log(`Total vectors stored:   ${totalVectors}`);
  console.log(`\nVectorize index "${INDEX_NAME}" is ready for retrieval.`);
}

ingest().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
