/**
 * scripts/find-urls.js
 *
 * Two-pass tool:
 *   Pass 1 — validate every URL in splunk-urls.js (same as validate-urls.js)
 *   Pass 2 — for each dead URL, search the help.splunk.com sitemap for the
 *             best-matching live replacement
 *
 * Outputs:
 *   /tmp/url-replacements.txt  — OLD → NEW patch list
 *   /tmp/find-report.txt       — full console log (captured by CI via tee)
 *
 * Run: bun scripts/find-urls.js
 */

import { writeFileSync } from 'fs';
import { splunkDocs } from './splunk-urls.js';

// ── HTTP helpers ──────────────────────────────────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
];
let uaIdx = 0;
const nextUA = () => USER_AGENTS[uaIdx++ % USER_AGENTS.length];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchText(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': nextUA(), 'Accept': 'text/html,application/xml,*/*' },
      redirect: 'follow',
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, status: res.status, text: null };
    return { ok: true, status: res.status, text: await res.text() };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, status: 0, text: null, error: e.message };
  }
}

// ── PASS 1: Validate all URLs in splunk-urls.js ───────────────────────────────
async function validateAll() {
  const allUrls = new Map();
  for (const doc of splunkDocs) {
    for (const url of doc.urls) {
      if (!allUrls.has(url)) allUrls.set(url, []);
      allUrls.get(url).push({ certType: doc.certType, topic: doc.topic });
    }
  }

  const uniqueUrls = [...allUrls.keys()];
  console.log(`\nPass 1: Validating ${uniqueUrls.length} unique URLs...`);

  const results = new Map();
  let i = 0;
  for (const url of uniqueUrls) {
    i++;
    const r = await fetchText(url, 12000);
    results.set(url, r);
    const icon = r.ok ? '✓' : '✗';
    const status = r.status === 0 ? 'ERR' : `${r.status}`;
    process.stdout.write(`  [${i}/${uniqueUrls.length}] ${icon} ${status.padEnd(4)} ${url}\n`);
    await sleep(800 + Math.floor(Math.random() * 400));
  }

  const dead = [...results.entries()].filter(([, r]) => !r.ok).map(([url]) => url);
  console.log(`\n  ✓ Alive: ${uniqueUrls.length - dead.length}  ✗ Dead: ${dead.length}`);

  // Map dead URL → its doc entry (certType + topic) for context-aware matching
  const deadWithContext = dead.map(url => {
    const contexts = allUrls.get(url) || [];
    return { url, contexts };
  });

  return deadWithContext;
}

// ── PASS 2: Fetch sitemap and find replacements ───────────────────────────────
async function fetchSitemapUrls() {
  console.log('\nPass 2: Fetching help.splunk.com sitemap...');
  const r = await fetchText('https://help.splunk.com/sitemap.xml', 30000);
  if (!r.ok || !r.text) {
    console.log('  ✗ Sitemap unavailable');
    return [];
  }

  // Extract sub-sitemap URLs
  const subSitemapUrls = [];
  const sitemapLocRegex = /<loc>(https:\/\/help\.splunk\.com[^<]*sitemap\.xml[^<]*)<\/loc>/g;
  let m;
  while ((m = sitemapLocRegex.exec(r.text)) !== null) subSitemapUrls.push(m[1].trim());

  // Only fetch the sitemaps relevant to Splunk Enterprise and Data Management
  const relevantSitemaps = subSitemapUrls.filter(u =>
    u.includes('splunk-enterprise') || u.includes('data-management')
  );
  console.log(`  Found ${subSitemapUrls.length} sub-sitemaps, using ${relevantSitemaps.length} relevant ones`);

  let allUrls = [];
  for (const sitemapUrl of relevantSitemaps) {
    console.log(`  Fetching: ${sitemapUrl}`);
    const sr = await fetchText(sitemapUrl, 30000);
    if (!sr.ok || !sr.text) continue;
    const locRegex = /<loc>(https:\/\/help\.splunk\.com[^<]+)<\/loc>/g;
    while ((m = locRegex.exec(sr.text)) !== null) {
      const loc = m[1].trim();
      if (!loc.endsWith('.xml')) allUrls.push(loc);
    }
    await sleep(500);
  }

  allUrls = [...new Set(allUrls)];
  console.log(`  Total sitemap URLs available: ${allUrls.length}`);
  return allUrls;
}

// ── Scoring: find best sitemap match for a dead URL ──────────────────────────
// Uses the dead URL's path segments AND its topic/cert context as signals.
function scoreMatch(sitemapUrl, deadUrl, contexts) {
  const sp = sitemapUrl.toLowerCase();
  const dp = deadUrl.toLowerCase();

  // Must be version 9.4
  if (!sp.includes('/9.4/')) return 0;

  // Must be splunk-enterprise or data-management
  if (!sp.includes('splunk-enterprise') && !sp.includes('data-management')) return 0;

  let score = 0;

  // ── Extract meaningful slug words from the dead URL's last path segment ──
  const deadSlug = dp.split('/').pop()
    .replace(/\.(conf|xml|html?)$/, '')  // strip extensions
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase → kebab
    .toLowerCase();

  const deadWords = deadSlug.split(/[-_]/).filter(w => w.length > 3);

  // Score each word from the dead URL slug that appears in the sitemap URL
  for (const word of deadWords) {
    if (sp.includes(word)) score += 3;
  }

  // ── Use topic context for section scoring ─────────────────────────────────
  const topicWords = contexts.flatMap(c =>
    (c.topic + ' ' + c.certType)
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4)
  );

  for (const word of topicWords) {
    if (sp.includes(word)) score += 1;
  }

  // ── Penalise clearly wrong sections ──────────────────────────────────────
  // If all contexts are non-security but URL is in security section, penalise
  const allNonSecurity = contexts.every(c =>
    !c.certType.toLowerCase().includes('security') &&
    !c.certType.toLowerCase().includes('cyber')
  );
  if (allNonSecurity && sp.includes('security')) score -= 5;

  // Prefer pages that aren't in "release-notes" or "style-guide"
  if (sp.includes('release-notes') || sp.includes('style-guide')) score -= 10;

  return score;
}

function findBestMatch(deadUrl, contexts, sitemapUrls) {
  let best = null;
  let bestScore = 0;

  for (const sUrl of sitemapUrls) {
    const s = scoreMatch(sUrl, deadUrl, contexts);
    if (s > bestScore) {
      bestScore = s;
      best = sUrl;
    }
  }

  // Require a minimum score to avoid garbage matches
  return bestScore >= 6 ? best : null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60));
  console.log('  Splunk URL Finder v2');
  console.log('  Validate → Sitemap scan → Best-match replacement');
  console.log('═'.repeat(60));

  // Pass 1: find dead URLs in current splunk-urls.js
  const deadWithContext = await validateAll();

  if (deadWithContext.length === 0) {
    console.log('\n✓ All URLs are alive — nothing to fix!');
    writeFileSync('/tmp/url-replacements.txt', '# All URLs validated OK\n');
    return;
  }

  console.log(`\n${deadWithContext.length} dead URLs to find replacements for:`);
  for (const { url } of deadWithContext) console.log(`  ${url}`);

  // Pass 2: fetch sitemap
  const sitemapUrls = await fetchSitemapUrls();

  if (sitemapUrls.length === 0) {
    console.log('\n✗ Could not fetch sitemap — cannot find replacements automatically.');
    writeFileSync('/tmp/url-replacements.txt', deadWithContext.map(d =>
      `# MANUAL LOOKUP NEEDED\n# OLD: ${d.url}\n# CONTEXT: ${d.contexts.map(c => c.certType + ' / ' + c.topic).join(', ')}\n`
    ).join('\n'));
    return;
  }

  // Match each dead URL
  console.log('\n' + '═'.repeat(60));
  console.log('  REPLACEMENTS');
  console.log('═'.repeat(60));

  const replacements = [];
  const notFound = [];

  for (const { url, contexts } of deadWithContext) {
    const match = findBestMatch(url, contexts, sitemapUrls);
    const seg = url.split('/').pop();
    if (match) {
      console.log(`\n✓ ${seg}`);
      console.log(`  Context: ${contexts.map(c => `${c.certType} / ${c.topic}`).join(', ')}`);
      console.log(`  OLD: ${url}`);
      console.log(`  NEW: ${match}`);
      replacements.push({ dead: url, replacement: match, contexts });
    } else {
      console.log(`\n✗ ${seg} — no confident match found`);
      console.log(`  Context: ${contexts.map(c => `${c.certType} / ${c.topic}`).join(', ')}`);
      console.log(`  OLD: ${url}`);
      notFound.push({ dead: url, contexts });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log(`  Found: ${replacements.length}  Not found: ${notFound.length}`);
  console.log('═'.repeat(60));

  // ── Write patch file ──────────────────────────────────────────────────────
  const lines = [
    '# URL Replacements — generated by find-urls.js',
    '# Apply each OLD → NEW pair to scripts/splunk-urls.js',
    '# Then run validate-urls.js to confirm all are 200.',
    '',
  ];

  if (replacements.length > 0) {
    lines.push('# ── FOUND ──────────────────────────────────────────────');
    for (const r of replacements) {
      lines.push(`# ${r.contexts.map(c => `[${c.certType}] ${c.topic}`).join(' | ')}`);
      lines.push(`OLD: ${r.dead}`);
      lines.push(`NEW: ${r.replacement}`);
      lines.push('');
    }
  }

  if (notFound.length > 0) {
    lines.push('# ── MANUAL LOOKUP NEEDED ──────────────────────────────');
    lines.push('# Search https://help.splunk.com for these topics:');
    for (const r of notFound) {
      lines.push(`# ${r.contexts.map(c => `[${c.certType}] ${c.topic}`).join(' | ')}`);
      lines.push(`# OLD: ${r.dead}`);
      lines.push('');
    }
  }

  writeFileSync('/tmp/url-replacements.txt', lines.join('\n'));
  console.log('\nPatch file → /tmp/url-replacements.txt (download from artifacts)');

  if (notFound.length > 0) process.exit(1);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
