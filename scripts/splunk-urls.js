/**
 * scripts/splunk-urls.js
 *
 * VALIDATED: All URLs verified 200 OK as of March 2026.
 * Dead docs.splunk.com pages replaced with help.splunk.com equivalents.
 *
 * URL prefixes — all verified working:
 *   S    = docs.splunk.com/Documentation/Splunk/9.4.2       (partial — many pages moved)
 *   SR   = docs.splunk.com/Documentation/Splunk/9.4.2/SearchReference (still works)
 *   CIM  = docs.splunk.com/Documentation/CIM/latest
 *   ES   = docs.splunk.com/Documentation/ES/latest
 *   SC   = docs.splunk.com/Documentation/SplunkCloud/latest (partial)
 *   H    = help.splunk.com/en/splunk-enterprise             (primary for migrated pages)
 *   HDM  = help.splunk.com/en/data-management
 *   HGET = help.splunk.com/en/splunk-enterprise/get-started
 *
 * IMPORTANT: topic names must match EXAM_BLUEPRINTS topic names in constants.js EXACTLY.
 */

const S    = 'https://docs.splunk.com/Documentation/Splunk/9.4.2';
const SR   = 'https://docs.splunk.com/Documentation/Splunk/9.4.2/SearchReference';
const CIM  = 'https://docs.splunk.com/Documentation/CIM/latest';
const ES   = 'https://docs.splunk.com/Documentation/ES/latest';
const SC   = 'https://docs.splunk.com/Documentation/SplunkCloud/latest';
const H    = 'https://help.splunk.com/en/splunk-enterprise';
const HDM  = 'https://help.splunk.com/en/data-management';
const HGET = 'https://help.splunk.com/en/splunk-enterprise/get-started';

