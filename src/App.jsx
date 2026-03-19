import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, BookOpen, Award, RotateCcw, ShieldCheck, Flag, X, LayoutGrid, AlertCircle, Settings, Infinity, ListChecks, ExternalLink, Zap, Cloud, Server, Building, Briefcase, List, Cpu, Key, Lock, Star, Globe, LineChart, Target, Shield, FileText, Send, MessageSquare, CalendarCheck, BarChart2, Timer, GraduationCap, BadgeCheck, Flame, Users, RefreshCw } from 'lucide-react';

import { CURRENT_YEAR, YEAR_RANGE, TOPICS, CERT_CARDS, TOPIC_LINKS, API_KEY_URLS, PRODUCT_CONTEXT_MAP, EXAM_BLUEPRINTS } from './utils/constants';
import { DEFAULT_GROQ_KEY, CF_WEBHOOK_URL, CF_WEBHOOK_TOKEN, validateSubmissionWithAI, generateDynamicQuestions } from './utils/api';
import { runValidationPipeline } from './utils/agentValidator';
import { updateProfile, buildAdaptiveContext, getProfileSummary, clearProfile, getUserId, loadProfile, getCommunityStats, getWrongAnswerBank, clearReviewedAnswers } from './utils/agentAdaptive';
import { fetchExplanation } from './utils/agentExplainer';

// ─── Consent section definitions ───────────────────────────────────────────
const CONSENT_SECTIONS = [
  {
    title: '1. What This Tool Does',
    content: `This tool is a personal, AI-powered mock exam generator designed to help candidates prepare for Splunk certification exams. It dynamically generates practice questions based on official certification blueprints using third-party large language model (LLM) APIs. It does NOT access official Splunk exam question banks and is NOT affiliated with Splunk Inc. or PearsonVUE. Questions are generated fresh each session and are intended for study purposes only.`
  },
  {
    title: '2. Data Collected & Processed',
    content: `This tool collects and processes the following data:
• API Keys: Stored exclusively in your browser's localStorage. They are never transmitted to our servers.
• Exam Configurations: Topic selections, question counts, and timer settings are held in React state (memory only) and discarded when you close the tab.
• Consent Flag: A single boolean flag ("splunkExamConsent") is stored in localStorage to remember your consent decision.
• Adaptive Learning Profile: After each exam, your topic-level performance data (attempts, errors, score trends) is stored in both your browser's localStorage and in a Cloudflare D1 database. This data is linked to an anonymous random ID generated in your browser — it contains no personally identifiable information.
• Wrong Answer Bank: Missed questions are persisted to Cloudflare D1 for spaced repetition review. This data is linked to your anonymous ID only.
• Feedback Submissions: If you voluntarily submit an official exam result, the pasted evidence text, your chosen exam, and feedback are sent to a Cloudflare Worker webhook for processing. You should redact any personal information before pasting.`
  },
  {
    title: '3. AI Features & Third-Party Data Transmission',
    content: `When you generate an exam or submit feedback for validation, your configured prompt text and/or evidence text is sent directly from your browser to one of the following third-party AI providers, depending on your chosen generator engine:
• Groq (Meta Llama 3.3) — groq.com — Default engine
• Perplexity AI — perplexity.ai — Live web search engine
• Google Gemini — generativelanguage.googleapis.com
• OpenRouter / Alibaba Qwen — openrouter.ai

Your data is subject to the respective provider's privacy policy once transmitted. Do not paste sensitive, confidential, or personally identifiable information into any prompt field or evidence text box.`
  },
  {
    title: '4. GDPR — General Data Protection Regulation (EU)',
    content: `If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (EU) 2016/679, including the right to access, rectify, or erase your personal data. The legal basis for processing data in this tool is your explicit consent (Art. 6(1)(a) GDPR), which you provide by checking all boxes on this screen.

Data minimization is applied: only the data strictly necessary for the service to function is processed. Third-party AI providers may act as data processors under GDPR. By using AI features, you acknowledge that your data may be transferred outside the EU/EEA to countries that may not offer the same level of data protection. You may withdraw consent at any time by clearing your browser's localStorage.`
  },
  {
    title: '5. PDPA — Data Privacy Act of 2012 (Philippines, RA 10173)',
    content: `If you are located in the Philippines, you are protected under Republic Act 10173, also known as the Data Privacy Act of 2012, administered by the National Privacy Commission (NPC). This tool processes your personal data based on your consent, as required under Section 12(a) of the DPA.

You have the right to be informed, to object, to access, to rectify, to erase or block, and to data portability. Cross-border data transfers occur when AI generation features are used, as data is transmitted to servers located outside the Philippines. These transfers are made in accordance with the adequacy standards of Section 21 of the DPA. For any privacy concerns, you may reach us at the contact details provided in the project repository.`
  },
  {
    title: '6. EU AI Act — Regulation (EU) 2024/1689',
    content: `This tool employs AI systems for question generation and submission validation. Based on the intended use and context, these systems are classified as minimal-risk or limited-risk AI under Annex III criteria of the EU AI Act (Regulation (EU) 2024/1689).

As a user, you retain full human oversight and control at all times. AI-generated questions are not presented as authoritative exam content — they are practice aids requiring your critical review. The tool does not make automated decisions with legal or significant personal effects. Transparency is maintained: you are always informed when AI is being used and which provider is involved.`
  },
  {
    title: '7. CCPA — California Consumer Privacy Act (US)',
    content: `If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to delete personal information, and the right to opt out of the sale of personal information.

This tool does not sell your personal information. API keys are stored locally in your browser only. If you submit official exam results via the feedback form, that submission data is forwarded to the tool's maintainer via a secure Cloudflare Worker for quality improvement purposes only. You may request deletion of any submitted data by contacting the maintainer through the project's repository.`
  }
];

// ─── WrongAnswerCard — lazy explanation per missed question ──────────────────
function WrongAnswerCard({ questionIndex, question, yourAnswer, correctAnswer, allOptions, topic, examType, blueprintLevel, apiKey, docSource, timesMissed = 1 }) {
  const [state, setState] = useState('idle');
  const [explanation, setExplanation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [open, setOpen] = useState(false);

  const doFetch = async () => {
    setState('loading');
    try {
      const result = await fetchExplanation(
        { question, yourAnswer, correctAnswer, allOptions, topic, examType, blueprintLevel, timesMissed },
        apiKey
      );
      setExplanation(result);
      setState('done');
    } catch (err) {
      setErrorMsg(err.message);
      setState('error');
    }
  };

  const handleExpand = () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (state === 'idle') doFetch();
  };

  const handleRetry = () => {
    setErrorMsg('');
    doFetch();
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Q{questionIndex + 1}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium truncate">{topic}</span>
              {timesMissed >= 3 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                  Missed {timesMissed}× — deep explanation
                </span>
              )}
              {timesMissed === 2 && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                  Missed {timesMissed}× — detailed explanation
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">{question}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-red-700 leading-relaxed">
                  <span className="font-semibold">You answered:</span> {yourAnswer}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-green-700 leading-relaxed">
                  <span className="font-semibold">Correct answer:</span> {correctAnswer}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleExpand}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
              open
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
            }`}
          >
            {state === 'loading' ? (
              <><div className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /> Explaining...</>
            ) : (
              <>{open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {open ? 'Hide' : 'Why?'}</>
            )}
          </button>
        </div>
      </div>

      {open && state === 'loading' && (
        <div className="px-4 pb-4 pt-1 bg-indigo-50/50 border-t border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
            <span>Generating explanation...</span>
          </div>
        </div>
      )}

      {open && state === 'error' && (
        <div className="px-4 pb-4 pt-1 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
            <button onClick={handleRetry} className="ml-auto text-xs underline hover:no-underline">Retry</button>
          </div>
        </div>
      )}

      {open && state === 'done' && explanation && (
        <div className="px-4 pb-4 pt-3 bg-gradient-to-b from-indigo-50/60 to-white border-t border-indigo-100 space-y-3 animate-fade-in">
          <p className="text-sm text-slate-700 leading-relaxed">{explanation.explanation}</p>
          {explanation.keyTakeaway && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-800 leading-relaxed">{explanation.keyTakeaway}</p>
            </div>
          )}
          {explanation.docHint && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{explanation.docHint}</span>
              <a
                href={docSource || `https://docs.splunk.com/Documentation/Splunk/latest/Search?q=${encodeURIComponent(topic)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-pink-600 hover:text-pink-800 font-semibold transition-colors"
              >
                Open Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const LEVEL_COLORS = {
  'Foundational-Level': 'bg-green-100 text-green-700',
  'Entry-Level':        'bg-blue-100 text-blue-700',
  'Intermediate-Level': 'bg-yellow-100 text-yellow-700',
  'Professional-Level': 'bg-orange-100 text-orange-700',
  'Expert-Level':       'bg-red-100 text-red-700',
};
const BAR_COLORS = [
  'bg-pink-500','bg-indigo-500','bg-blue-500','bg-teal-500',
  'bg-emerald-500','bg-orange-500','bg-purple-500','bg-cyan-500',
  'bg-rose-500','bg-amber-500','bg-lime-500','bg-sky-500',
];

