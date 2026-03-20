// scripts/ingest.js
// Layer 2 RAG Ingestion script for Splunk Docs

import { load } from 'cheerio';
import { splunkDocs } from './splunk-urls.js';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const DRY_RUN = process.env.DRY_RUN === 'true';
const CERT_FILTER = process.env.CERT_FILTER || '';

const INDEX_NAME = 'splunk-docs-index';
const MODEL_NAME = '@cf/baai/bge-small-en-v1.5';

const BATCH_SIZE = 100;
const RETRY_LIMIT = 3;
const DELAY_BETWEEN_REQUESTS_MS = 1500;
const FORCE_REINGEST = process.env.FORCE_REINGEST === 'true';

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

let uaIndex = 0;
function nextUserAgent() {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua;
}

function getFetchHeaders() {
  return {
    "User-Agent": nextUserAgent(),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1"
  };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = RETRY_LIMIT) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers: getFetchHeaders() });
      if (response.status === 429 || response.status === 503) {
        const wait = 5000 * (i + 1);
        console.log(`  Rate limited (${response.status}), waiting ${wait/1000}s...`);
        await sleep(wait);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      const wait = 2000 * (i + 1);
      console.log(`  Retry ${i + 1}/${retries} for ${url} (${e.message}), waiting ${wait/1000}s...`);
      await sleep(wait);
    }
  }
}

// ── extractContent ────────────────────────────────────────────────────────────
// Updated to use Heretto DITA selectors for help.splunk.com (Heretto CMS)
// with legacy fallbacks for docs.splunk.com
function extractContent(html) {
  const $ = load(html);

  // Aggressively remove navigation chrome — Heretto/Splunk specific + generic
  $(
    'nav, header, footer, script, style, aside, iframe, noscript, ' +
    '.toc, .breadcrumb, #comments, ' +
    '[role="navigation"], [role="banner"], [role="contentinfo"], ' +
    '.sidebar, .left-nav, .right-nav, .navigation, .menu, ' +
    '.spl-sidebar, .spl-nav, .spl-header, .spl-footer'
  ).remove();

  // Heretto DITA selectors (help.splunk.com) in order of precision,
  // then legacy fallbacks for docs.splunk.com
  const selectors = [
    'article.topic',       // Primary: Heretto DITA article wrapper
    '.topic.concept',      // Primary: Heretto concept topic
    '.topic.reference',    // Primary: Heretto reference topic
    '.topic.task',         // Primary: Heretto task topic
    '[role="main"]',       // Secondary: ARIA main content
    'main',                // Fallback: HTML5 main
    '#main-content',       // Fallback: common ID
    '.main-area',          // Fallback: legacy Splunk docs wrapper
    'article',             // Generic HTML5 article
  ];

  let content = '';
  for (const selector of selectors) {
    const el = $(selector);
    if (el.length > 0) {
      content = el.text();
      break;
    }
  }

  // Final fallback to cleaned body
  if (!content) content = $('body').text();

  const cleaned = content.replace(/\s+/g, ' ').trim();

  // Hard guard — reject boilerplate and empty content
  // so the ingest loop skips this URL rather than indexing garbage
  if (
    cleaned.length < 200 ||
    cleaned.includes('googletagmanager') ||
    cleaned.includes('display:none') ||
    cleaned.includes('visibility:hidden')
  ) {
    return '';
  }

  return cleaned;
}

function chunkText(text, maxWords = 200, overlapWords = 50) {
  const words = text.split(' ');
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + maxWords).join(' ');
    if (chunk.trim().length > 50) {
      chunks.push(chunk);
    }
    i += (maxWords - overlapWords);
  }
  return chunks;
}

async function getEmbeddings(texts) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${MODEL_NAME}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: texts })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Workers AI Error: ${err}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Workers AI API Error: ${JSON.stringify(result.errors)}`);
  }

  return result.result.data;
}

// ── Deterministic vector ID ───────────────────────────────────────────────────
function urlToSlug(url) {
  return url
    .replace(/^https?:\/\/[^/]+\/Documentation\//, '')
    .replace(/^https?:\/\/help\.splunk\.com\/en\//, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase()
    .slice(0, 55);
}

function chunkId(url, chunkIndex) {
  return `${urlToSlug(url)}-${chunkIndex}`;
}

async function isUrlIngested(url) {
  if (FORCE_REINGEST) return false;
  const id = chunkId(url, 0);
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/vectorize/v2/indexes/${INDEX_NAME}/get-by-ids`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [id] })
      }
    );
    if (!response.ok) return false;
    const result = await response.json();
    return result.success && result.result?.length > 0;
  } catch {
    return false;
  }
}

