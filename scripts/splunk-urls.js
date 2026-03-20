// scripts/splunk-urls.js
//
// Flat structure: each entry is { certType, examType, topic, urls }
//
// Scripts that import this:
//   ingest.js        — iterates splunkDocs, reads doc.certType / doc.topic / doc.urls
//   find-urls.js     — same
//   validate-urls.js — same
//
// CERT_FILTER in the ingest workflow matches doc.certType exactly.
// Valid CERT_FILTER values:
//   "Splunk Core Certified User"
//   "Splunk Core Certified Power User"
//   "Splunk Advanced Power User"
//   "Splunk Enterprise Certified Admin"
//   "Splunk Cloud Certified Admin"
//   "Splunk Enterprise Certified Architect"
//   "Splunk Core Certified Consultant"
//   "Splunk O11y Cloud Certified Metrics User"
//   "Splunk Certified Cybersecurity Defense Engineer"

// ── Base URL constants ────────────────────────────────────────────────────────
const S   = 'https://docs.splunk.com/Documentation/Splunk/latest';
const H   = 'https://help.splunk.com/en/splunk-enterprise';
const ES  = 'https://docs.splunk.com/Documentation/ES/latest';
const SOC = 'https://help.splunk.com/en/splunk-observability-cloud';
const ES8 = 'https://help.splunk.com/en/splunk-enterprise-security-8';