function BlueprintPanel({ bp }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Official Exam Blueprint</p>
            <p className="text-xs text-slate-500 mt-0.5">Questions · Time · Topic weights from Splunk's official PDF</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className={`hidden sm:inline text-xs font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[bp.level] || 'bg-slate-100 text-slate-600'}`}>{bp.level}</span>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="p-5 border-t border-slate-100 space-y-6 bg-white animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <ListChecks className="w-5 h-5 text-pink-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-800">{bp.questions}</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5">Questions</span>
            </div>
            <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <Timer className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-800">{bp.minutes}</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5">Minutes</span>
            </div>
            <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <BadgeCheck className="w-5 h-5 text-green-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-800">{bp.passingScore}%</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5">Passing Score</span>
            </div>
            <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <GraduationCap className="w-5 h-5 text-purple-500 mb-1" />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${LEVEL_COLORS[bp.level] || 'bg-slate-100 text-slate-600'}`}>{bp.level}</span>
              <span className="text-xs text-slate-500 font-medium mt-1">Level</span>
            </div>
          </div>

          {bp.prerequisite && bp.prerequisite !== 'None' && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-amber-800"><span className="font-bold">Prerequisite:</span> {bp.prerequisite}</span>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Exam Content Breakdown</h4>
            <div className="space-y-2">
              {bp.topics.map((t, i) => (
                <div key={i} className="w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-600 font-medium leading-tight pr-2">{t.name}</span>
                    <span className="text-xs font-bold text-slate-700 flex-shrink-0">{t.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
            <a href={bp.blueprintUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center text-xs font-semibold text-pink-600 hover:text-pink-800 bg-pink-50 border border-pink-200 px-3 py-2 rounded-lg transition-colors">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> View Official Blueprint PDF
            </a>
            <a href={bp.scheduleUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg transition-colors">
              <CalendarCheck className="w-3.5 h-3.5 mr-1.5" /> Schedule via PearsonVUE
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [hasConsented, setHasConsented] = useState(() => localStorage.getItem('splunkExamConsent') === 'true');
  const [consentChecks, setConsentChecks] = useState([false, false, false, false]);
  const [expandedSections, setExpandedSections] = useState({});

  const [gameState, setGameState] = useState('menu');
  const [viewMode, setViewMode] = useState('grid');
  const [examType, setExamType] = useState(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const [communityStats, setCommunityStats] = useState({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewQuestionHashes, setReviewQuestionHashes] = useState([]);
  const [docPassages, setDocPassages] = useState([]);
  const [lastValidationLog, setLastValidationLog] = useState([]);

  const [apiKeys, setApiKeys] = useState(() => {
    const VALID_PROVIDERS = { perplexity: '', gemini: '', llama: DEFAULT_GROQ_KEY, qwen: '' };
    try {
      const saved = localStorage.getItem('splunkMockExamApiKeys');
      if (!saved) return VALID_PROVIDERS;
      const parsed = JSON.parse(saved);
      const mergedKeys = { ...VALID_PROVIDERS, ...Object.fromEntries(Object.entries(parsed).filter(([k]) => k in VALID_PROVIDERS)) };
      if (!mergedKeys.llama) mergedKeys.llama = DEFAULT_GROQ_KEY;
      return mergedKeys;
    } catch (e) { return VALID_PROVIDERS; }
  });

  const [examConfig, setExamConfig] = useState({
    numQuestions: 20, selectedTopics: [], useTimer: true, aiProvider: 'llama', customPrompt: ''
  });

  const [userEditedPrompt, setUserEditedPrompt] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loadingText, setLoadingText] = useState("");
  const [apiError, setApiError] = useState(null);

  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackState, setFeedbackState] = useState({ loading: false, success: false, error: null });
  const [feedbackForm, setFeedbackForm] = useState({ exam: '', status: 'pass', evidence: '', feedback: '' });

  const timerRef = useRef(null);

  // Helper: build 4 options for D1-sourced questions that only store correct_answer
  const shuffleWithCorrect = (correctAnswer) => {
    const distractors = [
      'This is configured automatically by Splunk at startup',
      'This setting is managed exclusively through the Splunk Web UI',
      'This requires a restart of the Splunk service to take effect',
      'This is handled by the deployment server and cannot be manually set',
      'This option is only available in Splunk Cloud, not Splunk Enterprise',
      'This is defined in the outputs.conf file, not the inputs.conf file',
    ];
    const picked = distractors
      .filter(d => d.toLowerCase() !== correctAnswer.toLowerCase())
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [correctAnswer, ...picked];
  };

  // ── Layer 2: Fetch relevant doc passages from Vectorize ─────────────────
  const fetchDocPassages = async (examType, topics) => {
    try {
      const topicParams = topics.length > 0
        ? topics.map(t => `topics[]=${encodeURIComponent(t)}`).join('&')
        : '';
      const BASE_URL = import.meta.env.MODE === 'development'
        ? '/api'
        : 'https://splunkmockexam.gtaad-innovations.com/api';
      const url = `${BASE_URL}/retrieve?examType=${encodeURIComponent(examType)}${topicParams ? '&' + topicParams : ''}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        return data.passages || [];
      }
    } catch (err) {
      console.warn('[Layer2] Doc retrieval failed, continuing without RAG:', err.message);
    }
    return [];
  };

  const buildAgenticPrompt = useCallback((type, num, topics, provider, passages = []) => {
    if (!type) return "";

    const bp = EXAM_BLUEPRINTS[type];
    const productContext = PRODUCT_CONTEXT_MAP[type] || 'Splunk Enterprise and Splunk Cloud Platform';
    const providerContext = provider === 'perplexity'
      ? `Use your live web search to verify answers against the latest ${YEAR_RANGE} Splunk documentation.`
      : `Draw from your deep knowledge of the Splunk product suite and official documentation.`;

    const levelGuidance = {
      'Foundational-Level': 'Questions should test basic recognition and recall. Avoid deep configuration syntax. Focus on concepts, definitions, and basic UI interactions a new user would encounter.',
      'Entry-Level': 'Questions should test practical understanding — not just definitions. Include some "what would you do" scenarios but keep them straightforward. Avoid multi-step troubleshooting.',
      'Intermediate-Level': 'Questions should require applied knowledge. Mix conceptual and scenario-based questions. Include some troubleshooting and configuration scenarios with realistic but clear context.',
      'Professional-Level': 'Questions should test real-world administration tasks. Include configuration-file-level details, troubleshooting multi-step scenarios, and architectural decisions.',
      'Expert-Level': 'Questions should test expert architectural decisions, cluster-level troubleshooting, sizing trade-offs, and edge-case scenarios an experienced practitioner would face.',
    };
    const difficulty = bp ? (levelGuidance[bp.level] || levelGuidance['Intermediate-Level']) : levelGuidance['Entry-Level'];

    let topicDistribution = '';
    if (topics.length > 0) {
      const base = Math.floor(num / topics.length);
      const remainder = num % topics.length;
      const distribution = topics.map((t, i) => {
        const count = base + (i < remainder ? 1 : 0);
        return `  - "${t}": ${count} question${count !== 1 ? 's' : ''}`;
      }).join('\n');
      topicDistribution = `The candidate has chosen to focus on these specific topics. Distribute the ${num} questions using these exact counts:
${distribution}

CRITICAL DIVERSITY RULE: Each question must test a DIFFERENT specific concept, command, setting, or scenario. If a topic has multiple questions, they must cover different sub-concepts. Never generate two questions that differ only in a number, threshold, or port value.`;
    } else if (bp) {
      const topicCounts = bp.topics.map(t => ({
        name: t.name,
        count: Math.max(1, Math.round((t.pct / 100) * num))
      }));
      let total = topicCounts.reduce((s, t) => s + t.count, 0);
      let i = 0;
      while (total < num) { topicCounts[i % topicCounts.length].count++; total++; i++; }
      while (total > num) { const idx = topicCounts.findIndex(t => t.count > 1); if (idx >= 0) { topicCounts[idx].count--; total--; } else break; }
      const distribution = topicCounts.map(t => `  - "${t.name}": ${t.count} question${t.count !== 1 ? 's' : ''}`).join('\n');
      topicDistribution = `Distribute the ${num} questions according to the OFFICIAL exam blueprint percentages:
${distribution}

This distribution is mandatory — do not deviate from these counts.`;
    } else {
      topicDistribution = `Distribute questions broadly and evenly across all major topics of the ${type} certification.`;
    }

    const { adaptivePromptSection } = buildAdaptiveContext(type, num, bp?.topics || []);

    return `You are a Splunk certification exam author creating a mock exam for the "${type}" certification (${bp ? bp.level : 'intermediate'}).

EXAM CONTEXT:
- Certification: ${type}
- Level: ${bp ? bp.level : 'Intermediate'}
- Product Scope: ${productContext}
- Total Questions to Generate: ${num}
${providerContext}

DIFFICULTY CALIBRATION — strictly follow this for every question:
${difficulty}

TOPIC DISTRIBUTION — follow these counts exactly:
${topicDistribution}
${adaptivePromptSection}
${passages.length > 0 ? `
REFERENCE DOCUMENTATION — Base your questions on these official Splunk documentation passages.
Every question MUST be grounded in the content below. For each question, include a "docSource" field
with the URL of the passage that most directly supports that question.

${passages.slice(0, 12).map((p, i) => `[DOC ${i+1}] Topic: ${p.topic}
Source: ${p.url}
---
${p.text.slice(0, 600)}
---`).join('\n\n')}

` : ''}QUESTION QUALITY RULES — every question must follow ALL of these:
1. Each question tests ONE specific, distinct concept. No two questions may test the same concept, even if the topic is the same.
2. Options must be grammatically parallel and similar in length (within ~10 words of each other). Never mix full sentences with single words as options.
3. All 4 options must be plausible to someone with partial knowledge — distractors should reflect real common misconceptions, not obvious wrong answers.
4. NEVER use "All of the above", "None of the above", or "Both A and B".
5. The correct answer must be verifiable against official Splunk documentation.
6. Do NOT repeat the exam type, certification name, or meta-information in the question text.
7. Questions must match the difficulty level above — do not make Entry-Level questions read like Expert-Level questions.
8. For ${num <= 5 ? 'small' : 'larger'} question sets, ensure maximum topic variety — do not repeat similar scenarios.`;
  }, []);

  useEffect(() => {
    if (!userEditedPrompt && examType) {
      setExamConfig(prev => ({ ...prev, customPrompt: buildAgenticPrompt(examType, prev.numQuestions, prev.selectedTopics, prev.aiProvider, docPassages) }));
    }
  }, [examType, examConfig.numQuestions, examConfig.selectedTopics, examConfig.aiProvider, userEditedPrompt, buildAgenticPrompt]);

  const examStateRef = useRef({ examType, questions, userAnswers });
  useEffect(() => { examStateRef.current = { examType, questions, userAnswers }; }, [examType, questions, userAnswers]);

  useEffect(() => {
    if (gameState === 'exam' && examConfig.useTimer) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            const { examType: et, questions: qs, userAnswers: ua } = examStateRef.current;
            if (et && qs.length > 0) {
              updateProfile(et, qs, ua, []).catch(err =>
                console.warn('[App] Profile update on timeout failed:', err.message)
              );
            }
            setIsReviewMode(false);
            setReviewQuestionHashes([]);
            setGameState('results');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, examConfig.useTimer]);

  useEffect(() => {
    if (!showFeedbackModal) {
      setFeedbackState({ loading: false, success: false, error: null });
    }
  }, [showFeedbackModal]);

  useEffect(() => {
    if (gameState !== 'menu') return;
    const CERT_IDS = Object.keys(EXAM_BLUEPRINTS);
    CERT_IDS.forEach(async (id) => {
      if (communityStats[id]) return;
      const data = await getCommunityStats(id);
      if (data?.topics?.length > 0) {
        setCommunityStats(prev => ({ ...prev, [id]: data }));
      }
    });
  }, [gameState]);

  const handleSelectExamType = useCallback(async (selectedType) => {
    setExamType(selectedType);
    setUserEditedPrompt(false);
    setExamConfig(prev => ({ ...prev, numQuestions: selectedType === 'Power User' ? 25 : 20, selectedTopics: [], useTimer: true }));
    setGameState('config');
    loadProfile(selectedType).catch(() => {});
  }, []);

  const updateApiKey = useCallback((provider, value) => {
    setApiKeys(prevKeys => {
      const newKeys = { ...prevKeys, [provider]: value };
      localStorage.setItem('splunkMockExamApiKeys', JSON.stringify(newKeys));
      return newKeys;
    });
  }, []);

  const toggleTopic = useCallback((topic) => {
    setExamConfig(prev => {
      const selected = prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter(t => t !== topic)
        : [...prev.selectedTopics, topic];
      return { ...prev, selectedTopics: selected };
    });
  }, []);

  const handleStartExam = useCallback(async () => {
    const rawKey = apiKeys[examConfig.aiProvider];
    const currentKey = (examConfig.aiProvider === 'llama' && (!rawKey || !rawKey.trim()))
      ? DEFAULT_GROQ_KEY
      : rawKey;

    if (!currentKey || currentKey.trim() === '') {
      setApiError(`Please enter an API key for ${examConfig.aiProvider.toUpperCase()} in the Advanced Settings to generate the exam.`);
      return;
    }

    setGameState('loading');
    setLoadingText('Retrieving relevant Splunk documentation...');

    // ── Layer 2: Fetch doc passages from Vectorize ─────────────────────────
    const passages = await fetchDocPassages(examType, examConfig.selectedTopics);
    setDocPassages(passages);
    if (passages.length > 0) {
      console.log(`[Layer2] Retrieved ${passages.length} doc passages for grounding`);
    }

    const promptWithDocs = buildAgenticPrompt(examType, examConfig.numQuestions, examConfig.selectedTopics, examConfig.aiProvider, passages);
    const enrichedConfig = { ...examConfig, customPrompt: promptWithDocs };

    setLoadingText(`Generating ${examConfig.numQuestions} dynamic questions using ${examConfig.aiProvider.toUpperCase()}...`);

    const { questions: fetchedQuestions, error } = await generateDynamicQuestions(examType, enrichedConfig, currentKey);
    if (error) setApiError(error);

    if (!fetchedQuestions || !Array.isArray(fetchedQuestions) || fetchedQuestions.length === 0) {
      setApiError(prev => prev || "The AI generated an invalid or empty set of questions.");
      setGameState('menu');
      return;
    }

    // ── Layer 1: Run validation + refinement pipeline ──────────────────────
    // Skip when using the shared default key — saves rate limit quota.
    // Only runs when the user has provided their own Groq key.
    let validatedQuestions = fetchedQuestions;
    let validationLog = [];
    const groqKey = apiKeys['llama'];
    const usingSharedKey = !groqKey || groqKey.trim() === '' || groqKey === DEFAULT_GROQ_KEY;

    if (!usingSharedKey) {
      const bp = EXAM_BLUEPRINTS[examType];
      const { questions: refined, validationLog: log } = await runValidationPipeline(
        fetchedQuestions,
        examType,
        bp?.level || 'Intermediate-Level',
        groqKey,
        (msg) => setLoadingText(msg)
      );
      validatedQuestions = refined;
      validationLog = log;
      setLastValidationLog(log);
    } else {
      setLoadingText('Questions ready ✓');
      await new Promise(r => setTimeout(r, 600));
      setLastValidationLog([]);
    }
    // ── End Layer 1 ────────────────────────────────────────────────────────

    const randomizedQuestions = validatedQuestions.map(q => {
      const safeQuestion = typeof q.question === 'string' ? q.question : JSON.stringify(q?.question || "Missing question text");
      const safeAnswer = typeof q.answer === 'string' ? q.answer : JSON.stringify(q?.answer || "Missing answer text");

      let safeOptions = q.options;
      if (!Array.isArray(safeOptions)) {
        if (typeof safeOptions === 'object' && safeOptions !== null) safeOptions = Object.values(safeOptions);
        else safeOptions = [String(safeOptions || "Option A"), "Option B", "Option C", "Option D"];
      }
      safeOptions = safeOptions.map(opt => typeof opt === 'string' ? opt : JSON.stringify(opt || ""));
      while (safeOptions.length < 4) safeOptions.push(`Dummy Option ${safeOptions.length + 1}`);

      const shuffledOptions = [...safeOptions].sort(() => Math.random() - 0.5);
      const correctIndex = shuffledOptions.findIndex(opt => opt === safeAnswer);

      return {
        ...q, question: safeQuestion, options: shuffledOptions,
        correctIndex: correctIndex !== -1 ? correctIndex : 0,
        topic: typeof q.topic === 'string' ? q.topic : JSON.stringify(q?.topic || "General"),
        docSource: typeof q.docSource === 'string' ? q.docSource : ''
      };
    });

    setQuestions(randomizedQuestions);
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(randomizedQuestions.length * 52);
    setGameState('exam');
  }, [apiKeys, examConfig, examType]);

  const handleAnswerSelect = useCallback((optionIndex) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  }, [currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => prev < questions.length - 1 ? prev + 1 : prev);
  }, [questions.length]);

  const prevQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => prev > 0 ? prev - 1 : prev);
  }, []);

  // ── Layer 3: Update adaptive profile on exam finish ──────────────────────
  const finishExam = useCallback(() => {
    clearInterval(timerRef.current);
    if (examType && questions.length > 0) {
      updateProfile(examType, questions, userAnswers, lastValidationLog).catch(err =>
        console.warn('[App] Profile update failed:', err.message)
      );
    }
    if (isReviewMode && reviewQuestionHashes.length > 0) {
      clearReviewedAnswers(examType, reviewQuestionHashes);
    }
    setIsReviewMode(false);
    setReviewQuestionHashes([]);
    setDocPassages([]);
    setGameState('results');
  }, [examType, questions, userAnswers, isReviewMode, reviewQuestionHashes, lastValidationLog]);

  // ── Launch a review session from the results page ───────────────────────
  const handleStartReview = useCallback(async () => {
    if (!examType) return;

    setGameState('loading');
    setLoadingText('Fetching your wrong answers from review bank...');

    const { wrongAnswers: dueItems } = await getWrongAnswerBank(examType, false);

    if (!dueItems || dueItems.length === 0) {
      setApiError('No wrong answers found in your review bank yet. Complete an exam first to build your bank.');
      setGameState('results');
      return;
    }

    const originalQuestions = dueItems.slice(0, 15).map(item => ({
      question: item.question,
      options: shuffleWithCorrect(item.correct_answer),
      correctIndex: 0,
      answer: item.correct_answer,
      topic: item.topic,
      _hash: item.question_hash
    })).map(q => {
      const shuffled = [...q.options].sort(() => Math.random() - 0.5);
      return { ...q, options: shuffled, correctIndex: shuffled.indexOf(q.answer) };
    });

    const hashes = originalQuestions.map(q => q._hash).filter(Boolean);

    const topicErrors = {};
    dueItems.forEach(item => {
      topicErrors[item.topic] = (topicErrors[item.topic] || 0) + item.times_missed;
    });
    const weakTopics = Object.entries(topicErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);

    const aiCount = Math.min(originalQuestions.length, 15);
    let aiQuestions = [];

    if (weakTopics.length > 0 && aiCount > 0) {
      setLoadingText(`Generating ${aiCount} fresh questions on your weak topics...`);
      const reviewConfig = {
        ...examConfig,
        numQuestions: aiCount,
        selectedTopics: weakTopics,
        customPrompt: buildAgenticPrompt(examType, aiCount, weakTopics, examConfig.aiProvider)
      };
      const groqKey = apiKeys['llama'] || DEFAULT_GROQ_KEY;
      const usingSharedKey = !apiKeys['llama'] || apiKeys['llama'].trim() === '' || apiKeys['llama'] === DEFAULT_GROQ_KEY;

      const { questions: fetched } = await generateDynamicQuestions(examType, reviewConfig, groqKey);

      if (fetched?.length > 0) {
        let refined = fetched;
        if (!usingSharedKey) {
          const bp = EXAM_BLUEPRINTS[examType];
          const result = await runValidationPipeline(
            fetched, examType, bp?.level || 'Intermediate-Level', groqKey,
            (msg) => setLoadingText(msg)
          );
          refined = result.questions;
        }
        aiQuestions = refined.map(q => {
          const safeAnswer = typeof q.answer === 'string' ? q.answer : '';
          let opts = Array.isArray(q.options) ? q.options.map(o => typeof o === 'string' ? o : '') : ['A', 'B', 'C', 'D'];
          while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
          const shuffled = [...opts].sort(() => Math.random() - 0.5);
          return { ...q, options: shuffled, correctIndex: shuffled.indexOf(safeAnswer) !== -1 ? shuffled.indexOf(safeAnswer) : 0 };
        });
      }
    }

    const combined = [...originalQuestions, ...aiQuestions].sort(() => Math.random() - 0.5);

    if (combined.length === 0) {
      setApiError('Could not build a review session. Please try again.');
      setGameState('results');
      return;
    }

    setIsReviewMode(true);
    setReviewQuestionHashes(hashes);
    setQuestions(combined);
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(combined.length * 52);
    setGameState('exam');
  }, [examType, examConfig, apiKeys, buildAgenticPrompt]);

  const keyboardStateRef = useRef({ currentQuestionIndex, questionsLength: questions.length, showGrid, showCancelModal, gameState });
  useEffect(() => {
    keyboardStateRef.current = { currentQuestionIndex, questionsLength: questions.length, showGrid, showCancelModal, gameState };
  }, [currentQuestionIndex, questions.length, showGrid, showCancelModal, gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = keyboardStateRef.current;
      if (state.gameState !== 'exam' || state.showGrid || state.showCancelModal) return;
      if (e.key === 'ArrowRight' && state.currentQuestionIndex < state.questionsLength - 1) setCurrentQuestionIndex(prev => prev + 1);
      if (e.key === 'ArrowLeft' && state.currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resultsData = useMemo(() => {
    if (gameState !== 'results') return null;
    let correct = 0;
    const weakTopicsMap = {};
    questions.forEach((q, index) => {
      if (!q) return;
      const isCorrect = userAnswers[index] === q.correctIndex;
      if (isCorrect) correct++;
      else {
        const t = q.topic || "Unknown Topic";
        weakTopicsMap[t] = (weakTopicsMap[t] || 0) + 1;
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;
    const topicsToReview = Object.keys(weakTopicsMap)
      .map(topic => ({ topic, errors: weakTopicsMap[topic] }))
      .sort((a, b) => b.errors - a.errors);
    return { correct, total: questions.length, score, passed, topicsToReview };
  }, [gameState, questions, userAnswers]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackState({ loading: true, success: false, error: null });
    try {
      const apiKey = apiKeys['llama'] || DEFAULT_GROQ_KEY;
      const validation = await validateSubmissionWithAI(feedbackForm, apiKey);
      if (!validation.isValid) {
        setFeedbackState({ loading: false, success: false, error: `Validation Failed: ${validation.reason}` });
        return;
      }
      if (CF_WEBHOOK_URL) {
        const response = await fetch(CF_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(CF_WEBHOOK_TOKEN ? { 'Authorization': `Bearer ${CF_WEBHOOK_TOKEN}` } : {})
          },
          body: JSON.stringify({
            targetEmail: "web.rbbjr@gmail.com",
            exam: feedbackForm.exam,
            status: feedbackForm.status,
            evidence: feedbackForm.evidence,
            feedback: feedbackForm.feedback,
            validationConfidence: validation.confidenceScore,
            timestamp: new Date().toISOString()
          })
        });
        if (!response.ok) throw new Error("Failed to forward data to the webhook.");
      }
      setFeedbackState({ loading: false, success: true, error: null });
      setFeedbackForm({ exam: '', status: 'pass', evidence: '', feedback: '' });
      setTimeout(() => setShowFeedbackModal(false), 3000);
    } catch (err) {
      setFeedbackState({ loading: false, success: false, error: err.message || "An unexpected error occurred." });
    }
  };

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ── Render: Consent Modal ─────────────────────────────────────────────────
  const renderConsentModal = () => {
    if (hasConsented) return null;
    const allChecked = consentChecks.every(Boolean);

    const toggleCheck = (idx) => {
      const newChecks = [...consentChecks];
      newChecks[idx] = !newChecks[idx];
      setConsentChecks(newChecks);
    };

    const handleDecline = () => {
      localStorage.removeItem('splunkExamConsent');
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'about:blank';
      }
    };

    const handleConsent = () => {
      if (allChecked) {
        localStorage.setItem('splunkExamConsent', 'true');
        setHasConsented(true);
      }
    };

    return (
      <div className="fixed inset-0 bg-[#0f172a] z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="bg-[#1e293b] border border-[#334155] max-w-3xl w-full shadow-2xl animate-fade-in text-slate-300 rounded-xl overflow-hidden flex flex-col my-4" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          <div className="p-6 md:p-8 border-b border-[#334155] bg-[#0f172a]/50 flex items-center gap-4 flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Data & Privacy Consent</h2>
              <p className="text-sm text-slate-400 mt-1">Mock Exam Generator — Please read before proceeding</p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-grow">
            <p className="text-sm text-slate-300">Before using this tool, please read and acknowledge the following data processing and privacy disclosures. This is required under applicable privacy and AI regulations. Click each section to expand and read the full disclosure.</p>

            <div className="space-y-2">
              {CONSENT_SECTIONS.map((section, i) => (
                <div key={i} className="border border-[#334155] rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(i)}
                    className="w-full flex items-center justify-between p-4 bg-[#0f172a]/50 hover:bg-[#0f172a]/80 transition-colors text-left"
                  >
                    <span className="font-semibold text-white text-sm">{section.title}</span>
                    {expandedSections[i]
                      ? <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0 ml-2" />
                      : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                    }
                  </button>
                  {expandedSections[i] && (
                    <div className="p-4 bg-[#0f172a]/30 border-t border-[#334155]">
                      <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Please confirm each item to proceed</h3>
              <div className="space-y-3">
                {[
                  "I have read and understood how this tool stores and processes data, including that session data is locally stored and not transmitted to proprietary servers except where AI features are triggered.",
                  "I understand that using AI features will transmit generation queries to a third-party AI provider (Groq/Meta/Google), and that sensitive data should not be pasted.",
                  "I acknowledge the disclosures made under the Philippine Data Privacy Act (RA 10173), including cross-border data transfer when AI features are used.",
                  "I understand this tool uses low-risk AI systems under the EU AI Act, that AI-generated content requires my review before use, and that I retain full human oversight."
                ].map((text, idx) => (
                  <label key={idx} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${consentChecks[idx] ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#0f172a]/50 border-[#334155] hover:border-slate-500'}`}>
                    <div className="relative flex items-center justify-center w-6 h-6 border-2 rounded-full border-slate-500 mr-4 flex-shrink-0 mt-0.5 transition-colors">
                      <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" checked={consentChecks[idx]} onChange={() => toggleCheck(idx)} />
                      {consentChecks[idx] && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                    </div>
                    <span className={`text-sm leading-relaxed ${consentChecks[idx] ? 'text-slate-200' : 'text-slate-400'}`}>{text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-[#0f172a] border-t border-[#334155] flex flex-col sm:flex-row gap-4 flex-shrink-0">
            <button
              onClick={handleDecline}
              className="flex-1 py-4 font-semibold text-slate-400 bg-[#1e293b] rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors border border-[#334155]"
            >
              Decline &amp; Exit
            </button>
            <button
              onClick={handleConsent}
              disabled={!allChecked}
              className={`flex-1 py-4 font-bold rounded-lg transition-all ${allChecked ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              Confirm all {consentChecks.filter(Boolean).length}/4 items above
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Feedback Modal ────────────────────────────────────────────────
  const renderFeedbackModal = () => {
    if (!showFeedbackModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white max-w-2xl w-full shadow-2xl animate-fade-in border border-slate-200 rounded-lg flex flex-col my-8">
          <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 rounded-t-lg">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                <ShieldCheck className="w-6 h-6 mr-2 text-green-600" /> Official Result Submission
              </h3>
              <p className="text-sm text-slate-500 mt-1">Submit your official exam result to help improve our AI's accuracy.</p>
            </div>
            <button onClick={() => setShowFeedbackModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
          </div>

          <div className="p-6 md:p-8 flex-grow">
            {feedbackState.success ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-bold text-slate-800">Successfully Validated & Submitted!</h4>
                <p className="text-slate-600">Thank you for contributing. Your official feedback helps improve the practice materials.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                {feedbackState.error && (
                  <div className="bg-red-50 text-red-700 p-4 border border-red-200 rounded-md flex items-start">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feedbackState.error}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Exam Taken</label>
                    <select required value={feedbackForm.exam} onChange={(e) => setFeedbackForm({...feedbackForm, exam: e.target.value})} className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-pink-500 outline-none text-slate-700 bg-white">
                      <option value="" disabled>Select Certification...</option>
                      {Object.keys(TOPICS).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Official Result</label>
                    <div className="flex bg-slate-100 p-1 rounded">
                      <button type="button" onClick={() => setFeedbackForm({...feedbackForm, status: 'pass'})} className={`flex-1 py-2 font-bold text-sm rounded transition-colors ${feedbackForm.status === 'pass' ? 'bg-green-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>PASS</button>
                      <button type="button" onClick={() => setFeedbackForm({...feedbackForm, status: 'fail'})} className={`flex-1 py-2 font-bold text-sm rounded transition-colors ${feedbackForm.status === 'fail' ? 'bg-red-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>FAIL</button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-1.5 text-slate-400" /> Paste Result Email / Evidence Text
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Please paste the text confirming your score or status (redact personal info). Our AI will validate this to prevent spam.</p>
                  <textarea required placeholder="Paste the text from PearsonVue or Splunk here..." value={feedbackForm.evidence} onChange={(e) => setFeedbackForm({...feedbackForm, evidence: e.target.value})} className="w-full h-32 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-pink-500 outline-none text-sm text-slate-700 font-mono resize-y" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1.5 text-slate-400" /> Feedback on the Mock Exam Tool
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Was the generated mock exam accurate compared to the real thing? What topics were missing?</p>
                  <textarea required placeholder="Share your experience..." value={feedbackForm.feedback} onChange={(e) => setFeedbackForm({...feedbackForm, feedback: e.target.value})} className="w-full h-24 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-pink-500 outline-none text-sm text-slate-700 resize-y" />
                </div>
                <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 flex items-start border border-blue-200">
                  <ShieldCheck className="w-5 h-5 mr-2 flex-shrink-0 text-blue-500" />
                  <p>Your submission will be processed and validated securely. Valid feedback is forwarded to the maintainer to enhance the AI generation prompts.</p>
                </div>
                <div className="pt-4 flex justify-end gap-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowFeedbackModal(false)} className="px-6 py-3 font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors">Cancel</button>
                  <button type="submit" disabled={feedbackState.loading} className="px-8 py-3 font-bold bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors shadow-md flex items-center disabled:opacity-70">
                    {feedbackState.loading ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Validating AI...</>
                    ) : (
                      <>Validate & Submit <Send className="w-4 h-4 ml-2" /></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Menu ──────────────────────────────────────────────────────────
  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 space-y-8 animate-fade-in py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
          Splunk <span className="text-pink-600">Mock Exam</span> Tool
        </h1>
        <p className="text-slate-600 max-w-lg mx-auto text-lg">
          Test your readiness with dynamically generated questions tailored to the official certification blueprints.
        </p>
      </div>

      <div className="w-full max-w-6xl flex justify-between items-center mb-[-1rem]">
        <button onClick={() => setShowFeedbackModal(true)} className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full shadow-sm border border-indigo-200">
          <Award className="w-4 h-4 mr-2" /> Submit Official Exam Result
        </button>
        <div className="bg-slate-200/70 p-1 flex space-x-1 shadow-inner rounded">
          <button onClick={() => setViewMode('grid')} className={`p-2 transition-all rounded-sm ${viewMode === 'grid' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`} title="Grid View">
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 transition-all rounded-sm ${viewMode === 'list' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`} title="List View">
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`w-full max-w-6xl ${viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col space-y-4'}`}>
        {CERT_CARDS.map((cert) => {
          const Icon = cert.icon;
          const stats = communityStats[cert.id];
          const hardestTopics = stats?.topics?.slice(0, 3) || [];
          return (
            <div key={cert.id} onClick={() => handleSelectExamType(cert.id)}
              className={`bg-white p-6 shadow-md border-t-4 ${cert.theme.border} hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 rounded-b-lg
                ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-col md:flex-row md:items-center gap-4 md:gap-8'}`}
            >
              <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'mb-4' : 'md:w-1/3 min-w-[250px]'}`}>
                <h2 className={`text-xl font-bold text-slate-800 ${cert.theme.hoverText} transition-colors leading-tight`}>{cert.title}</h2>
                <Icon className={`${cert.theme.text} w-8 h-8 flex-shrink-0 ml-3 ${viewMode === 'list' && 'hidden md:block'}`} />
              </div>
              <p className={`text-slate-500 text-sm ${viewMode === 'grid' ? 'mb-4 flex-grow' : 'flex-grow md:mb-0'}`}>{cert.desc}</p>

              <div className={`${viewMode === 'grid' ? 'mb-4' : 'md:mb-0 md:w-48 flex-shrink-0'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Community finds hardest</span>
                </div>
                {hardestTopics.length > 0 ? (
                  <div className="space-y-1">
                    {hardestTopics.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Flame className={`w-3 h-3 flex-shrink-0 ${t.errorRate >= 60 ? 'text-red-500' : t.errorRate >= 40 ? 'text-orange-400' : 'text-yellow-400'}`} />
                        <span className="text-xs text-slate-600 truncate">{t.topic}</span>
                        <span className={`text-xs font-bold ml-auto flex-shrink-0 ${t.errorRate >= 60 ? 'text-red-500' : t.errorRate >= 40 ? 'text-orange-500' : 'text-yellow-600'}`}>{t.errorRate}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Accumulates after more sessions</p>
                )}
              </div>

              <button className={`${cert.theme.bg} ${cert.theme.text} font-semibold py-2.5 px-6 rounded ${cert.theme.hoverBg} group-hover:text-white transition-colors flex items-center justify-center
                ${viewMode === 'grid' ? 'w-full mt-auto' : 'w-full md:w-auto md:flex-shrink-0 whitespace-nowrap'}`}>
                Configure Exam <Settings className="ml-2 w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Render: Config ────────────────────────────────────────────────────────
  const renderConfig = () => (
    <div className="max-w-3xl mx-auto w-full animate-fade-in bg-white shadow-xl p-6 md:p-10 border border-slate-100 rounded-lg">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 flex items-center">
            <Settings className="w-8 h-8 mr-3 text-pink-500" />
            Exam Configuration
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Customizing for: <span className="text-pink-600">{examType}</span></p>
        </div>
        <button onClick={() => setGameState('menu')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors rounded-full"><X className="w-6 h-6" /></button>
      </div>

      <div className="space-y-8">
        {examType && EXAM_BLUEPRINTS[examType] && (
          <BlueprintPanel bp={EXAM_BLUEPRINTS[examType]} />
        )}

        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center"><ListChecks className="w-5 h-5 mr-2 text-slate-500" /> Number of Questions</h3>
          <div className="flex flex-wrap gap-3">
            {[5, 10, 15, 20, 25, 30].map(num => (
              <button key={num} onClick={() => setExamConfig(prev => ({ ...prev, numQuestions: num }))}
                className={`px-6 py-3 font-bold transition-all rounded ${examConfig.numQuestions === num ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center"><Clock className="w-5 h-5 mr-2 text-slate-500" /> Exam Timer</h3>
          <label className="flex items-center cursor-pointer p-4 border-2 border-slate-100 hover:border-slate-300 transition-colors bg-white rounded-lg">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={examConfig.useTimer} onChange={(e) => setExamConfig(prev => ({ ...prev, useTimer: e.target.checked }))} />
              <div className={`block w-14 h-8 transition-colors rounded-full ${examConfig.useTimer ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${examConfig.useTimer ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div className="ml-4">
              <div className="font-bold text-slate-800">{examConfig.useTimer ? 'Timer Enabled' : 'Untimed Practice'}</div>
              <div className="text-sm text-slate-500">{examConfig.useTimer ? 'A strict countdown timer will run based on question count.' : 'Take your time without any pressure.'}</div>
            </div>
          </label>
        </div>

        <div>
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center"><BookOpen className="w-5 h-5 mr-2 text-slate-500" /> Topic Coverage</h3>
            <div className="flex space-x-3">
              <button onClick={() => setExamConfig(prev => ({ ...prev, selectedTopics: TOPICS[examType] }))} className="text-sm text-pink-600 hover:text-pink-800 font-semibold">Select All</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => setExamConfig(prev => ({ ...prev, selectedTopics: [] }))} className="text-sm text-slate-500 hover:text-slate-700 font-semibold">Clear All</button>
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-4">If no topics are selected, the exam will cover all topics randomly.</p>
          <div className="grid sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1 pr-2">
            {TOPICS[examType].map((topic, idx) => {
              const isSelected = examConfig.selectedTopics.includes(topic);
              return (
                <div key={idx} onClick={() => toggleTopic(topic)}
                  className={`p-3 border rounded cursor-pointer transition-all flex items-start space-x-3 ${isSelected ? 'bg-pink-50 border-pink-400' : 'bg-white border-slate-200 hover:border-pink-300'}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 border rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-pink-500 border-pink-500' : 'border-slate-300'}`}>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-pink-900' : 'text-slate-700'}`}>{topic}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between w-full text-left font-bold text-slate-700 hover:text-pink-600 transition-colors">
            <span className="flex items-center"><Settings className="w-5 h-5 mr-2" /> Advanced Setup (Generators)</span>
            {showAdvanced ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showAdvanced && (
            <div className="mt-6 bg-slate-50 p-6 border border-slate-200 rounded animate-fade-in shadow-inner space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center uppercase tracking-wider"><Cpu className="w-4 h-4 mr-2 text-pink-500" /> AI Generator Engine</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { id: 'llama', label: 'Meta (Llama 3.3 via Groq)' },
                    { id: 'perplexity', label: 'Perplexity (Live Web Search)' },
                    { id: 'gemini', label: 'Google (Gemini 1.5 Flash)' },
                    { id: 'qwen', label: 'Alibaba (Qwen 2.5 via OpenRouter)' }
                  ].map(provider => (
                    <button key={provider.id} onClick={() => setExamConfig(prev => ({ ...prev, aiProvider: provider.id }))}
                      className={`px-3 py-2 flex items-center text-sm font-semibold transition-all border rounded ${examConfig.aiProvider === provider.id ? 'bg-pink-100 border-pink-500 text-pink-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {provider.id === 'perplexity' && <Globe className="w-3.5 h-3.5 mr-1.5" />}
                      {provider.label}
                    </button>
                  ))}
                </div>

                <div className="relative animate-fade-in">
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center">
                      <Key className="w-4 h-4 mr-1.5" /> {examConfig.aiProvider.toUpperCase()} API Key
                    </label>
                    <a href={API_KEY_URLS[examConfig.aiProvider]} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center">
                      Get API Key <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                  <div className={`flex items-center border rounded focus-within:ring-1 transition-all overflow-hidden ${examConfig.aiProvider === 'llama' && !apiKeys['llama'] ? 'bg-green-50 border-green-300 focus-within:border-green-500 focus-within:ring-green-300' : 'bg-white border-slate-300 focus-within:border-pink-500 focus-within:ring-pink-500'}`}>
                    <span className="pl-3 text-slate-400"><Lock className="w-4 h-4" /></span>
                    <input
                      type="password"
                      value={apiKeys[examConfig.aiProvider] || ''}
                      onChange={(e) => updateApiKey(examConfig.aiProvider, e.target.value)}
                      placeholder={examConfig.aiProvider === 'llama' ? '✓ Default Groq key pre-loaded — or paste your own to override' : `Paste your ${examConfig.aiProvider} API key here...`}
                      className="w-full p-3 outline-none text-slate-700 bg-transparent font-mono text-sm"
                    />
                  </div>
                  {examConfig.aiProvider === 'llama' && !apiKeys['llama'] ? (
                    <p className="text-xs text-green-700 mt-2 flex items-center font-medium bg-green-50 p-2 border border-green-200 rounded">
                      <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" /> A shared Groq key is pre-configured. You can start the exam immediately, or paste your own key for higher rate limits and quality validation.
                    </p>
                  ) : (
                    <p className="text-xs text-green-700 mt-2 flex items-center font-medium bg-green-50 p-2 border border-green-200 rounded">
                      <ShieldCheck className="w-4 h-4 mr-1.5 flex-shrink-0" /> Security Note: Your key is stored securely in your browser's local storage and is never sent to our servers.
                    </p>
                  )}
                </div>

                {examConfig.aiProvider === 'perplexity' && (
                  <div className="bg-purple-50 text-purple-800 p-3 mt-3 text-sm flex items-start border border-purple-200 rounded">
                    <Globe className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Perplexity AI explicitly searches the live web to combine the latest {YEAR_RANGE} official Splunk documentation to ensure maximum accuracy.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider">
                    <Zap className="w-4 h-4 mr-2 text-pink-500" /> Agentic Prompt Engine
                  </h3>
                  {userEditedPrompt && (
                    <button
                      onClick={() => {
                        setUserEditedPrompt(false);
                        setExamConfig(prev => ({ ...prev, customPrompt: buildAgenticPrompt(examType, prev.numQuestions, prev.selectedTopics, prev.aiProvider) }));
                      }}
                      className="text-xs text-pink-600 hover:text-pink-800 flex items-center font-bold transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset to Dynamic Default
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  This prompt is dynamically updated based on your selections above. Feel free to edit it manually to force specific difficulty levels, tricky scenarios, or version focus (like {CURRENT_YEAR} standards).
                </p>
                <textarea
                  value={examConfig.customPrompt}
                  onChange={(e) => {
                    setUserEditedPrompt(true);
                    setExamConfig(prev => ({ ...prev, customPrompt: e.target.value }));
                  }}
                  className={`w-full h-56 p-4 border rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-sm text-slate-700 font-mono leading-relaxed resize-y shadow-inner
                    ${userEditedPrompt ? 'bg-yellow-50/30 border-yellow-300' : 'bg-slate-100/50 border-slate-300'}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex space-x-4">
        <button onClick={() => setGameState('menu')} className="px-6 py-4 font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors rounded">Back</button>
        <button onClick={handleStartExam} className="flex-1 flex items-center justify-center px-6 py-4 font-bold bg-pink-600 text-white hover:bg-pink-700 rounded transition-transform hover:-translate-y-1 shadow-lg">
          Generate & Start Exam <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );

  // ── Render: Loading ───────────────────────────────────────────────────────
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      <h2 className="text-2xl font-semibold text-slate-700 animate-pulse">{loadingText}</h2>
      <p className="text-slate-500 text-center max-w-md">
        We are generating a unique set of questions for you. This ensures your practice exam is close to the real dynamically generated test format.
      </p>
    </div>
  );

  // ── Render: Exam ──────────────────────────────────────────────────────────
  const renderExam = () => {
    const q = questions[currentQuestionIndex];

    if (!q) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Error Loading Question</h2>
          <p className="text-slate-600 mt-2 mb-6">The generated exam data could not be parsed properly.</p>
          <button onClick={() => setGameState('menu')} className="px-6 py-3 font-bold bg-slate-800 text-white hover:bg-slate-900 rounded transition-colors shadow-md">
            Return to Menu
          </button>
        </div>
      );
    }

    const unansweredCount = questions.length - Object.keys(userAnswers).length;
    const canSubmit = unansweredCount === 0;

    return (
      <div className="max-w-4xl mx-auto w-full animate-fade-in pb-20 relative">
        {isReviewMode && (
          <div className="mb-4 flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold px-4 py-2.5 rounded-lg">
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            Review Session — Mixed missed questions + fresh AI questions on your weak topics
          </div>
        )}

        {showCancelModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white p-6 max-w-md w-full shadow-2xl animate-fade-in rounded-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Cancel Exam?</h3>
              <p className="text-slate-600 mb-6">Are you sure you want to cancel? All your current progress will be lost.</p>
              <div className="flex space-x-4">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors">Resume</button>
                <button onClick={() => { setShowCancelModal(false); setIsReviewMode(false); setReviewQuestionHashes([]); setGameState('menu'); }} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded font-semibold transition-colors">Yes, Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showGrid && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] p-4 flex flex-col items-center justify-center" onClick={() => setShowGrid(false)}>
            <div className="bg-white p-6 max-w-2xl w-full shadow-2xl animate-fade-in rounded-lg" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Question Navigator</h3>
                  <p className="text-sm text-slate-500">{unansweredCount} remaining</p>
                </div>
                <button onClick={() => setShowGrid(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-[50vh] overflow-y-auto p-1 pr-2">
                {questions.map((_, idx) => {
                  const isAns = userAnswers[idx] !== undefined;
                  const isFlagged = flaggedQuestions[idx];
                  const isCurrent = currentQuestionIndex === idx;
                  return (
                    <button key={idx} onClick={() => { setCurrentQuestionIndex(idx); setShowGrid(false); }}
                      className={`relative w-10 h-10 font-semibold flex items-center justify-center transition-all rounded
                        ${isCurrent ? 'ring-2 ring-pink-500 ring-offset-2' : ''}
                        ${isAns ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                      `}
                    >
                      {idx + 1}
                      {isFlagged && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 border-2 border-white rounded-full shadow-sm" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600 justify-center bg-slate-50 p-3 rounded">
                <div className="flex items-center"><div className="w-3 h-3 bg-pink-600 rounded-sm mr-2" /> Answered</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-slate-200 rounded-sm mr-2" /> Unanswered</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-yellow-400 rounded-full mr-2" /> Flagged</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm border border-slate-100 p-4 rounded-lg mb-6 flex flex-col md:flex-row items-center justify-between sticky top-4 z-10 gap-4">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button onClick={() => setShowCancelModal(true)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors" title="Cancel Exam"><X className="w-6 h-6" /></button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={() => setShowGrid(true)} className="flex items-center px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded font-medium transition-colors border border-slate-200">
              <LayoutGrid className="w-5 h-5 mr-2 text-slate-500" /><span className="hidden sm:inline">Navigator</span>
            </button>
          </div>
          <div className="flex items-center space-x-3 text-center">
            <span className="bg-pink-100 text-pink-700 font-bold px-4 py-2 rounded-full">Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
          <div className={`flex items-center space-x-2 font-mono text-xl font-bold px-4 py-2 rounded-lg w-full md:w-auto justify-center
            ${!examConfig.useTimer ? 'bg-slate-50 text-slate-500' : timeRemaining < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-700'}`}>
            {examConfig.useTimer ? (
              <><Clock className="w-5 h-5" /><span>{formatTime(timeRemaining)}</span></>
            ) : (
              <><Infinity className="w-6 h-6" /><span className="text-sm uppercase tracking-wider font-sans ml-1">Untimed</span></>
            )}
          </div>
        </div>

        <div className="w-full bg-slate-200 h-2 rounded-full mb-6 overflow-hidden">
          <div className="bg-pink-500 h-full transition-all duration-300 ease-out" style={{ width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` }}></div>
        </div>

        <div className="bg-white shadow-md border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start gap-4">
            <div className="flex-grow min-w-0">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed">{q.question}</h2>
              {q.docSource && (
                <a href={q.docSource} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <BookOpen className="w-3 h-3" /> Source: Splunk Docs
                </a>
              )}
            </div>
            <button onClick={() => setFlaggedQuestions(prev => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }))}
              className={`flex-shrink-0 flex items-center px-3 py-2 text-sm rounded-md font-medium transition-colors border ${flaggedQuestions[currentQuestionIndex] ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
            >
              <Flag className="w-4 h-4 mr-1.5" fill={flaggedQuestions[currentQuestionIndex] ? "currentColor" : "none"} />
              <span className="hidden sm:inline">{flaggedQuestions[currentQuestionIndex] ? 'Flagged' : 'Flag'}</span>
            </button>
          </div>
          <div className="p-6 md:p-8 bg-slate-50 space-y-3">
            {q.options && q.options.map((option, idx) => {
              const selected = userAnswers[currentQuestionIndex] === idx;
              return (
                <div key={idx} onClick={() => handleAnswerSelect(idx)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 flex items-start space-x-3 ${selected ? 'border-pink-500 bg-pink-50 shadow-sm' : 'border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/50'}`}
                >
                  <div className={`mt-1 flex-shrink-0 w-5 h-5 border-2 rounded-full flex items-center justify-center ${selected ? 'border-pink-600' : 'border-slate-300'}`}>
                    {selected && <div className="w-2.5 h-2.5 bg-pink-600 rounded-full" />}
                  </div>
                  <span className={`text-lg ${selected ? 'text-pink-900 font-medium' : 'text-slate-700'}`}>{option}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 relative">
          <button onClick={prevQuestion} disabled={currentQuestionIndex === 0}
            className={`flex items-center px-6 py-3 rounded font-semibold transition-colors ${currentQuestionIndex === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'}`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">Previous</span>
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <div className="relative flex flex-col items-end">
              {!canSubmit && (
                <div className="absolute -top-8 right-0 text-orange-500 text-sm font-semibold flex items-center bg-orange-50 px-3 py-1 rounded border border-orange-200 whitespace-nowrap">
                  <AlertCircle className="w-4 h-4 mr-1.5" />
                  {unansweredCount} question{unansweredCount > 1 ? 's' : ''} remaining
                </div>
              )}
              <button onClick={finishExam} disabled={!canSubmit}
                className={`flex items-center px-8 py-3 rounded font-bold shadow-md transition-all ${canSubmit ? 'bg-pink-600 text-white hover:bg-pink-700 hover:scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Submit Exam <CheckCircle className="w-5 h-5 ml-2" />
              </button>
            </div>
          ) : (
            <button onClick={nextQuestion} className="flex items-center px-8 py-3 rounded font-bold bg-slate-800 text-white hover:bg-slate-900 shadow-md transition-transform hover:scale-105">
              <span className="hidden sm:inline">Next</span> <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Render: Results ───────────────────────────────────────────────────────
  const renderResults = () => {
    if (!resultsData) return null;
    const { score, passed, correct, total, topicsToReview } = resultsData;

    return (
      <div className="max-w-4xl mx-auto w-full animate-fade-in space-y-8 pb-12">
        <div className={`p-8 md:p-12 text-center text-white rounded-2xl shadow-xl relative overflow-hidden ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-pink-700'}`}>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
            {passed ? <CheckCircle className="w-64 h-64" /> : <XCircle className="w-64 h-64" />}
          </div>
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">{passed ? "Congratulations, You Passed!" : "Exam Failed"}</h1>
            <p className="text-xl md:text-2xl font-medium opacity-90">{examType} Mock Exam</p>
            <div className="inline-block bg-white/20 px-8 py-4 rounded-xl backdrop-blur-sm mt-6">
              <div className="text-5xl font-black">{score}%</div>
              <div className="text-sm font-medium uppercase tracking-wider mt-1 opacity-80">Final Score</div>
            </div>
            <p className="text-lg opacity-90 mt-4">You answered {correct} out of {total} questions correctly.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 flex items-center mb-6"><BookOpen className="w-6 h-6 mr-2 text-pink-500" />Topics to Review</h3>
            {topicsToReview.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg h-full flex flex-col justify-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                <p>Perfect! You didn't miss any topics.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 flex-grow">
                {topicsToReview.map((item, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-100 rounded-lg p-4 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700">{item.topic}</span>
                      <a href={TOPIC_LINKS[item.topic] || `https://docs.splunk.com/Documentation/Splunk/latest/Search?q=${encodeURIComponent(item.topic)}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 text-sm mt-1.5 flex items-center font-medium transition-colors">
                        Review Documentation <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </a>
                    </div>
                    <span className="bg-red-200 text-red-800 text-xs rounded-full font-bold px-3 py-1.5 whitespace-nowrap self-start sm:self-auto">{item.errors} error{item.errors > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {(() => {
              const profile = getProfileSummary(examType);
              void profileVersion;
              if (!profile || profile.sessions < 1) return null;
              const topTopics = profile.topics.slice(0, 5);
              return (
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-purple-500" /> Your Learning Profile
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{profile.sessions} session{profile.sessions !== 1 ? 's' : ''} tracked — next exam will adapt to your weak areas</p>
                    </div>
                    <button
                      onClick={() => { clearProfile(examType); setProfileVersion(v => v + 1); }}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      title="Reset adaptive profile for this exam"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 leading-none mb-0.5">Your anonymous ID — use on any device to continue your profile</p>
                      <p className="text-xs font-mono text-slate-700 truncate">{getUserId()}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {topTopics.map((t, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-full">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-600 truncate pr-2 max-w-[60%]">{t.name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-bold ${t.errorRate > 50 ? 'text-red-600' : t.errorRate > 25 ? 'text-orange-500' : 'text-green-600'}`}>
                                {100 - t.errorRate}%
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                t.trend === 'improving' ? 'bg-green-100 text-green-700' :
                                t.trend === 'declining' ? 'bg-red-100 text-red-700' :
                                t.trend === 'new' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>{t.trend}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${t.errorRate > 50 ? 'bg-red-400' : t.errorRate > 25 ? 'bg-orange-400' : 'bg-green-400'}`}
                              style={{ width: `${100 - t.errorRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {profile.topics.length > 5 && (
                    <p className="text-xs text-slate-400 mt-3 text-center">+{profile.topics.length - 5} more topics tracked</p>
                  )}
                </div>
              );
            })()}

            {(() => {
              const wrongCount = questions.filter((q, idx) => userAnswers[idx] !== q.correctIndex).length;
              if (wrongCount === 0) return null;
              return (
                <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800">Review Weak Topics</h4>
                      <p className="text-slate-500 text-sm mt-1">
                        Launch a focused session mixing your {wrongCount} missed question{wrongCount !== 1 ? 's' : ''} with fresh AI questions on the same weak topics.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartReview}
                    className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-md"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Start Review Session
                  </button>
                </div>
              );
            })()}

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col items-center text-center">
              <h4 className="font-bold text-slate-800 mb-2">Help Validate Our AI</h4>
              <p className="text-slate-500 text-sm mb-6">Have you recently taken the official {examType} exam? Submit your official score report text to help improve this generator.</p>
              <button onClick={() => setShowFeedbackModal(true)} className="w-full flex items-center justify-center px-6 py-4 rounded-lg font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200">
                <Award className="w-5 h-5 mr-2" /> Submit Official Result
              </button>
            </div>

            {passed ? (
              <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100 flex flex-col justify-center items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <BadgeCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">You're Ready — Go for It!</h4>
                  <p className="text-slate-500 text-sm mt-1">Mock score clears 70%. Consider booking the real exam while the material is fresh.</p>
                </div>
                {EXAM_BLUEPRINTS[examType] && (
                  <a href={EXAM_BLUEPRINTS[examType].scheduleUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center px-6 py-4 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md">
                    <CalendarCheck className="w-5 h-5 mr-2" /> Schedule the Real Exam
                  </a>
                )}
                <button onClick={() => setGameState('menu')} className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                  <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col justify-center items-center text-center space-y-4">
                <div className="bg-slate-50 rounded-lg w-full p-5">
                  <AlertTriangle className="w-10 h-10 mx-auto text-orange-400 mb-3" />
                  <h4 className="font-bold text-slate-800 mb-1">Keep Studying</h4>
                  <p className="text-slate-600 text-sm">Focus on the topics above, especially those with multiple errors. Real exams require precise knowledge of UI locations and exact syntax.</p>
                </div>
                {EXAM_BLUEPRINTS[examType] && (
                  <a href={EXAM_BLUEPRINTS[examType].blueprintUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors border border-pink-200 text-sm">
                    <FileText className="w-4 h-4 mr-2" /> Review Official Blueprint PDF
                  </a>
                )}
                <button onClick={() => setGameState('menu')} className="w-full flex items-center justify-center px-6 py-4 rounded-lg font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors">
                  <RotateCcw className="w-5 h-5 mr-2" /> Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Wrong Answer Review Section ── */}
        {(() => {
          const wrongAnswers = questions
            .map((q, idx) => ({ q, idx }))
            .filter(({ q, idx }) => userAnswers[idx] !== q.correctIndex);

          if (wrongAnswers.length === 0) return null;

          const bp = EXAM_BLUEPRINTS[examType];
          const groqKey = apiKeys['llama'] || DEFAULT_GROQ_KEY;

          return (
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <XCircle className="w-6 h-6 text-red-500" />
                    Wrong Answer Review
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {wrongAnswers.length} missed question{wrongAnswers.length !== 1 ? 's' : ''} — click <span className="font-semibold text-indigo-600">Why?</span> on any question for an AI explanation
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg">
                  <Zap className="w-3.5 h-3.5" /> AI-Powered Explanations
                </div>
              </div>
              <div className="p-6 space-y-4">
                {wrongAnswers.map(({ q, idx }) => (
                  <WrongAnswerCard
                    key={idx}
                    questionIndex={idx}
                    question={q.question}
                    yourAnswer={q.options[userAnswers[idx]] ?? 'No answer selected'}
                    correctAnswer={q.options[q.correctIndex]}
                    allOptions={q.options}
                    topic={q.topic}
                    examType={examType}
                    blueprintLevel={bp?.level || 'Intermediate-Level'}
                    apiKey={groqKey}
                    docSource={q.docSource || ''}
                    timesMissed={q.times_missed || 1}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // ── Render: Footer ────────────────────────────────────────────────────────
  const renderFooter = () => {
    if (gameState !== 'menu' && gameState !== 'results') return null;
    return (
      <footer className="max-w-6xl mx-auto px-4 py-12 mt-12 border-t border-slate-200 animate-fade-in space-y-16">

        {/* ── Features & Benefits ── */}
        <div>
          <div className="text-center mb-10">
            <h3 className="text-2xl font-extrabold text-slate-800">Features &amp; Benefits</h3>
            <p className="text-slate-500 mt-2">Everything built into this tool to maximize your exam readiness.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm text-slate-600">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 bg-pink-100 flex items-center justify-center rounded-lg flex-shrink-0"><Zap className="w-5 h-5 text-pink-600" /></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">AI-Powered Question Generation</h4>
                <p>Questions are generated fresh every session using large language models (Groq/Llama, Gemini, Perplexity, Qwen) — no static question banks, no repetition.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 bg-indigo-100 flex items-center justify-center rounded-lg flex-shrink-0"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">RAG-Grounded on Splunk Docs</h4>
                <p>A Retrieval-Augmented Generation (RAG) layer retrieves real Splunk documentation passages from a Cloudflare Vectorize index to ground every question in official content.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 bg-purple-100 flex items-center justify-center rounded-lg flex-shrink-0"><ShieldCheck className="w-5 h-5 text-purple-600" /></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Self-Validation Pipeline</h4>
                <p>A built-in validation agent reviews every generated question for answer-option mismatches, duplicate concepts, formatting issues, and difficulty calibration — then auto-regenerates failures.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center rounded-lg flex-shrink-0"><BarChart2 className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Adaptive Learning Profile</h4>
                <p>Your performance per topic is tracked across sessions in Cloudflare D1. Subsequent exams automatically weight your weak areas more heavily and ease up on strong topics.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 bg-orange-100 flex items-center justify-center rounded-lg flex-shrink-0"><RefreshCw className="w-5 h-5 text-orange-600" /></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Spaced Repetition Review Bank</h4>
                <p>Wrong answers are stored and scheduled using a spaced repetition algorithm (1→3→7→14→30→60 day intervals). Launch a Review Session from the results page to drill missed questions.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 bg-yellow-100 flex items-center justify-center rounded-lg flex-shrink-0"><Star className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">AI Answer Explanations</h4>
                <p>After each exam, click <span className="font-semibold text-indigo-600">Why?</span> on any wrong answer to get a lazy-loaded AI explanation covering the concept, the misconception, and a key takeaway.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded-lg flex-shrink-0"><FileText className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Official Exam Blueprint Integration</h4>
                <p>Each certification card shows the official Splunk exam blueprint — questions, time limit, passing score, level, and topic weight percentages sourced directly from Splunk's PDFs.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 bg-cyan-100 flex items-center justify-center rounded-lg flex-shrink-0"><Users className="w-5 h-5 text-cyan-600" /></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Community Difficulty Heatmap</h4>
                <p>Aggregated (anonymized) error rates from all users are shown per topic on each certification card, revealing which topics the community finds hardest before you even start.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 bg-rose-100 flex items-center justify-center rounded-lg flex-shrink-0"><Globe className="w-5 h-5 text-rose-600" /></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Live Web Search Mode</h4>
                <p>Switch to the Perplexity engine to generate questions grounded in live Splunk documentation searches — ideal for keeping up with the latest product changes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── How to Use ── */}
        <div>
          <div className="text-center mb-10">
            <h3 className="text-2xl font-extrabold text-slate-800">How to Use This Tool</h3>
            <p className="text-slate-500 mt-2">Follow these steps to get the most out of each study session.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-slate-600">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 bg-pink-100 text-pink-600 font-bold flex items-center justify-center rounded-full mb-3">1</div>
              <h4 className="font-bold text-slate-800 mb-1">Select a Certification</h4>
              <p>Pick the Splunk cert track you're studying for. Each card shows a community difficulty heatmap and links to the official exam blueprint.</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 bg-pink-100 text-pink-600 font-bold flex items-center justify-center rounded-full mb-3">2</div>
              <h4 className="font-bold text-slate-800 mb-1">Configure Your Exam</h4>
              <p>Choose the number of questions, focus on specific blueprint topics, toggle the timer, and select your AI generator engine. Optionally customize the prompt directly.</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 bg-pink-100 text-pink-600 font-bold flex items-center justify-center rounded-full mb-3">3</div>
              <h4 className="font-bold text-slate-800 mb-1">Take the Exam</h4>
              <p>Answer all questions before submitting. Use the navigator to jump between questions, flag items for review, and track your progress with the answer bar.</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 bg-pink-100 text-pink-600 font-bold flex items-center justify-center rounded-full mb-3">4</div>
              <h4 className="font-bold text-slate-800 mb-1">Review &amp; Improve</h4>
              <p>See your score, review wrong answers with AI explanations, launch a spaced-repetition review session, and track your adaptive learning profile across sessions.</p>
            </div>
          </div>
        </div>

        {/* ── Attribution ── */}
        <div className="text-center text-xs text-slate-400 pb-4">
          <p>This is a personal project and is not officially affiliated with or endorsed by Splunk Inc.</p>
        </div>

      </footer>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans selection:bg-pink-200 selection:text-pink-900 flex flex-col">
      {renderConsentModal()}
      {renderFeedbackModal()}

      <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center font-bold text-xl">
          <span className="text-pink-500 mr-1">&gt;</span> Splunk <span className="font-light ml-1 text-slate-300">MockTest</span>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
        {gameState === 'menu' && renderMenu()}
        {gameState === 'config' && renderConfig()}
        {gameState === 'loading' && renderLoading()}
        {gameState === 'exam' && renderExam()}
        {gameState === 'results' && renderResults()}

        {apiError && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-6 md:p-8 max-w-lg w-full shadow-2xl rounded-xl animate-fade-in border-t-4 border-red-500">
              <div className="flex items-center mb-4 text-red-600">
                <AlertTriangle className="w-8 h-8 mr-3 flex-shrink-0" />
                <h3 className="text-xl font-bold">API Connection Issue</h3>
              </div>
              <p className="text-slate-600 mb-8 whitespace-pre-wrap leading-relaxed">
                {typeof apiError === 'string' ? apiError : JSON.stringify(apiError)}
              </p>
              <button onClick={() => setApiError(null)} className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-900 rounded-lg text-white font-bold transition-colors shadow-md">
                Acknowledge
              </button>
            </div>
          </div>
        )}
      </main>

      {renderFooter()}
    </div>
  );
}
