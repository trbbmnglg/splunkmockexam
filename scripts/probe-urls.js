/**
 * scripts/probe-urls.js
 *
 * Probes specific candidate URLs for the 21 topics that the sitemap
 * keyword-matcher got wrong or couldn't find.
 *
 * For each topic, tries 2-3 candidate URLs in order — stops at first 200.
 * Outputs a verified patch file ready to apply to splunk-urls.js.
 *
 * Run: bun scripts/probe-urls.js
 */

import { writeFileSync } from 'fs';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];
let uaIdx = 0;
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function checkUrl(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': USER_AGENTS[uaIdx++ % USER_AGENTS.length],
        'Accept': 'text/html,*/*',
      },
      redirect: 'follow',
    });
    clearTimeout(t);
    return res.status === 200;
  } catch {
    clearTimeout(t);
    return false;
  }
}

// ── Candidates for each wrong/not-found match ─────────────────────────────────
// Each entry: [topic_slug, [cert/topic context], [candidate URLs in priority order]]
// First candidate that returns 200 wins.
const PROBES = [
  // ── User cert ──────────────────────────────────────────────────────────────
  ['add-reports-to-dashboards', 'User / Creating Reports and Dashboards', [
    'https://help.splunk.com/en/splunk-enterprise/get-started/search-tutorial/9.4/part-7-creating-dashboards/add-reports-to-a-dashboard',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/build-and-manage-dashboards/add-a-report-to-a-dashboard',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/build-and-manage-dashboards/add-a-panel-to-a-dashboard',
  ]],

  // ── Power User cert ────────────────────────────────────────────────────────
  ['pivot-data-model-data', 'Power User / Creating Data Models', [
    'https://help.splunk.com/en/splunk-enterprise/manage-knowledge-objects/knowledge-management-manual/9.4/build-a-data-model/pivot-your-data-model-data',
    'https://help.splunk.com/en/splunk-enterprise/manage-knowledge-objects/knowledge-management-manual/9.4/accelerate-data-models/use-pivot-to-create-reports-and-dashboards',
    'https://help.splunk.com/en/splunk-enterprise/manage-knowledge-objects/knowledge-management-manual/9.4/build-a-data-model/about-data-models',
  ]],

  // ── Advanced Power User cert ───────────────────────────────────────────────
  ['optimize-searches', 'Advanced Power User / Using Search Efficiently + Cybersecurity / SPL', [
    'https://help.splunk.com/en/splunk-enterprise/search/search-manual/9.4/write-better-searches/optimize-searches',
    'https://help.splunk.com/en/splunk-enterprise/search/search-manual/9.4/write-better-searches/about-search-optimization',
    'https://help.splunk.com/en/splunk-enterprise/search/search-manual/9.4/write-better-searches/write-better-searches',
    'https://help.splunk.com/en/splunk-enterprise/search/search-manual/9.4/write-better-searches',
  ]],
  ['about-form-inputs', 'Advanced Power User / Using Forms', [
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/build-and-manage-dashboards/about-form-inputs-for-dashboards',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/about-form-inputs',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/build-and-manage-dashboards/add-form-inputs-to-a-dashboard',
  ]],
  ['add-a-form-input', 'Advanced Power User / Using Forms', [
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/build-and-manage-dashboards/add-form-inputs-to-a-dashboard',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/add-a-form-input-to-a-dashboard',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/build-and-manage-dashboards/about-form-inputs-for-dashboards',
  ]],
  ['about-drilldown', 'Advanced Power User / Adding Drilldowns', [
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/add-interactivity-to-dashboards/about-drilldown',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/simple-xml-dashboards/9.4/add-drilldown-to-simple-xml-dashboards/about-drilldown-in-simple-xml',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboard-studio/9.4/add-dashboard-interactions/about-drilldown-in-dashboard-studio',
  ]],
  ['about-visualization-types', 'Advanced Power User / Adding Advanced Behaviors and Visualizations', [
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/visualize-data/about-splunk-enterprise-data-visualizations',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/visualize-data/types-of-visualizations-in-splunk-enterprise',
    'https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboards-and-visualizations/9.4/visualize-data/about-splunk-enterprise-visualizations',
  ]],
  ['strftime', 'Advanced Power User / Working with Time', [
    'https://help.splunk.com/en/splunk-enterprise/search/spl-search-reference/9.4/evaluation-functions/date-and-time-functions/strftime',
    'https://help.splunk.com/en/splunk-enterprise/search/search-manual/9.4/time-modifiers/format-times-using-strftime',
    'https://help.splunk.com/en/splunk-enterprise/search/spl-search-reference/9.4/statistical-and-charting-functions/strftime',
    'https://help.splunk.com/en/splunk-enterprise/search/search-manual/9.4/time-modifiers/reference-time-by-using-time-modifiers-in-search',
  ]],

  // ── Enterprise Admin cert ──────────────────────────────────────────────────
  ['administer-splunk-enterprise', 'Enterprise Admin / Splunk Admin Basics', [
    'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/introduction-to-the-splunk-enterprise-admin-manual/about-the-splunk-enterprise-admin-manual',
    'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/administer-splunk-enterprise/administer-splunk-enterprise',
    'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/get-splunk-enterprise/about-the-splunk-enterprise-admin-manual',
  ]],
  ['about-installing-splunk-enterprise', 'Enterprise Admin / Splunk Admin Basics', [
    'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/9.4/introduction-to-installation/about-installing-splunk-enterprise',
    'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/9.4/install-splunk-enterprise/about-installing-splunk-on-linux',
    'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/9.4/install-splunk-enterprise/about-splunk-enterprise-installation',
  ]],
  ['about-license-management', 'Enterprise Admin / License Management', [
    'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/configure-splunk-licenses/about-license-management',
    'https://help.splunk.com/en/data-management/splunk-enterprise-admin-manual/9.4/configure-splunk-licenses/about-license-management',
    'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/manage-splunk-licenses/about-license-management',
    'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/configure-licensing/about-license-management',
  ]],
  ['configure-scim-user-provisioning', 'Enterprise Admin / Splunk Authentication Management', [
    'https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/9.4/configure-user-provisioning/configure-scim-user-provisioning',
    'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/manage-users/configure-scim-user-provisioning',
    'https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/9.4/set-up-scim-provisioning/configure-scim-user-provisioning',
  ]],
  ['about-getting-data-in', 'Enterprise Admin / Getting Data In – Staging', [
    'https://help.splunk.com/en/splunk-enterprise/get-started/get-data-in/9.4/introduction/about-getting-data-in',
    'https://help.splunk.com/en/splunk-enterprise/get-data-in/get-started-with-getting-data-in/9.4/introduction/about-getting-data-in',
    'https://help.splunk.com/en/data-management/get-data-in/get-data-into-splunk-enterprise/9.4/introduction/about-getting-data-in',
    'https://help.splunk.com/en/splunk-enterprise/get-started/get-data-in/9.4/how-to-get-data-into-your-splunk-deployment/about-getting-data-in',
  ]],
  ['override-source-and-extraction-configurations', 'Enterprise Admin / Fine Tuning Inputs', [
    'https://help.splunk.com/en/splunk-enterprise/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/override-source-and-extraction-configurations',
    'https://help.splunk.com/en/data-management/get-data-in/get-data-into-splunk-enterprise/9.4/configure-event-processing/override-source-and-extraction-configurations',
    'https://help.splunk.com/en/splunk-enterprise/get-started/get-data-in/9.4/set-source-types/override-source-and-extraction-configurations',
    'https://help.splunk.com/en/splunk-enterprise/get-started/get-data-in/9.4/configure-event-processing/override-source-and-extraction-configurations',
  ]],
  ['parse-data-using-data-preview', 'Enterprise Admin / Parsing Phase and Data', [
    'https://help.splunk.com/en/splunk-enterprise/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/use-data-preview-to-configure-event-processing',
    'https://help.splunk.com/en/data-management/get-data-in/get-data-into-splunk-enterprise/9.4/configure-event-processing/use-data-preview-to-configure-event-processing',
    'https://help.splunk.com/en/splunk-enterprise/get-started/get-data-in/9.4/configure-event-processing/use-data-preview',
    'https://help.splunk.com/en/splunk-enterprise/get-started/get-data-in/9.4/configure-event-processing/use-data-preview-to-configure-event-processing',
  ]],
  ['how-splunk-enterprise-formats-multiline-events', 'Enterprise Admin / Parsing Phase and Data', [
    'https://help.splunk.com/en/splunk-enterprise/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/how-splunk-enterprise-handles-multiline-events',
    'https://help.splunk.com/en/data-management/get-data-in/get-data-into-splunk-enterprise/9.4/configure-event-processing/how-splunk-enterprise-formats-multiline-events',
    'https://help.splunk.com/en/splunk-enterprise/get-started/get-data-in/9.4/configure-event-processing/how-splunk-enterprise-formats-multiline-events',
    'https://help.splunk.com/en/splunk-enterprise/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/about-event-boundaries',
  ]],
  ['set-up-sed-commands', 'Enterprise Admin / Manipulating Raw Data', [
    'https://help.splunk.com/en/splunk-enterprise/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/set-up-sed-commands',
    'https://help.splunk.com/en/data-management/get-data-in/get-data-into-splunk-enterprise/9.4/configure-event-processing/set-up-sed-commands',
    'https://help.splunk.com/en/splunk-enterprise/get-started/get-data-in/9.4/configure-event-processing/set-up-sed-commands',
    'https://help.splunk.com/en/splunk-enterprise/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/anonymize-data',
  ]],

  // ── Cloud Admin cert ───────────────────────────────────────────────────────
  ['splunk-cloud-platform-overview', 'Cloud Admin / Splunk Cloud Overview + Working with Support', [
    'https://help.splunk.com/en/splunk-cloud-platform/get-started/splunk-cloud-platform-overview/9.4/about-splunk-cloud-platform/about-splunk-cloud-platform',
    'https://help.splunk.com/en/splunk-cloud-platform/administer/splunk-cloud-platform-admin-manual/9.4/overview-of-splunk-cloud-platform/about-splunk-cloud-platform',
    'https://help.splunk.com/en/splunk-cloud-platform/get-started/9.4/about-splunk-cloud-platform',
  ]],
  ['get-support', 'Cloud Admin / Working with Splunk Cloud Support', [
    'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/9.4/get-help-and-support/get-help-and-support-for-splunk-enterprise',
    'https://help.splunk.com/en/splunk-cloud-platform/administer/manage-splunk-cloud-platform/9.4/contact-splunk-support/contact-splunk-support',
    'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/9.4/get-help-and-support/contact-splunk-support',
  ]],

  // ── Enterprise Architect cert ──────────────────────────────────────────────
  ['manage-an-indexer-cluster', 'Enterprise Architect / Indexer Cluster Management and Administration', [
    'https://help.splunk.com/en/data-management/manage-splunk-enterprise-indexers/9.4/manage-the-indexer-cluster/manage-an-indexer-cluster',
    'https://help.splunk.com/en/splunk-enterprise/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster/use-the-splunk-cli-to-manage-an-indexer-cluster',
    'https://help.splunk.com/en/splunk-enterprise/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster/manage-peer-nodes',
  ]],

  // ── Consultant cert ────────────────────────────────────────────────────────
  ['view-monitoring-console-overview', 'Consultant / Monitoring Console', [
    'https://help.splunk.com/en/splunk-enterprise/administer/monitor/9.4/about-the-monitoring-console/use-the-monitoring-console',
    'https://help.splunk.com/en/splunk-enterprise/administer/monitor/9.4/monitoring-console-overview/monitoring-console-overview',
    'https://help.splunk.com/en/splunk-enterprise/administer/monitor/9.4/about-the-monitoring-console/about-the-monitoring-console',
  ]],
];

