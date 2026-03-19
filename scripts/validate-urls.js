/**
 * scripts/validate-urls.js
 *
 * Validates every URL in splunk-urls.js by making a real HTTP request.
 * Reports alive vs dead per cert/topic and writes a fixed splunk-urls.js
 * to /tmp/splunk-urls-fixed.js with dead URLs removed.
 *
 * Run locally:   bun scripts/validate-urls.js
 * Run in CI:     triggered via validate-urls.yml workflow
 *
 * Output:
 *   - Console report (grouped by cert)
 *   - /tmp/splunk-urls-fixed.js  — splunk-urls.js with dead URLs stripped
 *   - Exit code 0 always (dead URLs are reported, not fatal)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Inline the URL list rather than importing (avoids ES module path issues) ──
const S   = 'https://docs.splunk.com/Documentation/Splunk/9.4.2';
const SC  = 'https://docs.splunk.com/Documentation/SplunkCloud/latest';
const CIM = 'https://docs.splunk.com/Documentation/CIM/latest';
const ES  = 'https://docs.splunk.com/Documentation/ES/latest';
const H   = 'https://help.splunk.com/en/splunk-enterprise/administer';
const HDM = 'https://help.splunk.com/en/data-management';

// ── Copy of SPLUNK_DOC_URLS from splunk-urls.js ───────────────────────────────
// Keep in sync with scripts/splunk-urls.js
const SPLUNK_DOC_URLS = [
  // User
  { certType: 'User', topic: 'Splunk Basics', urls: [`${S}/SearchTutorial/WelcometotheSearchTutorial`,`${S}/SearchTutorial/Aboutthesearchapp`,`${S}/SearchTutorial/Startsearching`,`${S}/SearchTutorial/Aboutthisguide`] },
  { certType: 'User', topic: 'Basic Searching', urls: [`${S}/Search/GetstartedwithSearch`,`${S}/Search/Aboutsearchtimeranges`,`${S}/Search/Usethesearchcommand`,`${S}/SearchTutorial/Usefieldstosearch`,`${S}/Search/Saveasearch`] },
  { certType: 'User', topic: 'Using Fields in Searches', urls: [`${S}/Knowledge/Aboutfields`,`${S}/Knowledge/Addaliasestofields`,`${S}/SearchTutorial/Usefieldstosearch`,`${S}/Search/Searchwithfieldlookups`,`${S}/Knowledge/Usedefaultfields`] },
  { certType: 'User', topic: 'Search Language Fundamentals', urls: [`${S}/Search/Aboutthesearchlanguage`,`${S}/SearchReference/Search`,`${S}/Search/Usebooleansandcomparison`,`${S}/Search/Aboutsearchtimeranges`,`${S}/Search/Quickreferenceforoperators`] },
  { certType: 'User', topic: 'Using Basic Transforming Commands', urls: [`${S}/SearchReference/Stats`,`${S}/SearchReference/Chart`,`${S}/SearchReference/Timechart`,`${S}/SearchReference/Top`,`${S}/SearchReference/Rare`,`${S}/SearchReference/Table`,`${S}/SearchReference/Sort`] },
  { certType: 'User', topic: 'Creating Reports and Dashboards', urls: [`${S}/Report/Aboutreports`,`${S}/Report/Createandeditreports`,`${S}/Viz/PanelreferenceforSimplifiedXML`,`${S}/Report/Addreportstodashboards`,`${S}/Viz/Aboutdashboards`] },
  { certType: 'User', topic: 'Creating and Using Lookups', urls: [`${S}/Knowledge/Aboutlookupsandfieldactions`,`${S}/Knowledge/Makeyourlookupautomatic`,`${S}/Knowledge/DefineandsharelookupsinSplunkWeb`,`${S}/Knowledge/Definesearchtimelookupsforfields`] },
  { certType: 'User', topic: 'Creating Scheduled Reports and Alerts', urls: [`${S}/Alert/Aboutalerts`,`${S}/Report/Schedulereports`,`${S}/Alert/Definescheduledalerts`,`${S}/Alert/Alertexamples`] },
  // Power User
  { certType: 'Power User', topic: 'Using Transforming Commands for Visualizations', urls: [`${S}/SearchReference/Stats`,`${S}/SearchReference/Chart`,`${S}/SearchReference/Timechart`,`${S}/SearchReference/Eval`] },
  { certType: 'Power User', topic: 'Filtering and Formatting Results', urls: [`${S}/SearchReference/Eval`,`${S}/SearchReference/Where`,`${S}/SearchReference/Fieldformat`,`${S}/SearchReference/Rex`] },
  { certType: 'Power User', topic: 'Correlating Events', urls: [`${S}/SearchReference/Transaction`,`${S}/Search/Abouttransactions`,`${S}/SearchReference/Join`,`${S}/SearchReference/Appendcols`] },
  { certType: 'Power User', topic: 'Creating and Managing Fields', urls: [`${S}/Knowledge/Aboutfields`,`${S}/Knowledge/Managefields`,`${S}/Knowledge/Definedfieldextractions`] },
  { certType: 'Power User', topic: 'Creating Field Aliases and Calculated Fields', urls: [`${S}/Knowledge/Addaliasestofields`,`${S}/Knowledge/definecalcfields`] },
  { certType: 'Power User', topic: 'Creating Tags and Event Types', urls: [`${S}/Knowledge/Abouttagsandaliases`,`${S}/Knowledge/Defineeventtypes`,`${S}/Knowledge/Tageventtypes`] },
  { certType: 'Power User', topic: 'Creating and Using Macros', urls: [`${S}/Knowledge/Definesearchmacros`,`${S}/Knowledge/Usesearchmacros`] },
  { certType: 'Power User', topic: 'Creating and Using Workflow Actions', urls: [`${S}/Knowledge/CreateworkflowactionsinSplunkWeb`,`${S}/Knowledge/Aboutworkflowactions`] },
  { certType: 'Power User', topic: 'Creating Data Models', urls: [`${S}/Knowledge/Aboutdatamodels`,`${S}/Knowledge/Buildadatamodel`,`${S}/Knowledge/Pivotdatamodeldata`] },
  { certType: 'Power User', topic: 'Using the Common Information Model (CIM)', urls: [`${CIM}/User/Overview`,`${CIM}/User/UsetheCIM`,`${CIM}/User/Findthecommoninformationmodel`] },
  // Advanced Power User
  { certType: 'Advanced Power User', topic: 'Exploring Statistical Commands', urls: [`${S}/SearchReference/Stats`,`${S}/SearchReference/Eventstats`,`${S}/SearchReference/Streamstats`] },
  { certType: 'Advanced Power User', topic: 'Exploring eval Command Functions', urls: [`${S}/SearchReference/Eval`,`${S}/SearchReference/CommonEvalFunctions`] },
  { certType: 'Advanced Power User', topic: 'Exploring Lookups', urls: [`${S}/Knowledge/Aboutlookupsandfieldactions`,`${S}/Knowledge/DefineandsharelookupsinSplunkWeb`] },
  { certType: 'Advanced Power User', topic: 'Exploring Alerts', urls: [`${S}/Alert/Aboutalerts`,`${S}/Alert/Definescheduledalerts`] },
  { certType: 'Advanced Power User', topic: 'Advanced Field Creation and Management', urls: [`${S}/Knowledge/Definedfieldextractions`,`${S}/Knowledge/definecalcfields`] },
  { certType: 'Advanced Power User', topic: 'Working with Self-Describing Data and Files', urls: [`${S}/Data/Inputsettingsreference`,`${S}/Knowledge/Aboutfields`] },
  { certType: 'Advanced Power User', topic: 'Advanced Search Macros', urls: [`${S}/Knowledge/Definesearchmacros`,`${S}/Knowledge/Usesearchmacros`] },
  { certType: 'Advanced Power User', topic: 'Using Acceleration Options: Reports & Summary Indexing', urls: [`${S}/Report/Acceleratereports`,`${S}/Knowledge/Usesummaryindexing`] },
  { certType: 'Advanced Power User', topic: 'Using Acceleration Options: Data Models & tsidx', urls: [`${S}/Knowledge/Acceleratedatamodels`,`${S}/Knowledge/Aboutdatamodels`] },
  { certType: 'Advanced Power User', topic: 'Using Search Efficiently', urls: [`${S}/Search/Writebettersearches`,`${S}/Search/Optimizesearches`] },
  { certType: 'Advanced Power User', topic: 'More Search Tuning', urls: [`${S}/Search/Optimizesearches`,`${S}/Search/Writebettersearches`] },
  { certType: 'Advanced Power User', topic: 'Manipulating and Filtering Data', urls: [`${S}/SearchReference/Eval`,`${S}/SearchReference/Rex`,`${S}/SearchReference/Regex`,`${S}/SearchReference/Where`] },
  { certType: 'Advanced Power User', topic: 'Working with Multivalued Fields', urls: [`${S}/SearchReference/Makemv`,`${S}/SearchReference/Mvexpand`,`${S}/SearchReference/Mvcombine`] },
  { certType: 'Advanced Power User', topic: 'Using Advanced Transactions', urls: [`${S}/SearchReference/Transaction`,`${S}/Search/Abouttransactions`] },
  { certType: 'Advanced Power User', topic: 'Working with Time', urls: [`${S}/Search/Aboutsearchtimeranges`,`${S}/SearchReference/Strftime`] },
  { certType: 'Advanced Power User', topic: 'Using Subsearches', urls: [`${S}/Search/Aboutsubsearches`,`${S}/SearchReference/Appendcols`] },
  { certType: 'Advanced Power User', topic: 'Creating a Prototype', urls: [`${S}/Viz/Aboutdashboards`,`${S}/Viz/PanelreferenceforSimplifiedXML`] },
  { certType: 'Advanced Power User', topic: 'Using Forms', urls: [`${S}/Viz/Aboutforminputs`,`${S}/Viz/Addaforminput`] },
  { certType: 'Advanced Power User', topic: 'Improving Performance', urls: [`${S}/Search/Optimizesearches`,`${S}/Search/Writebettersearches`] },
  { certType: 'Advanced Power User', topic: 'Customizing Dashboards', urls: [`${S}/Viz/Aboutdashboards`,`${S}/Viz/PanelreferenceforSimplifiedXML`] },
  { certType: 'Advanced Power User', topic: 'Adding Drilldowns', urls: [`${S}/Viz/Adddrilldownstodashboardpanels`,`${S}/Viz/Aboutdrilldown`] },
  { certType: 'Advanced Power User', topic: 'Adding Advanced Behaviors and Visualizations', urls: [`${S}/Viz/Aboutvisualizationtypes`,`${S}/Viz/Adddrilldownstodashboardpanels`] },
  // Enterprise Admin
  { certType: 'Enterprise Admin', topic: 'Splunk Admin Basics', urls: [`${S}/Admin/Aboutsplunkadministration`,`${S}/Admin/Adminsplunkenterprise`] },
  { certType: 'Enterprise Admin', topic: 'License Management', urls: [`https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/9.4/install-a-splunk-enterprise-license/about-splunk-enterprise-licenses`,`${S}/Admin/Aboutlicensemanagement`] },
  { certType: 'Enterprise Admin', topic: 'Splunk Configuration Files', urls: [`${S}/Admin/Aboutconfigurationfiles`,`${S}/Admin/Wheretofindtheconfigurationfiles`,`${HDM}/splunk-enterprise-admin-manual/9.4/administer-splunk-enterprise-with-configuration-files/configuration-file-precedence`] },
  { certType: 'Enterprise Admin', topic: 'Splunk Indexes', urls: [`${S}/Indexer/Aboutindexesandindexers`,`${S}/Indexer/Setupmultipleindexes`,`${HDM}/manage-splunk-enterprise-indexers/9.4/manage-index-storage/configure-index-storage`] },
  { certType: 'Enterprise Admin', topic: 'Splunk User Management', urls: [`${S}/Security/Addandeditusers`,`${S}/Security/Aboutuserauthentication`] },
  { certType: 'Enterprise Admin', topic: 'Splunk Authentication Management', urls: [`${S}/Security/Setupauthenticationwithldap`,`${S}/Security/Configurescimprovisioning`] },
  { certType: 'Enterprise Admin', topic: 'Getting Data In', urls: [`${S}/Data/WhatSplunkcanmonitor`,`${S}/Data/Usingforwardingagents`] },
  { certType: 'Enterprise Admin', topic: 'Distributed Search', urls: [`${S}/DistSearch/Whatisdistributedsearch`,`${H}/distributed-search/9.4/deploy-distributed-search/system-requirements-and-other-deployment-considerations-for-distributed-search`,`${S}/DistSearch/Configurethedeployment`] },
  { certType: 'Enterprise Admin', topic: 'Getting Data In – Staging', urls: [`${S}/Forwarding/Typesofforwarders`,`${S}/Data/Dataintegritychecksummary`] },
  { certType: 'Enterprise Admin', topic: 'Configuring Forwarders', urls: [`https://docs.splunk.com/Documentation/Forwarder/9.4.2/Forwarder/Abouttheuniversalforwarder`,`${S}/Forwarding/Aboutforwardingandreceivingdata`,`${S}/Forwarding/Configureforwardingwithoutputs.conf`] },
  { certType: 'Enterprise Admin', topic: 'Forwarder Management', urls: [`${S}/Updating/Aboutdeploymentserver`,`${S}/Updating/Configuredeploymentclients`] },
  { certType: 'Enterprise Admin', topic: 'Monitor Inputs', urls: [`${S}/Data/MonitorfilesanddirectorieswithSplunkWeb`,`${S}/Data/Monitorfilesanddirectories`] },
  { certType: 'Enterprise Admin', topic: 'Network and Scripted Inputs', urls: [`${S}/Data/Monitornetworkports`,`${S}/Data/Getdatafromscripts`] },
  { certType: 'Enterprise Admin', topic: 'Agentless Inputs', urls: [`${S}/Data/UsetheHTTPEventCollector`,`${S}/Data/HowSplunkEnterprisehandlesyourdata`] },
  { certType: 'Enterprise Admin', topic: 'Fine Tuning Inputs', urls: [`${S}/Data/Overridesourceandextractionconfigurations`,`${S}/Data/Editinputs.conf`] },
  { certType: 'Enterprise Admin', topic: 'Parsing Phase and Data', urls: [`${S}/Data/Parsedatapreview`,`${S}/Data/Howsplunkformatsmultilineevents`] },
  { certType: 'Enterprise Admin', topic: 'Manipulating Raw Data', urls: [`${S}/Data/Anonymizedatawithmasking`,`${S}/Data/Setupsedcommands`] },
  // Cloud Admin
  { certType: 'Cloud Admin', topic: 'Splunk Cloud Overview', urls: [`${SC}/Admin/SplunkCloudOverview`,`${SC}/Admin/GettingStarted`] },
  { certType: 'Cloud Admin', topic: 'Index Management', urls: [`${SC}/Admin/ManageIndexes`,`${SC}/Admin/Createandmanageindexes`] },
  { certType: 'Cloud Admin', topic: 'User Authentication and Authorization', urls: [`${SC}/Security/Setupauthenticationwithldap`,`${SC}/Security/Rolesandcapabilities`] },
  { certType: 'Cloud Admin', topic: 'Splunk Configuration Files', urls: [`${SC}/Admin/Aboutconfigurationfiles`,`${SC}/Admin/ManageCloudConfiguration`] },
  { certType: 'Cloud Admin', topic: 'Getting Data in Cloud', urls: [`${SC}/Admin/MonitorInputs`,`${SC}/Admin/ConfigureInputsFromSplunkWeb`] },
  { certType: 'Cloud Admin', topic: 'Forwarder Management', urls: [`${SC}/Admin/ConfigHeavyForwarder`,`${SC}/Admin/MonitorInputs`] },
  { certType: 'Cloud Admin', topic: 'Monitor Inputs', urls: [`${SC}/Admin/MonitorInputs`,`${SC}/Admin/ConfigureInputsFromSplunkWeb`] },
  { certType: 'Cloud Admin', topic: 'Network and Other Inputs', urls: [`${SC}/Admin/Monitornetworkports`,`${SC}/Admin/UsetheHTTPEventCollector`] },
  { certType: 'Cloud Admin', topic: 'Fine-tuning Inputs', urls: [`${SC}/Admin/Editinputs`,`${SC}/Admin/Overridesource`] },
  { certType: 'Cloud Admin', topic: 'Parsing Phase and Data Preview', urls: [`${SC}/Admin/Parsedatapreview`,`${SC}/Admin/Howsplunkformatsmultilineevents`] },
  { certType: 'Cloud Admin', topic: 'Manipulating Raw Data', urls: [`${SC}/Admin/Anonymizedata`,`${SC}/Admin/Setupsedcommands`] },
  { certType: 'Cloud Admin', topic: 'Installing and Managing Apps', urls: [`${SC}/Admin/SelfServiceAppInstall`,`${SC}/Admin/PrivateApps`] },
  { certType: 'Cloud Admin', topic: 'Working with Splunk Cloud Support', urls: [`${SC}/Admin/WorkWithSupport`,`${SC}/Admin/Diagnostictools`] },
  // Enterprise Architect
  { certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Index Design', urls: [`${S}/Indexer/Setupmultipleindexes`,`${S}/Indexer/Aboutindexesandindexers`] },
  { certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Resource Planning', urls: [`${S}/Capacity/Overviewofcapacityplanning`,`${S}/Capacity/Referencehardware`] },
  { certType: 'Enterprise Architect', topic: 'Large-scale Splunk Deployment Overview', urls: [`${S}/Capacity/Overviewofcapacityplanning`,`${S}/Indexer/Basicclusterarchitecture`] },
  { certType: 'Enterprise Architect', topic: 'Forwarder and Deployment Best Practices', urls: [`${S}/Updating/Aboutdeploymentserver`,`${S}/Forwarding/Aboutforwardingandreceivingdata`] },
  { certType: 'Enterprise Architect', topic: 'Single-site Indexer Cluster', urls: [`${S}/Indexer/Aboutclusters`,`${S}/Indexer/Basicclusterarchitecture`,`${H}/manage-indexers-and-indexer-clusters/9.4/configure-the-manager-node/configure-the-manager-node-with-server.conf`] },
  { certType: 'Enterprise Architect', topic: 'Multisite Indexer Cluster', urls: [`${S}/Indexer/Multisiteclusters`,`${S}/Indexer/Migratetomultisite`] },
  { certType: 'Enterprise Architect', topic: 'Indexer Cluster Management and Administration', urls: [`${S}/Indexer/Manageanindexercluster`,`${H}/manage-indexers-and-indexer-clusters/9.4/configure-the-indexer-cluster/indexer-cluster-configuration-overview`] },
  { certType: 'Enterprise Architect', topic: 'Search Head Cluster', urls: [`${S}/DistSearch/AboutSHC`,`${H}/distributed-search/9.4/deploy-search-head-clustering/deploy-a-search-head-cluster`] },
  { certType: 'Enterprise Architect', topic: 'Search Head Cluster Management and Administration', urls: [`${S}/DistSearch/SHCarchitecture`,`${H}/distributed-search/9.4/deploy-search-head-clustering/deploy-a-search-head-cluster`] },
  // O11y
  { certType: 'O11y Metrics User', topic: 'Get Metrics In with OpenTelemetry', urls: [`${S}/Metrics/Overview`,`${S}/Metrics/GetMetricsIntoSplunk`] },
  { certType: 'O11y Metrics User', topic: 'Metrics Concepts', urls: [`${S}/Metrics/Overview`,`${S}/Metrics/GetMetricsIntoSplunk`] },
  { certType: 'O11y Metrics User', topic: 'Introduction to Alerting on Metrics with Detectors', urls: [`${S}/Alert/Aboutalerts`,`${S}/Alert/Definescheduledalerts`] },
  // Cybersecurity
  { certType: 'Cybersecurity Defense Engineer', topic: 'SPL and Efficient Searching', urls: [`${S}/Search/Writebettersearches`,`${S}/Search/Optimizesearches`] },
  { certType: 'Cybersecurity Defense Engineer', topic: 'Investigation, Event Handling, Correlation, and Risk', urls: [`${ES}/User/Aboutnotableevents`,`${ES}/User/Triagenotableevents`] },
  { certType: 'Cybersecurity Defense Engineer', topic: 'Threat Detection and Investigation', urls: [`${ES}/User/Useriskoverview`,`${ES}/User/Investigatethreat`] },
  // Consultant
  { certType: 'Consultant', topic: 'Deploying Splunk', urls: [`${S}/Installation/Systemrequirements`,`${S}/Admin/Adminsplunkenterprise`] },
  { certType: 'Consultant', topic: 'Monitoring Console', urls: [`${S}/DMC/AbouttheDMC`,`${S}/DMC/ViewDMCoverview`] },
  { certType: 'Consultant', topic: 'Access and Roles', urls: [`${S}/Security/Addandeditusers`,`${S}/Security/Aboutuserauthentication`] },
  { certType: 'Consultant', topic: 'Data Collection', urls: [`${S}/Data/WhatSplunkcanmonitor`,`${S}/Data/Usingforwardingagents`] },
  { certType: 'Consultant', topic: 'Indexing', urls: [`${S}/Indexer/Aboutindexesandindexers`,`${S}/Indexer/Setupmultipleindexes`] },
  { certType: 'Consultant', topic: 'Search', urls: [`${S}/Search/Writebettersearches`,`${S}/DistSearch/Whatisdistributedsearch`] },
  { certType: 'Consultant', topic: 'Configuration Management', urls: [`${S}/Admin/Aboutconfigurationfiles`,`${S}/Updating/Aboutdeploymentserver`] },
  { certType: 'Consultant', topic: 'Indexer Clustering', urls: [`${S}/Indexer/Aboutclusters`,`${H}/manage-indexers-and-indexer-clusters/9.4/configure-the-indexer-cluster/indexer-cluster-configuration-overview`] },
  { certType: 'Consultant', topic: 'Search Head Clustering', urls: [`${S}/DistSearch/AboutSHC`,`${S}/DistSearch/SHCarchitecture`] },
];

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
  // Deduplicate URLs globally — same URL may appear in multiple cert/topic entries
  const allUrls = new Map(); // url → [{ certType, topic }]
  for (const doc of SPLUNK_DOC_URLS) {
    for (const url of doc.urls) {
      if (!allUrls.has(url)) allUrls.set(url, []);
      allUrls.get(url).push({ certType: doc.certType, topic: doc.topic });
    }
  }

  const uniqueUrls = [...allUrls.keys()];
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Splunk URL Validator`);
  console.log(`  ${uniqueUrls.length} unique URLs across ${SPLUNK_DOC_URLS.length} cert/topic entries`);
  console.log(`${'═'.repeat(60)}\n`);

  // ── Check all URLs with a polite delay ───────────────────────────────────
  const results = new Map(); // url → { status, ok }
  let checked = 0;

  for (const url of uniqueUrls) {
    const result = await checkUrl(url);
    results.set(url, result);
    checked++;

    const icon = result.ok ? '✓' : '✗';
    const statusStr = result.status === 0 ? `TIMEOUT/ERR` : `HTTP ${result.status}`;
    console.log(`[${checked}/${uniqueUrls.length}] ${icon} ${statusStr.padEnd(12)} ${url}`);

    // Polite delay — 1s + small jitter to avoid rate limiting during validation
    await sleep(1000 + Math.floor(Math.random() * 500));
  }

  // ── Summary report grouped by cert ───────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  RESULTS BY CERT');
  console.log(`${'═'.repeat(60)}`);

  const deadUrls = new Set();

  const byCert = {};
  for (const doc of SPLUNK_DOC_URLS) {
    if (!byCert[doc.certType]) byCert[doc.certType] = [];
    byCert[doc.certType].push(doc);
  }

  let totalAlive = 0, totalDead = 0;

  for (const [cert, docs] of Object.entries(byCert)) {
    console.log(`\n  ── ${cert} ──`);
    for (const doc of docs) {
      const dead = doc.urls.filter(u => !results.get(u)?.ok);
      const alive = doc.urls.filter(u => results.get(u)?.ok);
      const icon = dead.length === 0 ? '✓' : dead.length === doc.urls.length ? '✗' : '⚠';
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

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Total unique URLs checked: ${uniqueUrls.length}`);
  console.log(`  ✓ Alive: ${totalAlive}`);
  console.log(`  ✗ Dead:  ${totalDead}`);

  if (deadUrls.size === 0) {
    console.log('\n  All URLs are alive — no changes needed!');
  } else {
    console.log(`\n  Dead URLs to fix (${deadUrls.size}):`);
    for (const u of deadUrls) {
      console.log(`    ${u}`);
    }
  }

  // ── Write fixed splunk-urls.js with dead URLs removed ────────────────────
  // We strip dead URLs from each entry. If ALL urls in an entry are dead,
  // we keep the entry but replace with a comment so it's obvious what needs fixing.

  const fixedDocs = SPLUNK_DOC_URLS.map(doc => {
    const liveUrls = doc.urls.filter(u => results.get(u)?.ok);
    return { ...doc, urls: liveUrls, removedCount: doc.urls.length - liveUrls.length };
  });

  // ── Generate the fixed file content ──────────────────────────────────────
  const lines = [];
  lines.push(`/**`);
  lines.push(` * scripts/splunk-urls.js — AUTO-GENERATED BY validate-urls.js`);
  lines.push(` * Dead URLs have been removed. Entries with 0 surviving URLs are marked TODO.`);
  lines.push(` * Re-run validate-urls.js after manually fixing TODO entries.`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`const S   = 'https://docs.splunk.com/Documentation/Splunk/9.4.2';`);
  lines.push(`const SC  = 'https://docs.splunk.com/Documentation/SplunkCloud/latest';`);
  lines.push(`const CIM = 'https://docs.splunk.com/Documentation/CIM/latest';`);
  lines.push(`const ES  = 'https://docs.splunk.com/Documentation/ES/latest';`);
  lines.push(`const H   = 'https://help.splunk.com/en/splunk-enterprise/administer';`);
  lines.push(`const HDM = 'https://help.splunk.com/en/data-management';`);
  lines.push(``);
  lines.push(`export const SPLUNK_DOC_URLS = [`);

  let currentCert = '';
  for (const doc of fixedDocs) {
    if (doc.certType !== currentCert) {
      currentCert = doc.certType;
      lines.push(``);
      lines.push(`  // ── ${currentCert} ` + '─'.repeat(Math.max(0, 55 - currentCert.length)));
    }

    if (doc.urls.length === 0) {
      lines.push(`  // TODO: all URLs dead for [${doc.certType}] ${doc.topic} — find replacements`);
      lines.push(`  // { certType: '${doc.certType}', topic: '${doc.topic}', urls: [] },`);
    } else {
      const urlLines = doc.urls.map((u, i) =>
        `    '${u}'${i < doc.urls.length - 1 ? ',' : ''}`
      ).join('\n');
      const removedNote = doc.removedCount > 0 ? ` // ${doc.removedCount} dead URL(s) removed` : '';
      lines.push(`  {${removedNote}`);
      lines.push(`    certType: '${doc.certType}', topic: '${doc.topic}',`);
      lines.push(`    urls: [`);
      lines.push(urlLines);
      lines.push(`    ]`);
      lines.push(`  },`);
    }
  }

  lines.push(`];`);
  lines.push(``);
  lines.push(`export const splunkDocs = SPLUNK_DOC_URLS;`);

  const fixedContent = lines.join('\n');
  writeFileSync('/tmp/splunk-urls-fixed.js', fixedContent);
  console.log(`\n  Fixed file written to: /tmp/splunk-urls-fixed.js`);
  console.log(`  Download from the workflow artifacts after the run completes.`);
  console.log(`\n${'═'.repeat(60)}\n`);
}

main().catch(err => {
  console.error('Validator failed:', err);
  process.exit(1);
});
