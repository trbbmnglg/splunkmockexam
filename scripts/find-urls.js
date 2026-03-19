/**
 * scripts/find-urls.js
 *
 * For each dead topic in splunk-urls.js, searches help.splunk.com's sitemap
 * to find the correct replacement URL.
 *
 * Strategy:
 *   1. Fetch the help.splunk.com sitemap index
 *   2. For each dead URL's keyword, scan relevant sitemap files
 *   3. Find the best-matching live URL
 *   4. Output a patch list + updated splunk-urls.js
 *
 * Run: bun scripts/find-urls.js
 */

import { writeFileSync } from 'fs';
import { splunkDocs } from './splunk-urls.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];
let uaIdx = 0;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchText(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENTS[uaIdx++ % USER_AGENTS.length],
        'Accept': 'text/html,application/xml,*/*',
      },
      redirect: 'follow',
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(t);
    return null;
  }
}

async function checkUrl(url) {
  const text = await fetchText(url, 12000);
  return text !== null;
}

// ── Dead URL keyword mapping → search terms for sitemap scanning ──────────────
// Maps the last path segment of the dead docs.splunk.com URL to
// keywords we'd expect in a help.splunk.com URL
const DEAD_URL_KEYWORDS = {
  // Search & UI
  'Aboutthisguide':                    'about-the-search-tutorial',
  'Saveasearch':                       'save-and-share',
  'Searchwithfieldlookups':            'field-lookups',
  'Usebooleansandcomparison':          'boolean-expressions',
  'Quickreferenceforoperators':        'quick-reference',
  'Addreportstodashboards':            'add-reports-to-dashboards',
  'Aboutdashboards':                   'about-dashboards',
  'Optimizesearches':                  'optimize-searches',
  'Strftime':                          'strftime',
  'Aboutforminputs':                   'form-inputs',
  'Addaforminput':                     'add-a-form',
  'Adddrilldownstodashboardpanels':    'add-drilldowns',
  'Aboutdrilldown':                    'about-drilldown',
  'Aboutvisualizationtypes':           'visualization-types',
  // Knowledge
  'DefineandsharelookupsinSplunkWeb':  'define-and-share-lookups',
  'Definesearchtimelookupsforfields':  'search-time-lookups',
  'Managefields':                      'manage-fields',
  'Definedfieldextractions':           'field-extractions',
  'Aboutworkflowactions':              'workflow-actions',
  'Buildadatamodel':                   'build-a-data-model',
  'Pivotdatamodeldata':                'pivot',
  // Admin
  'Aboutsplunkadministration':         'administer-splunk-enterprise',
  'Adminsplunkenterprise':             'administer-splunk-enterprise',
  'Aboutlicensemanagement':            'license-management',
  'Aboutuserauthentication':           'user-authentication',
  'Setupauthenticationwithldap':       'ldap',
  'Configurescimprovisioning':         'scim',
  'Configurethedeployment':            'configure-the-distributed',
  // Data
  'Inputsettingsreference':            'inputs-configuration',
  'Dataintegritychecksummary':         'data-integrity',
  'Configureforwardingwithoutputs.conf': 'outputs-conf',
  'Getdatafromscripts':                'get-data-from-scripts',
  'HowSplunkEnterprisehandlesyourdata': 'how-splunk-enterprise-handles',
  'Overridesourceandextractionconfigurations': 'override-source',
  'Editinputs.conf':                   'edit-inputs',
  'Parsedatapreview':                  'parse-data',
  'Howsplunkformatsmultilineevents':   'multiline-events',
  'Anonymizedatawithmasking':          'anonymize-data',
  'Setupsedcommands':                  'sed-commands',
  // Architect/Metrics/DMC
  'Overviewofcapacityplanning':        'capacity-planning',
  'Manageanindexercluster':            'manage-an-indexer-cluster',
  'GetMetricsIntoSplunk':              'get-metrics-into-splunk',
  'AbouttheDMC':                       'monitoring-console',
  'ViewDMCoverview':                   'monitoring-console-overview',
  // Cloud
  'SplunkCloudOverview':               'splunk-cloud',
  'GettingStarted':                    'getting-started',
  'Createandmanageindexes':            'create-and-manage-indexes',
  'Aboutconfigurationfiles':           'configuration-files',
  'ManageCloudConfiguration':          'cloud-configuration',
  'MonitorInputs':                     'monitor-inputs',
  'ConfigureInputsFromSplunkWeb':      'configure-inputs',
  'ConfigHeavyForwarder':              'heavy-forwarder',
  'Monitornetworkports':               'network-ports',
  'UsetheHTTPEventCollector':          'http-event-collector',
  'Editinputs':                        'edit-inputs',
  'Overridesource':                    'override-source',
  'WorkWithSupport':                   'support',
  'Diagnostictools':                   'diagnostic',
};

