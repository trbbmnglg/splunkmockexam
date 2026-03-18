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
const DELAY_BETWEEN_REQUESTS_MS = 500; // Increased delay to be gentler

// Standard browser headers to avoid WAF blocking (403 Forbidden)
const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
  "Sec-Ch-Ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": "\"Windows\"",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1"
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = RETRY_LIMIT) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers: FETCH_HEADERS });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`  Retry ${i + 1}/${retries} for ${url}`);
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}

function extractContent(html) {
  const $ = load(html);
  
  // Remove nav, headers, footers, scripts, styles
  $('nav, header, footer, script, style, .toc, .breadcrumb, #comments').remove();
  
  // Splunk docs specific main content area
  let content = $('.main-content').text() || $('article').text() || $('body').text();
  
  // Clean up whitespace
  return content.replace(/\s+/g, ' ').trim();
}

function chunkText(text, maxWords = 200, overlapWords = 50) {
  const words = text.split(' ');
  const chunks = [];
  let i = 0;
  
  while (i < words.length) {
    const chunk = words.slice(i, i + maxWords).join(' ');
    chunks.push(chunk);
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
  
  return result.result.data; // Array of arrays (embeddings)
}

async function uploadToVectorize(vectors) {
  // Cloudflare Vectorize expects NDJSON format for bulk inserts
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
    docsToProcess = splunkDocs.filter(cert => cert.cert === CERT_FILTER);
  }

  const totalUrls = docsToProcess.reduce((sum, cert) => sum + cert.urls.length, 0);
  console.log(`Total doc entries: ${docsToProcess.length}`);
  console.log(`Total URLs: ${totalUrls}`);

  let allVectors = [];
  let processedCount = 0;

  for (const cert of docsToProcess) {
    console.log(`\n[${cert.cert}] ${cert.topic}`);
    
    for (const url of cert.urls) {
      console.log(`  Fetching: ${url}`);
      try {
        const html = await fetchWithRetry(url);
        const text = extractContent(html);
        const chunks = chunkText(text);
        
        console.log(`  -> Extracted ${chunks.length} chunks`);
        
        for (let i = 0; i < chunks.length; i++) {
          allVectors.push({
            id: `${cert.cert.replace(/\s/g, '-')}-${Date.now()}-${processedCount}-${i}`,
            text: chunks[i], // We temporarily store text here to embed later
            metadata: {
              cert: cert.cert,
              topic: cert.topic,
              url: url
            }
          });
        }
        processedCount++;
        await sleep(DELAY_BETWEEN_REQUESTS_MS); // Be nice to Splunk servers
      } catch (e) {
        console.error(`  SKIP — fetch failed: ${e.message}`);
      }
    }
  }

  if (allVectors.length === 0) {
    console.log('\nNo chunks extracted. Exiting.');
    return;
  }

  console.log(`\nTotal chunks to embed: ${allVectors.length}`);

  if (DRY_RUN) {
    console.log('\nDRY RUN: Skipping embedding and upload.');
    return;
  }

  // Process in batches
  console.log('\nStarting Embedding and Upload...');
  let totalUploaded = 0;

  for (let i = 0; i < allVectors.length; i += BATCH_SIZE) {
    const batch = allVectors.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} items)...`);
    
    try {
      // 1. Get embeddings
      const texts = batch.map(b => b.text);
      const embeddings = await getEmbeddings(texts);
      
      // 2. Format for Vectorize
      const vectorizePayload = batch.map((item, idx) => ({
        id: item.id,
        values: embeddings[idx],
        namespace: item.metadata.cert.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase(), // clean namespace
        metadata: {
          ...item.metadata,
          text: item.text // Store original text for retrieval
        }
      }));

      // 3. Upload
      await uploadToVectorize(vectorizePayload);
      totalUploaded += batch.length;
      console.log(`  Uploaded ${batch.length} vectors.`);
      
    } catch (e) {
      console.error(`  Batch failed: ${e.message}`);
    }
  }

  console.log(`\n=== Ingestion Complete ===`);
  console.log(`Successfully embedded and uploaded ${totalUploaded}/${allVectors.length} chunks.`);
}

main().catch(console.error);
