import { ShieldCheck, Award, Zap, Cloud, Server, Building, Briefcase, LineChart, Target } from 'lucide-react';

export const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_RANGE = CURRENT_YEAR > 2025 ? `2025-${CURRENT_YEAR}` : `2025`;

export const TOPICS = {
  "Power User": ["Field Aliases", "Calculated Fields", "Creating Tags and Event Types", "Using Macros", "Creating Workflow Actions", "Data Models", "Normalizing Data with the CIM", "Working with Time and Time Modifiers", "Statistical Processing", "Comparing Values and Correlation Analysis", "Result Modification"],
  "User": ["Splunk Search Basics", "Basic SPL", "Using Fields", "Creating Basic Reports and Dashboards", "Creating Alerts", "Splunk Components (Forwarders, Indexers, Search Heads)"],
  "Advanced Power User": ["Advanced Search Commands", "Advanced Evaluating and Formatting", "Regular Expressions in Splunk", "Advanced Dashboards and Visualizations", "Data Models and Pivot", "Advanced Macros and Custom Commands"],
  "Cloud Admin": ["Splunk Cloud Architecture", "User and Role Management", "Data Inputs and Forwarder Management", "App Deployment in Splunk Cloud", "Index Management and Retention", "Monitoring and Troubleshooting Splunk Cloud"],
  "Enterprise Admin": ["Splunk Architecture and Deployment", "License Management", "User Management and Authentication", "Data Inputs and Parsing", "Distributed Search", "Index Cluster Management", "Search Head Cluster Management"],
  "Enterprise Architect": ["Splunk Deployment Planning", "Infrastructure Sizing and Storage", "Data Collection Strategy", "High Availability and Disaster Recovery", "Security and Compliance", "Performance Tuning and Scaling"],
  "Consultant": ["Splunk Deployment Methodology", "Architecture Best Practices", "Data Onboarding Strategies", "Advanced Troubleshooting", "Performance Optimization", "Project Management for Splunk Services"],
  "O11y Metrics User": ["Metrics Basics and Formats", "Splunk Infrastructure Monitoring (SIM) Concepts", "Charting and Visualizations", "Dashboards in SIM", "Detectors and Alerts", "Analytics and Functions"],
  "Cybersecurity Defense Engineer": ["Cybersecurity Landscape", "Security Operations (SecOps)", "Threat Detection and Investigation", "Incident Response", "Splunk Enterprise Security (ES) Basics", "Threat Intelligence and Hunting"]
};

export const CERT_CARDS = [
  { id: "User", title: "Core Certified User", icon: ShieldCheck, theme: { border: "border-orange-500", text: "text-orange-500", hoverText: "group-hover:text-orange-600", bg: "bg-orange-50", hoverBg: "group-hover:bg-orange-600" }, desc: "Covers basic SPL, searching, reporting, and dashboard creation. Ideal for beginners." },
  { id: "Power User", title: "Core Certified Power User", icon: Award, theme: { border: "border-pink-500", text: "text-pink-500", hoverText: "group-hover:text-pink-600", bg: "bg-pink-50", hoverBg: "group-hover:bg-pink-600" }, desc: "Covers Field Aliases, Calculated Fields, Tags, Macros, Workflow Actions, Data Models, and CIM." },
  { id: "Advanced Power User", title: "Advanced Power User", icon: Zap, theme: { border: "border-purple-500", text: "text-purple-500", hoverText: "group-hover:text-purple-600", bg: "bg-purple-50", hoverBg: "group-hover:bg-purple-600" }, desc: "Deep dive into advanced searching, reporting, regular expressions, complex eval functions, and macros." },
  { id: "Cloud Admin", title: "Cloud Certified Admin", icon: Cloud, theme: { border: "border-blue-500", text: "text-blue-500", hoverText: "group-hover:text-blue-600", bg: "bg-blue-50", hoverBg: "group-hover:bg-blue-600" }, desc: "Focuses on user management, data inputs, forwarders, and app deployment in Splunk Cloud." },
  { id: "Enterprise Admin", title: "Enterprise Admin", icon: Server, theme: { border: "border-indigo-500", text: "text-indigo-500", hoverText: "group-hover:text-indigo-600", bg: "bg-indigo-50", hoverBg: "group-hover:bg-indigo-600" }, desc: "Covers on-premise architecture, clustering, distributed search, license management, and parsing." },
  { id: "Enterprise Architect", title: "Enterprise Architect", icon: Building, theme: { border: "border-teal-500", text: "text-teal-500", hoverText: "group-hover:text-teal-600", bg: "bg-teal-50", hoverBg: "group-hover:bg-teal-600" }, desc: "Focus on infrastructure sizing, High Availability/Disaster Recovery, and large-scale deployment planning." },
  { id: "Consultant", title: "Core Certified Consultant", icon: Briefcase, theme: { border: "border-emerald-500", text: "text-emerald-500", hoverText: "group-hover:text-emerald-600", bg: "bg-emerald-50", hoverBg: "group-hover:bg-emerald-600" }, desc: "Expert-level deployment methodologies, data onboarding strategies, optimization, and best practices." },
  { id: "O11y Metrics User", title: "O11y Cloud Metrics User", icon: LineChart, theme: { border: "border-cyan-500", text: "text-cyan-500", hoverText: "group-hover:text-cyan-600", bg: "bg-cyan-50", hoverBg: "group-hover:bg-cyan-600" }, desc: "Validates knowledge of Splunk Infrastructure Monitoring, metrics, charts, dashboards, and detectors." },
  { id: "Cybersecurity Defense Engineer", title: "Cybersecurity Defense Engineer", icon: Target, theme: { border: "border-red-500", text: "text-red-500", hoverText: "group-hover:text-red-600", bg: "bg-red-50", hoverBg: "group-hover:bg-red-600" }, desc: "Focuses on security operations, threat detection, incident response, and continuous monitoring." }
];