// ── Flat URL list ─────────────────────────────────────────────────────────────
export const splunkDocs = [

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK CORE CERTIFIED USER
  // ══════════════════════════════════════════════════════════════════════════

  { certType: 'Splunk Core Certified User', examType: 'User', topic: 'Splunk Basics', urls: [
    `${S}/SplunkEnterprise/latest/Overview/WhatSplunkEnterprisedoes`,
    `${S}/SplunkEnterprise/latest/Deploy/Distributedoverview`,
  ]},
  { certType: 'Splunk Core Certified User', examType: 'User', topic: 'Basic Searching', urls: [
    `${S}/SplunkEnterprise/latest/Search/Aboutsearching`,
    `${S}/SplunkEnterprise/latest/SearchTutorial/Startsearching`,
    `${S}/SplunkEnterprise/latest/Search/GetstartedwithSearch`,
  ]},
  { certType: 'Splunk Core Certified User', examType: 'User', topic: 'Using Fields in Searches', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutfields`,
    `${S}/SplunkEnterprise/latest/Search/Usefieldsinasearch`,
  ]},
  { certType: 'Splunk Core Certified User', examType: 'User', topic: 'Search Language Fundamentals', urls: [
    `${S}/SplunkEnterprise/latest/Search/Aboutthesearchlanguage`,
    `${S}/SplunkEnterprise/latest/SearchReference/WhatsInThisManual`,
    'https://help.splunk.com/en/search/spl-search-reference/9.4/spl2-search-reference/splunk-quick-reference-guide',
  ]},
  { certType: 'Splunk Core Certified User', examType: 'User', topic: 'Using Basic Transforming Commands', urls: [
    `${S}/SplunkEnterprise/latest/Search/Chartresults`,
    `${S}/SplunkEnterprise/latest/SearchReference/Stats`,
    `${S}/SplunkEnterprise/latest/SearchReference/Top`,
    `${S}/SplunkEnterprise/latest/SearchReference/Rare`,
  ]},
  { certType: 'Splunk Core Certified User', examType: 'User', topic: 'Creating Reports and Dashboards', urls: [
    `${S}/SplunkEnterprise/latest/Report/Createreports`,
    `${S}/SplunkEnterprise/latest/SearchTutorial/Createreports`,
    `${S}/SplunkEnterprise/latest/Viz/AboutSplunkDashboards`,
  ]},
  { certType: 'Splunk Core Certified User', examType: 'User', topic: 'Creating and Using Lookups', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutlookupsandfieldactions`,
    `${S}/SplunkEnterprise/latest/Knowledge/Definereferencelookupsbydefault`,
  ]},
  { certType: 'Splunk Core Certified User', examType: 'User', topic: 'Creating Scheduled Reports and Alerts', urls: [
    `${S}/SplunkEnterprise/latest/Alert/Aboutalerts`,
    `${S}/SplunkEnterprise/latest/Alert/Definescheduledalerts`,
    `${S}/SplunkEnterprise/latest/Report/Schedulereports`,
  ]},

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK CORE CERTIFIED POWER USER
  // ══════════════════════════════════════════════════════════════════════════

  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Using Transforming Commands for Visualizations', urls: [
    `${S}/SplunkEnterprise/latest/Search/Chartresults`,
    `${S}/SplunkEnterprise/latest/SearchReference/Stats`,
  ]},
  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Filtering and Formatting Results', urls: [
    `${S}/SplunkEnterprise/latest/SearchReference/Eval`,
    `${S}/SplunkEnterprise/latest/SearchReference/Where`,
    `${S}/SplunkEnterprise/latest/SearchReference/Rename`,
  ]},
  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Correlating Events', urls: [
    `${S}/SplunkEnterprise/latest/SearchReference/Join`,
    `${S}/SplunkEnterprise/latest/SearchReference/Append`,
    `${S}/SplunkEnterprise/latest/SearchReference/Appendcols`,
  ]},
  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Creating and Managing Fields', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutfields`,
    `${S}/SplunkEnterprise/latest/SearchReference/Rex`,
  ]},
  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Creating Field Aliases and Calculated Fields', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutfieldaliases`,
    `${S}/SplunkEnterprise/latest/Knowledge/definecalcfields`,
  ]},
  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Creating Tags and Event Types', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Tageventsandobjects`,
    `${S}/SplunkEnterprise/latest/Knowledge/Abouteventtypes`,
  ]},
  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Creating and Using Macros', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Definesearchmacros`,
    `${S}/SplunkEnterprise/latest/Knowledge/Usesearchmacros`,
  ]},
  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Creating and Using Workflow Actions', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutworkflowactions`,
  ]},
  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Creating Data Models', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutdatamodels`,
    `${S}/SplunkEnterprise/latest/Knowledge/Buildingdatamodels`,
  ]},
  { certType: 'Splunk Core Certified Power User', examType: 'Power User', topic: 'Using the Common Information Model (CIM)', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/UsingtheCIM`,
  ]},

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK ADVANCED POWER USER
  // ══════════════════════════════════════════════════════════════════════════

  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Exploring Statistical Commands', urls: [
    `${S}/SplunkEnterprise/latest/SearchReference/Stats`,
    `${S}/SplunkEnterprise/latest/SearchReference/Eventstats`,
    `${S}/SplunkEnterprise/latest/SearchReference/Streamstats`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Exploring eval Command Functions', urls: [
    `${S}/SplunkEnterprise/latest/SearchReference/Eval`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Exploring Lookups', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutlookupsandfieldactions`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Exploring Alerts', urls: [
    `${S}/SplunkEnterprise/latest/Alert/Aboutalerts`,
    `${S}/SplunkEnterprise/latest/Alert/Definescheduledalerts`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Advanced Field Creation and Management', urls: [
    `${S}/SplunkEnterprise/latest/SearchReference/Rex`,
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutfields`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Working with Self-Describing Data and Files', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutdatamodels`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Advanced Search Macros', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Definesearchmacros`,
    `${S}/SplunkEnterprise/latest/Knowledge/Usesearchmacros`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Using Acceleration Options: Reports & Summary Indexing', urls: [
    `${S}/SplunkEnterprise/latest/Report/Schedulereports`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Using Acceleration Options: Data Models & tsidx', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutdatamodels`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Using Search Efficiently', urls: [
    `${S}/SplunkEnterprise/latest/Search/Writebettersearches`,
    `${H}/search/search-manual/9.4/write-better-searches`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'More Search Tuning', urls: [
    `${S}/SplunkEnterprise/latest/Search/Writebettersearches`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Manipulating and Filtering Data', urls: [
    `${S}/SplunkEnterprise/latest/SearchReference/Rex`,
    `${S}/SplunkEnterprise/latest/SearchReference/Eval`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Working with Multivalued Fields', urls: [
    `${S}/SplunkEnterprise/latest/SearchReference/Mvexpand`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Using Advanced Transactions', urls: [
    `${S}/SplunkEnterprise/latest/Search/Abouttransactions`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Working with Time', urls: [
    `${H}/search/search-manual/9.4/search-time-modifiers/use-time-modifiers-in-your-search`,
    `${S}/SplunkEnterprise/latest/Search/Abouttimemodifiers`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Using Subsearches', urls: [
    `${S}/SplunkEnterprise/latest/Search/Aboutsubsearches`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Creating a Prototype', urls: [
    `${S}/SplunkEnterprise/latest/Viz/AboutSplunkDashboards`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Using Forms', urls: [
    `${H}/create-dashboards-and-reports/dashboards-and-visualizations/9.4/build-and-manage-dashboards/about-form-inputs-for-dashboards`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Improving Performance', urls: [
    `${S}/SplunkEnterprise/latest/Search/Writebettersearches`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Customizing Dashboards', urls: [
    `${S}/SplunkEnterprise/latest/Viz/AboutSplunkDashboards`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Adding Drilldowns', urls: [
    `${H}/create-dashboards-and-reports/dashboards-and-visualizations/9.4/add-interactivity-to-dashboards/about-drilldown`,
  ]},
  { certType: 'Splunk Advanced Power User', examType: 'Advanced Power User', topic: 'Adding Advanced Behaviors and Visualizations', urls: [
    `${H}/create-dashboards-and-reports/dashboards-and-visualizations/9.4/visualize-data/about-splunk-enterprise-data-visualizations`,
  ]},

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK ENTERPRISE CERTIFIED ADMIN
  // ══════════════════════════════════════════════════════════════════════════

  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Splunk Admin Basics', urls: [
    `${H}/administer/admin-manual/9.4/introduction-to-the-splunk-enterprise-admin-manual/about-the-splunk-enterprise-admin-manual`,
    `${H}/get-started/install-and-upgrade/9.4/install-splunk-enterprise/about-installing-splunk-on-linux`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'License Management', urls: [
    `${H}/get-started/install-and-upgrade/9.4/install-a-splunk-enterprise-license/about-splunk-enterprise-licenses`,
    `${H}/administer/admin-manual/9.4/manage-splunk-licenses/about-license-management`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Splunk Configuration Files', urls: [
    `${S}/SplunkEnterprise/latest/Admin/Aboutconfigurationfiles`,
    `${S}/SplunkEnterprise/latest/Admin/Configurationfiledirectoriesandfiles`,
    `${S}/SplunkEnterprise/latest/Admin/Wheretofindtheconfigurationfiles`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Splunk Indexes', urls: [
    `${S}/SplunkEnterprise/latest/Indexer/Aboutindexesandindexers`,
    `${S}/SplunkEnterprise/latest/Indexer/Setupmultipleindexes`,
    `${S}/SplunkEnterprise/latest/Indexer/Configuredataretention`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Splunk User Management', urls: [
    `${S}/SplunkEnterprise/latest/Security/Aboutusersandroles`,
    `${S}/SplunkEnterprise/latest/Security/Addandeditroles`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Splunk Authentication Management', urls: [
    `${H}/administer/manage-users-and-security/9.4/set-up-user-authentication/set-up-user-authentication-with-ldap`,
    `${H}/administer/manage-users-and-security/9.4/manage-users/about-users-and-roles`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Getting Data In', urls: [
    `${S}/SplunkEnterprise/latest/Data/WaystogetdataintoSplunk`,
    `${S}/SplunkEnterprise/latest/Data/Monitorfiles`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Distributed Search', urls: [
    `${S}/SplunkEnterprise/latest/DistSearch/Whatisdistributedsearch`,
    `${S}/SplunkEnterprise/latest/DistSearch/Configuredistributedsearch`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Getting Data In – Staging', urls: [
    `${H}/get-started/get-data-in/9.4/introduction/about-getting-data-in`,
    `${H}/get-data-in/get-started-with-getting-data-in/9.4/introduction/about-getting-data-in`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Configuring Forwarders', urls: [
    `${S}/SplunkEnterprise/latest/Forwarding/Aboutforwardingandreceivingdata`,
    `${S}/SplunkEnterprise/latest/Forwarding/Enableaforwarder`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Forwarder Management', urls: [
    `${S}/SplunkEnterprise/latest/Forwarding/Configureforwardingwithoutputs.conf`,
    `${S}/SplunkEnterprise/latest/Updating/Aboutdeploymentserver`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Monitor Inputs', urls: [
    `${S}/SplunkEnterprise/latest/Data/Monitorfiles`,
    `${S}/SplunkEnterprise/latest/Data/Configuredatamonitor`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Network and Scripted Inputs', urls: [
    `${S}/SplunkEnterprise/latest/Data/Monitornetworkports`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Agentless Inputs', urls: [
    `${S}/SplunkEnterprise/latest/Data/UsetheHTTPEventCollector`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Fine Tuning Inputs', urls: [
    `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/override-source-and-extraction-configurations`,
    `${H}/get-started/get-data-in/9.4/configure-event-processing/override-source-and-extraction-configurations`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Parsing Phase and Data', urls: [
    `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/use-data-preview-to-configure-event-processing`,
    `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/how-splunk-enterprise-handles-multiline-events`,
  ]},
  { certType: 'Splunk Enterprise Certified Admin', examType: 'Enterprise Admin', topic: 'Manipulating Raw Data', urls: [
    `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/set-up-sed-commands`,
    `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/anonymize-data`,
  ]},

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK CLOUD CERTIFIED ADMIN
  // ══════════════════════════════════════════════════════════════════════════

  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Splunk Cloud Overview', urls: [
    `${S}/SplunkCloud/latest/Admin/SplunkCloudoverview`,
    `${S}/SplunkCloud/latest/Admin/SharedResponsibilities`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Index Management', urls: [
    `${S}/SplunkCloud/latest/Admin/ManageIndices`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'User Authentication and Authorization', urls: [
    `${S}/SplunkCloud/latest/Admin/ManageRoles`,
    `${S}/SplunkCloud/latest/Admin/ManageUsers`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Splunk Configuration Files', urls: [
    `${S}/SplunkEnterprise/latest/Admin/Aboutconfigurationfiles`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Getting Data in Cloud', urls: [
    `${S}/SplunkCloud/latest/Admin/RetrievingData`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Forwarder Management', urls: [
    `${S}/SplunkCloud/latest/Admin/ManageForwarders`,
    `${S}/SplunkCloud/latest/Admin/CloudForwarderRequirements`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Monitor Inputs', urls: [
    `${S}/SplunkEnterprise/latest/Data/Monitorfiles`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Network and Other Inputs', urls: [
    `${S}/SplunkEnterprise/latest/Data/Monitornetworkports`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Fine-tuning Inputs', urls: [
    `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/override-source-and-extraction-configurations`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Parsing Phase and Data Preview', urls: [
    `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/use-data-preview-to-configure-event-processing`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Manipulating Raw Data', urls: [
    `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/set-up-sed-commands`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Installing and Managing Apps', urls: [
    `${S}/SplunkCloud/latest/Admin/ManageApps`,
    `${S}/SplunkCloud/latest/Admin/SelfServiceApps`,
  ]},
  { certType: 'Splunk Cloud Certified Admin', examType: 'Cloud Admin', topic: 'Working with Splunk Cloud Support', urls: [
    `${H}/get-started/install-and-upgrade/9.4/get-help-and-support/get-help-and-support-for-splunk-enterprise`,
  ]},

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK ENTERPRISE CERTIFIED ARCHITECT
  // ══════════════════════════════════════════════════════════════════════════

  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Introduction', urls: [
    `${S}/SplunkEnterprise/latest/Deploy/Distributedoverview`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Project Requirements', urls: [
    `${S}/SplunkEnterprise/latest/Deploy/Plandeployment`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Infrastructure Planning: Index Design', urls: [
    `${S}/SplunkEnterprise/latest/Indexer/Setupmultipleindexes`,
    `${S}/SplunkEnterprise/latest/Indexer/Configuredataretention`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Infrastructure Planning: Resource Planning', urls: [
    `${S}/SplunkEnterprise/latest/Deploy/Estimatingindexvolume`,
    `${S}/SplunkEnterprise/latest/Deploy/ReferenceHardware`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Clustering Overview', urls: [
    `${S}/SplunkEnterprise/latest/Indexer/Aboutindexerclusters`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Forwarder and Deployment Best Practices', urls: [
    `${S}/SplunkEnterprise/latest/Forwarding/Aboutforwardingandreceivingdata`,
    `${S}/SplunkEnterprise/latest/Updating/Aboutdeploymentserver`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Performance Monitoring and Tuning', urls: [
    `${S}/SplunkEnterprise/latest/Admin/AboutMonitoringConsole`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Splunk Troubleshooting Methods and Tools', urls: [
    `${S}/SplunkEnterprise/latest/Troubleshooting/WhoToContactforSupport`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Single-site Indexer Cluster', urls: [
    `${S}/SplunkEnterprise/latest/Indexer/Setupthecaptainnode`,
    `${S}/SplunkEnterprise/latest/Indexer/Maintainanindexercluster`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Multisite Indexer Cluster', urls: [
    `${S}/SplunkEnterprise/latest/Indexer/AboutmultisiteIndexerClusters`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Indexer Cluster Management and Administration', urls: [
    `${H}/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster/manage-peer-nodes`,
    `${H}/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster/use-the-splunk-cli-to-manage-an-indexer-cluster`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Search Head Cluster', urls: [
    `${S}/SplunkEnterprise/latest/DistSearch/AboutSHC`,
    `${S}/SplunkEnterprise/latest/DistSearch/DeploySHC`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'Search Head Cluster Management and Administration', urls: [
    `${S}/SplunkEnterprise/latest/DistSearch/ManageSHC`,
  ]},
  { certType: 'Splunk Enterprise Certified Architect', examType: 'Enterprise Architect', topic: 'KV Store Collection and Lookup Management', urls: [
    `${S}/SplunkEnterprise/latest/Knowledge/Aboutlookupsandfieldactions`,
  ]},

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK CORE CERTIFIED CONSULTANT
  // ══════════════════════════════════════════════════════════════════════════

  { certType: 'Splunk Core Certified Consultant', examType: 'Consultant', topic: 'Deploying Splunk', urls: [
    `${S}/SplunkEnterprise/latest/Deploy/Distributedoverview`,
    `${S}/SplunkEnterprise/latest/Deploy/Plandeployment`,
  ]},
  { certType: 'Splunk Core Certified Consultant', examType: 'Consultant', topic: 'Monitoring Console', urls: [
    `${H}/administer/monitor/9.4/about-the-monitoring-console/about-the-monitoring-console`,
    `${S}/SplunkEnterprise/latest/Admin/AboutMonitoringConsole`,
  ]},
  { certType: 'Splunk Core Certified Consultant', examType: 'Consultant', topic: 'Access and Roles', urls: [
    `${S}/SplunkEnterprise/latest/Security/Aboutusersandroles`,
    `${S}/SplunkEnterprise/latest/Security/Addandeditroles`,
  ]},
  { certType: 'Splunk Core Certified Consultant', examType: 'Consultant', topic: 'Data Collection', urls: [
    `${S}/SplunkEnterprise/latest/Data/WaystogetdataintoSplunk`,
    `${S}/SplunkEnterprise/latest/Forwarding/Aboutforwardingandreceivingdata`,
  ]},
  { certType: 'Splunk Core Certified Consultant', examType: 'Consultant', topic: 'Indexing', urls: [
    `${S}/SplunkEnterprise/latest/Indexer/Aboutindexesandindexers`,
    `${S}/SplunkEnterprise/latest/Indexer/Setupmultipleindexes`,
  ]},
  { certType: 'Splunk Core Certified Consultant', examType: 'Consultant', topic: 'Search', urls: [
    `${S}/SplunkEnterprise/latest/Search/Writebettersearches`,
    `${S}/SplunkEnterprise/latest/DistSearch/Whatisdistributedsearch`,
  ]},
  { certType: 'Splunk Core Certified Consultant', examType: 'Consultant', topic: 'Configuration Management', urls: [
    `${S}/SplunkEnterprise/latest/Admin/Aboutconfigurationfiles`,
    `${S}/SplunkEnterprise/latest/Updating/Aboutdeploymentserver`,
  ]},
  { certType: 'Splunk Core Certified Consultant', examType: 'Consultant', topic: 'Indexer Clustering', urls: [
    `${S}/SplunkEnterprise/latest/Indexer/Aboutindexerclusters`,
    `${S}/SplunkEnterprise/latest/Indexer/Maintainanindexercluster`,
  ]},
  { certType: 'Splunk Core Certified Consultant', examType: 'Consultant', topic: 'Search Head Clustering', urls: [
    `${S}/SplunkEnterprise/latest/DistSearch/AboutSHC`,
    `${S}/SplunkEnterprise/latest/DistSearch/ManageSHC`,
  ]},

  // ══════════════════════════════════════════════════════════════════════════
  // O11Y METRICS USER — all 8 blueprint topics
  // CERT_FILTER = "Splunk O11y Cloud Certified Metrics User"
  // ══════════════════════════════════════════════════════════════════════════

  { certType: 'Splunk O11y Cloud Certified Metrics User', examType: 'O11y Metrics User', topic: 'Metrics Concepts', urls: [
    `${SOC}/manage-data/metrics-metadata-and-events/metrics-in-splunk-observability-cloud`,
    `${SOC}/get-started/splunk-observability-cloud-overview/splunk-observability-cloud-overview`,
  ]},
  { certType: 'Splunk O11y Cloud Certified Metrics User', examType: 'O11y Metrics User', topic: 'Get Metrics In with OpenTelemetry', urls: [
    `${SOC}/get-started/send-data/get-started-send-data`,
    `${SOC}/get-started/splunk-observability-cloud-overview/splunk-observability-cloud-overview`,
  ]},
  { certType: 'Splunk O11y Cloud Certified Metrics User', examType: 'O11y Metrics User', topic: 'Monitor Using Built-in Content', urls: [
    `${SOC}/create-dashboards-and-charts/create-dashboards/built-in-dashboards`,
    `${SOC}/monitor-infrastructure/use-navigators`,
    `${SOC}/monitor-infrastructure/use-navigators/available-navigators`,
  ]},
  { certType: 'Splunk O11y Cloud Certified Metrics User', examType: 'O11y Metrics User', topic: 'Introduction to Visualizing Metrics', urls: [
    `${SOC}/create-dashboards-and-charts/create-dashboards/built-in-dashboards`,
    `${SOC}/create-dashboards-and-charts/create-dashboards/available-dashboards`,
  ]},
  { certType: 'Splunk O11y Cloud Certified Metrics User', examType: 'O11y Metrics User', topic: 'Introduction to Alerting on Metrics with Detectors', urls: [
    `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/best-practices-for-creating-detectors`,
    `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/alerts-and-detectors`,
  ]},
  { certType: 'Splunk O11y Cloud Certified Metrics User', examType: 'O11y Metrics User', topic: 'Create Efficient Dashboards and Alerts', urls: [
    `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/best-practices-for-creating-detectors`,
    `${SOC}/create-dashboards-and-charts/create-dashboards/built-in-dashboards`,
  ]},
  { certType: 'Splunk O11y Cloud Certified Metrics User', examType: 'O11y Metrics User', topic: 'Finding Insights Using Analytics', urls: [
    `${SOC}/manage-data/metrics-metadata-and-events/metrics-in-splunk-observability-cloud`,
    `${SOC}/monitor-infrastructure/use-navigators`,
  ]},
  { certType: 'Splunk O11y Cloud Certified Metrics User', examType: 'O11y Metrics User', topic: 'Detectors for Common Use Cases', urls: [
    `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/best-practices-for-creating-detectors`,
    `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/alerts-and-detectors`,
  ]},

  // ══════════════════════════════════════════════════════════════════════════
  // CYBERSECURITY DEFENSE ENGINEER — all 6 blueprint topics
  // CERT_FILTER = "Splunk Certified Cybersecurity Defense Engineer"
  // ══════════════════════════════════════════════════════════════════════════

  { certType: 'Splunk Certified Cybersecurity Defense Engineer', examType: 'Cybersecurity Defense Engineer', topic: 'The Cyber Landscape, Frameworks, and Standards', urls: [
    `${ES8}/administer/8.1/detections/use-detections-to-search-for-threats-in-splunk-enterprise-security`,
    `${ES8}/administer/8.4/threat-intelligence/add-new-threat-intelligence-sources-in-splunk-enterprise-security`,
    `${ES8}/user-guide/8.1/analytics/threat-intelligence-dashboards`,
  ]},
  { certType: 'Splunk Certified Cybersecurity Defense Engineer', examType: 'Cybersecurity Defense Engineer', topic: 'Threat and Attack Types, Motivations, and Tactics', urls: [
    `${ES8}/administer/8.4/threat-intelligence/add-new-threat-intelligence-sources-in-splunk-enterprise-security`,
    `${ES8}/administer/8.2/threat-intelligence/configure-threat-lists-in-splunk-enterprise-security`,
    `${ES8}/user-guide/8.1/analytics/threat-intelligence-dashboards`,
  ]},
  { certType: 'Splunk Certified Cybersecurity Defense Engineer', examType: 'Cybersecurity Defense Engineer', topic: 'Defenses, Data Sources, and SIEM Best Practices', urls: [
    `${ES8}/administer/8.2/threat-intelligence/configure-threat-lists-in-splunk-enterprise-security`,
    `${ES8}/administer/8.1/detections/use-detections-to-search-for-threats-in-splunk-enterprise-security`,
    `${ES8}/user-guide/8.1/analytics/threat-intelligence-dashboards`,
  ]},
  { certType: 'Splunk Certified Cybersecurity Defense Engineer', examType: 'Cybersecurity Defense Engineer', topic: 'Investigation, Event Handling, Correlation, and Risk', urls: [
    `${ES8}/user-guide/8.1/analytics/threat-intelligence-dashboards`,
    `${ES8}/administer/8.1/detections/use-detections-to-search-for-threats-in-splunk-enterprise-security`,
    `${ES}/User/Aboutnotableevents`,
    `${ES}/User/Triagenotableevents`,
  ]},
  { certType: 'Splunk Certified Cybersecurity Defense Engineer', examType: 'Cybersecurity Defense Engineer', topic: 'SPL and Efficient Searching', urls: [
    `${S}/SplunkEnterprise/latest/Search/Writebettersearches`,
    'https://help.splunk.com/en/search/spl-search-reference/9.4/spl2-search-reference/splunk-quick-reference-guide',
  ]},
  { certType: 'Splunk Certified Cybersecurity Defense Engineer', examType: 'Cybersecurity Defense Engineer', topic: 'Threat Hunting and Remediation', urls: [
    `${ES8}/administer/8.1/detections/use-detections-to-search-for-threats-in-splunk-enterprise-security`,
    `${ES8}/administer/8.4/threat-intelligence/add-new-threat-intelligence-sources-in-splunk-enterprise-security`,
  ]},

];

// ── Named re-export alias (used by validate-urls.js fixed output) ─────────────
export const SPLUNK_DOC_URLS = splunkDocs;
