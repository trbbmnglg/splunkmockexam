/**
 * scripts/splunk-urls.js
 *
 * Curated Splunk documentation URLs for each certification topic.
 * These are stable Splunk Docs pages that map directly to blueprint topics.
 *
 * Each entry:
 *   certType  — matches EXAM_BLUEPRINTS key in constants.js
 *   topic     — matches blueprint topic name exactly
 *   urls      — array of docs.splunk.com pages to scrape for this topic
 */

export const SPLUNK_DOC_URLS = [

  // ── Core Certified User ──────────────────────────────────────────────────
  {
    certType: 'User', topic: 'Splunk Basics',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchTutorial/WelcometotheSearchTutorial',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchTutorial/Aboutthesearchapp',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchTutorial/Startsearching',
    ]
  },
  {
    certType: 'User', topic: 'Basic Searching',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Aboutsearching',
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Searchtimerange',
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Usethesearchbar',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchTutorial/Usefieldstosearch',
    ]
  },
  {
    certType: 'User', topic: 'Using Fields in Searches',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Aboutfields',
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Addaliasestofields',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchTutorial/Usefieldstosearch',
    ]
  },
  {
    certType: 'User', topic: 'Search Language Fundamentals',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Aboutthesearchlanguage',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Search',
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Usebooleansandcomparisonoperators',
    ]
  },
  {
    certType: 'User', topic: 'Using Basic Transforming Commands',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Stats',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Chart',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Timechart',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Top',
    ]
  },
  {
    certType: 'User', topic: 'Creating Reports and Dashboards',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Report/Aboutreports',
      'https://docs.splunk.com/Documentation/Splunk/latest/Viz/Aboutdashboards',
      'https://docs.splunk.com/Documentation/Splunk/latest/Viz/PanelreferenceforSimplifiedXML',
    ]
  },
  {
    certType: 'User', topic: 'Creating and Using Lookups',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Aboutlookupsandfieldactions',
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Definealookuponthefly',
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Configuredblookupdefinitions',
    ]
  },
  {
    certType: 'User', topic: 'Creating Scheduled Reports and Alerts',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Alert/Aboutalerts',
      'https://docs.splunk.com/Documentation/Splunk/latest/Report/Schedulereports',
      'https://docs.splunk.com/Documentation/Splunk/latest/Alert/Definerealtimealerts',
    ]
  },

  // ── Core Certified Power User ────────────────────────────────────────────
  {
    certType: 'Power User', topic: 'Creating Field Aliases and Calculated Fields',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Addaliasestofields',
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Defineandeditcalculatedfields',
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Tags and Event Types',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Abouttagsandaliases',
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Defineandeventtype',
    ]
  },
  {
    certType: 'Power User', topic: 'Creating and Using Macros',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Definesearchmacros',
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Usesearchmacros',
    ]
  },
  {
    certType: 'Power User', topic: 'Creating and Using Workflow Actions',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Aboutworkflowactions',
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Addaworkflowaction',
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Data Models',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Aboutdatamodels',
      'https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Createandeditdatamodels',
    ]
  },
  {
    certType: 'Power User', topic: 'Using the Common Information Model (CIM)',
    urls: [
      'https://docs.splunk.com/Documentation/CIM/latest/User/Overview',
      'https://docs.splunk.com/Documentation/CIM/latest/User/UsetheCIM',
    ]
  },
  {
    certType: 'Power User', topic: 'Correlating Events',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Transaction',
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Correlateevents',
    ]
  },
  {
    certType: 'Power User', topic: 'Filtering and Formatting Results',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Eval',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Where',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Fieldformat',
    ]
  },

  // ── Enterprise Admin ─────────────────────────────────────────────────────
  {
    certType: 'Enterprise Admin', topic: 'Splunk Indexes',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Aboutindexesandindexers',
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Setupmultipleindexes',
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Managingindexstorage',
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Splunk Configuration Files',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles',
      'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Wheretofindtheconfigurationfiles',
      'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Configurationfileprecedence',
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Distributed Search',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/Whatisdistributedsearch',
      'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/Setupdistributedsearch',
      'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/Configuresearchheadpooling',
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Configuring Forwarders',
    urls: [
      'https://docs.splunk.com/Documentation/Forwarder/latest/Forwarder/Abouttheuniversalforwarder',
      'https://docs.splunk.com/Documentation/Forwarder/latest/Forwarder/Installawindowsuniversalforwarder',
      'https://docs.splunk.com/Documentation/Splunk/latest/Forwarding/Configureforwardingandfilteredrouting',
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Forwarder Management',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Updating/Aboutdeploymentserver',
      'https://docs.splunk.com/Documentation/Splunk/latest/Updating/Configureadeploymentserver',
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'License Management',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutlicenses',
      'https://docs.splunk.com/Documentation/Splunk/latest/Admin/Howlicensingworks',
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Monitor Inputs',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Data/MonitorfilesanddirectorieswithSplunkWeb',
      'https://docs.splunk.com/Documentation/Splunk/latest/Data/Monitorfilesanddirectories',
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Getting Data In',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Data/WhatSplunkcanmonitor',
      'https://docs.splunk.com/Documentation/Splunk/latest/Data/Usingforwardingagents',
    ]
  },

  // ── Cloud Admin ──────────────────────────────────────────────────────────
  {
    certType: 'Cloud Admin', topic: 'Getting Data in Cloud',
    urls: [
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Admin/ConfigureInputs',
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Admin/NamedInputs',
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Index Management',
    urls: [
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Admin/ManageIndexes',
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Admin/CreateAndManageIndexesClassic',
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'User Authentication and Authorization',
    urls: [
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Security/Setupauthenticationwithldap',
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Security/Rolesandcapabilities',
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Forwarder Management',
    urls: [
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Admin/ManageForwarders',
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Admin/ConfigureHeavyForwarder',
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Installing and Managing Apps',
    urls: [
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Admin/SelfServiceAppInstall',
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/Admin/PrivateApps',
    ]
  },

  // ── Enterprise Architect ─────────────────────────────────────────────────
  {
    certType: 'Enterprise Architect', topic: 'Single-site Indexer Cluster',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Aboutclusters',
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Basicclusterarchitecture',
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Configurethemasternode',
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Multisite Indexer Cluster',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Multisiteclusters',
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Deploymultisitecluster',
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Search Head Cluster',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/AboutSHC',
      'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/DeploySHC',
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Resource Planning',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Capacity/Introtocapacityplanning',
      'https://docs.splunk.com/Documentation/Splunk/latest/Capacity/HardwareforSplunkEnterprise',
    ]
  },

  // ── Advanced Power User ──────────────────────────────────────────────────
  {
    certType: 'Advanced Power User', topic: 'Working with Multivalued Fields',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Multivalueeval',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Makemv',
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Subsearches',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Useasubsearch',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Appendcols',
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Advanced Transactions',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Transaction',
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Abouttransactions',
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Manipulating and Filtering Data',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Eval',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Rex',
      'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Regex',
    ]
  },

  // ── O11y Metrics User ────────────────────────────────────────────────────
  {
    certType: 'O11y Metrics User', topic: 'Metrics Concepts',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Metrics/Overview',
      'https://docs.splunk.com/Documentation/Splunk/latest/Metrics/GetMetricsIn',
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Introduction to Alerting on Metrics with Detectors',
    urls: [
      'https://docs.splunk.com/Documentation/SplunkCloud/latest/AlertManager/Aboutdetectors',
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Get Metrics In with OpenTelemetry',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Metrics/GetMetricsIn',
      'https://docs.splunk.com/observability/en/gdi/opentelemetry/opentelemetry.html',
    ]
  },

  // ── Cybersecurity Defense Engineer ───────────────────────────────────────
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'SPL and Efficient Searching',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Optimizesearches',
      'https://docs.splunk.com/Documentation/Splunk/latest/Search/Writebettersearches',
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
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Aboutclusters',
      'https://docs.splunk.com/Documentation/Splunk/latest/Indexer/Managingindexers',
    ]
  },
  {
    certType: 'Consultant', topic: 'Data Collection',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/Data/WhatSplunkcanmonitor',
      'https://docs.splunk.com/Documentation/Splunk/latest/Data/Usingforwardingagents',
    ]
  },
  {
    certType: 'Consultant', topic: 'Search Head Clustering',
    urls: [
      'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/AboutSHC',
      'https://docs.splunk.com/Documentation/Splunk/latest/DistSearch/SHCarchitecture',
    ]
  },
];