export const TOPIC_LINKS = {
  "Field Aliases": "https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Abouttagsandaliases",
  "Splunk Search Basics": "https://docs.splunk.com/Documentation/Splunk/latest/SearchTutorial/WelcometotheSearchTutorial",
};

export const API_KEY_URLS = {
  perplexity: "https://console.perplexity.ai/settings/api",
  gemini: "https://aistudio.google.com/app/apikey",
  llama: "https://console.groq.com/keys",
  qwen: "https://openrouter.ai/keys"
};

export const PRODUCT_CONTEXT_MAP = {
  'O11y Metrics User': 'Splunk Infrastructure Monitoring (SIM) and Splunk Observability Cloud',
  'Cybersecurity Defense Engineer': 'Splunk Enterprise Security (ES), Risk-Based Alerting (RBA), Investigation Workbench, MITRE ATT&CK',
  'Cloud Admin': 'Splunk Cloud Platform, including Victoria and Classic experience',
  'Enterprise Architect': 'Splunk Enterprise at scale, multi-site clustering, SmartStore',
  'Consultant': 'Splunk Enterprise deployment methodologies, data onboarding best practices',
};

// ─── Official Exam Blueprints ─────────────────────────────────────────────
// Sourced directly from official Splunk test blueprint PDFs (splunk.com/en_us/pdfs/training/)
export const EXAM_BLUEPRINTS = {
  "User": {
    questions: 60,
    minutes: 60,
    level: "Entry-Level",
    passingScore: 70,
    prerequisite: "None",
    scheduleUrl: "https://home.pearsonvue.com/splunk",
    blueprintUrl: "https://www.splunk.com/en_us/pdfs/training/splunk-test-blueprint-user.pdf",
    topics: [
      { name: "Splunk Basics", pct: 5 },
      { name: "Basic Searching", pct: 22 },
      { name: "Using Fields in Searches", pct: 20 },
      { name: "Search Language Fundamentals", pct: 15 },
      { name: "Using Basic Transforming Commands", pct: 15 },
      { name: "Creating Reports and Dashboards", pct: 12 },
      { name: "Creating and Using Lookups", pct: 6 },
      { name: "Creating Scheduled Reports and Alerts", pct: 5 },
    ]
  },
  "Power User": {
    questions: 65,
    minutes: 60,
    level: "Entry-Level",
    passingScore: 70,
    prerequisite: "None",
    scheduleUrl: "https://home.pearsonvue.com/splunk",
    blueprintUrl: "https://www.splunk.com/en_us/pdfs/training/splunk-test-blueprint-power-user.pdf",
    topics: [
      { name: "Using Transforming Commands for Visualizations", pct: 5 },
      { name: "Filtering and Formatting Results", pct: 10 },
      { name: "Correlating Events", pct: 15 },
      { name: "Creating and Managing Fields", pct: 10 },
      { name: "Creating Field Aliases and Calculated Fields", pct: 10 },
      { name: "Creating Tags and Event Types", pct: 10 },
      { name: "Creating and Using Macros", pct: 10 },
      { name: "Creating and Using Workflow Actions", pct: 10 },
      { name: "Creating Data Models", pct: 10 },
      { name: "Using the Common Information Model (CIM)", pct: 10 },
    ]
  },
  "Advanced Power User": {
    questions: 70,
    minutes: 60,
    level: "Intermediate-Level",
    passingScore: 70,
    prerequisite: "Splunk Core Certified Power User",
    scheduleUrl: "https://home.pearsonvue.com/splunk",
    blueprintUrl: "https://www.splunk.com/en_us/pdfs/training/splunk-test-blueprint-advanced-power-user.pdf",
    topics: [
      { name: "Exploring Statistical Commands", pct: 4 },
      { name: "Exploring eval Command Functions", pct: 4 },
      { name: "Exploring Lookups", pct: 4 },
      { name: "Exploring Alerts", pct: 4 },
      { name: "Advanced Field Creation and Management", pct: 4 },
      { name: "Working with Self-Describing Data and Files", pct: 3 },
      { name: "Advanced Search Macros", pct: 3 },
      { name: "Using Acceleration Options: Reports & Summary Indexing", pct: 4 },
      { name: "Using Acceleration Options: Data Models & tsidx", pct: 4 },
      { name: "Using Search Efficiently", pct: 4 },
      { name: "More Search Tuning", pct: 3 },
      { name: "Manipulating and Filtering Data", pct: 6 },
      { name: "Working with Multivalued Fields", pct: 7 },
      { name: "Using Advanced Transactions", pct: 5 },
      { name: "Working with Time", pct: 2 },
      { name: "Using Subsearches", pct: 6 },
      { name: "Creating a Prototype", pct: 4 },
      { name: "Using Forms", pct: 5 },
      { name: "Improving Performance", pct: 6 },
      { name: "Customizing Dashboards", pct: 6 },
      { name: "Adding Drilldowns", pct: 7 },
      { name: "Adding Advanced Behaviors and Visualizations", pct: 5 },
    ]
  },
  "Cloud Admin": {
    questions: 60,
    minutes: 75,
    level: "Professional-Level",
    passingScore: 70,
    prerequisite: "Splunk Core Certified Power User",
    scheduleUrl: "https://home.pearsonvue.com/splunk",
    blueprintUrl: "https://www.splunk.com/en_us/pdfs/training/splunk-test-blueprint-cloud-admin.pdf",
    topics: [
      { name: "Splunk Cloud Overview", pct: 5 },
      { name: "Index Management", pct: 5 },
      { name: "User Authentication and Authorization", pct: 5 },
      { name: "Splunk Configuration Files", pct: 5 },
      { name: "Getting Data in Cloud", pct: 15 },
      { name: "Forwarder Management", pct: 5 },
      { name: "Monitor Inputs", pct: 15 },
      { name: "Network and Other Inputs", pct: 10 },
      { name: "Fine-tuning Inputs", pct: 5 },
      { name: "Parsing Phase and Data Preview", pct: 10 },
      { name: "Manipulating Raw Data", pct: 10 },
      { name: "Installing and Managing Apps", pct: 5 },
      { name: "Working with Splunk Cloud Support", pct: 5 },
    ]
  },
  "Enterprise Admin": {
    questions: 56,
    minutes: 60,
    level: "Professional-Level",
    passingScore: 70,
    prerequisite: "Splunk Core Certified Power User",
    scheduleUrl: "https://home.pearsonvue.com/splunk",
    blueprintUrl: "https://www.splunk.com/en_us/pdfs/training/splunk-test-blueprint-enterprise-admin.pdf",
    topics: [
      { name: "Splunk Admin Basics", pct: 5 },
      { name: "License Management", pct: 5 },
      { name: "Splunk Configuration Files", pct: 5 },
      { name: "Splunk Indexes", pct: 10 },
      { name: "Splunk User Management", pct: 5 },
      { name: "Splunk Authentication Management", pct: 5 },
      { name: "Getting Data In", pct: 5 },
      { name: "Distributed Search", pct: 10 },
      { name: "Getting Data In – Staging", pct: 5 },
      { name: "Configuring Forwarders", pct: 5 },
      { name: "Forwarder Management", pct: 10 },
      { name: "Monitor Inputs", pct: 5 },
      { name: "Network and Scripted Inputs", pct: 5 },
      { name: "Agentless Inputs", pct: 5 },
      { name: "Fine Tuning Inputs", pct: 5 },
      { name: "Parsing Phase and Data", pct: 5 },
      { name: "Manipulating Raw Data", pct: 5 },
    ]
  },
  "Enterprise Architect": {
    questions: 85,
    minutes: 90,
    level: "Expert-Level",
    passingScore: 70,
    prerequisite: "Splunk Core Certified Power User + Enterprise Admin",
    scheduleUrl: "https://home.pearsonvue.com/splunk",
    blueprintUrl: "https://www.splunk.com/en_us/pdfs/training/splunk-test-blueprint-architect.pdf",
    topics: [
      { name: "Introduction", pct: 2 },
      { name: "Project Requirements", pct: 5 },
      { name: "Infrastructure Planning: Index Design", pct: 5 },
      { name: "Infrastructure Planning: Resource Planning", pct: 7 },
      { name: "Clustering Overview", pct: 5 },
      { name: "Forwarder and Deployment Best Practices", pct: 6 },
      { name: "Performance Monitoring and Tuning", pct: 5 },
      { name: "Splunk Troubleshooting Methods and Tools", pct: 5 },
      { name: "Clarifying the Problem", pct: 5 },
      { name: "Licensing and Crash Problems", pct: 5 },
      { name: "Configuration Problems", pct: 5 },
      { name: "Search Problems", pct: 5 },
      { name: "Deployment Problems", pct: 5 },
      { name: "Large-scale Splunk Deployment Overview", pct: 5 },
      { name: "Single-site Indexer Cluster", pct: 5 },
      { name: "Multisite Indexer Cluster", pct: 5 },
      { name: "Indexer Cluster Management and Administration", pct: 7 },
      { name: "Search Head Cluster", pct: 5 },
      { name: "Search Head Cluster Management and Administration", pct: 5 },
      { name: "KV Store Collection and Lookup Management", pct: 3 },
    ]
  },
  "Consultant": {
    questions: 86,
    minutes: 120,
    level: "Expert-Level",
    passingScore: 70,
    prerequisite: "Power User + Advanced Power User + Enterprise Admin + Enterprise Architect",
    scheduleUrl: "https://home.pearsonvue.com/splunk",
    blueprintUrl: "https://www.splunk.com/en_us/pdfs/training/splunk-test-blueprint-consultant.pdf",
    topics: [
      { name: "Deploying Splunk", pct: 5 },
      { name: "Monitoring Console", pct: 8 },
      { name: "Access and Roles", pct: 8 },
      { name: "Data Collection", pct: 15 },
      { name: "Indexing", pct: 14 },
      { name: "Search", pct: 14 },
      { name: "Configuration Management", pct: 8 },
      { name: "Indexer Clustering", pct: 18 },
      { name: "Search Head Clustering", pct: 10 },
    ]
  },
  "O11y Metrics User": {
    questions: 54,
    minutes: 60,
    level: "Foundational-Level",
    passingScore: 70,
    prerequisite: "None",
    scheduleUrl: "https://home.pearsonvue.com/splunk",
    blueprintUrl: "https://www.splunk.com/en_us/pdfs/training/splunk-test-blueprint-o11y-cloud-metrics-user.pdf",
    topics: [
      { name: "Get Metrics In with OpenTelemetry", pct: 10 },
      { name: "Metrics Concepts", pct: 15 },
      { name: "Monitor Using Built-in Content", pct: 10 },
      { name: "Introduction to Visualizing Metrics", pct: 15 },
      { name: "Introduction to Alerting on Metrics with Detectors", pct: 10 },
      { name: "Create Efficient Dashboards and Alerts", pct: 10 },
      { name: "Finding Insights Using Analytics", pct: 15 },
      { name: "Detectors for Common Use Cases", pct: 15 },
    ]
  },
  "Cybersecurity Defense Engineer": {
    questions: 66,
    minutes: 75,
    level: "Intermediate-Level",
    passingScore: 70,
    prerequisite: "None (Power User knowledge recommended)",
    scheduleUrl: "https://home.pearsonvue.com/splunk",
    blueprintUrl: "https://www.splunk.com/en_us/pdfs/training/splunk-test-blueprint-cybersecurity-defense-analyst.pdf",
    topics: [
      { name: "The Cyber Landscape, Frameworks, and Standards", pct: 10 },
      { name: "Threat and Attack Types, Motivations, and Tactics", pct: 20 },
      { name: "Defenses, Data Sources, and SIEM Best Practices", pct: 20 },
      { name: "Investigation, Event Handling, Correlation, and Risk", pct: 20 },
      { name: "SPL and Efficient Searching", pct: 20 },
      { name: "Threat Hunting and Remediation", pct: 10 },
    ]
  },
};
