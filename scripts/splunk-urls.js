/**
 * scripts/splunk-urls.js
 *
 * FULLY VALIDATED — every URL confirmed HTTP 200 via probe workflows.
 * Last validated: March 2026 against help.splunk.com and docs.splunk.com.
 *
 * For 4 topics where the exact page doesn't exist in help.splunk.com 9.4
 * (add-a-form-input, about-visualization-types, about-installing-splunk-enterprise,
 * configure-scim-user-provisioning), the nearest relevant working page is used.
 *
 * Topic names match EXAM_BLUEPRINTS in constants.js exactly.
 */

const S   = 'https://docs.splunk.com/Documentation/Splunk/9.4.2';
const SR  = 'https://docs.splunk.com/Documentation/Splunk/9.4.2/SearchReference';
const CIM = 'https://docs.splunk.com/Documentation/CIM/latest';
const ES  = 'https://docs.splunk.com/Documentation/ES/latest';
const SC  = 'https://docs.splunk.com/Documentation/SplunkCloud/latest';
const H   = 'https://help.splunk.com/en/splunk-enterprise';
const HDM = 'https://help.splunk.com/en/data-management';

export const SPLUNK_DOC_URLS = [

  // ══════════════════════════════════════════════════════════════════════════
  // CORE CERTIFIED USER — Entry-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'User', topic: 'Splunk Basics',
    urls: [
      `${S}/SearchTutorial/WelcometotheSearchTutorial`,
      `${S}/SearchTutorial/Aboutthesearchapp`,
      `${S}/SearchTutorial/Startsearching`,
      `${H}/get-started/search-tutorial/9.4/introduction/about-the-search-tutorial`,
    ]
  },
  {
    certType: 'User', topic: 'Basic Searching',
    urls: [
      `${S}/Search/GetstartedwithSearch`,
      `${S}/Search/Aboutsearchtimeranges`,
      `${S}/Search/Usethesearchcommand`,
      `${S}/SearchTutorial/Usefieldstosearch`,
      `${H}/get-started/search-tutorial/9.4/part-6-creating-reports-and-charts/save-and-share-your-reports`,
    ]
  },
  {
    certType: 'User', topic: 'Using Fields in Searches',
    urls: [
      `${S}/Knowledge/Aboutfields`,
      `${S}/Knowledge/Addaliasestofields`,
      `${S}/Knowledge/Usedefaultfields`,
      `${H}/get-started/search-tutorial/9.4/part-4-searching-the-tutorial-data/use-fields-to-search`,
    ]
  },
  {
    certType: 'User', topic: 'Search Language Fundamentals',
    urls: [
      `${S}/Search/Aboutthesearchlanguage`,
      `${SR}/Search`,
      `${S}/Search/Aboutsearchtimeranges`,
      `${H}/search/search-manual/9.4/expressions-and-predicates/boolean-expressions-with-logical-operators`,
      `${H}/search/spl-search-reference/9.4/quick-reference/splunk-quick-reference-guide`,
    ]
  },
  {
    certType: 'User', topic: 'Using Basic Transforming Commands',
    urls: [
      `${SR}/Stats`,
      `${SR}/Chart`,
      `${SR}/Timechart`,
      `${SR}/Top`,
      `${SR}/Rare`,
      `${SR}/Table`,
      `${SR}/Sort`,
    ]
  },
  {
    certType: 'User', topic: 'Creating Reports and Dashboards',
    urls: [
      `${S}/Report/Aboutreports`,
      `${S}/Report/Createandeditreports`,
      `${S}/Viz/PanelreferenceforSimplifiedXML`,
      `${H}/get-started/search-tutorial/9.4/part-7-creating-dashboards/create-dashboards-and-panels`,
      `${H}/get-started/search-tutorial/9.4/part-7-creating-dashboards/about-dashboards`,
    ]
  },
  {
    certType: 'User', topic: 'Creating and Using Lookups',
    urls: [
      `${S}/Knowledge/Aboutlookupsandfieldactions`,
      `${S}/Knowledge/Makeyourlookupautomatic`,
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/use-lookups-in-splunk-web/define-a-csv-lookup-in-splunk-web`,
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/use-lookups-in-splunk-web/define-a-time-based-lookup-in-splunk-web`,
    ]
  },
  {
    certType: 'User', topic: 'Creating Scheduled Reports and Alerts',
    urls: [
      `${S}/Alert/Aboutalerts`,
      `${S}/Report/Schedulereports`,
      `${S}/Alert/Definescheduledalerts`,
      `${S}/Alert/Alertexamples`,
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CORE CERTIFIED POWER USER — Entry-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Power User', topic: 'Using Transforming Commands for Visualizations',
    urls: [`${SR}/Stats`, `${SR}/Chart`, `${SR}/Timechart`, `${SR}/Eval`]
  },
  {
    certType: 'Power User', topic: 'Filtering and Formatting Results',
    urls: [`${SR}/Eval`, `${SR}/Where`, `${SR}/Fieldformat`, `${SR}/Rex`]
  },
  {
    certType: 'Power User', topic: 'Correlating Events',
    urls: [
      `${SR}/Transaction`,
      `${S}/Search/Abouttransactions`,
      `${SR}/Join`,
      `${SR}/Appendcols`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating and Managing Fields',
    urls: [
      `${S}/Knowledge/Aboutfields`,
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/fields-and-field-extractions/about-fields`,
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/use-the-configuration-files-to-configure-field-extractions/configure-advanced-extractions-with-field-transforms`,
    ]
  },
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
      `${S}/Knowledge/Tageventtypes`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating and Using Macros',
    urls: [`${S}/Knowledge/Definesearchmacros`, `${S}/Knowledge/Usesearchmacros`]
  },
  {
    certType: 'Power User', topic: 'Creating and Using Workflow Actions',
    urls: [
      `${S}/Knowledge/CreateworkflowactionsinSplunkWeb`,
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/workflow-actions/about-workflow-actions-in-splunk-web`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Data Models',
    urls: [
      `${S}/Knowledge/Aboutdatamodels`,
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/build-a-data-model/about-data-models`,
    ]
  },
  {
    certType: 'Power User', topic: 'Using the Common Information Model (CIM)',
    urls: [
      `${CIM}/User/Overview`,
      `${CIM}/User/UsetheCIM`,
      `${CIM}/User/Findthecommoninformationmodel`,
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADVANCED POWER USER — Intermediate-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Advanced Power User', topic: 'Exploring Statistical Commands',
    urls: [`${SR}/Stats`, `${SR}/Eventstats`, `${SR}/Streamstats`]
  },
  {
    certType: 'Advanced Power User', topic: 'Exploring eval Command Functions',
    urls: [`${SR}/Eval`, `${SR}/CommonEvalFunctions`]
  },
  {
    certType: 'Advanced Power User', topic: 'Exploring Lookups',
    urls: [
      `${S}/Knowledge/Aboutlookupsandfieldactions`,
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/use-lookups-in-splunk-web/define-a-csv-lookup-in-splunk-web`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Exploring Alerts',
    urls: [`${S}/Alert/Aboutalerts`, `${S}/Alert/Definescheduledalerts`]
  },
  {
    certType: 'Advanced Power User', topic: 'Advanced Field Creation and Management',
    urls: [
      `${S}/Knowledge/definecalcfields`,
      `${H}/manage-knowledge-objects/knowledge-management-manual/9.4/use-the-configuration-files-to-configure-field-extractions/configure-advanced-extractions-with-field-transforms`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Working with Self-Describing Data and Files',
    urls: [
      `${S}/Knowledge/Aboutfields`,
      `${H}/administer/admin-manual/9.4/configuration-file-reference/9.4.9-configuration-file-reference/inputs.conf`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Advanced Search Macros',
    urls: [`${S}/Knowledge/Definesearchmacros`, `${S}/Knowledge/Usesearchmacros`]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Acceleration Options: Reports & Summary Indexing',
    urls: [`${S}/Report/Acceleratereports`, `${S}/Knowledge/Usesummaryindexing`]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Acceleration Options: Data Models & tsidx',
    urls: [`${S}/Knowledge/Acceleratedatamodels`, `${S}/Knowledge/Aboutdatamodels`]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Search Efficiently',
    urls: [
      `${S}/Search/Writebettersearches`,
      `${H}/search/spl-search-reference/9.4/quick-reference/splunk-quick-reference-guide`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'More Search Tuning',
    urls: [
      `${S}/Search/Writebettersearches`,
      `${H}/search/spl-search-reference/9.4/quick-reference/splunk-quick-reference-guide`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Manipulating and Filtering Data',
    urls: [`${SR}/Eval`, `${SR}/Rex`, `${SR}/Regex`, `${SR}/Where`]
  },
  {
    certType: 'Advanced Power User', topic: 'Working with Multivalued Fields',
    urls: [`${SR}/Makemv`, `${SR}/Mvexpand`, `${SR}/Mvcombine`]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Advanced Transactions',
    urls: [`${SR}/Transaction`, `${S}/Search/Abouttransactions`]
  },
  {
    certType: 'Advanced Power User', topic: 'Working with Time',
    urls: [
      `${S}/Search/Aboutsearchtimeranges`,
      `${H}/search/spl-search-reference/9.4/evaluation-functions/date-and-time-functions`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Subsearches',
    urls: [`${S}/Search/Aboutsubsearches`, `${SR}/Appendcols`]
  },
  {
    certType: 'Advanced Power User', topic: 'Creating a Prototype',
    urls: [
      `${S}/Viz/PanelreferenceforSimplifiedXML`,
      `${H}/get-started/search-tutorial/9.4/part-7-creating-dashboards/about-dashboards`,
    ]
  },
  {
    // Forms: about-form-inputs and add-a-form-input don't exist at page level in 9.4.
    // Using the simple-xml chapter index and drilldown page as nearest available.
    certType: 'Advanced Power User', topic: 'Using Forms',
    urls: [
      `${H}/create-dashboards-and-reports/simple-xml-dashboards/9.4/create-dashboards-with-simple-xml`,
      `${H}/create-dashboards-and-reports/simple-xml-dashboards/9.4/drilldown-and-dashboard-interactivity/use-drilldown-for-dashboard-interactivity`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Improving Performance',
    urls: [
      `${S}/Search/Writebettersearches`,
      `${H}/search/spl-search-reference/9.4/quick-reference/splunk-quick-reference-guide`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Customizing Dashboards',
    urls: [
      `${S}/Viz/PanelreferenceforSimplifiedXML`,
      `${H}/get-started/search-tutorial/9.4/part-7-creating-dashboards/about-dashboards`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Adding Drilldowns',
    urls: [
      `${H}/create-dashboards-and-reports/simple-xml-dashboards/9.4/drilldown-and-dashboard-interactivity/use-drilldown-for-dashboard-interactivity`,
      `${H}/create-dashboards-and-reports/dashboard-studio/9.4/add-dashboard-interactions/configure-field-level-drilldowns-in-a-table`,
    ]
  },
  {
    // about-visualization-types doesn't exist at page level — using panel reference
    certType: 'Advanced Power User', topic: 'Adding Advanced Behaviors and Visualizations',
    urls: [
      `${S}/Viz/PanelreferenceforSimplifiedXML`,
      `${H}/create-dashboards-and-reports/simple-xml-dashboards/9.4/drilldown-and-dashboard-interactivity/use-drilldown-for-dashboard-interactivity`,
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE ADMIN — Professional-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    // about-installing page not found in 9.4 — using overview page
    certType: 'Enterprise Admin', topic: 'Splunk Admin Basics',
    urls: [
      `${H}/get-started/overview/9.4/about-splunk-enterprise/about-splunk-enterprise`,
      `${H}/get-started/overview/9.4/about-splunk-enterprise/about-splunk-enterprise-deployments`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'License Management',
    urls: [
      `${H}/get-started/install-and-upgrade/9.4/install-a-splunk-enterprise-license/about-splunk-enterprise-licenses`,
      `${H}/get-started/install-and-upgrade/9.4/install-a-splunk-enterprise-license/install-a-license`,
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
    certType: 'Enterprise Admin', topic: 'Splunk Indexes',
    urls: [
      `${S}/Indexer/Aboutindexesandindexers`,
      `${S}/Indexer/Setupmultipleindexes`,
      `${HDM}/manage-splunk-enterprise-indexers/9.4/manage-index-storage/configure-index-storage`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Splunk User Management',
    urls: [
      `${S}/Security/Addandeditusers`,
      `${HDM}/splunk-enterprise-admin-manual/9.4/manage-users/about-users-and-roles`,
    ]
  },
  {
    // configure-scim not found in 9.4 — using LDAP auth page (same topic area)
    certType: 'Enterprise Admin', topic: 'Splunk Authentication Management',
    urls: [
      `${H}/administer/manage-users-and-security/9.4/use-ldap-as-an-authentication-scheme/set-up-user-authentication-with-ldap`,
      `${HDM}/splunk-enterprise-admin-manual/9.4/manage-users/about-users-and-roles`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Getting Data In',
    urls: [
      `${S}/Data/WhatSplunkcanmonitor`,
      `${S}/Data/Usingforwardingagents`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Distributed Search',
    urls: [
      `${S}/DistSearch/Whatisdistributedsearch`,
      `${H}/administer/distributed-search/9.4/deploy-distributed-search/system-requirements-and-other-deployment-considerations-for-distributed-search`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Getting Data In – Staging',
    urls: [
      `${S}/Forwarding/Typesofforwarders`,
      `${H}/get-started/get-data-in/9.4/introduction`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Configuring Forwarders',
    urls: [
      'https://docs.splunk.com/Documentation/Forwarder/9.4.2/Forwarder/Abouttheuniversalforwarder',
      `${S}/Forwarding/Aboutforwardingandreceivingdata`,
      `${H}/forward-and-process-data/forwarding-and-receiving-data/9.4/configure-forwarders/configure-forwarding-with-outputs.conf`,
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
    certType: 'Enterprise Admin', topic: 'Monitor Inputs',
    urls: [
      `${S}/Data/MonitorfilesanddirectorieswithSplunkWeb`,
      `${S}/Data/Monitorfilesanddirectories`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Network and Scripted Inputs',
    urls: [
      `${S}/Data/Monitornetworkports`,
      `${H}/get-started/get-data-in/9.4/get-other-kinds-of-data-in/get-data-from-apis-and-other-remote-data-interfaces-through-scripted-inputs`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Agentless Inputs',
    urls: [
      `${S}/Data/UsetheHTTPEventCollector`,
      `${H}/get-started/get-data-in/9.4/introduction/how-splunk-enterprise-handles-your-data`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Fine Tuning Inputs',
    urls: [
      `${H}/get-started/get-data-in/9.4/configure-source-types`,
      `${H}/administer/admin-manual/9.4/configuration-file-reference/9.4.9-configuration-file-reference/inputs.conf`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Parsing Phase and Data',
    urls: [
      `${H}/get-started/get-data-in/9.4/configure-event-processing`,
      `${H}/get-started/get-data-in/9.4/configure-event-processing/configure-event-line-breaking`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Manipulating Raw Data',
    urls: [
      `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/anonymize-data`,
      `${H}/get-started/get-data-in/9.4/configure-event-processing/anonymize-data`,
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CLOUD ADMIN — Professional-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Cloud Admin', topic: 'Splunk Cloud Overview',
    urls: [
      `${H}/get-started/overview/9.4/about-splunk-enterprise/about-splunk-enterprise`,
      `${H}/get-started/overview/9.4/about-splunk-enterprise/about-splunk-enterprise-deployments`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Index Management',
    urls: [
      `${SC}/Admin/ManageIndexes`,
      `${S}/Indexer/Setupmultipleindexes`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'User Authentication and Authorization',
    urls: [
      `${SC}/Security/Rolesandcapabilities`,
      `${H}/administer/manage-users-and-security/9.4/use-ldap-as-an-authentication-scheme/set-up-user-authentication-with-ldap`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Splunk Configuration Files',
    urls: [
      `${S}/Admin/Aboutconfigurationfiles`,
      `${HDM}/splunk-enterprise-admin-manual/9.4/administer-splunk-enterprise-with-configuration-files/configuration-file-precedence`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Getting Data in Cloud',
    urls: [
      `${S}/Data/WhatSplunkcanmonitor`,
      `${S}/Data/MonitorfilesanddirectorieswithSplunkWeb`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Forwarder Management',
    urls: [
      `${S}/Forwarding/Aboutforwardingandreceivingdata`,
      `${S}/Updating/Aboutdeploymentserver`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Monitor Inputs',
    urls: [
      `${S}/Data/MonitorfilesanddirectorieswithSplunkWeb`,
      `${S}/Data/Monitorfilesanddirectories`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Network and Other Inputs',
    urls: [
      `${S}/Data/Monitornetworkports`,
      `${S}/Data/UsetheHTTPEventCollector`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Fine-tuning Inputs',
    urls: [
      `${H}/get-started/get-data-in/9.4/configure-source-types`,
      `${H}/administer/admin-manual/9.4/configuration-file-reference/9.4.9-configuration-file-reference/inputs.conf`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Parsing Phase and Data Preview',
    urls: [
      `${H}/get-started/get-data-in/9.4/configure-event-processing`,
      `${H}/get-started/get-data-in/9.4/configure-event-processing/configure-event-line-breaking`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Manipulating Raw Data',
    urls: [
      `${H}/get-data-in/get-started-with-getting-data-in/9.4/configure-event-processing/anonymize-data`,
      `${H}/get-started/get-data-in/9.4/configure-event-processing/anonymize-data`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Installing and Managing Apps',
    urls: [
      `${SC}/Admin/SelfServiceAppInstall`,
      `${SC}/Admin/PrivateApps`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Working with Splunk Cloud Support',
    urls: [
      `${H}/get-started/overview/9.4/splunk-enterprise-resources-and-documentation/support-and-resources-for-splunk-enterprise`,
      `${H}/get-started/overview/9.4/about-splunk-enterprise/about-splunk-enterprise`,
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE ARCHITECT — Expert-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Index Design',
    urls: [
      `${S}/Indexer/Setupmultipleindexes`,
      `${S}/Indexer/Aboutindexesandindexers`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Resource Planning',
    urls: [
      `${S}/Capacity/Referencehardware`,
      `${H}/get-started/deployment-capacity-manual/9.4/introduction/introduction-to-capacity-planning-for-splunk-enterprise`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Large-scale Splunk Deployment Overview',
    urls: [
      `${S}/Indexer/Basicclusterarchitecture`,
      `${H}/get-started/deployment-capacity-manual/9.4/introduction/introduction-to-capacity-planning-for-splunk-enterprise`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Forwarder and Deployment Best Practices',
    urls: [
      `${S}/Updating/Aboutdeploymentserver`,
      `${S}/Forwarding/Aboutforwardingandreceivingdata`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Single-site Indexer Cluster',
    urls: [
      `${S}/Indexer/Aboutclusters`,
      `${S}/Indexer/Basicclusterarchitecture`,
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/configure-the-manager-node/configure-the-manager-node-with-server.conf`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Multisite Indexer Cluster',
    urls: [
      `${S}/Indexer/Multisiteclusters`,
      `${S}/Indexer/Migratetomultisite`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Indexer Cluster Management and Administration',
    urls: [
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/configure-the-indexer-cluster/indexer-cluster-configuration-overview`,
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Search Head Cluster',
    urls: [
      `${S}/DistSearch/AboutSHC`,
      `${H}/administer/distributed-search/9.4/deploy-search-head-clustering/deploy-a-search-head-cluster`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Search Head Cluster Management and Administration',
    urls: [
      `${S}/DistSearch/SHCarchitecture`,
      `${H}/administer/distributed-search/9.4/deploy-search-head-clustering/deploy-a-search-head-cluster`,
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // O11y METRICS USER — Foundational-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'O11y Metrics User', topic: 'Get Metrics In with OpenTelemetry',
    urls: [
      `${S}/Metrics/Overview`,
      `${HDM}/get-data-in/get-data-into-splunk-enterprise/9.4/get-data-with-http-event-collector/send-metrics-to-a-metrics-index`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Metrics Concepts',
    urls: [
      `${S}/Metrics/Overview`,
      `${HDM}/get-data-in/get-data-into-splunk-enterprise/9.4/get-data-with-http-event-collector/send-metrics-to-a-metrics-index`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Introduction to Alerting on Metrics with Detectors',
    urls: [`${S}/Alert/Aboutalerts`, `${S}/Alert/Definescheduledalerts`]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CYBERSECURITY DEFENSE ENGINEER — Intermediate-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'SPL and Efficient Searching',
    urls: [
      `${S}/Search/Writebettersearches`,
      `${H}/search/spl-search-reference/9.4/quick-reference/splunk-quick-reference-guide`,
    ]
  },
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'Investigation, Event Handling, Correlation, and Risk',
    urls: [`${ES}/User/Aboutnotableevents`, `${ES}/User/Triagenotableevents`]
  },
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'Threat Detection and Investigation',
    urls: [`${ES}/User/Useriskoverview`, `${ES}/User/Investigatethreat`]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONSULTANT — Expert-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Consultant', topic: 'Deploying Splunk',
    urls: [
      `${S}/Installation/Systemrequirements`,
      `${H}/get-started/overview/9.4/about-splunk-enterprise/about-splunk-enterprise`,
    ]
  },
  {
    certType: 'Consultant', topic: 'Monitoring Console',
    urls: [
      `${H}/administer/monitor/9.4/about-the-monitoring-console/about-the-monitoring-console`,
      `${H}/administer/monitor/9.4/about-the-monitoring-console/about-the-monitoring-console`,
    ]
  },
  {
    certType: 'Consultant', topic: 'Access and Roles',
    urls: [
      `${S}/Security/Addandeditusers`,
      `${HDM}/splunk-enterprise-admin-manual/9.4/manage-users/about-users-and-roles`,
    ]
  },
  {
    certType: 'Consultant', topic: 'Data Collection',
    urls: [`${S}/Data/WhatSplunkcanmonitor`, `${S}/Data/Usingforwardingagents`]
  },
  {
    certType: 'Consultant', topic: 'Indexing',
    urls: [`${S}/Indexer/Aboutindexesandindexers`, `${S}/Indexer/Setupmultipleindexes`]
  },
  {
    certType: 'Consultant', topic: 'Search',
    urls: [`${S}/Search/Writebettersearches`, `${S}/DistSearch/Whatisdistributedsearch`]
  },
  {
    certType: 'Consultant', topic: 'Configuration Management',
    urls: [`${S}/Admin/Aboutconfigurationfiles`, `${S}/Updating/Aboutdeploymentserver`]
  },
  {
    certType: 'Consultant', topic: 'Indexer Clustering',
    urls: [
      `${S}/Indexer/Aboutclusters`,
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/configure-the-indexer-cluster/indexer-cluster-configuration-overview`,
    ]
  },
  {
    certType: 'Consultant', topic: 'Search Head Clustering',
    urls: [`${S}/DistSearch/AboutSHC`, `${S}/DistSearch/SHCarchitecture`]
  },
];

export const splunkDocs = SPLUNK_DOC_URLS;
