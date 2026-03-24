import React, { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';

import { EXAM_BLUEPRINTS, YEAR_RANGE, PRODUCT_CONTEXT_MAP } from './utils/constants';
import { DEFAULT_GROQ_KEY }    from './utils/api';
import { buildAdaptiveContext } from './utils/agentAdaptive';
import { getOrCreateToken, hashToken } from './utils/privacyToken';
import { getUserId } from './utils/agentAdaptive';

import { useExamSession }     from './hooks/useExamSession';
import { useAdaptiveProfile } from './hooks/useAdaptiveProfile';
import { useKeyboard }        from './hooks/useKeyboard';

import ConsentModal          from './components/ConsentModal';
import FeedbackModal         from './components/FeedbackModal';
import AppFooter             from './components/AppFooter';
import AppInfoDrawer         from './components/AppInfoDrawer';
import PrivacySettingsModal  from './components/PrivacySettingsModal';
import MenuScreen            from './components/MenuScreen';
import LoadingScreen         from './components/LoadingScreen';
import ErrorModal            from './components/ErrorModal';
import ConfigScreen          from './components/ConfigScreen';
import ExamScreen            from './components/ExamScreen';
import ResultsScreen         from './components/ResultsScreen';
import { BASE_URL }          from './utils/baseUrl';

// ── Register privacy token on app load (fire-and-forget) ─────────────────────
async function ensurePrivacyToken() {
  try {
    const userId    = getUserId();
    const token     = getOrCreateToken();
    if (!token) return;
    const tokenHash = await hashToken(token);
    await fetch(`${BASE_URL}/privacy/register-token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, tokenHash }),
      signal:  AbortSignal.timeout(8000),
    });
  } catch { /* non-fatal — modal re-registers on open */ }
}

export default function App() {
  // ── Consent ───────────────────────────────────────────────────────────────
  const [hasConsented, setHasConsented] = useState(
    () => localStorage.getItem('splunkExamConsent') === 'true'
  );

  // ── Top-level UI ──────────────────────────────────────────────────────────
  const [viewMode,           setViewMode]           = useState('grid');
  const [examType,           setExamType]           = useState(null);
  const [profileVersion,     setProfileVersion]     = useState(0);
  const [showFeedbackModal,  setShowFeedbackModal]  = useState(false);
  const [showInfoDrawer,     setShowInfoDrawer]     = useState(false);
  const [showPrivacyModal,   setShowPrivacyModal]   = useState(false);
  const [showAdvanced,       setShowAdvanced]       = useState(false);
  const [userEditedPrompt,   setUserEditedPrompt]   = useState(false);
  const [focusMode,          setFocusMode]          = useState(false);

  const [apiKeys, setApiKeys] = useState(() => {
    const VALID = { perplexity: '', gemini: '', llama: DEFAULT_GROQ_KEY, qwen: '' };
    try {
      const saved  = localStorage.getItem('splunkMockExamApiKeys');
      if (!saved) return VALID;
      const parsed = JSON.parse(saved);
      const merged = { ...VALID, ...Object.fromEntries(Object.entries(parsed).filter(([k]) => k in VALID)) };
      if (!merged.llama) merged.llama = DEFAULT_GROQ_KEY;
      return merged;
    } catch { return VALID; }
  });

  const [examConfig, setExamConfig] = useState({
    numQuestions: 20, selectedTopics: [], useTimer: true, aiProvider: 'llama',
    customPrompt: '', focusMode: false,
  });

  // ── Register privacy token on mount ──────────────────────────────────────
  useEffect(() => {
    ensurePrivacyToken();
  }, []);

  const updateApiKey = useCallback((provider, value) => {
    setApiKeys(prev => {
      const next = { ...prev, [provider]: value };
      localStorage.setItem('splunkMockExamApiKeys', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── buildAgenticPrompt ────────────────────────────────────────────────────
  const buildAgenticPrompt = useCallback((type, num, topics, provider, passages = [], seenConcepts = []) => {
    if (!type) return '';
    const bp             = EXAM_BLUEPRINTS[type];
    const productContext = PRODUCT_CONTEXT_MAP[type] || 'Splunk Enterprise and Splunk Cloud Platform';
    const providerContext = provider === 'perplexity'
      ? `Use your live web search to verify answers against the latest ${YEAR_RANGE} Splunk documentation.`
      : `Draw from your deep knowledge of the Splunk product suite and official documentation.`;

    const levelGuidance = {
      'Foundational-Level': 'Questions should test basic recognition and recall. Avoid deep configuration syntax. Focus on concepts, definitions, and basic UI interactions a new user would encounter.',
      'Entry-Level':        'Questions should test practical understanding — not just definitions. Include some "what would you do" scenarios but keep them straightforward. Avoid multi-step troubleshooting.',
      'Intermediate-Level': 'Questions should require applied knowledge. Mix conceptual and scenario-based questions. Include some troubleshooting and configuration scenarios with realistic but clear context.',
      'Professional-Level': 'Questions should test real-world administration tasks. Include configuration-file-level details, troubleshooting multi-step scenarios, and architectural decisions.',
      'Expert-Level':       'Questions should test expert architectural decisions, cluster-level troubleshooting, sizing trade-offs, and edge-case scenarios an experienced practitioner would face.',
    };
    const difficulty = bp ? (levelGuidance[bp.level] || levelGuidance['Intermediate-Level']) : levelGuidance['Entry-Level'];

    let topicDistribution = '';
    if (topics.length > 0) {
      const base = Math.floor(num / topics.length);
      const rem  = num % topics.length;
      const dist = topics.map((t, i) => {
        const count = base + (i < rem ? 1 : 0);
        return `  - "${t}": ${count} question${count !== 1 ? 's' : ''}`;
      }).join('\n');
      topicDistribution = `The candidate has chosen to focus on these specific topics. Distribute the ${num} questions using these exact counts:\n${dist}\n\nCRITICAL DIVERSITY RULE: Each question must test a DIFFERENT specific concept, command, setting, or scenario. If a topic has multiple questions, they must cover different sub-concepts. Never generate two questions that differ only in a number, threshold, or port value.`;
    } else if (bp) {
      const topicCounts = bp.topics.map(t => ({ name: t.name, count: Math.max(1, Math.round((t.pct / 100) * num)) }));
      let total = topicCounts.reduce((s, t) => s + t.count, 0);
      let i = 0;
      while (total < num) { topicCounts[i % topicCounts.length].count++; total++; i++; }
      while (total > num) { const idx = topicCounts.findIndex(t => t.count > 1); if (idx >= 0) { topicCounts[idx].count--; total--; } else break; }
      const dist = topicCounts.map(t => `  - "${t.name}": ${t.count} question${t.count !== 1 ? 's' : ''}`).join('\n');
      topicDistribution = `Distribute the ${num} questions according to the OFFICIAL exam blueprint percentages:\n${dist}\n\nThis distribution is mandatory — do not deviate from these counts.`;
    } else {
      topicDistribution = `Distribute questions broadly and evenly across all major topics of the ${type} certification.`;
    }

    const { adaptivePromptSection } = buildAdaptiveContext(type, num, bp?.topics || []);

    let seenConceptsSection = '';
    if (seenConcepts && seenConcepts.length > 0) {
      const byTopic = {};
      for (const c of seenConcepts) {
        const t = c.topic || 'General';
        if (!byTopic[t]) byTopic[t] = [];
        byTopic[t].push(c.hint);
      }
      const lines = Object.entries(byTopic)
        .map(([topic, hints]) => `  [${topic}]\n${hints.map(h => `    - "${h}"`).join('\n')}`)
        .join('\n');
      seenConceptsSection = `
CROSS-SESSION DUPLICATE PREVENTION — MANDATORY:
The candidate has already seen questions on these exact concepts in previous sessions.
You MUST NOT generate questions that test the same specific scenario, command syntax,
or concept as any item listed below. Approach each topic from a completely different angle.

${lines}

This list contains ${seenConcepts.length} previously seen concept${seenConcepts.length !== 1 ? 's' : ''}.
Treat each item as a hard exclusion — if your question would have the same correct answer
or test the same sub-concept as a listed item, discard it and generate a different question.`;
    }

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
${passages.length > 0 ? `\nREFERENCE DOCUMENTATION — Base your questions on these official Splunk documentation passages.\nEvery question MUST be grounded in the content below. For each question, include a "docSource" field\nwith the URL of the passage that most directly supports that question.\n\n${passages.slice(0, 12).map((p, i) => `[DOC ${i + 1}] Topic: ${p.topic}\nSource: ${p.url}\n---\n${p.text.slice(0, 600)}\n---`).join('\n\n')}\n\n` : ''}${seenConceptsSection}

STRICT TOPIC BOUNDARY — this is the most important rule:
You MUST generate questions ONLY within the topics listed in the TOPIC DISTRIBUTION section above.
Do NOT introduce any topic, concept, or Splunk feature that belongs to a different certification exam.
Examples of what is FORBIDDEN for this exam ("${type}"):
${type === 'User'             ? `- Any question about indexer clusters, search head clusters, deployment servers, or forwarders — those are Enterprise Admin topics\n- Any question about security, threat detection, SIEM, or Splunk ES — those are Cybersecurity topics\n- Any question about CIM, data models, macros, or workflow actions — those are Power User topics\n- Any question about metrics, detectors, or OpenTelemetry — those are O11y topics` : ''}${type === 'Power User'      ? `- Any question about indexer clusters, license management, or Splunk infrastructure — those are Enterprise Admin topics\n- Any question about security, threat detection, or Splunk ES — those are Cybersecurity topics\n- Any question about SmartStore, multisite clusters, or capacity planning — those are Architect topics` : ''}${type === 'Cloud Admin'     ? `- Any question about on-premises Enterprise clustering or indexer cluster manager nodes — those are Enterprise Architect topics\n- Any question about security threat detection or Splunk ES — those are Cybersecurity topics` : ''}${type === 'Enterprise Admin' ? `- Any question about multisite indexer clusters or SmartStore — those are Enterprise Architect topics\n- Any question about security threat detection or Splunk ES — those are Cybersecurity topics` : ''}
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

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const session = useExamSession({ examType, examConfig, apiKeys, buildAgenticPrompt });

  const {
    communityStats,
    usageInfo,
    prewarmProfile,
    fetchUsageInfo,
  } = useAdaptiveProfile({ gameState: session.gameState, apiKeys });

  useKeyboard({
    currentQuestionIndex:    session.currentQuestionIndex,
    questionsLength:         session.questions.length,
    showGrid:                session.showGrid,
    showCancelModal:         session.showCancelModal,
    gameState:               session.gameState,
    setCurrentQuestionIndex: session.setCurrentQuestionIndex,
  });

  // ── Focus mode ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (session.gameState === 'exam' && examConfig.focusMode) setFocusMode(true);
    if (session.gameState !== 'exam') setFocusMode(false);
  }, [session.gameState, examConfig.focusMode]);

  const handleExitFocus = useCallback(() => setFocusMode(false), []);

  // ── handleSelectExamType ──────────────────────────────────────────────────
  const handleSelectExamType = useCallback(async (selectedType) => {
    setExamType(selectedType);
    setUserEditedPrompt(false);
    setExamConfig(prev => ({
      ...prev,
      numQuestions:   selectedType === 'Power User' ? 25 : 20,
      selectedTopics: [],
      useTimer:       true,
    }));
    session.setGameState('config');
    prewarmProfile(selectedType);
    await fetchUsageInfo();
  }, [session.setGameState, prewarmProfile, fetchUsageInfo]);

  // ── Sync prompt ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userEditedPrompt && examType) {
      setExamConfig(prev => ({
        ...prev,
        customPrompt: buildAgenticPrompt(
          examType, prev.numQuestions, prev.selectedTopics, prev.aiProvider,
        ),
      }));
    }
  }, [examType, examConfig.numQuestions, examConfig.selectedTopics, examConfig.aiProvider, userEditedPrompt, buildAgenticPrompt]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans selection:bg-pink-200 selection:text-pink-900 flex flex-col">

      {!hasConsented && <ConsentModal onConsent={() => setHasConsented(true)} />}

      {showFeedbackModal && (
        <FeedbackModal onClose={() => setShowFeedbackModal(false)} apiKey={apiKeys['llama']} />
      )}

      <AppInfoDrawer open={showInfoDrawer} onClose={() => setShowInfoDrawer(false)} />

      {showPrivacyModal && (
        <PrivacySettingsModal onClose={() => setShowPrivacyModal(false)} />
      )}

      <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-bold text-xl">
          <div className="flex items-center">
            <span className="text-pink-500 mr-1">&gt;</span> Splunk <span className="font-light ml-1 text-slate-300">MockTest</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Privacy button */}
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700 border border-slate-700 hover:border-slate-500"
              title="Privacy & Data Settings"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Privacy</span>
            </button>
            {/* About button */}
            <button
              onClick={() => setShowInfoDrawer(true)}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700 border border-slate-700 hover:border-slate-500"
            >
              About this tool
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 md:py-12">

        {session.gameState === 'menu' && (
          <MenuScreen
            viewMode={viewMode}
            setViewMode={setViewMode}
            communityStats={communityStats}
            onSelectExamType={handleSelectExamType}
            onShowFeedback={() => setShowFeedbackModal(true)}
          />
        )}

        {session.gameState === 'loading' && (
          <LoadingScreen loadingText={session.loadingText} />
        )}

        {session.gameState === 'config' && (
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
            onBack={() => session.setGameState('menu')}
            onStart={session.handleStartExam}
            usageInfo={usageInfo}
          />
        )}

        {session.gameState === 'exam' && (
          <ExamScreen
            questions={session.questions}
            currentQuestionIndex={session.currentQuestionIndex}
            setCurrentQuestionIndex={session.setCurrentQuestionIndex}
            userAnswers={session.userAnswers}
            handleAnswerSelect={session.handleAnswerSelect}
            flaggedQuestions={session.flaggedQuestions}
            setFlaggedQuestions={session.setFlaggedQuestions}
            examConfig={examConfig}
            timeRemaining={session.timeRemaining}
            isReviewMode={session.isReviewMode}
            showCancelModal={session.showCancelModal}
            setShowCancelModal={session.setShowCancelModal}
            showGrid={session.showGrid}
            setShowGrid={session.setShowGrid}
            finishExam={session.finishExam}
            onCancelToMenu={session.handleCancelToMenu}
            formatTime={formatTime}
            focusMode={focusMode}
            onExitFocus={handleExitFocus}
          />
        )}

        {session.gameState === 'results' && (
          <ResultsScreen
            resultsData={session.resultsData}
            examType={examType}
            questions={session.questions}
            userAnswers={session.userAnswers}
            apiKeys={apiKeys}
            profileVersion={profileVersion}
            setProfileVersion={setProfileVersion}
            handleStartReview={session.handleStartReview}
            onShowFeedback={() => setShowFeedbackModal(true)}
            onRetry={() => session.setGameState('menu')}
            onGoToConfig={() => { setShowAdvanced(true); session.setGameState('config'); }}
          />
        )}

        <ErrorModal
          apiError={session.apiError}
          onDismiss={() => session.setApiError(null)}
        />

      </main>

      <AppFooter gameState={session.gameState} />
    </div>
  );
}
