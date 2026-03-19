import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Award, Settings, LayoutGrid, List,
  AlertTriangle, Users, Flame,
} from 'lucide-react';

import { YEAR_RANGE, TOPICS, CERT_CARDS, API_KEY_URLS, PRODUCT_CONTEXT_MAP, EXAM_BLUEPRINTS } from './utils/constants';
import { DEFAULT_GROQ_KEY, generateDynamicQuestions } from './utils/api';
import { runValidationPipeline } from './utils/agentValidator';
import { updateProfile, buildAdaptiveContext, loadProfile, getCommunityStats, getWrongAnswerBank, clearReviewedAnswers } from './utils/agentAdaptive';

import ConsentModal   from './components/ConsentModal';
import FeedbackModal  from './components/FeedbackModal';
import AppFooter      from './components/AppFooter';
import ConfigScreen   from './components/ConfigScreen';
import ExamScreen     from './components/ExamScreen';
import ResultsScreen  from './components/ResultsScreen';

export default function App() {
  // ── Consent ────────────────────────────────────────────────────────────────
  const [hasConsented, setHasConsented] = useState(
    () => localStorage.getItem('splunkExamConsent') === 'true'
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [gameState,       setGameState]       = useState('menu');
  const [viewMode,        setViewMode]        = useState('grid');
  const [examType,        setExamType]        = useState(null);
  const [profileVersion,  setProfileVersion]  = useState(0);
  const [communityStats,  setCommunityStats]  = useState({});

  // ── Exam session ───────────────────────────────────────────────────────────
  const [isReviewMode,          setIsReviewMode]          = useState(false);
  const [reviewQuestionHashes,  setReviewQuestionHashes]  = useState([]);
  const [docPassages,           setDocPassages]           = useState([]);
  const [lastValidationLog,     setLastValidationLog]     = useState([]);
  const [usageInfo,             setUsageInfo]             = useState(null);

  const [apiKeys, setApiKeys] = useState(() => {
    const VALID = { perplexity: '', gemini: '', llama: DEFAULT_GROQ_KEY, qwen: '' };
    try {
      const saved = localStorage.getItem('splunkMockExamApiKeys');
      if (!saved) return VALID;
      const parsed = JSON.parse(saved);
      const merged = { ...VALID, ...Object.fromEntries(Object.entries(parsed).filter(([k]) => k in VALID)) };
      if (!merged.llama) merged.llama = DEFAULT_GROQ_KEY;
      return merged;
    } catch { return VALID; }
  });

  const [examConfig, setExamConfig] = useState({
    numQuestions: 20, selectedTopics: [], useTimer: true, aiProvider: 'llama', customPrompt: '',
  });
  const [userEditedPrompt, setUserEditedPrompt] = useState(false);
  const [showAdvanced,     setShowAdvanced]     = useState(false);

  const [questions,             setQuestions]             = useState([]);
  const [currentQuestionIndex,  setCurrentQuestionIndex]  = useState(0);
  const [userAnswers,           setUserAnswers]           = useState({});
  const [flaggedQuestions,      setFlaggedQuestions]      = useState({});
  const [timeRemaining,         setTimeRemaining]         = useState(0);
  const [loadingText,           setLoadingText]           = useState('');
  const [apiError,              setApiError]              = useState(null);

  const [showCancelModal,   setShowCancelModal]   = useState(false);
  const [showGrid,          setShowGrid]          = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const timerRef = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
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

  const fetchDocPassages = async (type, topics) => {
    try {
      const topicParams = topics.length > 0
        ? topics.map(t => `topics[]=${encodeURIComponent(t)}`).join('&')
        : '';
      const BASE_URL = import.meta.env.MODE === 'development'
        ? '/api'
        : 'https://splunkmockexam.gtaad-innovations.com/api';
      const url = `${BASE_URL}/retrieve?examType=${encodeURIComponent(type)}${topicParams ? '&' + topicParams : ''}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return (await res.json()).passages || [];
    } catch (err) {
      console.warn('[Layer2] Doc retrieval failed, continuing without RAG:', err.message);
    }
    return [];
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── checkAndIncrementUsage ─────────────────────────────────────────────────
  // Only called for shared-key users. Returns { allowed, remaining, resetAt }.
  // Own-key users and review sessions skip this entirely.
  const checkAndIncrementUsage = async () => {
    try {
      const BASE_URL = import.meta.env.MODE === 'development'
        ? '/api'
        : 'https://splunkmockexam.gtaad-innovations.com/api';
      const { getUserId } = await import('./utils/agentAdaptive.js');
      const userId = getUserId();
      const res = await fetch(`${BASE_URL}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 429) {
        const data = await res.json();
        let parsed = {};
        try { parsed = JSON.parse(data.error); } catch { parsed = data; }
        const resetTime = parsed.resetAt
          ? new Date(parsed.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
          : 'midnight UTC';
        return {
          allowed: false,
          message: `You've reached the daily limit of 10 free exams (resets at ${resetTime}).\n\nTo keep practising, add your own free Groq API key in Advanced Settings — it takes 30 seconds to get one at console.groq.com/keys`,
        };
      }
      if (res.ok) {
        const data = await res.json();
        return { allowed: true, remaining: data.remaining };
      }
      // On any unexpected error, allow through — don't block users on infra issues
      return { allowed: true, remaining: null };
    } catch {
      // Network error or timeout — allow through silently
      return { allowed: true, remaining: null };
    }
  };

  // ── buildAgenticPrompt ─────────────────────────────────────────────────────
  const buildAgenticPrompt = useCallback((type, num, topics, provider, passages = []) => {
    if (!type) return '';
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
      topicDistribution = `The candidate has chosen to focus on these specific topics. Distribute the ${num} questions using these exact counts:\n${distribution}\n\nCRITICAL DIVERSITY RULE: Each question must test a DIFFERENT specific concept, command, setting, or scenario. If a topic has multiple questions, they must cover different sub-concepts. Never generate two questions that differ only in a number, threshold, or port value.`;
    } else if (bp) {
      const topicCounts = bp.topics.map(t => ({ name: t.name, count: Math.max(1, Math.round((t.pct / 100) * num)) }));
      let total = topicCounts.reduce((s, t) => s + t.count, 0);
      let i = 0;
      while (total < num) { topicCounts[i % topicCounts.length].count++; total++; i++; }
      while (total > num) { const idx = topicCounts.findIndex(t => t.count > 1); if (idx >= 0) { topicCounts[idx].count--; total--; } else break; }
      const distribution = topicCounts.map(t => `  - "${t.name}": ${t.count} question${t.count !== 1 ? 's' : ''}`).join('\n');
      topicDistribution = `Distribute the ${num} questions according to the OFFICIAL exam blueprint percentages:\n${distribution}\n\nThis distribution is mandatory — do not deviate from these counts.`;
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
${passages.length > 0 ? `\nREFERENCE DOCUMENTATION — Base your questions on these official Splunk documentation passages.\nEvery question MUST be grounded in the content below. For each question, include a "docSource" field\nwith the URL of the passage that most directly supports that question.\n\n${passages.slice(0, 12).map((p, i) => `[DOC ${i+1}] Topic: ${p.topic}\nSource: ${p.url}\n---\n${p.text.slice(0, 600)}\n---`).join('\n\n')}\n\n` : ''}STRICT TOPIC BOUNDARY — this is the most important rule:
You MUST generate questions ONLY within the topics listed in the TOPIC DISTRIBUTION section above.
Do NOT introduce any topic, concept, or Splunk feature that belongs to a different certification exam.
Examples of what is FORBIDDEN for this exam ("${type}"):
${type === 'User' ? `- Any question about indexer clusters, search head clusters, deployment servers, or forwarders — those are Enterprise Admin topics\n- Any question about security, threat detection, SIEM, or Splunk ES — those are Cybersecurity topics\n- Any question about CIM, data models, macros, or workflow actions — those are Power User topics\n- Any question about metrics, detectors, or OpenTelemetry — those are O11y topics` : ''}${type === 'Power User' ? `- Any question about indexer clusters, license management, or Splunk infrastructure — those are Enterprise Admin topics\n- Any question about security, threat detection, or Splunk ES — those are Cybersecurity topics\n- Any question about SmartStore, multisite clusters, or capacity planning — those are Architect topics` : ''}${type === 'Cloud Admin' ? `- Any question about on-premises Enterprise clustering or indexer cluster manager nodes — those are Enterprise Architect topics\n- Any question about security threat detection or Splunk ES — those are Cybersecurity topics` : ''}${type === 'Enterprise Admin' ? `- Any question about multisite indexer clusters or SmartStore — those are Enterprise Architect topics\n- Any question about security threat detection or Splunk ES — those are Cybersecurity topics` : ''}
Every question's "topic" field must exactly match one of the topic names in the TOPIC DISTRIBUTION above.

QUESTION QUALITY RULES — every question must follow ALL of these:
1. Each question tests ONE specific, distinct concept. No two questions may test the same concept, even if the topic is the same.
2. Options must be grammatically parallel and similar in length (within ~10 words of each other). Never mix full sentences with single words as options.
3. All 4 options must be plausible to someone with partial knowledge — distractors should reflect real common misconceptions, not obvious wrong answers.
4. NEVER use "All of the above", "None of the above", or "Both A and B".
5. The correct answer must be verifiable against official Splunk documentation.
6. Do NOT repeat the exam type, certification name, or meta-information in the question text.
7. Questions must match the difficulty level above — do not make Entry-Level questions read like Expert-Level questions.
8. For ${num <= 5 ? 'small' : 'larger'} question sets, ensure maximum topic variety — do not repeat similar scenarios.`;
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userEditedPrompt && examType) {
      setExamConfig(prev => ({
        ...prev,
        customPrompt: buildAgenticPrompt(examType, prev.numQuestions, prev.selectedTopics, prev.aiProvider, docPassages),
      }));
    }
  }, [examType, examConfig.numQuestions, examConfig.selectedTopics, examConfig.aiProvider, userEditedPrompt, buildAgenticPrompt]);

  const examStateRef = useRef({ examType, questions, userAnswers });
  useEffect(() => { examStateRef.current = { examType, questions, userAnswers }; }, [examType, questions, userAnswers]);

  useEffect(() => {
    if (gameState === 'exam' && examConfig.useTimer) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            const { examType: et, questions: qs, userAnswers: ua } = examStateRef.current;
            if (et && qs.length > 0) {
              updateProfile(et, qs, ua, []).catch(err => console.warn('[App] Profile update on timeout failed:', err.message));
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
    if (gameState !== 'menu') return;
    const CERT_IDS = Object.keys(EXAM_BLUEPRINTS);
    CERT_IDS.forEach(async (id) => {
      if (communityStats[id]) return;
      const data = await getCommunityStats(id);
      if (data?.topics?.length > 0) setCommunityStats(prev => ({ ...prev, [id]: data }));
    });
  }, [gameState]);

  const keyboardStateRef = useRef({ currentQuestionIndex, questionsLength: questions.length, showGrid, showCancelModal, gameState });
  useEffect(() => {
    keyboardStateRef.current = { currentQuestionIndex, questionsLength: questions.length, showGrid, showCancelModal, gameState };
  }, [currentQuestionIndex, questions.length, showGrid, showCancelModal, gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const s = keyboardStateRef.current;
      if (s.gameState !== 'exam' || s.showGrid || s.showCancelModal) return;
      if (e.key === 'ArrowRight' && s.currentQuestionIndex < s.questionsLength - 1) setCurrentQuestionIndex(prev => prev + 1);
      if (e.key === 'ArrowLeft'  && s.currentQuestionIndex > 0)                     setCurrentQuestionIndex(prev => prev - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const updateApiKey = useCallback((provider, value) => {
    setApiKeys(prevKeys => {
      const newKeys = { ...prevKeys, [provider]: value };
      localStorage.setItem('splunkMockExamApiKeys', JSON.stringify(newKeys));
      return newKeys;
    });
  }, []);

  const handleSelectExamType = useCallback(async (selectedType) => {
    setExamType(selectedType);
    setUserEditedPrompt(false);
    setExamConfig(prev => ({ ...prev, numQuestions: selectedType === 'Power User' ? 25 : 20, selectedTopics: [], useTimer: true }));
    setGameState('config');
    loadProfile(selectedType).catch(() => {});

    // Fetch usage info for shared-key users so ConfigScreen can show the indicator
    const groqKey        = apiKeys['llama'];
    const usingSharedKey = !groqKey || groqKey.trim() === '' || groqKey === DEFAULT_GROQ_KEY;
    if (usingSharedKey) {
      try {
        const BASE_URL = import.meta.env.MODE === 'development'
          ? '/api'
          : 'https://splunkmockexam.gtaad-innovations.com/api';
        const { getUserId } = await import('./utils/agentAdaptive.js');
        const userId = getUserId();
        const res = await fetch(`${BASE_URL}/usage?userId=${encodeURIComponent(userId)}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) setUsageInfo(await res.json());
      } catch {
        // Non-fatal — indicator just won't show
      }
    } else {
      setUsageInfo(null); // own-key users don't see the indicator
    }
  }, [apiKeys]);

  // ── handleStartExam ────────────────────────────────────────────────────────
  // Fix 3: Layer 1 validation now runs for ALL users.
  //   - Own Groq key  → full pipeline, up to 4 refinement cycles
  //   - Shared/no key → 1 lightweight cycle (catches critical failures
  //                     without hammering the shared quota)
  const handleStartExam = useCallback(async () => {
    const rawKey     = apiKeys[examConfig.aiProvider];
    const currentKey = (examConfig.aiProvider === 'llama' && (!rawKey || !rawKey.trim())) ? DEFAULT_GROQ_KEY : rawKey;
    if (!currentKey || currentKey.trim() === '') {
      setApiError(`Please enter an API key for ${examConfig.aiProvider.toUpperCase()} in the Advanced Settings to generate the exam.`);
      return;
    }

    // ── Usage limit check (shared-key users only) ──────────────────────────
    // Own-key users bypass this entirely — they use their own Groq quota.
    const groqKey        = apiKeys['llama'];
    const usingSharedKey = !groqKey || groqKey.trim() === '' || groqKey === DEFAULT_GROQ_KEY;

    if (usingSharedKey && examConfig.aiProvider === 'llama') {
      const usage = await checkAndIncrementUsage();
      if (!usage.allowed) {
        setApiError(usage.message);
        return;
      }
      if (usage.remaining !== null && usage.remaining <= 2) {
        // Non-blocking low-quota nudge — stored so we can show it after load
        console.info(`[Usage] ${usage.remaining} shared-key exam${usage.remaining !== 1 ? 's' : ''} remaining today`);
      }
    }

    setGameState('loading');
    setLoadingText('Retrieving relevant Splunk documentation...');

    // Layer 2: RAG
    const passages = await fetchDocPassages(examType, examConfig.selectedTopics);
    setDocPassages(passages);
    if (passages.length > 0) console.log(`[Layer2] Retrieved ${passages.length} doc passages for grounding`);

    const promptWithDocs = buildAgenticPrompt(examType, examConfig.numQuestions, examConfig.selectedTopics, examConfig.aiProvider, passages);
    const enrichedConfig = { ...examConfig, customPrompt: promptWithDocs };

    setLoadingText(`Generating ${examConfig.numQuestions} dynamic questions using ${examConfig.aiProvider.toUpperCase()}...`);

    const { questions: fetchedQuestions, error, trace: genTrace } = await generateDynamicQuestions(examType, enrichedConfig, currentKey);
    if (genTrace) console.info('[Trace] Generation:', genTrace);
    if (error) setApiError(error);

    if (!fetchedQuestions || !Array.isArray(fetchedQuestions) || fetchedQuestions.length === 0) {
      setApiError(prev => prev || 'The AI generated an invalid or empty set of questions.');
      setGameState('menu');
      return;
    }

    // Layer 1: Validation — runs for ALL users now.
    // usingSharedKey → 1 cycle (lightweight, protects shared quota)
    // own key        → full 4-cycle pipeline
    const validationKey  = usingSharedKey ? DEFAULT_GROQ_KEY : groqKey;
    const bp             = EXAM_BLUEPRINTS[examType];

    const { questions: validatedQuestions, validationLog } = await runValidationPipeline(
      fetchedQuestions,
      examType,
      bp?.level || 'Intermediate-Level',
      validationKey,
      (msg) => setLoadingText(msg),
      usingSharedKey ? 1 : undefined   // 1 cycle for shared key, default (4) for own key
    );

    setLastValidationLog(validationLog);

    const randomizedQuestions = validatedQuestions.map(q => {
      const safeQuestion = typeof q.question === 'string' ? q.question : JSON.stringify(q?.question || 'Missing question text');
      const safeAnswer   = typeof q.answer   === 'string' ? q.answer   : JSON.stringify(q?.answer   || 'Missing answer text');
      let safeOptions = q.options;
      if (!Array.isArray(safeOptions)) {
        safeOptions = (typeof safeOptions === 'object' && safeOptions !== null)
          ? Object.values(safeOptions)
          : [String(safeOptions || 'Option A'), 'Option B', 'Option C', 'Option D'];
      }
      safeOptions = safeOptions.map(opt => typeof opt === 'string' ? opt : JSON.stringify(opt || ''));
      while (safeOptions.length < 4) safeOptions.push(`Dummy Option ${safeOptions.length + 1}`);
      const shuffledOptions = [...safeOptions].sort(() => Math.random() - 0.5);
      const correctIndex    = shuffledOptions.findIndex(opt => opt === safeAnswer);
      return {
        ...q,
        question:     safeQuestion,
        options:      shuffledOptions,
        correctIndex: correctIndex !== -1 ? correctIndex : 0,
        answer:       safeAnswer,
        topic:        typeof q.topic     === 'string' ? q.topic     : JSON.stringify(q?.topic     || 'General'),
        docSource:    typeof q.docSource === 'string' ? q.docSource : '',
      };
    });

    setQuestions(randomizedQuestions);
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(randomizedQuestions.length * 52);
    setGameState('exam');
  }, [apiKeys, examConfig, examType, buildAgenticPrompt]);

  const handleAnswerSelect = useCallback((optionIndex) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  }, [currentQuestionIndex]);

  // Layer 3: finish exam
  const finishExam = useCallback(() => {
    clearInterval(timerRef.current);
    if (examType && questions.length > 0) {
      updateProfile(examType, questions, userAnswers, lastValidationLog).catch(err => console.warn('[App] Profile update failed:', err.message));
    }
    if (isReviewMode && reviewQuestionHashes.length > 0) {
      clearReviewedAnswers(examType, reviewQuestionHashes);
    }
    setIsReviewMode(false);
    setReviewQuestionHashes([]);
    setDocPassages([]);
    setGameState('results');
  }, [examType, questions, userAnswers, isReviewMode, reviewQuestionHashes, lastValidationLog]);

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
      question:     item.question,
      options:      shuffleWithCorrect(item.correct_answer),
      correctIndex: 0,
      answer:       item.correct_answer,
      topic:        item.topic,
      _hash:        item.question_hash,
    })).map(q => {
      const shuffled = [...q.options].sort(() => Math.random() - 0.5);
      return { ...q, options: shuffled, correctIndex: shuffled.indexOf(q.answer) };
    });

    const hashes = originalQuestions.map(q => q._hash).filter(Boolean);
    const topicErrors = {};
    dueItems.forEach(item => { topicErrors[item.topic] = (topicErrors[item.topic] || 0) + item.times_missed; });
    const weakTopics = Object.entries(topicErrors).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

    const aiCount = Math.min(originalQuestions.length, 15);
    let aiQuestions = [];

    if (weakTopics.length > 0 && aiCount > 0) {
      setLoadingText(`Generating ${aiCount} fresh questions on your weak topics...`);
      const reviewConfig   = { ...examConfig, numQuestions: aiCount, selectedTopics: weakTopics, customPrompt: buildAgenticPrompt(examType, aiCount, weakTopics, examConfig.aiProvider) };
      const groqKey        = apiKeys['llama'] || DEFAULT_GROQ_KEY;
      const usingSharedKey = !apiKeys['llama'] || apiKeys['llama'].trim() === '' || apiKeys['llama'] === DEFAULT_GROQ_KEY;

      const { questions: fetched, trace: reviewTrace } = await generateDynamicQuestions(examType, reviewConfig, groqKey);
      if (reviewTrace) console.info('[Trace] Review generation:', reviewTrace);

      if (fetched?.length > 0) {
        const bp = EXAM_BLUEPRINTS[examType];
        const { questions: refined } = await runValidationPipeline(
          fetched,
          examType,
          bp?.level || 'Intermediate-Level',
          groqKey,
          (msg) => setLoadingText(msg),
          usingSharedKey ? 1 : undefined
        );
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

  // ── resultsData ────────────────────────────────────────────────────────────
  const resultsData = useMemo(() => {
    if (gameState !== 'results') return null;
    let correct = 0;
    const weakTopicsMap = {};
    questions.forEach((q, index) => {
      if (!q) return;
      const isCorrect = userAnswers[index] === q.correctIndex;
      if (isCorrect) correct++;
      else {
        const t = q.topic || 'Unknown Topic';
        weakTopicsMap[t] = (weakTopicsMap[t] || 0) + 1;
      }
    });
    const score  = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;
    const topicsToReview = Object.keys(weakTopicsMap)
      .map(topic => ({ topic, errors: weakTopicsMap[topic] }))
      .sort((a, b) => b.errors - a.errors);
    return { correct, total: questions.length, score, passed, topicsToReview };
  }, [gameState, questions, userAnswers]);

  // ── Render: Menu ───────────────────────────────────────────────────────────
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
          <button onClick={() => setViewMode('grid')} className={`p-2 transition-all rounded-sm ${viewMode === 'grid' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`} title="Grid View"><LayoutGrid className="w-5 h-5" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 transition-all rounded-sm ${viewMode === 'list' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`} title="List View"><List className="w-5 h-5" /></button>
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

  // ── Render: Loading ────────────────────────────────────────────────────────
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
      <h2 className="text-2xl font-semibold text-slate-700 animate-pulse">{loadingText}</h2>
      <p className="text-slate-500 text-center max-w-md">
        We are generating a unique set of questions for you. This ensures your practice exam is close to the real dynamically generated test format.
      </p>
    </div>
  );

  // ── Root render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans selection:bg-pink-200 selection:text-pink-900 flex flex-col">

      {!hasConsented && <ConsentModal onConsent={() => setHasConsented(true)} />}

      {showFeedbackModal && (
        <FeedbackModal onClose={() => setShowFeedbackModal(false)} apiKey={apiKeys['llama']} />
      )}

      <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center font-bold text-xl">
          <span className="text-pink-500 mr-1">&gt;</span> Splunk <span className="font-light ml-1 text-slate-300">MockTest</span>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 md:py-12">

        {gameState === 'menu'    && renderMenu()}
        {gameState === 'loading' && renderLoading()}

        {gameState === 'config' && (
          <ConfigScreen
            examType={examType}
            examConfig={examConfig}
            setExamConfig={setExamConfig}
            apiKeys={apiKeys}
            updateApiKey={updateApiKey}
            userEditedPrompt={userEditedPrompt}
            setUserEditedPrompt={setUserEditedPrompt}
            buildAgenticPrompt={buildAgenticPrompt}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            onBack={() => setGameState('menu')}
            onStart={handleStartExam}
            usageInfo={usageInfo}
          />
        )}

        {gameState === 'exam' && (
          <ExamScreen
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            userAnswers={userAnswers}
            handleAnswerSelect={handleAnswerSelect}
            flaggedQuestions={flaggedQuestions}
            setFlaggedQuestions={setFlaggedQuestions}
            examConfig={examConfig}
            timeRemaining={timeRemaining}
            isReviewMode={isReviewMode}
            showCancelModal={showCancelModal}
            setShowCancelModal={setShowCancelModal}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            finishExam={finishExam}
            onCancelToMenu={() => {
              setShowCancelModal(false);
              setIsReviewMode(false);
              setReviewQuestionHashes([]);
              setGameState('menu');
            }}
            formatTime={formatTime}
          />
        )}

        {gameState === 'results' && (
          <ResultsScreen
            resultsData={resultsData}
            examType={examType}
            questions={questions}
            userAnswers={userAnswers}
            apiKeys={apiKeys}
            profileVersion={profileVersion}
            setProfileVersion={setProfileVersion}
            handleStartReview={handleStartReview}
            onShowFeedback={() => setShowFeedbackModal(true)}
            onRetry={() => setGameState('menu')}
          />
        )}

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

      <AppFooter gameState={gameState} />
    </div>
  );
}