// ── Known sitemap URLs to scan for help.splunk.com ───────────────────────────
const SITEMAPS_TO_SCAN = [
  'https://help.splunk.com/sitemap.xml',
  'https://help.splunk.com/en/splunk-enterprise/sitemap.xml',
  'https://help.splunk.com/en/data-management/sitemap.xml',
];

async function fetchSitemapUrls(sitemapUrl) {
  console.log(`  Fetching sitemap: ${sitemapUrl}`);
  const text = await fetchText(sitemapUrl, 30000);
  if (!text) return [];

  // Extract all <loc> URLs from sitemap
  const locs = [];
  const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(text)) !== null) {
    locs.push(match[1].trim());
  }

  // If this is a sitemap index, recursively fetch sub-sitemaps
  const isIndex = text.includes('<sitemapindex') || text.includes('<sitemap>');
  if (isIndex && locs.length > 0 && locs[0].endsWith('.xml')) {
    console.log(`    → Sitemap index with ${locs.length} sub-sitemaps, fetching...`);
    const allUrls = [];
    for (const subUrl of locs.slice(0, 20)) { // cap at 20 sub-sitemaps
      await sleep(500);
      const subUrls = await fetchSitemapUrls(subUrl);
      allUrls.push(...subUrls);
    }
    return allUrls;
  }

  return locs.filter(u => u.includes('help.splunk.com') && !u.endsWith('.xml'));
}

function getKeyword(deadUrl) {
  const lastSegment = deadUrl.split('/').pop();
  return DEAD_URL_KEYWORDS[lastSegment] || lastSegment.toLowerCase().replace(/\./g, '-');
}

