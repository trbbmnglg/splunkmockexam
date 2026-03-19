/**
 * scripts/validate-urls.js
 *
 * Validates every URL in splunk-urls.js by making real HTTP requests.
 * Imports directly from splunk-urls.js — no duplicate URL list to maintain.
 *
 * Run locally:   bun scripts/validate-urls.js
 * Run in CI:     triggered via validate-urls.yml workflow
 *
 * Output:
 *   - Console report grouped by cert (✓ alive / ✗ dead)
 *   - /tmp/validation-report.txt  (captured by CI via tee)
 *   - /tmp/splunk-urls-fixed.js   — ready-to-deploy with dead URLs removed
 */

import { writeFileSync } from 'fs';
import { splunkDocs } from './splunk-urls.js';

// ── HTTP check ────────────────────────────────────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];
let uaIdx = 0;

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENTS[uaIdx++ % USER_AGENTS.length],
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return { status: res.status, ok: res.status === 200 };
  } catch (e) {
    clearTimeout(timeout);
    return { status: 0, ok: false, error: e.message };
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Deduplicate URLs globally
  const allUrls = new Map(); // url → [{ certType, topic }]
  for (const doc of splunkDocs) {
    for (const url of doc.urls) {
      if (!allUrls.has(url)) allUrls.set(url, []);
      allUrls.get(url).push({ certType: doc.certType, topic: doc.topic });
    }
  }

  const uniqueUrls = [...allUrls.keys()];
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Splunk URL Validator`);
  console.log(`  ${uniqueUrls.length} unique URLs across ${splunkDocs.length} cert/topic entries`);
  console.log(`${'═'.repeat(60)}\n`);

  // ── Check all URLs ────────────────────────────────────────────────────────
  const results = new Map();
  let checked = 0;

  for (const url of uniqueUrls) {
    const result = await checkUrl(url);
    results.set(url, result);
    checked++;
    const icon = result.ok ? '✓' : '✗';
    const statusStr = result.status === 0 ? 'TIMEOUT/ERR' : `HTTP ${result.status}`;
    console.log(`[${checked}/${uniqueUrls.length}] ${icon} ${statusStr.padEnd(12)} ${url}`);
    await sleep(1000 + Math.floor(Math.random() * 500));
  }

  // ── Report grouped by cert ────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  RESULTS BY CERT');
  console.log(`${'═'.repeat(60)}`);

  const deadUrls = new Set();
  const byCert = {};
  for (const doc of splunkDocs) {
    if (!byCert[doc.certType]) byCert[doc.certType] = [];
    byCert[doc.certType].push(doc);
  }

  let totalAlive = 0, totalDead = 0;

  for (const [cert, docs] of Object.entries(byCert)) {
    console.log(`\n  ── ${cert} ──`);
    for (const doc of docs) {
      const dead  = doc.urls.filter(u => !results.get(u)?.ok);
      const alive = doc.urls.filter(u =>  results.get(u)?.ok);
      const icon  = dead.length === 0 ? '✓' : dead.length === doc.urls.length ? '✗' : '⚠';
      console.log(`  ${icon} ${doc.topic} (${alive.length}/${doc.urls.length} alive)`);
      for (const u of dead) {
        const r = results.get(u);
        const statusStr = r.status === 0 ? 'TIMEOUT/ERR' : `HTTP ${r.status}`;
        console.log(`      ✗ [${statusStr}] ${u}`);
        deadUrls.add(u);
        totalDead++;
      }
      totalAlive += alive.length;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Total unique URLs checked: ${uniqueUrls.length}`);
  console.log(`  ✓ Alive: ${totalAlive}`);
  console.log(`  ✗ Dead:  ${totalDead}`);

  if (deadUrls.size === 0) {
    console.log('\n  ✓ All URLs alive — splunk-urls.js is clean, ready to ingest!');
    writeFileSync('/tmp/splunk-urls-fixed.js', '// All URLs validated OK — no changes needed.\n');
  } else {
    console.log(`\n  Dead URLs (${deadUrls.size}):`);
    for (const u of deadUrls) console.log(`    ${u}`);
    writefixedFile(splunkDocs, results);
  }

  console.log(`\n${'═'.repeat(60)}\n`);

  // Exit 1 if any dead URLs found — makes CI step clearly fail/warn
  if (deadUrls.size > 0) process.exit(1);
}

// ── Write fixed splunk-urls.js with dead URLs stripped ────────────────────────
function writefixedFile(docs, results) {
  const lines = [];
  lines.push(`/**`);
  lines.push(` * scripts/splunk-urls.js — PATCHED BY validate-urls.js`);
  lines.push(` * Dead URLs have been removed. Entries marked TODO need manual replacement.`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`const S    = 'https://docs.splunk.com/Documentation/Splunk/9.4.2';`);
  lines.push(`const SR   = 'https://docs.splunk.com/Documentation/Splunk/9.4.2/SearchReference';`);
  lines.push(`const CIM  = 'https://docs.splunk.com/Documentation/CIM/latest';`);
  lines.push(`const ES   = 'https://docs.splunk.com/Documentation/ES/latest';`);
  lines.push(`const SC   = 'https://docs.splunk.com/Documentation/SplunkCloud/latest';`);
  lines.push(`const H    = 'https://help.splunk.com/en/splunk-enterprise';`);
  lines.push(`const HDM  = 'https://help.splunk.com/en/data-management';`);
  lines.push(`const HGET = 'https://help.splunk.com/en/splunk-enterprise/get-started';`);
  lines.push(``);
  lines.push(`export const SPLUNK_DOC_URLS = [`);

  let currentCert = '';
  for (const doc of docs) {
    if (doc.certType !== currentCert) {
      currentCert = doc.certType;
      lines.push(`\n  // ── ${currentCert} ${'─'.repeat(Math.max(0, 50 - currentCert.length))}`);
    }
    const liveUrls = doc.urls.filter(u => results.get(u)?.ok);
    const removed  = doc.urls.length - liveUrls.length;

    if (liveUrls.length === 0) {
      lines.push(`  // TODO: all URLs dead — replace for [${doc.certType}] ${doc.topic}`);
      lines.push(`  // { certType: '${doc.certType}', topic: '${doc.topic}', urls: [] },`);
    } else {
      if (removed > 0) lines.push(`  // ${removed} dead URL(s) removed from this entry`);
      lines.push(`  {`);
      lines.push(`    certType: '${doc.certType}', topic: '${doc.topic}',`);
      lines.push(`    urls: [`);
      liveUrls.forEach((u, i) => lines.push(`      '${u}'${i < liveUrls.length - 1 ? ',' : ''}`));
      lines.push(`    ]`);
      lines.push(`  },`);
    }
  }

  lines.push(`];\n`);
  lines.push(`export const splunkDocs = SPLUNK_DOC_URLS;`);

  writeFileSync('/tmp/splunk-urls-fixed.js', lines.join('\n'));
  console.log(`\n  Fixed file written → /tmp/splunk-urls-fixed.js (download from artifacts)`);
}

main().catch(err => {
  console.error('Validator failed:', err);
  process.exit(1);
});