async function uploadToVectorize(vectors) {
  const ndjson = vectors.map(v => JSON.stringify(v)).join('\n');

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/vectorize/v2/indexes/${INDEX_NAME}/insert`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/x-ndjson'
      },
      body: ndjson
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Vectorize Upload Error: ${err}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Vectorize API Error: ${JSON.stringify(result.errors)}`);
  }
  return result;
}

async function main() {
  console.log('=== Splunk MockTest — Layer 2 Ingestion ===');
  console.log(`Index: ${INDEX_NAME}`);

  let docsToProcess = splunkDocs;

  if (CERT_FILTER) {
    docsToProcess = splunkDocs.filter(doc => doc.certType === CERT_FILTER);
    console.log(`Filtered to certType="${CERT_FILTER}": ${docsToProcess.length} entries`);
  }

  const totalUrls = docsToProcess.reduce((sum, doc) => sum + doc.urls.length, 0);
  console.log(`Total doc entries: ${docsToProcess.length}`);
  console.log(`Total URLs: ${totalUrls}`);

  let allVectors = [];
  let processedCount = 0;
  let skippedCount = 0;
  let boilerplateCount = 0;

  for (const doc of docsToProcess) {
    const certType = doc.certType;
    const topic    = doc.topic;

    console.log(`\n[${certType}] ${topic}`);

    for (const url of doc.urls) {
      const alreadyDone = await isUrlIngested(url);
      if (alreadyDone) {
        console.log(`  SKIP (already ingested): ${url}`);
        processedCount++;
        continue;
      }

      console.log(`  Fetching: ${url}`);
      try {
        const html = await fetchWithRetry(url);
        const text = extractContent(html);

        // Skip if extractContent returned empty (boilerplate detected)
        if (!text) {
          console.log(`  SKIP — boilerplate or no extractable content: ${url}`);
          boilerplateCount++;
          skippedCount++;
          await sleep(DELAY_BETWEEN_REQUESTS_MS);
          continue;
        }

        const chunks = chunkText(text);
        console.log(`  -> Extracted ${chunks.length} chunks`);

        for (let i = 0; i < chunks.length; i++) {
          allVectors.push({
            id: chunkId(url, i),
            text: chunks[i],
            metadata: {
              cert:  certType,
              topic: topic,
              url:   url
            }
          });
        }
        processedCount++;
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
      } catch (e) {
        console.error(`  SKIP — fetch failed: ${e.message}`);
        skippedCount++;
      }
    }
  }

  console.log(`\nURLs processed: ${processedCount}`);
  console.log(`URLs skipped (fetch errors): ${skippedCount - boilerplateCount}`);
  console.log(`URLs skipped (boilerplate): ${boilerplateCount}`);

  if (allVectors.length === 0) {
    console.log('No chunks extracted. Exiting.');
    return;
  }

  console.log(`Total chunks to embed: ${allVectors.length}`);

  if (DRY_RUN) {
    console.log('\nDRY RUN: Skipping embedding and upload.');
    console.log('Sample vector IDs:');
    allVectors.slice(0, 5).forEach(v => console.log(`  ${v.id}`));
    return;
  }

  console.log('\nStarting Embedding and Upload...');
  let totalUploaded = 0;
  const totalBatches = Math.ceil(allVectors.length / BATCH_SIZE);

  for (let i = 0; i < allVectors.length; i += BATCH_SIZE) {
    const batch = allVectors.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} items)...`);

    try {
      const texts = batch.map(b => b.text);
      const embeddings = await getEmbeddings(texts);

      const vectorizePayload = batch.map((item, idx) => ({
        id: item.id,
        values: embeddings[idx],
        namespace: item.metadata.cert.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase(),
        metadata: {
          cert:  item.metadata.cert,
          topic: item.metadata.topic,
          url:   item.metadata.url,
          text:  item.text
        }
      }));

      await uploadToVectorize(vectorizePayload);
      totalUploaded += batch.length;
      console.log(`  ✓ Uploaded ${batch.length} vectors. Total so far: ${totalUploaded}`);

      await sleep(500);

    } catch (e) {
      console.error(`  Batch ${batchNum} failed: ${e.message}`);
    }
  }

  console.log(`\n=== Ingestion Complete ===`);
  console.log(`Successfully embedded and uploaded ${totalUploaded}/${allVectors.length} chunks.`);
  console.log(`URLs skipped due to fetch errors: ${skippedCount - boilerplateCount}`);
  console.log(`URLs skipped due to boilerplate: ${boilerplateCount}`);
  console.log(`Re-run anytime — already-ingested URLs will be auto-skipped.`);
  console.log(`To force full re-ingest: set FORCE_REINGEST=true in the workflow inputs.`);
}

main().catch(console.error);
