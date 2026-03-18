/**
 * scripts/splunk-urls.js
 *
 * Curated Splunk documentation URLs for each certification topic.
 *
 * FIX 2026-03: Pinned all URLs from /Splunk/latest/ to /Splunk/9.4.2/
 * Splunk migrated versions > 9.4.2 to help.splunk.com — the old docs portal
 * returns HTTP 500 for the `latest` alias. 9.4.2 is the last version on
 * docs.splunk.com and remains current for all cert exam objectives.
 *
 * SplunkCloud urls remain on /SplunkCloud/latest/ as that portal still works.
 * CIM urls remain on /CIM/latest/ (separate product, unaffected).
 */

const S = 'https://docs.splunk.com/Documentation/Splunk/9.4.2';
const SC = 'https://docs.splunk.com/Documentation/SplunkCloud/latest';
const FWD = 'https://docs.splunk.com/Documentation/Forwarder/9.4.2';
const CIM = 'https://docs.splunk.com/Documentation/CIM/latest';

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
      `${S}/Search/Usebooleansandcomparisonoperators`,
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
      `${S}/Viz/Aboutdashboards`,
      `${S}/Viz/PanelreferenceforSimplifiedXML`,
    ]
  },
  {
    certType: 'User', topic: 'Creating and Using Lookups',
    urls: [
      `${S}/Knowledge/Aboutlookupsandfieldactions`,
      `${S}/Knowledge/Definealookuponthefly`,
      `${S}/Knowledge/Configuredblookupdefinitions`,
    ]
  },
  {
    certType: 'User', topic: 'Creating Scheduled Reports and Alerts',
    urls: [
      `${S}/Alert/Aboutalerts`,
      `${S}/Report/Schedulereports`,
      `${S}/Alert/Definerealtimealerts`,
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
      `${S}/Knowledge/Defineandeventtype`,
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
      `${S}/Knowledge/WorkflowactionsinSplunkWeb`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Data Models',
    urls: [
      `${S}/Knowledge/Aboutdatamodels`,
      `${S}/Knowledge/Createandeditdatamodels`,
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
      `${S}/Search/Correlateevents`,
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
      `${S}/Indexer/Managingindexstorage`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Splunk Configuration Files',
    urls: [
      `${S}/Admin/Aboutconfigurationfiles`,
      `${S}/Admin/Wheretofindtheconfigurationfiles`,
      `${S}/Admin/Configurationfileprecedence`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Distributed Search',
    urls: [
      `${S}/DistSearch/Whatisdistributedsearch`,
      `${S}/DistSearch/Setupdistributedsearch`,
      `${S}/DistSearch/Configuresearchheadpooling`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Configuring Forwarders',
    urls: [
      `${FWD}/Forwarder/Abouttheuniversalforwarder`,
      `${FWD}/Forwarder/Installawindowsuniversalforwarder`,
      `${S}/Forwarding/Configureforwardingandfilteredrouting`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Forwarder Management',
    urls: [
      `${S}/Updating/Aboutdeploymentserver`,
      `${S}/Updating/Configureadeploymentserver`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'License Management',
    urls: [
      `${S}/Admin/Aboutlicenses`,
      `${S}/Admin/Howlicensingworks`,
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
      `${SC}/Admin/ConfigureInputs`,
      `${SC}/Admin/NamedInputs`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Index Management',
    urls: [
      `${SC}/Admin/ManageIndexes`,
      `${SC}/Admin/CreateAndManageIndexesClassic`,
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
      `${SC}/Admin/ManageForwarders`,
      `${SC}/Admin/ConfigureHeavyForwarder`,
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
      `${S}/Indexer/Configurethemasternode`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Multisite Indexer Cluster',
    urls: [
      `${S}/Indexer/Multisiteclusters`,
      `${S}/Indexer/Deploymultisitecluster`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Search Head Cluster',
    urls: [
      `${S}/DistSearch/AboutSHC`,
      `${S}/DistSearch/DeploySHC`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Resource Planning',
    urls: [
      `${S}/Capacity/Introtocapacityplanning`,
      `${S}/Capacity/HardwareforSplunkEnterprise`,
    ]
  },

  // ── Advanced Power User ──────────────────────────────────────────────────
  {
    certType: 'Advanced Power User', topic: 'Working with Multivalued Fields',
    urls: [
      `${S}/SearchReference/Multivalueeval`,
      `${S}/SearchReference/Makemv`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Subsearches',
    urls: [
      `${S}/Search/Useasubsearch`,
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
      `${S}/Metrics/GetMetricsIn`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Introduction to Alerting on Metrics with Detectors',
    urls: [
      `${SC}/AlertManager/Aboutdetectors`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Get Metrics In with OpenTelemetry',
    urls: [
      `${S}/Metrics/GetMetricsIn`,
    ]
  },

  // ── Cybersecurity Defense Engineer ───────────────────────────────────────
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'SPL and Efficient Searching',
    urls: [
      `${S}/Search/Optimizesearches`,
      `${S}/Search/Writebettersearches`,
    ]
  },
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'Investigation, Event Handling, Correlation, and Risk',
    urls: [
      'https://docs.splunk.com/Documentation/ES/latest/User/Aboutnotableevents',
      'https://docs.splunk.com/Documentation/ES/latest/User/Triagenotableevents',
    ]
  },
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'Threat Detection and Investigation',
    urls: [
      'https://docs.splunk.com/Documentation/ES/latest/User/Useriskoverview',
      'https://docs.splunk.com/Documentation/ES/latest/User/Investigatethreat',
    ]
  },

  // ── Consultant ───────────────────────────────────────────────────────────
  {
    certType: 'Consultant', topic: 'Indexer Clustering',
    urls: [
      `${S}/Indexer/Aboutclusters`,
      `${S}/Indexer/Managingindexers`,
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