function findBestMatch(keyword, candidateUrls, version = '9.4') {
  const kw = keyword.toLowerCase();
  // Score each candidate
  const scored = candidateUrls
    .filter(u => u.includes(version))
    .map(u => {
      const path = u.toLowerCase();
      let score = 0;
      // Exact keyword in path
      if (path.includes(kw)) score += 10;
      // Partial keyword words match
      const words = kw.split('-').filter(w => w.length > 3);
      for (const word of words) {
        if (path.includes(word)) score += 2;
      }
      return { url: u, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.url || null;
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  Splunk URL Finder — Locating replacements via sitemap');
  console.log('═'.repeat(60) + '\n');

  // ── Collect all dead URLs from splunk-urls.js ─────────────────────────────
  const deadUrls = new Set();
  for (const doc of splunkDocs) {
    for (const url of doc.urls) {
      // Check if this is one we know is dead (from previous validation)
      const lastSegment = url.split('/').pop();
      if (DEAD_URL_KEYWORDS[lastSegment]) {
        deadUrls.add(url);
      }
    }
  }

  console.log(`Dead URLs to find replacements for: ${deadUrls.size}`);

  // ── Fetch sitemap ─────────────────────────────────────────────────────────
  console.log('\nFetching help.splunk.com sitemap...');
  let allHelpUrls = [];

  for (const sitemapUrl of SITEMAPS_TO_SCAN) {
    const urls = await fetchSitemapUrls(sitemapUrl);
    console.log(`  Found ${urls.length} URLs in ${sitemapUrl}`);
    allHelpUrls.push(...urls);
    await sleep(1000);
  }

  // Deduplicate
  allHelpUrls = [...new Set(allHelpUrls)];
  console.log(`\nTotal unique help.splunk.com URLs from sitemap: ${allHelpUrls.length}`);

  if (allHelpUrls.length === 0) {
    console.log('\nWARNING: Sitemap returned no URLs — Splunk may not expose a public sitemap.');
    console.log('Falling back to direct URL probing...\n');
    await directProbe(deadUrls);
    return;
  }

  // ── Find best match for each dead URL ─────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  REPLACEMENTS FOUND');
  console.log('═'.repeat(60));

  const replacements = new Map();
  let found = 0, notFound = 0;

  for (const deadUrl of deadUrls) {
    const keyword = getKeyword(deadUrl);
    const match = findBestMatch(keyword, allHelpUrls);
    if (match) {
      console.log(`✓ ${deadUrl.split('/').pop()}`);
      console.log(`  → ${match}`);
      replacements.set(deadUrl, match);
      found++;
    } else {
      console.log(`✗ ${deadUrl.split('/').pop()} — no match found for keyword: "${keyword}"`);
      notFound++;
    }
  }

  console.log(`\nFound: ${found}, Not found: ${notFound}`);

  // ── Write patch report ─────────────────────────────────────────────────────
  const lines = ['// URL Replacements found by find-urls.js', '// Apply these to splunk-urls.js manually or via patch', ''];
  for (const [dead, replacement] of replacements) {
    lines.push(`// ${dead.split('/').pop()}`);
    lines.push(`// OLD: ${dead}`);
    lines.push(`// NEW: ${replacement}`);
    lines.push('');
  }

  writeFileSync('/tmp/url-replacements.txt', lines.join('\n'));
  console.log('\nPatch report written → /tmp/url-replacements.txt');
  console.log('Download from workflow artifacts.\n');
}

// ── Fallback: direct probe known help.splunk.com URL patterns ─────────────────
// Used when sitemap is unavailable. Tests educated guesses based on
// the known-working URL patterns from validation run 1.
async function directProbe(deadUrls) {
  // Known good books from validated URLs
  const BOOKS = {
    search: [
      'help.splunk.com/en/splunk-enterprise/administer/search/9.4',
      'help.splunk.com/en/splunk-enterprise/search/9.4',
    ],
    knowledge: [
      'help.splunk.com/en/splunk-enterprise/administer/knowledge/9.4',
      'help.splunk.com/en/splunk-enterprise/knowledge/9.4',
    ],
    admin: [
      'help.splunk.com/en/splunk-enterprise/administer/splunk-enterprise-admin-manual/9.4',
      'help.splunk.com/en/splunk-enterprise/administer/9.4',
    ],
    data: [
      'help.splunk.com/en/data-management/splunk-enterprise-data-management/9.4',
      'help.splunk.com/en/data-management/9.4',
    ],
    viz: [
      'help.splunk.com/en/splunk-enterprise/administer/search-reporting/9.4',
      'help.splunk.com/en/splunk-enterprise/search-reporting/9.4',
    ],
  };

  // Map dead URL segment → [book_category, chapter_guess, page_guess]
  const PROBES = {
    'Aboutthisguide':        ['search',    'search-tutorial',           'about-the-search-tutorial'],
    'Saveasearch':           ['search',    'search-manual',             'save-and-share-searches'],
    'Searchwithfieldlookups':['search',    'search-manual',             'use-field-lookups'],
    'Usebooleansandcomparison':['search',  'search-manual',             'about-boolean-expressions'],
    'Quickreferenceforoperators':['search','search-manual',             'search-quick-reference'],
    'Addreportstodashboards':['viz',       'reporting',                 'add-reports-to-dashboards'],
    'Aboutdashboards':       ['viz',       'reporting',                 'about-dashboards'],
    'Optimizesearches':      ['search',    'search-manual',             'optimize-searches'],
    'Strftime':              ['search',    'search-reference',          'strftime'],
    'Aboutforminputs':       ['viz',       'reporting',                 'about-form-inputs'],
    'Addaforminput':         ['viz',       'reporting',                 'add-a-form-input'],
    'Adddrilldownstodashboardpanels':['viz','reporting',                'add-drilldowns-to-dashboard-panels'],
    'Aboutdrilldown':        ['viz',       'reporting',                 'about-drilldown'],
    'Aboutvisualizationtypes':['viz',      'reporting',                 'about-visualization-types'],
    'DefineandsharelookupsinSplunkWeb':['knowledge','knowledge-manager-manual','define-and-share-lookups'],
    'Definesearchtimelookupsforfields':['knowledge','knowledge-manager-manual','search-time-lookups'],
    'Managefields':          ['knowledge', 'knowledge-manager-manual',  'manage-fields'],
    'Definedfieldextractions':['knowledge','knowledge-manager-manual',  'field-extractions'],
    'Aboutworkflowactions':  ['knowledge', 'knowledge-manager-manual',  'about-workflow-actions'],
    'Buildadatamodel':       ['knowledge', 'knowledge-manager-manual',  'build-a-data-model'],
    'Pivotdatamodeldata':    ['knowledge', 'knowledge-manager-manual',  'pivot-data-model-data'],
    'Inputsettingsreference':['data',      'get-data-in',               'inputs-conf-reference'],
    'Aboutsplunkadministration':['admin',  'administer-splunk-enterprise','administer-splunk-enterprise'],
    'Adminsplunkenterprise': ['admin',     'administer-splunk-enterprise','administer-splunk-enterprise'],
    'Aboutlicensemanagement':['admin',     'manage-splunk-licenses',    'about-license-management'],
    'Aboutuserauthentication':['admin',    'manage-splunk-users',       'about-user-authentication'],
    'Setupauthenticationwithldap':['admin','manage-splunk-users',       'set-up-authentication-with-ldap'],
    'Configurescimprovisioning':['admin',  'manage-splunk-users',       'configure-scim-provisioning'],
    'Configurethedeployment':['search',    'distributed-search',        'configure-the-deployment'],
    'Dataintegritychecksummary':['data',   'get-data-in',               'data-integrity-check'],
    'Configureforwardingwithoutputs.conf':['data','forward-data',       'configure-forwarding-with-outputs-conf'],
    'Getdatafromscripts':    ['data',      'get-data-in',               'get-data-from-scripts'],
    'HowSplunkEnterprisehandlesyourdata':['data','get-data-in',         'how-splunk-enterprise-handles-your-data'],
    'Overridesourceandextractionconfigurations':['data','get-data-in',  'override-source-and-extraction-configurations'],
    'Editinputs.conf':       ['data',      'get-data-in',               'edit-inputs-conf'],
    'Parsedatapreview':      ['data',      'get-data-in',               'parse-data-preview'],
    'Howsplunkformatsmultilineevents':['data','get-data-in',            'how-splunk-formats-multiline-events'],
    'Anonymizedatawithmasking':['data',    'get-data-in',               'anonymize-data-with-masking'],
    'Setupsedcommands':      ['data',      'get-data-in',               'set-up-sed-commands'],
    'Overviewofcapacityplanning':['admin', 'deploy-splunk',             'overview-of-capacity-planning'],
    'Manageanindexercluster':['admin',     'manage-indexers-and-indexer-clusters','manage-an-indexer-cluster'],
    'GetMetricsIntoSplunk':  ['data',      'metrics',                   'get-metrics-into-splunk'],
    'AbouttheDMC':           ['admin',     'monitoring-splunk-enterprise','about-the-monitoring-console'],
    'ViewDMCoverview':       ['admin',     'monitoring-splunk-enterprise','view-monitoring-console-overview'],
  };

  console.log('Direct probing — testing URL candidates...\n');
  const results = [];
  let probed = 0;

  for (const deadUrl of deadUrls) {
    const seg = deadUrl.split('/').pop();
    const probe = PROBES[seg];
    if (!probe) {
      console.log(`  SKIP (no probe defined): ${seg}`);
      continue;
    }

    const [bookCat, chapter, page] = probe;
    const bookBases = BOOKS[bookCat] || BOOKS.admin;
    let found = null;

    for (const base of bookBases) {
      const candidate = `https://${base}/${chapter}/${page}`;
      probed++;
      const ok = await checkUrl(candidate);
      const icon = ok ? '✓' : '✗';
      console.log(`  ${icon} ${candidate}`);
      if (ok) { found = candidate; break; }
      await sleep(800);
    }

    results.push({ dead: deadUrl, replacement: found });
    await sleep(500);
  }

  // ── Write results ─────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  PROBE RESULTS');
  console.log('═'.repeat(60));

  const found_list = results.filter(r => r.replacement);
  const not_found  = results.filter(r => !r.replacement);

  console.log(`\n✓ Found replacements: ${found_list.length}`);
  for (const r of found_list) {
    console.log(`  ${r.dead.split('/').pop()}`);
    console.log(`    → ${r.replacement}`);
  }

  console.log(`\n✗ Still not found: ${not_found.length}`);
  for (const r of not_found) {
    console.log(`  ${r.dead.split('/').pop()}`);
  }

  // Write patch file
  const lines = ['# URL Replacements from direct probe', '# Apply to splunk-urls.js', ''];
  for (const r of found_list) {
    lines.push(`OLD: ${r.dead}`);
    lines.push(`NEW: ${r.replacement}`);
    lines.push('');
  }
  if (not_found.length > 0) {
    lines.push('# NOT FOUND — needs manual lookup:');
    for (const r of not_found) lines.push(`#   ${r.dead}`);
  }

  writeFileSync('/tmp/url-replacements.txt', lines.join('\n'));
  console.log('\nPatch report written → /tmp/url-replacements.txt');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
