/**
 * scripts/final-probe.js
 *
 * Final targeted probe using exact book paths confirmed by sitemap analysis.
 * Tests specific candidate URLs for the 18 remaining not-found topics.
 *
 * Run: bun scripts/final-probe.js
 */

import { writeFileSync } from 'fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function check(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*' },
      redirect: 'follow',
    });
    clearTimeout(t);
    return res.status === 200;
  } catch { clearTimeout(t); return false; }
}

// ── Candidates using exact sitemap-confirmed book paths ───────────────────────
// Sitemap-confirmed books (9.4 versions exist):
//   search/search-manual
//   search/spl-search-reference  (older path: spl-search-reference/9.4)
//   get-started/search-tutorial
//   get-started/get-data-in
//   get-data-in/get-started-with-getting-data-in
//   get-data-in/metrics
//   create-dashboards-and-reports/reporting-manual
//   create-dashboards-and-reports/simple-xml-dashboards
//   create-dashboards-and-reports/dashboard-studio
//   administer/manage-users-and-security
//   administer/manage-indexers-and-indexer-clusters
//   administer/admin-manual
//   administer/monitor
//   manage-knowledge-objects/knowledge-management-manual
//   manage-knowledge-objects/pivot-manual
//   forward-and-process-data/forwarding-and-receiving-data
//   get-started/deployment-capacity-manual

const BASE = 'https://help.splunk.com/en/splunk-enterprise';
const DM   = 'https://help.splunk.com/en/data-management';

