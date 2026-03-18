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
