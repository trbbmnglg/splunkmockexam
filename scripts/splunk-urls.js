// ── Base URL constants ────────────────────────────────────────────────────────
const S   = 'https://docs.splunk.com/Documentation/Splunk/latest';
const H   = 'https://help.splunk.com/en/search';
const ES  = 'https://docs.splunk.com/Documentation/ES/latest';
const HDM = 'https://docs.splunk.com/Documentation/Splunk/latest';
const SOC = 'https://help.splunk.com/en/splunk-observability-cloud';
const ES8 = 'https://help.splunk.com/en/splunk-enterprise-security-8';

// ── URL list ──────────────────────────────────────────────────────────────────
export const splunkDocs = [

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK CORE CERTIFIED USER
  // ══════════════════════════════════════════════════════════════════════════
  {
    examType: 'User',
    cert: 'Splunk Core Certified User',
    topics: [
      {
        topic: 'Splunk Components',
        urls: [
          `${S}/SplunkEnterprise/latest/Overview/WhatSplunkEnterprisedoes`,
          `${S}/SplunkEnterprise/latest/Deploy/Distributedoverview`,
        ],
      },
      {
        topic: 'Installing and Navigating Splunk',
        urls: [
          `${S}/SplunkEnterprise/latest/Installation/Chooseyourplatform`,
          `${S}/SplunkEnterprise/latest/SearchTutorial/NavigateSplunk`,
        ],
      },
      {
        topic: 'Getting Data In',
        urls: [
          `${S}/SplunkEnterprise/latest/Data/WaystogetdataintoSplunk`,
          `${S}/SplunkEnterprise/latest/Data/Monitorfiles`,
          `${S}/SplunkEnterprise/latest/Forwarding/Aboutforwardingandreceivingdata`,
        ],
      },
      {
        topic: 'Basic Searching',
        urls: [
          `${S}/SplunkEnterprise/latest/Search/Aboutsearching`,
          `${S}/SplunkEnterprise/latest/SearchTutorial/Startsearching`,
          `${S}/SplunkEnterprise/latest/Search/GetstartedwithSearch`,
        ],
      },
      {
        topic: 'Using Fields in Searches',
        urls: [
          `${S}/SplunkEnterprise/latest/Search/Aboutfields`,
          `${S}/SplunkEnterprise/latest/Knowledge/Aboutfields`,
          `${S}/SplunkEnterprise/latest/Search/Usefieldsinasearch`,
        ],
      },
      {
        topic: 'Search Language Fundamentals',
        urls: [
          `${S}/SplunkEnterprise/latest/Search/Aboutthesearchlanguage`,
          `${S}/SplunkEnterprise/latest/SearchReference/WhatsInThisManual`,
          `${H}/spl-search-reference/9.4/spl2-search-reference/splunk-quick-reference-guide`,
        ],
      },
      {
        topic: 'Using Basic Transforming Commands',
        urls: [
          `${S}/SplunkEnterprise/latest/Search/Chartresults`,
          `${S}/SplunkEnterprise/latest/SearchReference/Stats`,
          `${S}/SplunkEnterprise/latest/SearchReference/Top`,
          `${S}/SplunkEnterprise/latest/SearchReference/Rare`,
        ],
      },
      {
        topic: 'Creating Reports and Dashboards',
        urls: [
          `${S}/SplunkEnterprise/latest/Report/Createreports`,
          `${S}/SplunkEnterprise/latest/SearchTutorial/Createreports`,
          `${S}/SplunkEnterprise/latest/Viz/AboutSplunkDashboards`,
        ],
      },
      {
        topic: 'Datasets and the Common Information Model',
        urls: [
          `${S}/SplunkEnterprise/latest/Knowledge/UsingtheCIM`,
          `${S}/CommonInformationModel/latest/Getting Started`,
        ],
      },
      {
        topic: 'Creating and Using Lookups',
        urls: [
          `${S}/SplunkEnterprise/latest/Knowledge/Aboutlookupsandfieldactions`,
          `${S}/SplunkEnterprise/latest/Knowledge/Definereferencelookupsbydefault`,
        ],
      },
      {
        topic: 'Scheduled Reports and Alerts',
        urls: [
          `${S}/SplunkEnterprise/latest/Alert/Aboutalerts`,
          `${S}/SplunkEnterprise/latest/Alert/Definescheduledalerts`,
          `${S}/SplunkEnterprise/latest/Report/Schedulereports`,
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK CORE CERTIFIED POWER USER
  // ══════════════════════════════════════════════════════════════════════════
  {
    examType: 'Power User',
    cert: 'Splunk Core Certified Power User',
    topics: [
      {
        topic: 'Using Fields',
        urls: [
          `${S}/SplunkEnterprise/latest/Knowledge/Aboutfields`,
          `${S}/SplunkEnterprise/latest/Search/Usefieldsinasearch`,
        ],
      },
      {
        topic: 'Field Aliases and Calculated Fields',
        urls: [
          `${S}/SplunkEnterprise/latest/Knowledge/Aboutfieldaliases`,
          `${S}/SplunkEnterprise/latest/Knowledge/definecalcfields`,
        ],
      },
      {
        topic: 'Lookups',
        urls: [
          `${S}/SplunkEnterprise/latest/Knowledge/Aboutlookupsandfieldactions`,
          `${S}/SplunkEnterprise/latest/Knowledge/Definealookupwithatelemetry`,
        ],
      },
      {
        topic: 'Scheduled Reports and Alerts',
        urls: [
          `${S}/SplunkEnterprise/latest/Alert/Aboutalerts`,
          `${S}/SplunkEnterprise/latest/Alert/Definescheduledalerts`,
        ],
      },
      {
        topic: 'Statistical Processing',
        urls: [
          `${S}/SplunkEnterprise/latest/Search/Chartresults`,
          `${S}/SplunkEnterprise/latest/SearchReference/Stats`,
          `${S}/SplunkEnterprise/latest/SearchReference/Eventstats`,
          `${S}/SplunkEnterprise/latest/SearchReference/Streamstats`,
        ],
      },
      {
        topic: 'Comparing Values',
        urls: [
          `${S}/SplunkEnterprise/latest/SearchReference/Eval`,
          `${S}/SplunkEnterprise/latest/SearchReference/Where`,
        ],
      },
      {
        topic: 'Result Modification',
        urls: [
          `${S}/SplunkEnterprise/latest/SearchReference/Eval`,
          `${S}/SplunkEnterprise/latest/SearchReference/Rex`,
          `${S}/SplunkEnterprise/latest/SearchReference/Rename`,
        ],
      },
      {
        topic: 'Correlation Analysis',
        urls: [
          `${S}/SplunkEnterprise/latest/SearchReference/Join`,
          `${S}/SplunkEnterprise/latest/SearchReference/Append`,
          `${S}/SplunkEnterprise/latest/SearchReference/Appendcols`,
        ],
      },
      {
        topic: 'Formatting Results',
        urls: [
          `${S}/SplunkEnterprise/latest/SearchReference/Xyseries`,
          `${S}/SplunkEnterprise/latest/SearchReference/Untable`,
          `${S}/SplunkEnterprise/latest/SearchReference/Table`,
        ],
      },
      {
        topic: 'Tags and Event Types',
        urls: [
          `${S}/SplunkEnterprise/latest/Knowledge/Tageventsandobjects`,
          `${S}/SplunkEnterprise/latest/Knowledge/Abouteventtypes`,
        ],
      },
      {
        topic: 'Macros',
        urls: [
          `${S}/SplunkEnterprise/latest/Knowledge/Definesearchmacros`,
          `${S}/SplunkEnterprise/latest/Knowledge/Usesearchmacros`,
        ],
      },
      {
        topic: 'Workflow Actions',
        urls: [
          `${S}/SplunkEnterprise/latest/Knowledge/Aboutworkflowactions`,
        ],
      },
      {
        topic: 'Data Models',
        urls: [
          `${S}/SplunkEnterprise/latest/Knowledge/Aboutdatamodels`,
          `${S}/SplunkEnterprise/latest/Knowledge/Buildingdatamodels`,
        ],
      },
      {
        topic: 'Advanced Visualizations',
        urls: [
          `${S}/SplunkEnterprise/latest/Viz/Visualizationreference`,
          `${S}/SplunkEnterprise/latest/Viz/Chooseavisualizationtype`,
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK ENTERPRISE CERTIFIED ADMIN
  // ══════════════════════════════════════════════════════════════════════════
  {
    examType: 'Enterprise Admin',
    cert: 'Splunk Enterprise Certified Admin',
    topics: [
      {
        topic: 'Splunk Licensing',
        urls: [
          `${S}/SplunkEnterprise/latest/Admin/Aboutlicensingforindexers`,
          `${S}/SplunkEnterprise/latest/Admin/Howlicensingworks`,
        ],
      },
      {
        topic: 'Splunk Configuration Files',
        urls: [
          `${S}/SplunkEnterprise/latest/Admin/Aboutconfigurationfiles`,
          `${S}/SplunkEnterprise/latest/Admin/Configurationfiledirectoriesandfiles`,
          `${S}/SplunkEnterprise/latest/Admin/Wheretofindtheconfigurationfiles`,
        ],
      },
      {
        topic: 'User Management',
        urls: [
          `${S}/SplunkEnterprise/latest/Security/Aboutusersandroles`,
          `${S}/SplunkEnterprise/latest/Security/Addandeditroles`,
          `${S}/SplunkEnterprise/latest/Security/Securepasswords`,
        ],
      },
      {
        topic: 'Getting Data In',
        urls: [
          `${S}/SplunkEnterprise/latest/Data/WaystogetdataintoSplunk`,
          `${S}/SplunkEnterprise/latest/Data/Monitorfiles`,
          `${S}/SplunkEnterprise/latest/Data/Configuredatamonitor`,
        ],
      },
      {
        topic: 'Forwarder Management',
        urls: [
          `${S}/SplunkEnterprise/latest/Forwarding/Aboutforwardingandreceivingdata`,
          `${S}/SplunkEnterprise/latest/Forwarding/Enableaforwarder`,
          `${S}/SplunkEnterprise/latest/Forwarding/Configureforwardingwithoutputs.conf`,
        ],
      },
      {
        topic: 'Index Management',
        urls: [
          `${S}/SplunkEnterprise/latest/Indexer/Aboutindexesandindexers`,
          `${S}/SplunkEnterprise/latest/Indexer/Setupmultipleindexes`,
          `${S}/SplunkEnterprise/latest/Indexer/Configuredataretention`,
        ],
      },
      {
        topic: 'Distributed Search',
        urls: [
          `${S}/SplunkEnterprise/latest/DistSearch/Whatisdistributedsearch`,
          `${S}/SplunkEnterprise/latest/DistSearch/Configuredistributedsearch`,
        ],
      },
      {
        topic: 'Basic Cluster Administration',
        urls: [
          `${S}/SplunkEnterprise/latest/Indexer/Aboutindexerclusters`,
          `${S}/SplunkEnterprise/latest/Indexer/Managingindexerclusterupdates`,
        ],
      },
      {
        topic: 'Deployment Server',
        urls: [
          `${S}/SplunkEnterprise/latest/Updating/Aboutdeploymentserver`,
          `${S}/SplunkEnterprise/latest/Updating/Updateconfigurations`,
        ],
      },
      {
        topic: 'Monitoring Splunk',
        urls: [
          `${S}/SplunkEnterprise/latest/Admin/AboutMonitoringConsole`,
          `${S}/SplunkEnterprise/latest/Admin/Abouttheauditlog`,
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK CLOUD CERTIFIED ADMIN
  // ══════════════════════════════════════════════════════════════════════════
  {
    examType: 'Cloud Admin',
    cert: 'Splunk Cloud Certified Admin',
    topics: [
      {
        topic: 'Splunk Cloud Overview',
        urls: [
          `${S}/SplunkCloud/latest/Admin/SplunkCloudoverview`,
          `${S}/SplunkCloud/latest/Admin/SharedResponsibilities`,
        ],
      },
      {
        topic: 'User and Role Management',
        urls: [
          `${S}/SplunkCloud/latest/Admin/ManageRoles`,
          `${S}/SplunkCloud/latest/Admin/InviteUsers`,
          `${S}/SplunkCloud/latest/Admin/ManageUsers`,
        ],
      },
      {
        topic: 'Data Management',
        urls: [
          `${S}/SplunkCloud/latest/Admin/ManageIndices`,
          `${S}/SplunkCloud/latest/Admin/RetrievingData`,
        ],
      },
      {
        topic: 'Forwarder Management',
        urls: [
          `${S}/SplunkCloud/latest/Admin/ManageForwarders`,
          `${S}/SplunkCloud/latest/Admin/CloudForwarderRequirements`,
        ],
      },
      {
        topic: 'Splunk Cloud Apps and Add-ons',
        urls: [
          `${S}/SplunkCloud/latest/Admin/ManageApps`,
          `${S}/SplunkCloud/latest/Admin/SelfServiceApps`,
        ],
      },
      {
        topic: 'Monitoring and Alerts',
        urls: [
          `${S}/SplunkCloud/latest/Admin/MonitorSplunkCloudPlatform`,
          `${S}/SplunkCloud/latest/Admin/SetAlerts`,
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SPLUNK ENTERPRISE CERTIFIED ARCHITECT
  // ══════════════════════════════════════════════════════════════════════════
  {
    examType: 'Enterprise Architect',
    cert: 'Splunk Enterprise Certified Architect',
    topics: [
      {
        topic: 'Splunk Deployment Planning',
        urls: [
          `${S}/SplunkEnterprise/latest/Deploy/Distributedoverview`,
          `${S}/SplunkEnterprise/latest/Deploy/Plandeployment`,
        ],
      },
      {
        topic: 'Indexer Clustering',
        urls: [
          `${S}/SplunkEnterprise/latest/Indexer/Aboutindexerclusters`,
          `${S}/SplunkEnterprise/latest/Indexer/Setupthecaptainnode`,
          `${S}/SplunkEnterprise/latest/Indexer/Maintainanindexercluster`,
        ],
      },
      {
        topic: 'Search Head Clustering',
        urls: [
          `${S}/SplunkEnterprise/latest/DistSearch/AboutSHC`,
          `${S}/SplunkEnterprise/latest/DistSearch/DeploySHC`,
          `${S}/SplunkEnterprise/latest/DistSearch/ManageSHC`,
        ],
      },
      {
        topic: 'SmartStore',
        urls: [
          `${S}/SplunkEnterprise/latest/Indexer/AboutSmartStore`,
          `${S}/SplunkEnterprise/latest/Indexer/DeploySmartStore`,
        ],
      },
      {
        topic: 'Capacity Planning and Performance',
        urls: [
          `${S}/SplunkEnterprise/latest/Deploy/Estimatingindexvolume`,
          `${S}/SplunkEnterprise/latest/Deploy/ReferenceHardware`,
        ],
      },
      {
        topic: 'Splunk Security Architecture',
        urls: [
          `${S}/SplunkEnterprise/latest/Security/Aboutsecurity`,
          `${S}/SplunkEnterprise/latest/Security/Securingyourdeployment`,
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // O11Y METRICS USER (Splunk Observability Cloud)
  // Previously: 3 topics with 2 sharing identical URLs
  // Now: all 8 blueprint topics with distinct, specific URLs
  // ══════════════════════════════════════════════════════════════════════════
  {
    examType: 'O11y Metrics User',
    cert: 'Splunk O11y Cloud Certified Metrics User',
    topics: [
      {
        topic: 'Metrics Concepts',
        urls: [
          `${SOC}/manage-data/metrics-metadata-and-events/metrics-in-splunk-observability-cloud`,
          `${SOC}/get-started/splunk-observability-cloud-overview/splunk-observability-cloud-overview`,
        ],
      },
      {
        topic: 'Get Metrics In with OpenTelemetry',
        urls: [
          // Distinct from Metrics Concepts — focuses on OTel ingestion, not metric types
          `${SOC}/get-started/send-data/get-started-send-data`,
          `${SOC}/get-started/splunk-observability-cloud-overview/splunk-observability-cloud-overview`,
        ],
      },
      {
        topic: 'Monitor Using Built-in Content',
        urls: [
          `${SOC}/create-dashboards-and-charts/create-dashboards/built-in-dashboards`,
          `${SOC}/monitor-infrastructure/use-navigators`,
          `${SOC}/monitor-infrastructure/use-navigators/available-navigators`,
        ],
      },
      {
        topic: 'Introduction to Visualizing Metrics',
        urls: [
          `${SOC}/create-dashboards-and-charts/create-dashboards/built-in-dashboards`,
          `${SOC}/create-dashboards-and-charts/create-dashboards/available-dashboards`,
        ],
      },
      {
        topic: 'Create Efficient Dashboards and Alerts',
        urls: [
          `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/best-practices-for-creating-detectors`,
          `${SOC}/create-dashboards-and-charts/create-dashboards/built-in-dashboards`,
        ],
      },
      {
        topic: 'Introduction to Alerting on Metrics with Detectors',
        urls: [
          'https://docs.splunk.com/observability/alerts-detectors-notifications/alerts-and-detectors/alerts-detectors-notifications.html',
          `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/best-practices-for-creating-detectors`,
          `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/alerts-and-detectors`,
        ],
      },
      {
        topic: 'Finding Insights Using Analytics',
        urls: [
          `${SOC}/manage-data/metrics-metadata-and-events/metrics-in-splunk-observability-cloud`,
          `${SOC}/monitor-infrastructure/use-navigators`,
        ],
      },
      {
        topic: 'Detectors for Common Use Cases',
        urls: [
          `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/best-practices-for-creating-detectors`,
          `${SOC}/create-alerts-detectors-and-service-level-objectives/create-alerts-and-detectors/alerts-and-detectors`,
          'https://docs.splunk.com/observability/alerts-detectors-notifications/alerts-and-detectors/alerts-detectors-notifications.html',
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CYBERSECURITY DEFENSE ENGINEER
  // Previously: 3 topics covered, 3 missing entirely
  // Now: all 6 blueprint topics covered with ES 8.x docs
  // ══════════════════════════════════════════════════════════════════════════
  {
    examType: 'Cybersecurity Defense Engineer',
    cert: 'Splunk Certified Cybersecurity Defense Engineer',
    topics: [
      {
        topic: 'SPL and Efficient Searching',
        urls: [
          `${S}/SplunkEnterprise/latest/Search/Writebettersearches`,
          `${H}/spl-search-reference/9.4/spl2-search-reference/splunk-quick-reference-guide`,
        ],
      },
      {
        topic: 'Investigation, Event Handling, Correlation, and Risk',
        urls: [
          `${ES8}/user-guide/8.1/analytics/threat-intelligence-dashboards`,
          `${ES8}/administer/8.1/detections/use-detections-to-search-for-threats-in-splunk-enterprise-security`,
          `${ES}/User/Aboutnotableevents`,
          `${ES}/User/Triagenotableevents`,
        ],
      },
      {
        topic: 'Threat Detection and Investigation',
        urls: [
          `${ES8}/administer/8.1/detections/use-detections-to-search-for-threats-in-splunk-enterprise-security`,
          `${ES8}/administer/8.4/threat-intelligence/add-new-threat-intelligence-sources-in-splunk-enterprise-security`,
          `${ES}/User/Useriskoverview`,
          `${ES}/User/Investigatethreat`,
        ],
      },
      {
        // NEW — was missing entirely
        topic: 'The Cyber Landscape, Frameworks, and Standards',
        urls: [
          `${ES8}/administer/8.1/detections/use-detections-to-search-for-threats-in-splunk-enterprise-security`,
          `${ES8}/administer/8.4/threat-intelligence/add-new-threat-intelligence-sources-in-splunk-enterprise-security`,
          `${ES8}/user-guide/8.1/analytics/threat-intelligence-dashboards`,
        ],
      },
      {
        // NEW — was missing entirely
        topic: 'Threat and Attack Types, Motivations, and Tactics',
        urls: [
          `${ES8}/administer/8.4/threat-intelligence/add-new-threat-intelligence-sources-in-splunk-enterprise-security`,
          `${ES8}/administer/8.2/threat-intelligence/configure-threat-lists-in-splunk-enterprise-security`,
          `${ES8}/user-guide/8.1/analytics/threat-intelligence-dashboards`,
        ],
      },
      {
        // NEW — was missing entirely
        topic: 'Defenses, Data Sources, and SIEM Best Practices',
        urls: [
          `${ES8}/administer/8.2/threat-intelligence/configure-threat-lists-in-splunk-enterprise-security`,
          `${ES8}/administer/8.1/detections/use-detections-to-search-for-threats-in-splunk-enterprise-security`,
          `${ES8}/user-guide/8.1/analytics/threat-intelligence-dashboards`,
        ],
      },
    ],
  },

];

// ── Flatten to a simple array of { url, examType, topic } for the ingestor ───
export const flattenUrls = () => {
  const result = [];
  for (const cert of splunkDocs) {
    for (const topicEntry of cert.topics) {
      for (const url of topicEntry.urls) {
        result.push({
          url,
          examType: cert.examType,
          topic:    topicEntry.topic,
          cert:     cert.cert,
        });
      }
    }
  }
  // Deduplicate by URL — same page may appear under multiple topics
  const seen = new Set();
  return result.filter(entry => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
};