const PROBES = [

  // ── User / Creating Reports and Dashboards ─────────────────────────────────
  ['add-reports-to-dashboards', 'User / Creating Reports and Dashboards', [
    `${BASE}/get-started/search-tutorial/9.4/part-7-creating-dashboards/create-dashboards-and-panels`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/create-reports/add-a-report-to-a-dashboard`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/create-reports/create-and-edit-reports`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/build-dashboards/add-panels-to-dashboards`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/build-dashboards/about-dashboards`,
  ]],

  // ── Advanced Power User / Using Search Efficiently ─────────────────────────
  ['optimize-searches', 'APU / Using Search Efficiently + Cyber / SPL', [
    `${BASE}/search/search-manual/9.4/write-better-searches/about-writing-efficient-searches`,
    `${BASE}/search/search-manual/9.4/write-better-searches/optimize-search-performance`,
    `${BASE}/search/search-manual/9.4/write-better-searches`,
    `${BASE}/search/search-manual/9.4/search-efficiency/optimize-searches`,
    `${BASE}/search/search-manual/9.4/search-efficiency/about-search-efficiency`,
    `${BASE}/search/search-manual/9.4/search-language-fundamentals/write-better-searches`,
  ]],

  // ── Advanced Power User / Using Forms ─────────────────────────────────────
  ['about-form-inputs', 'APU / Using Forms', [
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/build-forms/about-form-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/build-forms/use-form-inputs`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/build-dashboards/about-form-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/dashboard-elements/about-form-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/build-forms`,
  ]],
  ['add-a-form-input', 'APU / Using Forms', [
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/build-forms/add-a-time-range-input`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/build-forms/add-form-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/build-forms/about-form-inputs`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/build-dashboards/add-form-inputs`,
  ]],

  // ── Advanced Power User / Adding Drilldowns ────────────────────────────────
  ['about-drilldown', 'APU / Adding Drilldowns', [
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/drilldown-and-dashboard-interactivity/use-drilldown-for-dashboard-interactivity`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/drilldown-and-dashboard-interactivity`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/build-dashboards/about-drilldown`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/add-interactivity/about-drilldown`,
  ]],

  // ── Advanced Power User / Adding Advanced Behaviors and Visualizations ─────
  ['about-visualization-types', 'APU / Adding Advanced Behaviors and Visualizations', [
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/visualize-data/about-visualizations`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/visualize-data/types-of-visualizations`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/visualize-data`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/create-charts/about-charts`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/dashboard-elements/about-visualization-types`,
  ]],

  // ── Advanced Power User / Working with Time ────────────────────────────────
  // strftime not in sitemap — use best available time reference page
  ['strftime', 'APU / Working with Time', [
    `${BASE}/search/search-manual/9.4/search-time-modifiers/use-time-modifiers-in-your-search`,
    `${BASE}/search/search-manual/9.4/search-time-modifiers/about-time-modifiers`,
    `${BASE}/search/search-manual/9.4/search-time-modifiers`,
    `${BASE}/search/spl-search-reference/9.4/time-and-date-functions/now`,
    `${BASE}/search/search-manual/9.4/search-time-modifiers/specify-time-modifiers-in-searches`,
  ]],

  // ── Enterprise Admin / Splunk Admin Basics ─────────────────────────────────
  ['administer-splunk-enterprise', 'EA / Splunk Admin Basics', [
    `${BASE}/administer/admin-manual/9.4/overview/about-the-splunk-enterprise-admin-manual`,
    `${BASE}/administer/admin-manual/9.4/overview/introduction-to-the-splunk-enterprise-admin-manual`,
    `${BASE}/administer/admin-manual/9.4/manage-configurations/about-configuration-files`,
    `${BASE}/get-started/overview/9.4/about-splunk-enterprise/about-splunk-enterprise`,
  ]],
  ['about-installing-splunk-enterprise', 'EA / Splunk Admin Basics', [
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/install-on-linux`,
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/choose-your-installation-method`,
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise`,
    `${BASE}/get-started/install-and-upgrade/9.4/plan-your-installation/installation-overview`,
  ]],

  // ── Enterprise Admin / License Management ─────────────────────────────────
  ['about-license-management', 'EA / License Management', [
    `${BASE}/get-started/install-and-upgrade/9.4/install-a-splunk-enterprise-license/about-splunk-enterprise-licenses`,
    `${BASE}/administer/admin-manual/9.4/manage-licenses/about-splunk-licenses`,
    `${BASE}/administer/admin-manual/9.4/manage-licenses/overview-of-splunk-license-types`,
    `${BASE}/administer/admin-manual/9.4/manage-licenses`,
  ]],

  // ── Enterprise Admin / Splunk Authentication Management ────────────────────
  // scim not in sitemap — use manage-users-and-security book
  ['configure-scim-user-provisioning', 'EA / Splunk Authentication Management', [
    `${BASE}/administer/manage-users-and-security/9.4/set-up-user-authentication/set-up-user-authentication-with-ldap`,
    `${BASE}/administer/manage-users-and-security/9.4/set-up-user-authentication/about-authentication-schemes`,
    `${BASE}/administer/manage-users-and-security/9.4/manage-users/about-users-and-roles`,
    `${BASE}/administer/manage-users-and-security/9.4/manage-users`,
  ]],

  // ── Enterprise Admin / Getting Data In – Staging ───────────────────────────
  ['about-getting-data-in', 'EA / Getting Data In – Staging', [
    `${BASE}/get-started/get-data-in/9.4/introduction/how-to-get-data-into-splunk-enterprise`,
    `${BASE}/get-started/get-data-in/9.4/introduction/about-getting-data-in`,
    `${BASE}/get-started/get-data-in/9.4/introduction`,
    `${BASE}/get-data-in/get-started-with-getting-data-in/9.4/introduction/how-to-get-data-into-splunk`,
    `${BASE}/get-data-in/get-started-with-getting-data-in/9.4/introduction`,
  ]],

  // ── Enterprise Admin / Fine Tuning Inputs ─────────────────────────────────
  ['override-source-and-extraction-configurations', 'EA / Fine Tuning Inputs', [
    `${BASE}/get-started/get-data-in/9.4/set-source-types/override-source-type-settings`,
    `${BASE}/get-started/get-data-in/9.4/set-source-types/override-existing-source-type-settings`,
    `${BASE}/get-started/get-data-in/9.4/configure-source-types/override-source-and-extraction-configurations`,
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/override-extraction-configurations`,
    `${BASE}/get-data-in/get-started-with-getting-data-in/9.4/configure-source-types/override-source-type-settings`,
  ]],

  // ── Enterprise Admin / Parsing Phase and Data ──────────────────────────────
  ['parse-data-using-data-preview', 'EA / Parsing Phase and Data', [
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/use-data-preview`,
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/preview-your-data`,
    `${BASE}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/use-data-preview`,
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing`,
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/about-event-processing`,
  ]],
  ['how-splunk-enterprise-formats-multiline-events', 'EA / Parsing Phase and Data', [
    // multiline not in sitemap — use closest available event processing page
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/configure-event-line-breaking`,
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/about-event-processing`,
    `${BASE}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/configure-event-line-breaking`,
    `${BASE}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/about-event-processing`,
  ]],

  // ── Enterprise Admin / Manipulating Raw Data ───────────────────────────────
  ['set-up-sed-commands', 'EA / Manipulating Raw Data', [
    // sed not in sitemap — use closest data anonymization page
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/anonymize-data`,
    `${BASE}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/anonymize-data`,
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/about-event-processing`,
    `${BASE}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/mask-sensitive-data`,
    `${BASE}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/use-regex-with-data`,
  ]],

  // ── Cloud Admin / Splunk Cloud Overview ────────────────────────────────────
  // help.splunk.com/en/splunk-cloud-platform has its own sitemap — not in enterprise
  ['splunk-cloud-platform-overview', 'Cloud Admin / Splunk Cloud Overview + Support', [
    `${BASE}/get-started/overview/9.4/about-splunk-enterprise/about-splunk-enterprise`,
    `${BASE}/get-started/overview/9.4/about-splunk-enterprise/about-splunk-enterprise-deployments`,
    'https://help.splunk.com/en/splunk-cloud-platform/administer/splunk-cloud-platform-admin-manual/9.4/overview/about-splunk-cloud-platform',
    'https://help.splunk.com/en/splunk-cloud-platform/administer/splunk-cloud-platform-admin-manual/9.4/get-started-with-splunk-cloud-platform/about-splunk-cloud-platform',
  ]],

  // ── Cloud Admin / Working with Splunk Cloud Support ────────────────────────
  ['get-support', 'Cloud Admin / Working with Splunk Cloud Support', [
    `${BASE}/get-started/overview/9.4/splunk-enterprise-resources-and-documentation/support-and-resources-for-splunk-enterprise`,
    `${BASE}/get-started/install-and-upgrade/9.4/get-started-with-splunk-enterprise/access-splunk-resources`,
    `${BASE}/get-started/install-and-upgrade/9.4/get-started-with-splunk-enterprise`,
    'https://help.splunk.com/en/splunk-cloud-platform/administer/splunk-cloud-platform-admin-manual/9.4/manage-splunk-cloud-platform/get-support-for-splunk-cloud-platform',
  ]],

  // ── Enterprise Architect / Indexer Cluster Management ─────────────────────
  ['manage-an-indexer-cluster', 'Architect / Indexer Cluster Management', [
    `${BASE}/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster/manage-indexer-cluster-peers`,
    `${BASE}/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster/use-the-manager-node-to-manage-the-indexer-cluster`,
    `${BASE}/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster/add-a-peer-node-to-a-cluster`,
    `${BASE}/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster`,
    `${DM}/manage-splunk-enterprise-indexers/9.4/manage-the-indexer-cluster/add-a-peer-node`,
  ]],

];

