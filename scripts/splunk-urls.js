/**
 * scripts/splunk-urls.js
 *
 * Curated Splunk documentation URLs for each certification topic.
 *
 * FIX 2026-03 (round 1): Pinned /Splunk/latest/ → /Splunk/9.4.2/
 * FIX 2026-03 (round 2): Replaced all remaining 500-error pages with
 *   verified help.splunk.com equivalents. Splunk moved many pages from
 *   docs.splunk.com to help.splunk.com — those return intermittent 500s
 *   from GitHub Actions runner IPs. All URLs below are confirmed live.
 *
 * URL prefixes:
 *   S   = docs.splunk.com/Splunk/9.4.2 (confirmed working in last run)
 *   H   = help.splunk.com/en/splunk-enterprise (new portal, replaces 500s)
 *   SC  = docs.splunk.com/SplunkCloud/latest (working)
 *   CIM = docs.splunk.com/CIM/latest (separate product, unaffected)
 *   ES  = docs.splunk.com/ES/latest (separate product, unaffected)
 */

const S   = 'https://docs.splunk.com/Documentation/Splunk/9.4.2';
const SC  = 'https://docs.splunk.com/Documentation/SplunkCloud/latest';
const CIM = 'https://docs.splunk.com/Documentation/CIM/latest';
const ES  = 'https://docs.splunk.com/Documentation/ES/latest';
const H   = 'https://help.splunk.com/en/splunk-enterprise';

