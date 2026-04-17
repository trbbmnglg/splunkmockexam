import React, { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';

import { DEFAULT_GROQ_KEY }    from './utils/api';
import { getOrCreateToken, hashToken } from './utils/privacyToken';
import { getUserId } from './utils/agentAdaptive';
import { buildAgenticPrompt } from './utils/buildAgenticPrompt';

import { useExamSession }     from './hooks/useExamSession';
import { useAdaptiveProfile } from './hooks/useAdaptiveProfile';
import { useKeyboard }        from './hooks/useKeyboard';

import ConsentModal             from './components/ConsentModal';
import FeedbackModal            from './components/FeedbackModal';
import AppFooter                from './components/AppFooter';
import AppInfoDrawer            from './components/AppInfoDrawer';
import PrivacySettingsModal     from './components/PrivacySettingsModal';
import MenuScreen               from './components/MenuScreen';
import LoadingScreen            from './components/LoadingScreen';
import ErrorModal               from './components/ErrorModal';
import ConfigScreen             from './components/ConfigScreen';
import ExamScreen               from './components/ExamScreen';
import ResultsScreen            from './components/ResultsScreen';
import TransferCollisionModal   from './components/modals/TransferCollisionModal';
import { useToast }             from './components/Toast';
import { BASE_URL }             from './utils/baseUrl';

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

export default function App({ transferState }) {
  // ── Toast + profile-transfer collision state ──────────────────────────────
  const { push: toast, ToastContainer } = useToast();

  const [transferCollision, setTransferCollision] = useState(
    () => transferState?.collision === true ? transferState : null
  );

  // Fire the "Profile transferred" toast once on mount if the router flagged
  // a successful non-colliding transfer. No local setState/setTimeout — the
  // toast hook manages auto-dismissal.
  useEffect(() => {
    if (transferState?.collision === false) {
      toast({ type: 'success', message: 'Profile transferred — your study progress has been loaded.' });
    }
    // Intentionally only on mount — transferState is a hydration-time prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTransferChoice = useCallback((choice) => {
    if (!transferCollision) return;
    if (choice === 'incoming') {
      try {
        localStorage.setItem('splunkUserId', transferCollision.incomingUserId);
        localStorage.removeItem('splunkAdaptiveProfile');
      } catch {
        console.warn('[QR] Could not write userId to localStorage');
      }
    }
    // choice === 'keep' → do nothing, existing profile stays
    setTransferCollision(null);
    if (choice === 'incoming') window.location.reload();
  }, [transferCollision]);

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
  }, [examType, examConfig.numQuestions, examConfig.selectedTopics, examConfig.aiProvider, userEditedPrompt]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-accenture-gray-off-white font-sans selection:bg-accenture-purple-lightest selection:text-accenture-purple-darkest flex flex-col">

      {transferCollision && (
        <TransferCollisionModal
          onKeep={() => handleTransferChoice('keep')}
          onUseIncoming={() => handleTransferChoice('incoming')}
        />
      )}

      {!hasConsented && <ConsentModal onConsent={() => setHasConsented(true)} />}

      {showFeedbackModal && (
        <FeedbackModal onClose={() => setShowFeedbackModal(false)} apiKey={apiKeys['llama']} />
      )}

      <AppInfoDrawer open={showInfoDrawer} onClose={() => setShowInfoDrawer(false)} />

      {showPrivacyModal && (
        <PrivacySettingsModal onClose={() => setShowPrivacyModal(false)} />
      )}

      {!focusMode && (
      <nav className="bg-accenture-black text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-bold text-xl">
          <div className="flex items-center">
            <span className="text-accenture-purple mr-1">&gt;</span> Splunk <span className="font-light ml-1 text-accenture-gray-light">MockTest</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Privacy button */}
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-accenture-gray-light hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-accenture-purple-darkest border border-accenture-purple-darkest hover:border-accenture-purple"
              title="Privacy & Data Settings"
            >
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Privacy</span>
            </button>
            {/* About button */}
            <button
              onClick={() => setShowInfoDrawer(true)}
              className="text-xs font-semibold text-accenture-gray-light hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-accenture-purple-darkest border border-accenture-purple-darkest hover:border-accenture-purple"
            >
              About this tool
            </button>
          </div>
        </div>
      </nav>
      )}

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
      <ToastContainer />
    </div>
  );
}