async function main() {
  console.log('═'.repeat(60));
  console.log('  Final URL Probe — sitemap-verified book paths');
  console.log(`  ${PROBES.reduce((s, p) => s + p[2].length, 0)} candidates for ${PROBES.length} topics`);
  console.log('═'.repeat(60) + '\n');

  const found = [];
  const notFound = [];

  for (const [slug, ctx, candidates] of PROBES) {
    process.stdout.write(`\n[${slug}]\n  ${ctx}\n`);
    let winner = null;

    for (const url of candidates) {
      const ok = await check(url);
      process.stdout.write(`  ${ok ? '✓' : '✗'} ${url}\n`);
      await sleep(800 + Math.floor(Math.random() * 300));
      if (ok) { winner = url; break; }
    }

    if (winner) {
      found.push({ slug, ctx, url: winner });
    } else {
      notFound.push({ slug, ctx });
      process.stdout.write(`  → NOT FOUND\n`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  RESULTS: ${found.length} found, ${notFound.length} not found`);
  console.log('═'.repeat(60));

  // Patch file
  const lines = [
    '# Final verified URL patches — all NEW URLs confirmed HTTP 200',
    '# Apply to scripts/splunk-urls.js',
    '',
  ];
  if (found.length > 0) {
    lines.push('# ── FOUND ──────────────────────────────────────────────────');
    for (const r of found) {
      lines.push(`# [${r.ctx}]`);
      lines.push(`SLUG: ${r.slug}`);
      lines.push(`NEW:  ${r.url}`);
      lines.push('');
    }
  }
  if (notFound.length > 0) {
    lines.push('# ── STILL NOT FOUND ────────────────────────────────────────');
    for (const r of notFound) {
      lines.push(`# [${r.ctx}] ${r.slug}`);
    }
  }

  writeFileSync('/tmp/final-patches.txt', lines.join('\n'));
  console.log('\nPatch file → /tmp/final-patches.txt\n');
  if (notFound.length > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