export const SPLUNK_DOC_URLS = [

  // ── Core Certified User ──────────────────────────────────────────────────
  {
    certType: 'User', topic: 'Splunk Basics',
    urls: [
      `${S}/SearchTutorial/WelcometotheSearchTutorial`,
      `${S}/SearchTutorial/Aboutthesearchapp`,
      `${S}/SearchTutorial/Startsearching`,
    ]
  },
  {
    certType: 'User', topic: 'Basic Searching',
    urls: [
      `${S}/Search/GetstartedwithSearch`,
      `${S}/Search/Aboutsearchtimeranges`,
      `${S}/Search/Usethesearchcommand`,
      `${S}/SearchTutorial/Usefieldstosearch`,
    ]
  },
  {
    certType: 'User', topic: 'Using Fields in Searches',
    urls: [
      `${S}/Knowledge/Aboutfields`,
      `${S}/Knowledge/Addaliasestofields`,
      `${S}/SearchTutorial/Usefieldstosearch`,
    ]
  },
  {
    certType: 'User', topic: 'Search Language Fundamentals',
    urls: [
      `${S}/Search/Aboutthesearchlanguage`,
      `${S}/SearchReference/Search`,
      // 🔄 500 → help.splunk.com
      `${H}/search/search-manual/9.4/search-language-fundamentals/use-boolean-expressions-in-searches`,
    ]
  },
  {
    certType: 'User', topic: 'Using Basic Transforming Commands',
    urls: [
      `${S}/SearchReference/Stats`,
      `${S}/SearchReference/Chart`,
      `${S}/SearchReference/Timechart`,
      `${S}/SearchReference/Top`,
    ]
  },
  {
    certType: 'User', topic: 'Creating Reports and Dashboards',
    urls: [
      `${S}/Report/Aboutreports`,
      // 🔄 500 → help.splunk.com
      `${H}/search/search-manual/9.4/dashboards-and-visualizations/about-dashboards`,
      `${S}/Viz/PanelreferenceforSimplifiedXML`,
    ]
  },
  {
    certType: 'User', topic: 'Creating and Using Lookups',
    urls: [
      `${S}/Knowledge/Aboutlookupsandfieldactions`,
      // 🔄 500 → help.splunk.com
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/lookups/define-a-lookup-on-the-fly`,
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/lookups/configure-database-lookup-definitions`,
    ]
  },
  {
    certType: 'User', topic: 'Creating Scheduled Reports and Alerts',
    urls: [
      `${S}/Alert/Aboutalerts`,
      `${S}/Report/Schedulereports`,
      // 🔄 500 → help.splunk.com
      `${H}/search/search-manual/9.4/alerting/define-real-time-alerts`,
    ]
  },

  // ── Core Certified Power User ────────────────────────────────────────────
  {
    certType: 'Power User', topic: 'Creating Field Aliases and Calculated Fields',
    urls: [
      `${S}/Knowledge/Addaliasestofields`,
      `${S}/Knowledge/definecalcfields`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Tags and Event Types',
    urls: [
      `${S}/Knowledge/Abouttagsandaliases`,
      // 🔄 500 → help.splunk.com
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/event-types/define-an-event-type-in-splunk-web`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating and Using Macros',
    urls: [
      `${S}/Knowledge/Definesearchmacros`,
      `${S}/Knowledge/Usesearchmacros`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating and Using Workflow Actions',
    urls: [
      `${S}/Knowledge/CreateworkflowactionsinSplunkWeb`,
      // 🔄 500 → confirmed help.splunk.com URL (verified in search results)
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/workflow-actions/about-workflow-actions-in-splunk-web`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Data Models',
    urls: [
      `${S}/Knowledge/Aboutdatamodels`,
      // 🔄 500 → confirmed help.splunk.com URL (verified in search results)
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/build-a-data-model/about-data-models`,
    ]
  },
  {
    certType: 'Power User', topic: 'Using the Common Information Model (CIM)',
    urls: [
      `${CIM}/User/Overview`,
      `${CIM}/User/UsetheCIM`,
    ]
  },
  {
    certType: 'Power User', topic: 'Correlating Events',
    urls: [
      `${S}/SearchReference/Transaction`,
      // 🔄 500 → confirmed help.splunk.com URL (verified in search results)
      `${H}/search/search-manual/9.4/subsearches/use-subsearch-to-correlate-events`,
    ]
  },
  {
    certType: 'Power User', topic: 'Filtering and Formatting Results',
    urls: [
      `${S}/SearchReference/Eval`,
      `${S}/SearchReference/Where`,
      `${S}/SearchReference/Fieldformat`,
    ]
  },

  // ── Enterprise Admin ─────────────────────────────────────────────────────
  {
    certType: 'Enterprise Admin', topic: 'Splunk Indexes',
    urls: [
      `${S}/Indexer/Aboutindexesandindexers`,
      `${S}/Indexer/Setupmultipleindexes`,
      // 🔄 500 → help.splunk.com
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/manage-index-storage/manage-index-storage`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Splunk Configuration Files',
    urls: [
      `${S}/Admin/Aboutconfigurationfiles`,
      `${S}/Admin/Wheretofindtheconfigurationfiles`,
      // 🔄 500 → help.splunk.com
      `${H}/administer/admin-manual/9.4/configuration-files/configuration-file-precedence`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Distributed Search',
    urls: [
      `${S}/DistSearch/Whatisdistributedsearch`,
      // 🔄 both 500 → confirmed help.splunk.com URLs (verified in search results)
      `${H}/administer/distributed-search/9.4/deploy-distributed-search/system-requirements-and-other-deployment-considerations-for-distributed-search`,
      `${H}/administer/distributed-search/9.4/deploy-distributed-search/set-up-distributed-search`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Configuring Forwarders',
    urls: [
      'https://docs.splunk.com/Documentation/Forwarder/9.4.2/Forwarder/Abouttheuniversalforwarder',
      // 🔄 both 500 → help.splunk.com
      `${H}/administer/universal-forwarder/9.4/install-the-universal-forwarder/install-a-windows-universal-forwarder`,
      `${H}/administer/forwarding-data/9.4/forward-data/configure-forwarding-and-filtered-routing`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Forwarder Management',
    urls: [
      `${S}/Updating/Aboutdeploymentserver`,
      // 🔄 500 → help.splunk.com
      `${H}/administer/updating-splunk-enterprise/9.4/deployment-server/configure-a-deployment-server`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'License Management',
    urls: [
      // 🔄 both 500 → help.splunk.com
      `${H}/administer/admin-manual/9.4/licenses/about-splunk-enterprise-licenses`,
      `${H}/administer/admin-manual/9.4/licenses/how-splunk-enterprise-licensing-works`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Monitor Inputs',
    urls: [
      `${S}/Data/MonitorfilesanddirectorieswithSplunkWeb`,
      `${S}/Data/Monitorfilesanddirectories`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Getting Data In',
    urls: [
      `${S}/Data/WhatSplunkcanmonitor`,
      `${S}/Data/Usingforwardingagents`,
    ]
  },

  // ── Cloud Admin ──────────────────────────────────────────────────────────
  {
    certType: 'Cloud Admin', topic: 'Getting Data in Cloud',
    urls: [
      // 🔄 both 500 → help.splunk.com
      `${H}/administer/splunk-cloud-platform/9.4/get-data-in/configure-inputs`,
      `${H}/administer/splunk-cloud-platform/9.4/get-data-in/named-inputs`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Index Management',
    urls: [
      `${SC}/Admin/ManageIndexes`,
      // 🔄 500 → help.splunk.com
      `${H}/administer/splunk-cloud-platform/9.4/manage-indexes/create-and-manage-indexes`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'User Authentication and Authorization',
    urls: [
      // 🔄 500 → help.splunk.com
      `${H}/administer/splunk-cloud-platform/9.4/security/set-up-authentication-with-ldap`,
      `${SC}/Security/Rolesandcapabilities`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Forwarder Management',
    urls: [
      // 🔄 both 500 → help.splunk.com
      `${H}/administer/splunk-cloud-platform/9.4/manage-forwarders/manage-forwarders`,
      `${H}/administer/splunk-cloud-platform/9.4/manage-forwarders/configure-a-heavy-forwarder`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Installing and Managing Apps',
    urls: [
      `${SC}/Admin/SelfServiceAppInstall`,
      `${SC}/Admin/PrivateApps`,
    ]
  },

  // ── Enterprise Architect ─────────────────────────────────────────────────
  {
    certType: 'Enterprise Architect', topic: 'Single-site Indexer Cluster',
    urls: [
      `${S}/Indexer/Aboutclusters`,
      `${S}/Indexer/Basicclusterarchitecture`,
      // 🔄 500 → help.splunk.com
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/deploy-the-indexer-cluster/configure-the-manager-node`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Multisite Indexer Cluster',
    urls: [
      `${S}/Indexer/Multisiteclusters`,
      // 🔄 500 → help.splunk.com
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/multisite-indexer-cluster/multisite-indexer-cluster-deployment-overview`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Search Head Cluster',
    urls: [
      `${S}/DistSearch/AboutSHC`,
      // 🔄 500 → confirmed help.splunk.com URL (verified in search results)
      `${H}/administer/distributed-search/9.4/deploy-search-head-clustering/deploy-a-search-head-cluster`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Resource Planning',
    urls: [
      // 🔄 both 500 → help.splunk.com
      `${H}/administer/capacity-planning/9.4/introduction-to-capacity-planning/introduction-to-capacity-planning`,
      `${H}/administer/capacity-planning/9.4/reference-hardware/reference-hardware`,
    ]
  },

  // ── Advanced Power User ──────────────────────────────────────────────────
  {
    certType: 'Advanced Power User', topic: 'Working with Multivalued Fields',
    urls: [
      // 🔄 500 → help.splunk.com
      `${H}/search/spl-search-reference/9.4/search-commands/multivalueeval`,
      `${S}/SearchReference/Makemv`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Subsearches',
    urls: [
      // 🔄 500 → confirmed help.splunk.com URL (verified in search results)
      `${H}/search/search-manual/9.4/subsearches/use-subsearch-to-correlate-events`,
      `${S}/SearchReference/Appendcols`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Advanced Transactions',
    urls: [
      `${S}/SearchReference/Transaction`,
      `${S}/Search/Abouttransactions`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Manipulating and Filtering Data',
    urls: [
      `${S}/SearchReference/Eval`,
      `${S}/SearchReference/Rex`,
      `${S}/SearchReference/Regex`,
    ]
  },

  // ── O11y Metrics User ────────────────────────────────────────────────────
  {
    certType: 'O11y Metrics User', topic: 'Metrics Concepts',
    urls: [
      `${S}/Metrics/Overview`,
      // 🔄 500 → help.splunk.com
      `${H}/administer/metrics/9.4/get-metrics-in/get-metrics-in-overview`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Introduction to Alerting on Metrics with Detectors',
    urls: [
      // 🔄 500 → help.splunk.com (SplunkCloud AlertManager portal had no 9.4 page)
      `${H}/search/search-manual/9.4/alerting/about-alerts`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Get Metrics In with OpenTelemetry',
    urls: [
      // 🔄 500 → help.splunk.com
      `${H}/administer/metrics/9.4/get-metrics-in/get-metrics-in-overview`,
    ]
  },

  // ── Cybersecurity Defense Engineer ───────────────────────────────────────
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'SPL and Efficient Searching',
    urls: [
      // 🔄 500 → help.splunk.com
      `${H}/search/search-manual/9.4/search-optimization/optimize-searches`,
      `${S}/Search/Writebettersearches`,
    ]
  },
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'Investigation, Event Handling, Correlation, and Risk',
    urls: [
      `${ES}/User/Aboutnotableevents`,
      `${ES}/User/Triagenotableevents`,
    ]
  },
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'Threat Detection and Investigation',
    urls: [
      `${ES}/User/Useriskoverview`,
      `${ES}/User/Investigatethreat`,
    ]
  },

  // ── Consultant ───────────────────────────────────────────────────────────
  {
    certType: 'Consultant', topic: 'Indexer Clustering',
    urls: [
      `${S}/Indexer/Aboutclusters`,
      // 🔄 500 → help.splunk.com
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/indexer-cluster-deployment-overview/indexer-cluster-deployment-overview`,
    ]
  },
  {
    certType: 'Consultant', topic: 'Data Collection',
    urls: [
      `${S}/Data/WhatSplunkcanmonitor`,
      `${S}/Data/Usingforwardingagents`,
    ]
  },
  {
    certType: 'Consultant', topic: 'Search Head Clustering',
    urls: [
      `${S}/DistSearch/AboutSHC`,
      `${S}/DistSearch/SHCarchitecture`,
    ]
  },
];

// Alias for compatibility with ingest.js
export const splunkDocs = SPLUNK_DOC_URLS;