// ── Run probes ────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60));
  console.log('  Splunk URL Prober');
  console.log(`  Testing ${PROBES.reduce((s, p) => s + p[2].length, 0)} candidates for ${PROBES.length} topics`);
  console.log('═'.repeat(60) + '\n');

  const found = [];
  const notFound = [];
  let totalProbed = 0;

  for (const [slug, context, candidates] of PROBES) {
    console.log(`\n[${slug}]`);
    console.log(`  Context: ${context}`);
    let winner = null;

    for (const url of candidates) {
      totalProbed++;
      const ok = await checkUrl(url);
      console.log(`  ${ok ? '✓' : '✗'} ${url}`);
      await sleep(900 + Math.floor(Math.random() * 300));
      if (ok) { winner = url; break; }
    }

    if (winner) {
      found.push({ slug, context, url: winner });
      console.log(`  → FOUND: ${winner}`);
    } else {
      notFound.push({ slug, context });
      console.log(`  → NOT FOUND — all candidates returned non-200`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log(`  RESULTS: ${found.length} found, ${notFound.length} not found`);
  console.log('═'.repeat(60));

  // ── Write patch file ──────────────────────────────────────────────────────
  const lines = [
    '# Verified URL patches — generated by probe-urls.js',
    '# All NEW URLs confirmed HTTP 200.',
    '# Apply to scripts/splunk-urls.js then run validate-urls.js to confirm.',
    '',
  ];

  if (found.length > 0) {
    lines.push('# ── VERIFIED REPLACEMENTS ────────────────────────────────');
    for (const r of found) {
      lines.push(`# [${r.context}]`);
      lines.push(`SLUG: ${r.slug}`);
      lines.push(`NEW:  ${r.url}`);
      lines.push('');
    }
  }

  if (notFound.length > 0) {
    lines.push('# ── STILL NOT FOUND — manual lookup needed ───────────────');
    for (const r of notFound) {
      lines.push(`# [${r.context}]`);
      lines.push(`# SLUG: ${r.slug}`);
      lines.push('');
    }
  }

  writeFileSync('/tmp/url-patches.txt', lines.join('\n'));
  console.log('\nPatch file → /tmp/url-patches.txt');
  console.log('Download from workflow artifacts.\n');

  if (notFound.length > 0) process.exit(1);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