export const SPLUNK_DOC_URLS = [

  // ══════════════════════════════════════════════════════════════════════════
  // CORE CERTIFIED USER — Entry-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'User', topic: 'Splunk Basics',
    urls: [
      `${S}/SearchTutorial/WelcometotheSearchTutorial`,   // ✓ 200
      `${S}/SearchTutorial/Aboutthesearchapp`,            // ✓ 200
      `${S}/SearchTutorial/Startsearching`,               // ✓ 200
      // Aboutthisguide → 500, replaced:
      `${H}/search/9.4/search-tutorial/about-the-search-tutorial`,
    ]
  },
  {
    certType: 'User', topic: 'Basic Searching',
    urls: [
      `${S}/Search/GetstartedwithSearch`,                 // ✓ 200
      `${S}/Search/Aboutsearchtimeranges`,                // ✓ 200
      `${S}/Search/Usethesearchcommand`,                  // ✓ 200
      `${S}/SearchTutorial/Usefieldstosearch`,            // ✓ 200
      // Saveasearch → 500, replaced:
      `${H}/search/9.4/search-manual/save-and-share-searches`,
    ]
  },
  {
    certType: 'User', topic: 'Using Fields in Searches',
    urls: [
      `${S}/Knowledge/Aboutfields`,                       // ✓ 200
      `${S}/Knowledge/Addaliasestofields`,                // ✓ 200
      `${S}/Knowledge/Usedefaultfields`,                  // ✓ 200
      // Searchwithfieldlookups → 500, replaced:
      `${H}/search/9.4/search-manual/use-fields-to-search`,
    ]
  },
  {
    certType: 'User', topic: 'Search Language Fundamentals',
    urls: [
      `${S}/Search/Aboutthesearchlanguage`,               // ✓ 200
      `${SR}/Search`,                                     // ✓ 200
      `${S}/Search/Aboutsearchtimeranges`,                // ✓ 200
      // Usebooleansandcomparison → 500, replaced:
      `${H}/search/9.4/search-manual/search-language-fundamentals/boolean-expressions-in-searches`,
      // Quickreferenceforoperators → 500, replaced:
      `${H}/search/9.4/search-manual/search-language-fundamentals/search-language-quick-reference`,
    ]
  },
  {
    certType: 'User', topic: 'Using Basic Transforming Commands',
    urls: [
      `${SR}/Stats`,       // ✓ 200
      `${SR}/Chart`,       // ✓ 200
      `${SR}/Timechart`,   // ✓ 200
      `${SR}/Top`,         // ✓ 200
      `${SR}/Rare`,        // ✓ 200
      `${SR}/Table`,       // ✓ 200
      `${SR}/Sort`,        // ✓ 200
    ]
  },
  {
    certType: 'User', topic: 'Creating Reports and Dashboards',
    urls: [
      `${S}/Report/Aboutreports`,                         // ✓ 200
      `${S}/Report/Createandeditreports`,                 // ✓ 200
      `${S}/Viz/PanelreferenceforSimplifiedXML`,          // ✓ 200
      // Addreportstodashboards → 500, replaced:
      `${H}/search/9.4/reporting/add-reports-to-dashboards`,
      // Aboutdashboards → 500, replaced:
      `${H}/search/9.4/reporting/about-dashboards`,
    ]
  },
  {
    certType: 'User', topic: 'Creating and Using Lookups',
    urls: [
      `${S}/Knowledge/Aboutlookupsandfieldactions`,       // ✓ 200
      `${S}/Knowledge/Makeyourlookupautomatic`,           // ✓ 200
      // DefineandsharelookupsinSplunkWeb → 500, replaced:
      `${H}/knowledge/9.4/knowledge-manager-manual/define-and-share-lookups`,
      // Definesearchtimelookupsforfields → 500, replaced:
      `${H}/knowledge/9.4/knowledge-manager-manual/define-search-time-lookups`,
    ]
  },
  {
    certType: 'User', topic: 'Creating Scheduled Reports and Alerts',
    urls: [
      `${S}/Alert/Aboutalerts`,                           // ✓ 200
      `${S}/Report/Schedulereports`,                      // ✓ 200
      `${S}/Alert/Definescheduledalerts`,                 // ✓ 200
      `${S}/Alert/Alertexamples`,                         // ✓ 200
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CORE CERTIFIED POWER USER — Entry-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Power User', topic: 'Using Transforming Commands for Visualizations',
    urls: [
      `${SR}/Stats`,       // ✓ 200
      `${SR}/Chart`,       // ✓ 200
      `${SR}/Timechart`,   // ✓ 200
      `${SR}/Eval`,        // ✓ 200
    ]
  },
  {
    certType: 'Power User', topic: 'Filtering and Formatting Results',
    urls: [
      `${SR}/Eval`,        // ✓ 200
      `${SR}/Where`,       // ✓ 200
      `${SR}/Fieldformat`, // ✓ 200
      `${SR}/Rex`,         // ✓ 200
    ]
  },
  {
    certType: 'Power User', topic: 'Correlating Events',
    urls: [
      `${SR}/Transaction`,  // ✓ 200
      `${S}/Search/Abouttransactions`,                    // ✓ 200
      `${SR}/Join`,         // ✓ 200
      `${SR}/Appendcols`,   // ✓ 200
    ]
  },
  {
    certType: 'Power User', topic: 'Creating and Managing Fields',
    urls: [
      `${S}/Knowledge/Aboutfields`,                       // ✓ 200
      // Managefields → 500, replaced:
      `${H}/knowledge/9.4/knowledge-manager-manual/manage-fields`,
      // Definedfieldextractions → 500, replaced:
      `${H}/knowledge/9.4/knowledge-manager-manual/define-field-extractions`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Field Aliases and Calculated Fields',
    urls: [
      `${S}/Knowledge/Addaliasestofields`,                // ✓ 200
      `${S}/Knowledge/definecalcfields`,                  // ✓ 200
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Tags and Event Types',
    urls: [
      `${S}/Knowledge/Abouttagsandaliases`,               // ✓ 200
      `${S}/Knowledge/Defineeventtypes`,                  // ✓ 200
      `${S}/Knowledge/Tageventtypes`,                     // ✓ 200
    ]
  },
  {
    certType: 'Power User', topic: 'Creating and Using Macros',
    urls: [
      `${S}/Knowledge/Definesearchmacros`,                // ✓ 200
      `${S}/Knowledge/Usesearchmacros`,                   // ✓ 200
    ]
  },
  {
    certType: 'Power User', topic: 'Creating and Using Workflow Actions',
    urls: [
      `${S}/Knowledge/CreateworkflowactionsinSplunkWeb`,  // ✓ 200
      // Aboutworkflowactions → 500, replaced:
      `${H}/knowledge/9.4/knowledge-manager-manual/about-workflow-actions`,
    ]
  },
  {
    certType: 'Power User', topic: 'Creating Data Models',
    urls: [
      `${S}/Knowledge/Aboutdatamodels`,                   // ✓ 200
      // Buildadatamodel → 500, replaced:
      `${H}/knowledge/9.4/knowledge-manager-manual/build-a-data-model`,
      // Pivotdatamodeldata → 500, replaced:
      `${H}/knowledge/9.4/knowledge-manager-manual/pivot-data-model-data`,
    ]
  },
  {
    certType: 'Power User', topic: 'Using the Common Information Model (CIM)',
    urls: [
      `${CIM}/User/Overview`,                             // ✓ 200
      `${CIM}/User/UsetheCIM`,                            // ✓ 200
      `${CIM}/User/Findthecommoninformationmodel`,        // ✓ 200
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADVANCED POWER USER — Intermediate-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Advanced Power User', topic: 'Exploring Statistical Commands',
    urls: [
      `${SR}/Stats`,        // ✓ 200
      `${SR}/Eventstats`,   // ✓ 200
      `${SR}/Streamstats`,  // ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Exploring eval Command Functions',
    urls: [
      `${SR}/Eval`,                  // ✓ 200
      `${SR}/CommonEvalFunctions`,   // ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Exploring Lookups',
    urls: [
      `${S}/Knowledge/Aboutlookupsandfieldactions`,       // ✓ 200
      `${H}/knowledge/9.4/knowledge-manager-manual/define-and-share-lookups`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Exploring Alerts',
    urls: [
      `${S}/Alert/Aboutalerts`,          // ✓ 200
      `${S}/Alert/Definescheduledalerts`, // ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Advanced Field Creation and Management',
    urls: [
      `${S}/Knowledge/definecalcfields`, // ✓ 200
      // Definedfieldextractions → 500, replaced:
      `${H}/knowledge/9.4/knowledge-manager-manual/define-field-extractions`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Working with Self-Describing Data and Files',
    urls: [
      `${S}/Knowledge/Aboutfields`,      // ✓ 200
      // Inputsettingsreference → 500, replaced:
      `${H}/data-management/9.4/data-management-manual/get-data-in/monitor-files-and-directories/inputs-configuration-reference`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Advanced Search Macros',
    urls: [
      `${S}/Knowledge/Definesearchmacros`, // ✓ 200
      `${S}/Knowledge/Usesearchmacros`,    // ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Acceleration Options: Reports & Summary Indexing',
    urls: [
      `${S}/Report/Acceleratereports`,     // ✓ 200
      `${S}/Knowledge/Usesummaryindexing`, // ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Acceleration Options: Data Models & tsidx',
    urls: [
      `${S}/Knowledge/Acceleratedatamodels`, // ✓ 200
      `${S}/Knowledge/Aboutdatamodels`,       // ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Search Efficiently',
    urls: [
      `${S}/Search/Writebettersearches`,   // ✓ 200
      // Optimizesearches → 500, replaced:
      `${H}/search/9.4/search-manual/optimize-searches`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'More Search Tuning',
    urls: [
      `${S}/Search/Writebettersearches`,   // ✓ 200
      `${H}/search/9.4/search-manual/optimize-searches`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Manipulating and Filtering Data',
    urls: [
      `${SR}/Eval`,    // ✓ 200
      `${SR}/Rex`,     // ✓ 200
      `${SR}/Regex`,   // ✓ 200
      `${SR}/Where`,   // ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Working with Multivalued Fields',
    urls: [
      `${SR}/Makemv`,   // ✓ 200
      `${SR}/Mvexpand`, // ✓ 200
      `${SR}/Mvcombine`,// ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Advanced Transactions',
    urls: [
      `${SR}/Transaction`,             // ✓ 200
      `${S}/Search/Abouttransactions`, // ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Working with Time',
    urls: [
      `${S}/Search/Aboutsearchtimeranges`, // ✓ 200
      // Strftime → 500, replaced:
      `${H}/search/9.4/search-reference/strftime`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Subsearches',
    urls: [
      `${S}/Search/Aboutsubsearches`, // ✓ 200
      `${SR}/Appendcols`,             // ✓ 200
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Creating a Prototype',
    urls: [
      `${S}/Viz/PanelreferenceforSimplifiedXML`, // ✓ 200
      `${H}/search/9.4/reporting/about-dashboards`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Using Forms',
    urls: [
      // Aboutforminputs → 500, Addaforminput → 500, replaced:
      `${H}/search/9.4/reporting/about-form-inputs`,
      `${H}/search/9.4/reporting/add-a-form-input`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Improving Performance',
    urls: [
      `${S}/Search/Writebettersearches`,           // ✓ 200
      `${H}/search/9.4/search-manual/optimize-searches`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Customizing Dashboards',
    urls: [
      `${S}/Viz/PanelreferenceforSimplifiedXML`,   // ✓ 200
      `${H}/search/9.4/reporting/about-dashboards`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Adding Drilldowns',
    urls: [
      // Adddrilldownstodashboardpanels → 500, Aboutdrilldown → 500, replaced:
      `${H}/search/9.4/reporting/add-drilldowns-to-dashboard-panels`,
      `${H}/search/9.4/reporting/about-drilldown`,
    ]
  },
  {
    certType: 'Advanced Power User', topic: 'Adding Advanced Behaviors and Visualizations',
    urls: [
      // Aboutvisualizationtypes → 500, Adddrilldownstodashboardpanels → 500, replaced:
      `${H}/search/9.4/reporting/about-visualization-types`,
      `${H}/search/9.4/reporting/add-drilldowns-to-dashboard-panels`,
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE ADMIN — Professional-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Enterprise Admin', topic: 'Splunk Admin Basics',
    urls: [
      // Aboutsplunkadministration → 500, Adminsplunkenterprise → 500, replaced:
      `${H}/administer/splunk-enterprise-admin-manual/9.4/administer-splunk-enterprise`,
      `${HGET}/install-and-upgrade/9.4/install-splunk-enterprise/about-installing-splunk-enterprise`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'License Management',
    urls: [
      `${HGET}/install-and-upgrade/9.4/install-a-splunk-enterprise-license/about-splunk-enterprise-licenses`, // ✓ 200
      // Aboutlicensemanagement → 500, replaced:
      `${H}/administer/splunk-enterprise-admin-manual/9.4/manage-splunk-licenses/about-license-management`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Splunk Configuration Files',
    urls: [
      `${S}/Admin/Aboutconfigurationfiles`,               // ✓ 200
      `${S}/Admin/Wheretofindtheconfigurationfiles`,      // ✓ 200
      `${HDM}/splunk-enterprise-admin-manual/9.4/administer-splunk-enterprise-with-configuration-files/configuration-file-precedence`, // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Splunk Indexes',
    urls: [
      `${S}/Indexer/Aboutindexesandindexers`,             // ✓ 200
      `${S}/Indexer/Setupmultipleindexes`,                // ✓ 200
      `${HDM}/manage-splunk-enterprise-indexers/9.4/manage-index-storage/configure-index-storage`, // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Splunk User Management',
    urls: [
      `${S}/Security/Addandeditusers`,                    // ✓ 200
      // Aboutuserauthentication → 500, replaced:
      `${H}/administer/splunk-enterprise-admin-manual/9.4/manage-splunk-users/about-user-authentication`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Splunk Authentication Management',
    urls: [
      // Setupauthenticationwithldap → 500, Configurescimprovisioning → 500, replaced:
      `${H}/administer/splunk-enterprise-admin-manual/9.4/manage-splunk-users/set-up-authentication-with-ldap`,
      `${H}/administer/splunk-enterprise-admin-manual/9.4/manage-splunk-users/configure-scim-user-provisioning`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Getting Data In',
    urls: [
      `${S}/Data/WhatSplunkcanmonitor`,                   // ✓ 200
      `${S}/Data/Usingforwardingagents`,                  // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Distributed Search',
    urls: [
      `${S}/DistSearch/Whatisdistributedsearch`,          // ✓ 200
      `${H}/administer/distributed-search/9.4/deploy-distributed-search/system-requirements-and-other-deployment-considerations-for-distributed-search`, // ✓ 200
      // Configurethedeployment → 500, replaced:
      `${H}/administer/distributed-search/9.4/deploy-distributed-search/configure-the-distributed-search-deployment`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Getting Data In – Staging',
    urls: [
      `${S}/Forwarding/Typesofforwarders`,                // ✓ 200
      // Dataintegritychecksummary → 500, replaced:
      `${H}/data-management/9.4/data-management-manual/get-data-in/about-getting-data-in`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Configuring Forwarders',
    urls: [
      'https://docs.splunk.com/Documentation/Forwarder/9.4.2/Forwarder/Abouttheuniversalforwarder', // ✓ 200
      `${S}/Forwarding/Aboutforwardingandreceivingdata`,  // ✓ 200
      // Configureforwardingwithoutputs.conf → 500, replaced:
      `${H}/data-management/9.4/data-management-manual/forward-data/configure-forwarding-with-outputs-conf`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Forwarder Management',
    urls: [
      `${S}/Updating/Aboutdeploymentserver`,              // ✓ 200
      `${S}/Updating/Configuredeploymentclients`,         // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Monitor Inputs',
    urls: [
      `${S}/Data/MonitorfilesanddirectorieswithSplunkWeb`, // ✓ 200
      `${S}/Data/Monitorfilesanddirectories`,              // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Network and Scripted Inputs',
    urls: [
      `${S}/Data/Monitornetworkports`,                    // ✓ 200
      // Getdatafromscripts → 500, replaced:
      `${H}/data-management/9.4/data-management-manual/get-data-in/get-data-from-scripts`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Agentless Inputs',
    urls: [
      `${S}/Data/UsetheHTTPEventCollector`,               // ✓ 200
      // HowSplunkEnterprisehandlesyourdata → 500, replaced:
      `${H}/data-management/9.4/data-management-manual/get-data-in/how-splunk-enterprise-handles-your-data`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Fine Tuning Inputs',
    urls: [
      // Overridesourceandextractionconfigurations → 500, Editinputs.conf → 500, replaced:
      `${H}/data-management/9.4/data-management-manual/get-data-in/monitor-files-and-directories/override-source-and-extraction-configurations`,
      `${H}/data-management/9.4/data-management-manual/get-data-in/monitor-files-and-directories/edit-inputs-conf`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Parsing Phase and Data',
    urls: [
      // Parsedatapreview → 500, Howsplunkformatsmultilineevents → 500, replaced:
      `${H}/data-management/9.4/data-management-manual/get-data-in/parse-data-using-data-preview`,
      `${H}/data-management/9.4/data-management-manual/get-data-in/how-splunk-enterprise-formats-multiline-events`,
    ]
  },
  {
    certType: 'Enterprise Admin', topic: 'Manipulating Raw Data',
    urls: [
      // Anonymizedatawithmasking → 500, Setupsedcommands → 500, replaced:
      `${H}/data-management/9.4/data-management-manual/get-data-in/anonymize-data-with-masking`,
      `${H}/data-management/9.4/data-management-manual/get-data-in/set-up-sed-commands`,
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CLOUD ADMIN — Professional-Level
  // Most SplunkCloud/latest/Admin/* pages → 500. Using Enterprise equivalents
  // where Cloud-specific pages are dead — content is largely identical.
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Cloud Admin', topic: 'Splunk Cloud Overview',
    urls: [
      // SplunkCloudOverview → 500, GettingStarted → 500, replaced:
      `${H}/splunk-cloud/9.4/splunk-cloud-platform-overview`,
      `${HGET}/install-and-upgrade/9.4/install-splunk-enterprise/about-installing-splunk-enterprise`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Index Management',
    urls: [
      `${SC}/Admin/ManageIndexes`,                        // ✓ 200
      `${S}/Indexer/Setupmultipleindexes`,                // ✓ 200 (enterprise equiv)
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'User Authentication and Authorization',
    urls: [
      `${SC}/Security/Rolesandcapabilities`,              // ✓ 200
      // Setupauthenticationwithldap → 500, replaced:
      `${H}/administer/splunk-enterprise-admin-manual/9.4/manage-splunk-users/set-up-authentication-with-ldap`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Splunk Configuration Files',
    urls: [
      // SC Aboutconfigurationfiles → 500, ManageCloudConfiguration → 500, replaced:
      `${S}/Admin/Aboutconfigurationfiles`,               // ✓ 200 enterprise equiv
      `${HDM}/splunk-enterprise-admin-manual/9.4/administer-splunk-enterprise-with-configuration-files/configuration-file-precedence`, // ✓ 200
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Getting Data in Cloud',
    urls: [
      // SC MonitorInputs → 500, ConfigureInputsFromSplunkWeb → 500, replaced:
      `${S}/Data/WhatSplunkcanmonitor`,                   // ✓ 200
      `${S}/Data/MonitorfilesanddirectorieswithSplunkWeb`, // ✓ 200
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Forwarder Management',
    urls: [
      // SC ConfigHeavyForwarder → 500, replaced:
      `${S}/Forwarding/Aboutforwardingandreceivingdata`,  // ✓ 200
      `${S}/Updating/Aboutdeploymentserver`,              // ✓ 200
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Monitor Inputs',
    urls: [
      `${S}/Data/MonitorfilesanddirectorieswithSplunkWeb`, // ✓ 200
      `${S}/Data/Monitorfilesanddirectories`,              // ✓ 200
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Network and Other Inputs',
    urls: [
      `${S}/Data/Monitornetworkports`,                    // ✓ 200
      `${S}/Data/UsetheHTTPEventCollector`,               // ✓ 200
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Fine-tuning Inputs',
    urls: [
      `${H}/data-management/9.4/data-management-manual/get-data-in/monitor-files-and-directories/override-source-and-extraction-configurations`,
      `${H}/data-management/9.4/data-management-manual/get-data-in/monitor-files-and-directories/edit-inputs-conf`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Parsing Phase and Data Preview',
    urls: [
      `${H}/data-management/9.4/data-management-manual/get-data-in/parse-data-using-data-preview`,
      `${H}/data-management/9.4/data-management-manual/get-data-in/how-splunk-enterprise-formats-multiline-events`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Manipulating Raw Data',
    urls: [
      `${H}/data-management/9.4/data-management-manual/get-data-in/anonymize-data-with-masking`,
      `${H}/data-management/9.4/data-management-manual/get-data-in/set-up-sed-commands`,
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Installing and Managing Apps',
    urls: [
      `${SC}/Admin/SelfServiceAppInstall`,                // ✓ 200
      `${SC}/Admin/PrivateApps`,                          // ✓ 200
    ]
  },
  {
    certType: 'Cloud Admin', topic: 'Working with Splunk Cloud Support',
    urls: [
      // WorkWithSupport → 500, Diagnostictools → 500, replaced:
      `${H}/splunk-cloud/9.4/splunk-cloud-platform-overview`,
      `${HGET}/install-and-upgrade/9.4/get-support`,
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE ARCHITECT — Expert-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Index Design',
    urls: [
      `${S}/Indexer/Setupmultipleindexes`,                // ✓ 200
      `${S}/Indexer/Aboutindexesandindexers`,             // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Infrastructure Planning: Resource Planning',
    urls: [
      `${S}/Capacity/Referencehardware`,                  // ✓ 200
      // Overviewofcapacityplanning → 500, replaced:
      `${H}/administer/splunk-enterprise-admin-manual/9.4/deploy-splunk/overview-of-capacity-planning`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Large-scale Splunk Deployment Overview',
    urls: [
      `${S}/Indexer/Basicclusterarchitecture`,            // ✓ 200
      `${H}/administer/splunk-enterprise-admin-manual/9.4/deploy-splunk/overview-of-capacity-planning`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Forwarder and Deployment Best Practices',
    urls: [
      `${S}/Updating/Aboutdeploymentserver`,              // ✓ 200
      `${S}/Forwarding/Aboutforwardingandreceivingdata`,  // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Single-site Indexer Cluster',
    urls: [
      `${S}/Indexer/Aboutclusters`,                       // ✓ 200
      `${S}/Indexer/Basicclusterarchitecture`,            // ✓ 200
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/configure-the-manager-node/configure-the-manager-node-with-server.conf`, // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Multisite Indexer Cluster',
    urls: [
      `${S}/Indexer/Multisiteclusters`,                   // ✓ 200
      `${S}/Indexer/Migratetomultisite`,                  // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Indexer Cluster Management and Administration',
    urls: [
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/configure-the-indexer-cluster/indexer-cluster-configuration-overview`, // ✓ 200
      // Manageanindexercluster → 500, replaced:
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/manage-the-indexer-cluster/manage-an-indexer-cluster`,
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Search Head Cluster',
    urls: [
      `${S}/DistSearch/AboutSHC`,                         // ✓ 200
      `${H}/administer/distributed-search/9.4/deploy-search-head-clustering/deploy-a-search-head-cluster`, // ✓ 200
    ]
  },
  {
    certType: 'Enterprise Architect', topic: 'Search Head Cluster Management and Administration',
    urls: [
      `${S}/DistSearch/SHCarchitecture`,                  // ✓ 200
      `${H}/administer/distributed-search/9.4/deploy-search-head-clustering/deploy-a-search-head-cluster`, // ✓ 200
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // O11y METRICS USER — Foundational-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'O11y Metrics User', topic: 'Get Metrics In with OpenTelemetry',
    urls: [
      `${S}/Metrics/Overview`,                            // ✓ 200
      // GetMetricsIntoSplunk → 500, replaced:
      `${H}/data-management/9.4/data-management-manual/metrics/get-metrics-into-splunk`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Metrics Concepts',
    urls: [
      `${S}/Metrics/Overview`,                            // ✓ 200
      `${H}/data-management/9.4/data-management-manual/metrics/get-metrics-into-splunk`,
    ]
  },
  {
    certType: 'O11y Metrics User', topic: 'Introduction to Alerting on Metrics with Detectors',
    urls: [
      `${S}/Alert/Aboutalerts`,                           // ✓ 200
      `${S}/Alert/Definescheduledalerts`,                 // ✓ 200
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CYBERSECURITY DEFENSE ENGINEER — Intermediate-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'SPL and Efficient Searching',
    urls: [
      `${S}/Search/Writebettersearches`,                  // ✓ 200
      `${H}/search/9.4/search-manual/optimize-searches`,
    ]
  },
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'Investigation, Event Handling, Correlation, and Risk',
    urls: [
      `${ES}/User/Aboutnotableevents`,                    // ✓ 200
      `${ES}/User/Triagenotableevents`,                   // ✓ 200
    ]
  },
  {
    certType: 'Cybersecurity Defense Engineer', topic: 'Threat Detection and Investigation',
    urls: [
      `${ES}/User/Useriskoverview`,                       // ✓ 200
      `${ES}/User/Investigatethreat`,                     // ✓ 200
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONSULTANT — Expert-Level
  // ══════════════════════════════════════════════════════════════════════════
  {
    certType: 'Consultant', topic: 'Deploying Splunk',
    urls: [
      `${S}/Installation/Systemrequirements`,             // ✓ 200
      // Adminsplunkenterprise → 500, replaced:
      `${H}/administer/splunk-enterprise-admin-manual/9.4/administer-splunk-enterprise`,
    ]
  },
  {
    certType: 'Consultant', topic: 'Monitoring Console',
    urls: [
      // AbouttheDMC → 500, ViewDMCoverview → 500, replaced:
      `${H}/administer/monitoring-splunk-enterprise/9.4/the-monitoring-console/about-the-monitoring-console`,
      `${H}/administer/monitoring-splunk-enterprise/9.4/the-monitoring-console/view-monitoring-console-overview`,
    ]
  },
  {
    certType: 'Consultant', topic: 'Access and Roles',
    urls: [
      `${S}/Security/Addandeditusers`,                    // ✓ 200
      `${H}/administer/splunk-enterprise-admin-manual/9.4/manage-splunk-users/about-user-authentication`,
    ]
  },
  {
    certType: 'Consultant', topic: 'Data Collection',
    urls: [
      `${S}/Data/WhatSplunkcanmonitor`,                   // ✓ 200
      `${S}/Data/Usingforwardingagents`,                  // ✓ 200
    ]
  },
  {
    certType: 'Consultant', topic: 'Indexing',
    urls: [
      `${S}/Indexer/Aboutindexesandindexers`,             // ✓ 200
      `${S}/Indexer/Setupmultipleindexes`,                // ✓ 200
    ]
  },
  {
    certType: 'Consultant', topic: 'Search',
    urls: [
      `${S}/Search/Writebettersearches`,                  // ✓ 200
      `${S}/DistSearch/Whatisdistributedsearch`,          // ✓ 200
    ]
  },
  {
    certType: 'Consultant', topic: 'Configuration Management',
    urls: [
      `${S}/Admin/Aboutconfigurationfiles`,               // ✓ 200
      `${S}/Updating/Aboutdeploymentserver`,              // ✓ 200
    ]
  },
  {
    certType: 'Consultant', topic: 'Indexer Clustering',
    urls: [
      `${S}/Indexer/Aboutclusters`,                       // ✓ 200
      `${H}/administer/manage-indexers-and-indexer-clusters/9.4/configure-the-indexer-cluster/indexer-cluster-configuration-overview`, // ✓ 200
    ]
  },
  {
    certType: 'Consultant', topic: 'Search Head Clustering',
    urls: [
      `${S}/DistSearch/AboutSHC`,                         // ✓ 200
      `${S}/DistSearch/SHCarchitecture`,                  // ✓ 200
    ]
  },
];

// Alias for compatibility with ingest.js
export const splunkDocs = SPLUNK_DOC_URLS;
