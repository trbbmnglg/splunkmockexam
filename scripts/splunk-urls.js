/**
 * scripts/splunk-urls.js
 *
 * Curated Splunk documentation URLs for each certification topic.
 *
 * URL prefixes:
 *   S   = docs.splunk.com/Splunk/9.4.2 (confirmed working)
 *   SC  = docs.splunk.com/SplunkCloud/latest (working)
 *   CIM = docs.splunk.com/CIM/latest (separate product, unaffected)
 *   ES  = docs.splunk.com/ES/latest (separate product, unaffected)
 *   H   = help.splunk.com/en/splunk-enterprise/administer (verified working)
 *   HDM = help.splunk.com/en/data-management (verified working)
 */

const S   = 'https://docs.splunk.com/Documentation/Splunk/9.4.2';
const SC  = 'https://docs.splunk.com/Documentation/SplunkCloud/latest';
const CIM = 'https://docs.splunk.com/Documentation/CIM/latest';
const ES  = 'https://docs.splunk.com/Documentation/ES/latest';
const H   = 'https://help.splunk.com/en/splunk-enterprise/administer';
const HDM = 'https://help.splunk.com/en/data-management';

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
      `https://help.splunk.com/en/splunk-enterprise/search/search-manual/9.4/search-language-fundamentals/boolean-expressions-in-searches`,
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
      `${S}/Report/Createandeditreports`,
      `${S}/Viz/PanelreferenceforSimplifiedXML`,
    ]
  },
  {
    certType: 'User', topic: 'Creating and Using Lookups',
    urls: [
      `${S}/Knowledge/Aboutlookupsandfieldactions`,
      `${S}/Knowledge/Makeyourlookupautomatic`,
      `${S}/Knowledge/DefineandsharelookupsinSplunkWeb`,
    ]
  },
  {
    certType: 'User', topic: 'Creating Scheduled Reports and Alerts',
    urls: [
      `${S}/Alert/Aboutalerts`,
      `${S}/Report/Schedulereports`,
      `${S}/Alert/Definescheduledalerts`,
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
      `${S}/Knowledge/Defineeventtypes`,
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
      `${S}/Knowledge/Aboutworkflowactions`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Data Models',
    urls: [
      `${S}/Knowledge/Aboutdatamodels`,
      `${S}/Knowledge/Buildadatamodel`,
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
      `${S}/Search/Abouttransactions`,
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
      `${HDM}/manage-splunk-enterprise-indexers/9.4/manage-index-storage/configure-index-storage`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Splunk Configuration Files',
    urls: [
      `${S}/Admin/Aboutconfigurationfiles`,
      `${S}/Admin/Wheretofindtheconfigurationfiles`,
      `${HDM}/splunk-enterprise-admin-manual/9.4/administer-splunk-enterprise-with-configuration-files/configuration-file-precedence`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Distributed Search',
    urls: [
      `${S}/DistSearch/Whatisdistributedsearch`,
      `${H}/distributed-search/9.4/deploy-distributed-search/system-requirements-and-other-deployment-considerations-for-distributed-search`,
      `${H}/distributed-search/9.4/deploy-distributed-search/set-up-a-distributed-search-environment`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Configuring Forwarders',
    urls: [
      'https://docs.splunk.com/Documentation/Forwarder/9.4.2/Forwarder/Abouttheuniversalforwarder',
      `${S}/Forwarding/Aboutforwardingandreceivingdata`,
      `${S}/Forwarding/Configureforwardingwithoutputs.conf`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Forwarder Management',
    urls: [
      `${S}/Updating/Aboutdeploymentserver`,
      `${S}/Updating/Configuredeploymentclients`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'License Management',
    urls: [
      `https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/9.4/install-a-splunk-enterprise-license/about-splunk-enterprise-licenses`,
      `${S}/Admin/Aboutlicensemanagement`,
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
      `${SC}/Admin/MonitorInputs`,
      `${SC}/Admin/ConfigureInputsFromSplunkWeb`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Index Management',
    urls: [
      `${SC}/Admin/ManageIndexes`,
      `${SC}/Admin/Createandmanageindexes`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'User Authentication and Authorization',
    urls: [
      `${SC}/Security/Setupauthenticationwithldap`,
      `${SC}/Security/Rolesandcapabilities`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Forwarder Management',
    urls: [
      `${SC}/Admin/ConfigHeavyForwarder`,
      `${SC}/Admin/MonitorInputs`,
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
      `${H}/manage-indexers-and-indexer-clusters/9.4/configure-the-manager-node/configure-the-manager-node-with-server.conf`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Multisite Indexer Cluster',
    urls: [
      `${S}/Indexer/Multisiteclusters`,
      `${H}/manage-indexers-and-indexer-clusters/9.4/multisite-indexer-clusters/multisite-indexer-cluster-overview`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Search Head Cluster',
    urls: [
      `${S}/DistSearch/AboutSHC`,
      `${H}/distributed-search/9.4/deploy-search-head-clustering/deploy-a-search-head-cluster`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Resource Planning',
    urls: [
      `${S}/Capacity/Overviewofcapacityplanning`,
      `${S}/Capacity/Referencehardware`,
    ]
  },

  // ── Advanced Power User ──────────────────────────────────────────────────
  {
    certType: 'Advanced Power User', topic: 'Working with Multivalued Fields',
    urls: [
      `${S}/SearchReference/Makemv`,
      `${S}/SearchReference/Mvexpand`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Subsearches',
    urls: [
      `${S}/Search/Aboutsubsearches`,
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
      `${S}/Metrics/GetMetricsIntoSplunk`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Introduction to Alerting on Metrics with Detectors',
    urls: [
      `${S}/Alert/Aboutalerts`,
      `${S}/Alert/Definescheduledalerts`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Get Metrics In with OpenTelemetry',
    urls: [
      `${S}/Metrics/Overview`,
      `${S}/Metrics/GetMetricsIntoSplunk`,
    ]
  },

  // ── Cybersecurity Defense Engineer ───────────────────────────────────────
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'SPL and Efficient Searching',
    urls: [
      `${S}/Search/Writebettersearches`,
      `${S}/Search/Optimizesearches`,
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
      `${H}/manage-indexers-and-indexer-clusters/9.4/configure-the-indexer-cluster/indexer-cluster-configuration-overview`,
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
