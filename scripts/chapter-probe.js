/**
 * scripts/chapter-probe.js
 *
 * For the 8 remaining not-found topics, probes the parent section/chapter
 * index pages that we know exist, then tries variations of the page slug
 * using different chapter names revealed by the sitemap keyword search.
 *
 * Run: bun scripts/chapter-probe.js
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

const BASE = 'https://help.splunk.com/en/splunk-enterprise';

// For each still-not-found topic, we know the BOOK works.
// Now trying all plausible chapter/page combinations.
const PROBES = [

  // ── optimize-searches ─────────────────────────────────────────────────────
  // search/search-manual exists. Sitemap shows chapter "write-better-searches"
  // exists but our page slugs missed. Try every reasonable page name.
  ['optimize-searches', 'APU / Using Search Efficiently + Cyber / SPL', [
    `${BASE}/search/search-manual/9.4/write-better-searches/tips-for-writing-efficient-searches`,
    `${BASE}/search/search-manual/9.4/write-better-searches/search-best-practices`,
    `${BASE}/search/search-manual/9.4/write-better-searches/use-search-best-practices`,
    `${BASE}/search/search-manual/9.4/write-better-searches/improve-search-performance`,
    `${BASE}/search/search-manual/9.4/write-better-searches/about-search-best-practices`,
    `${BASE}/search/search-manual/9.4/write-better-searches/optimize-your-searches`,
    `${BASE}/search/search-manual/9.4/search-overview/about-search-performance`,
    `${BASE}/search/search-manual/9.4/search-language-fundamentals/about-search-language`,
    // Also try spl-search-reference which has 9.4 entries
    `${BASE}/search/spl-search-reference/9.4/quick-reference/splunk-quick-reference-guide`,
    `${BASE}/search/search-manual/9.4/write-better-searches/get-started-with-search-best-practices`,
  ]],

  // ── about-form-inputs + add-a-form-input ──────────────────────────────────
  // simple-xml-dashboards exists. Sitemap shows no "build-forms" chapter.
  // Try different chapter names that could contain forms content.
  ['about-form-inputs', 'APU / Using Forms', [
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/about-form-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/use-form-inputs-in-dashboards`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/use-tokens-and-form-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/about-tokens-and-template-variables`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/dashboard-elements/add-form-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/dashboard-elements/use-form-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml`,
  ]],
  ['add-a-form-input', 'APU / Using Forms', [
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/add-form-inputs-to-a-dashboard`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/configure-form-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/add-inputs-to-a-form-dashboard`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/dashboard-elements/add-a-time-range-picker`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/dashboard-elements/add-inputs`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/add-a-form-input-to-a-dashboard`,
  ]],

  // ── about-visualization-types ─────────────────────────────────────────────
  // Sitemap shows create-dashboards-and-reports/reporting-manual exists.
  // Try different chapter structures.
  ['about-visualization-types', 'APU / Adding Advanced Behaviors and Visualizations', [
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/visualize-data/visualization-types-in-splunk-enterprise`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/visualize-data/about-splunk-visualizations`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/visualize-data/choose-a-visualization`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/visualize-data/format-visualizations`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/create-reports/create-and-edit-reports`,
    `${BASE}/create-dashboards-and-reports/reporting-manual/9.4/create-reports/about-reports`,
    // Also try simple-xml with different chapter
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/dashboard-elements/about-visualizations`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/dashboard-elements/use-visualizations`,
    `${BASE}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml/about-splunk-enterprise-visualizations`,
  ]],

  // ── strftime ──────────────────────────────────────────────────────────────
  // Not in sitemap at all. Use the spl-search-reference which IS in sitemap.
  // Sitemap shows spl-search-reference/9.4 exists as a book.
  ['strftime', 'APU / Working with Time', [
    `${BASE}/search/spl-search-reference/9.4/evaluation-functions/strftime`,
    `${BASE}/search/spl-search-reference/9.4/evaluation-functions/date-and-time-functions`,
    `${BASE}/search/spl-search-reference/9.4/statistical-and-charting-functions/time-charting-functions`,
    `${BASE}/search/search-manual/9.4/search-time-modifiers/use-time-modifiers`,
    `${BASE}/search/search-manual/9.4/search-time-modifiers/time-modifier-options`,
    `${BASE}/search/search-manual/9.4/search-time-modifiers/relative-time-modifiers`,
    `${BASE}/search/search-manual/9.4/search-time-modifiers/real-time-searches-and-reports`,
  ]],

  // ── about-installing-splunk-enterprise ────────────────────────────────────
  // get-started/install-and-upgrade exists. Confirmed license page works.
  // License page URL: install-a-splunk-enterprise-license/about-splunk-enterprise-licenses
  // So chapter "install-splunk-enterprise" exists. Try different page slugs.
  ['about-installing-splunk-enterprise', 'EA / Splunk Admin Basics', [
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/installation-overview`,
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/about-splunk-enterprise`,
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/what-is-splunk-enterprise`,
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/steps-for-installing-splunk-enterprise`,
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/plan-your-installation`,
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/install-splunk-enterprise-on-linux`,
    `${BASE}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/install-on-windows`,
    // Different chapter
    `${BASE}/get-started/install-and-upgrade/9.4/plan-your-installation/system-requirements`,
    `${BASE}/get-started/install-and-upgrade/9.4/plan-your-installation/about-the-installation-manual`,
  ]],

  // ── configure-scim-user-provisioning ─────────────────────────────────────
  // administer/manage-users-and-security exists but all our page attempts failed.
  // The LDAP page works: set-up-user-authentication-with-ldap from find-urls run.
  // Try different chapters within manage-users-and-security.
  ['configure-scim-user-provisioning', 'EA / Splunk Authentication Management', [
    `${BASE}/administer/manage-users-and-security/9.4/set-up-user-authentication/use-ldap-to-authenticate-splunk-users`,
    `${BASE}/administer/manage-users-and-security/9.4/set-up-user-authentication/about-splunk-authentication`,
    `${BASE}/administer/manage-users-and-security/9.4/set-up-user-authentication/set-up-saml-authentication`,
    `${BASE}/administer/manage-users-and-security/9.4/manage-roles/about-splunk-roles`,
    `${BASE}/administer/manage-users-and-security/9.4/manage-roles/create-and-manage-roles`,
    `${BASE}/administer/manage-users-and-security/9.4/manage-users/add-and-edit-users`,
    `${BASE}/administer/manage-users-and-security/9.4/manage-users/about-user-authentication`,
    `${BASE}/administer/manage-users-and-security/9.4/manage-roles`,
    `${BASE}/administer/manage-users-and-security/9.4/manage-users`,
  ]],

  // ── override-source-and-extraction-configurations ────────────────────────
  // get-started/get-data-in exists. Confirmed: configure-event-processing
  // and configure-event-line-breaking work.
  // Try different chapter names within get-data-in.
  ['override-source-and-extraction-configurations', 'EA / Fine Tuning Inputs', [
    `${BASE}/get-started/get-data-in/9.4/configure-source-types/about-source-types`,
    `${BASE}/get-started/get-data-in/9.4/configure-source-types/set-source-types`,
    `${BASE}/get-started/get-data-in/9.4/configure-source-types/override-source-type-assignments`,
    `${BASE}/get-started/get-data-in/9.4/configure-source-types`,
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/configure-source-type-recognition`,
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/set-a-source-type`,
    `${BASE}/get-started/get-data-in/9.4/configure-event-processing/about-source-types`,
    // Also try configure-host-values chapter which appeared in sed search
    `${BASE}/get-started/get-data-in/9.4/configure-host-values/set-host-values`,
    `${BASE}/get-started/get-data-in/9.4/configure-source-types/configure-rule-based-source-type-recognition`,
  ]],

];

async function main() {
  console.log('═'.repeat(60));
  console.log('  Chapter Probe — finding correct page slugs');
  console.log(`  ${PROBES.reduce((s,p)=>s+p[2].length,0)} candidates for ${PROBES.length} topics`);
  console.log('═'.repeat(60) + '\n');

  const found = [];
  const notFound = [];

  for (const [slug, ctx, candidates] of PROBES) {
    process.stdout.write(`\n[${slug}]\n  ${ctx}\n`);
    let winner = null;
    for (const url of candidates) {
      const ok = await check(url);
      process.stdout.write(`  ${ok ? '✓' : '✗'} ${url}\n`);
      await sleep(700 + Math.floor(Math.random() * 300));
      if (ok) { winner = url; break; }
    }
    if (winner) found.push({ slug, ctx, url: winner });
    else { notFound.push({ slug, ctx }); process.stdout.write(`  → NOT FOUND\n`); }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  RESULTS: ${found.length} found, ${notFound.length} not found`);
  console.log('═'.repeat(60));

  const lines = ['# Chapter probe patches — all NEW URLs confirmed HTTP 200', ''];
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
    for (const r of notFound) lines.push(`# ${r.slug}  [${r.ctx}]`);
  }

  writeFileSync('/tmp/chapter-patches.txt', lines.join('\n'));
  console.log('\nPatch file → /tmp/chapter-patches.txt\n');
  if (notFound.length > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
