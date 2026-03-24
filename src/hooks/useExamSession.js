/**
 * hooks/useExamSession.js
 *
 * Changes in this version:
 *   - handleStartReview: added isTrackingEnabled() guard at the top.
 *     If tracking is off, shows a clear actionable error instead of
 *     hitting D1 and getting the confusing "no wrong answers" message.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  EXAM_BLUEPRINTS,
  SECONDS_PER_QUESTION,
  MAX_REVIEW_QUESTIONS,
  FUZZY_MATCH_THRESHOLD,
  MAX_QUESTION_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_DOCSOURCE_LENGTH,
  FETCH_TIMEOUT_MS,
} from '../utils/constants';
import { DEFAULT_GROQ_KEY, generateDynamicQuestions } from '../utils/api';
import { runValidationPipeline }    from '../utils/agentValidator';
import {
  updateProfile,
  getWrongAnswerBank,
  clearReviewedAnswers,
  saveSeenConcepts,
  getRecentSeenConcepts,
  getUserId,
} from '../utils/agentAdaptive';
import { isTrackingEnabled } from '../utils/privacyToken';
import { BASE_URL } from '../utils/baseUrl';
import { normalizeString, isUsingSharedKey, clampString } from '../utils/helpers';

// ─── Helpers (module-level, no state dependency) ──────────────────────────────

function shuffleWithCorrect(correctAnswer) {
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
}

async function fetchDocPassages(baseUrl, type, topics) {
  try {
    const topicParams = topics.length > 0
      ? topics.map(t => `topics[]=${encodeURIComponent(t)}`).join('&')
      : '';
    const url = `${baseUrl}/retrieve?examType=${encodeURIComponent(type)}${topicParams ? '&' + topicParams : ''}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (res.ok) return (await res.json()).passages || [];
  } catch (err) {
    console.warn('[Layer2] Doc retrieval failed, continuing without RAG:', err.message);
  }
  return [];
}

async function checkAndIncrementUsage(baseUrl) {
  try {
    const userId = getUserId();
    const res = await fetch(`${baseUrl}/usage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId }),
      signal:  AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
    return { allowed: true, remaining: null };
  } catch {
    return { allowed: true, remaining: null };
  }
}

function randomizeQuestion(q) {
  const safeQuestion = clampString(typeof q.question === 'string' ? q.question : JSON.stringify(q?.question || 'Missing question text'), MAX_QUESTION_LENGTH);
  const safeAnswer   = clampString(typeof q.answer   === 'string' ? q.answer   : JSON.stringify(q?.answer   || 'Missing answer text'), MAX_OPTION_LENGTH);

  let safeOptions = q.options;
  if (!Array.isArray(safeOptions)) {
    safeOptions = (typeof safeOptions === 'object' && safeOptions !== null)
      ? Object.values(safeOptions)
      : [String(safeOptions || 'Option A'), 'Option B', 'Option C', 'Option D'];
  }
  safeOptions = safeOptions.map(opt => clampString(typeof opt === 'string' ? opt : JSON.stringify(opt || ''), MAX_OPTION_LENGTH));
  while (safeOptions.length < 4) safeOptions.push(`Dummy Option ${safeOptions.length + 1}`);

  const shuffledOptions = [...safeOptions].sort(() => Math.random() - 0.5);

  // 1st pass: exact normalize match
  let correctIndex = shuffledOptions.findIndex(opt => normalizeString(opt) === normalizeString(safeAnswer));

  // 2nd pass: fuzzy — find option with most shared words (handles model rewording)
  if (correctIndex === -1) {
    const answerWords = new Set(normalizeString(safeAnswer).split(/\s+/));
    const scores = shuffledOptions.map(opt => {
      const optWords = normalizeString(opt).split(/\s+/);
      const shared = optWords.filter(w => answerWords.has(w)).length;
      return shared / Math.max(answerWords.size, optWords.length);
    });
    const best = scores.indexOf(Math.max(...scores));
    if (scores[best] >= FUZZY_MATCH_THRESHOLD) {
      console.info('[Question] Fuzzy matched answer:', safeAnswer, '→', shuffledOptions[best], `(${Math.round(scores[best]*100)}%)`);
      correctIndex = best;
    } else {
      console.warn('[Question] Answer-option mismatch (fuzzy also failed):', safeAnswer, '| options:', shuffledOptions, '| scores:', scores);
    }
  }

  return {
    ...q,
    question:     safeQuestion,
    options:      shuffledOptions,
    correctIndex: correctIndex !== -1 ? correctIndex : 0,
    answer:       shuffledOptions[correctIndex !== -1 ? correctIndex : 0],

    topic:        clampString(typeof q.topic     === 'string' ? q.topic     : JSON.stringify(q?.topic     || 'General'), MAX_TOPIC_LENGTH),
    docSource:    clampString(typeof q.docSource === 'string' ? q.docSource : '', MAX_DOCSOURCE_LENGTH),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExamSession({ examType, examConfig, apiKeys, buildAgenticPrompt }) {
  // ── Session state ──────────────────────────────────────────────────────────
  const [gameState,            setGameState]            = useState('menu');
  const [questions,            setQuestions]            = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers,          setUserAnswers]          = useState({});
  const [flaggedQuestions,     setFlaggedQuestions]     = useState({});
  const [timeRemaining,        setTimeRemaining]        = useState(0);
  const [loadingText,          setLoadingText]          = useState('');
  const [apiError,             setApiError]             = useState(null);
  const [docPassages,          setDocPassages]          = useState([]);
  const [lastValidationLog,    setLastValidationLog]    = useState([]);
  const [isReviewMode,         setIsReviewMode]         = useState(false);
  const [reviewQuestionHashes, setReviewQuestionHashes] = useState([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showGrid,        setShowGrid]        = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const timerRef      = useRef(null);
  const examStateRef  = useRef({ examType, questions, userAnswers });
  const mountedRef    = useRef(true);

  useEffect(() => {
    examStateRef.current = { examType, questions, userAnswers };
  }, [examType, questions, userAnswers]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Safe setState — no-ops after unmount
  const safeSetLoadingText = useCallback((v) => { if (mountedRef.current) setLoadingText(v); }, []);
  const safeSetApiError    = useCallback((v) => { if (mountedRef.current) setApiError(v); }, []);
  const safeSetGameState   = useCallback((v) => { if (mountedRef.current) setGameState(v); }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState === 'exam' && examConfig.useTimer) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            const { examType: et, questions: qs, userAnswers: ua } = examStateRef.current;
            if (et && qs.length > 0) {
              updateProfile(et, qs, ua, []).catch(err =>
                console.warn('[App] Profile update on timeout failed:', err.message)
              );
              saveSeenConcepts(et, qs);
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

  // ── handleAnswerSelect ─────────────────────────────────────────────────────
  const handleAnswerSelect = useCallback((optionIndex) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  }, [currentQuestionIndex]);

  // ── finishExam ─────────────────────────────────────────────────────────────
  const finishExam = useCallback(() => {
    clearInterval(timerRef.current);
    if (examType && questions.length > 0) {
      updateProfile(examType, questions, userAnswers, lastValidationLog)
        .catch(err => console.warn('[App] Profile update failed:', err.message));
      saveSeenConcepts(examType, questions);
    }
    if (isReviewMode && reviewQuestionHashes.length > 0) {
      clearReviewedAnswers(examType, reviewQuestionHashes);
    }
    setIsReviewMode(false);
    setReviewQuestionHashes([]);
    setDocPassages([]);
    setGameState('results');
  }, [examType, questions, userAnswers, isReviewMode, reviewQuestionHashes, lastValidationLog]);

  // ── handleStartExam ────────────────────────────────────────────────────────
  const handleStartExam = useCallback(async () => {
    // Snapshot keys at the start so mid-flight changes don't cause mismatches
    const snapshotKeys = { ...apiKeys };
    const rawKey     = snapshotKeys[examConfig.aiProvider];
    const currentKey = (examConfig.aiProvider === 'llama' && (!rawKey || !rawKey.trim()))
      ? DEFAULT_GROQ_KEY
      : rawKey;

    if (!currentKey || currentKey.trim() === '') {
      safeSetApiError(`Please enter an API key for ${examConfig.aiProvider.toUpperCase()} in the Advanced Settings to generate the exam.`);
      return;
    }

    const groqKey        = snapshotKeys['llama'];
    const usingShared    = isUsingSharedKey(groqKey);

    if (usingShared && examConfig.aiProvider === 'llama') {
      const usage = await checkAndIncrementUsage(BASE_URL);
      if (!mountedRef.current) return;
      if (!usage.allowed) {
        safeSetApiError(usage.message);
        return;
      }
      if (usage.remaining !== null && usage.remaining <= 2) {
        console.info(`[Usage] ${usage.remaining} shared-key exam${usage.remaining !== 1 ? 's' : ''} remaining today`);
      }
    }

    safeSetGameState('loading');
    safeSetLoadingText('Retrieving relevant Splunk documentation...');

    const [passages, seenConcepts] = await Promise.all([
      fetchDocPassages(BASE_URL, examType, examConfig.selectedTopics),
      getRecentSeenConcepts(examType),
    ]);
    if (!mountedRef.current) return;

    setDocPassages(passages);
    if (passages.length > 0)     console.log(`[Layer2] Retrieved ${passages.length} doc passages for grounding`);
    if (seenConcepts.length > 0) console.log(`[Dedup] Loaded ${seenConcepts.length} previously seen concepts for exclusion`);

    const promptWithDocs = buildAgenticPrompt(
      examType,
      examConfig.numQuestions,
      examConfig.selectedTopics,
      examConfig.aiProvider,
      passages,
      seenConcepts,
    );
    const enrichedConfig = { ...examConfig, customPrompt: promptWithDocs, passages };

    safeSetLoadingText(`Generating ${examConfig.numQuestions} dynamic questions using ${examConfig.aiProvider.toUpperCase()}...`);

    const { questions: fetchedQuestions, error, trace: genTrace } = await generateDynamicQuestions(examType, enrichedConfig, currentKey);
    if (!mountedRef.current) return;
    if (genTrace) console.info('[Trace] Generation:', genTrace);
    if (error)    safeSetApiError(error);

    if (!fetchedQuestions || !Array.isArray(fetchedQuestions) || fetchedQuestions.length === 0) {
      safeSetApiError(prev => prev || 'The AI generated an invalid or empty set of questions.');
      safeSetGameState('menu');
      return;
    }

    const validationKey = usingShared ? DEFAULT_GROQ_KEY : groqKey;
    const bp            = EXAM_BLUEPRINTS[examType];

    const { questions: validatedQuestions, validationLog } = await runValidationPipeline(
      fetchedQuestions,
      examType,
      bp?.level || 'Intermediate-Level',
      validationKey,
      (msg) => safeSetLoadingText(msg),
      usingShared ? 1 : undefined
    );
    if (!mountedRef.current) return;

    setLastValidationLog(validationLog);

    if (genTrace) {
      fetch(`${BASE_URL}/traces`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          examType,
          trace: {
            ...genTrace,
            questionCount:      validatedQuestions.length,
            validationCycles:   validationLog.length,
            validationFailures: validationLog.reduce((s, c) => s + c.failureCount, 0),
            ragPassageCount:    passages.length,
          }
        })
      }).catch(err => console.warn('[Trace] Telemetry POST failed:', err.message));
    }

    const randomizedQuestions = validatedQuestions.map(randomizeQuestion);

    setQuestions(randomizedQuestions);
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(randomizedQuestions.length * SECONDS_PER_QUESTION);
    safeSetGameState('exam');
  }, [apiKeys, examConfig, examType, buildAgenticPrompt, safeSetLoadingText, safeSetApiError, safeSetGameState]);

  // ── handleStartReview ──────────────────────────────────────────────────────
  const handleStartReview = useCallback(async () => {
    if (!examType) return;

    if (!isTrackingEnabled()) {
      safeSetApiError(
        'Study progress tracking is currently disabled.\n\n' +
        'Review sessions require your wrong answer bank, which is only saved when tracking is enabled.\n\n' +
        'To use review sessions: open Advanced Settings below the exam config and enable tracking, ' +
        'then complete an exam — your missed questions will be saved for review.'
      );
      return;
    }

    safeSetGameState('loading');
    safeSetLoadingText('Fetching your wrong answers from review bank...');

    const { wrongAnswers: dueItems } = await getWrongAnswerBank(examType, false);
    if (!mountedRef.current) return;
    if (!dueItems || dueItems.length === 0) {
      safeSetApiError('No wrong answers found in your review bank yet. Complete an exam first to build your bank.');
      safeSetGameState('results');
      return;
    }

    const originalQuestions = dueItems.slice(0, MAX_REVIEW_QUESTIONS).map(item => ({
      question:     item.question,
      options:      shuffleWithCorrect(item.correct_answer),
      correctIndex: 0,
      answer:       item.correct_answer,
      topic:        item.topic,
      _hash:        item.question_hash,
    })).map(q => {
      const shuffled = [...q.options].sort(() => Math.random() - 0.5);
      const norm2 = s => s.trim().replace(/\s+/g, ' ').toLowerCase();
      const ci2 = shuffled.findIndex(o => norm2(o) === norm2(q.answer));
      return { ...q, options: shuffled, correctIndex: ci2 !== -1 ? ci2 : 0 };
    });

    const hashes      = originalQuestions.map(q => q._hash).filter(Boolean);
    const topicErrors = {};
    dueItems.forEach(item => {
      topicErrors[item.topic] = (topicErrors[item.topic] || 0) + item.times_missed;
    });
    const weakTopics = Object.entries(topicErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    const aiCount     = Math.min(originalQuestions.length, MAX_REVIEW_QUESTIONS);
    let   aiQuestions = [];

    if (weakTopics.length > 0 && aiCount > 0) {
      safeSetLoadingText(`Generating ${aiCount} fresh questions on your weak topics...`);
      const reviewConfig = {
        ...examConfig,
        numQuestions:   aiCount,
        selectedTopics: weakTopics,
        customPrompt:   buildAgenticPrompt(examType, aiCount, weakTopics, examConfig.aiProvider),
        passages:       [],
      };
      const groqKey       = apiKeys['llama'] || DEFAULT_GROQ_KEY;
      const usingShared   = isUsingSharedKey(apiKeys['llama']);

      const { questions: fetched, trace: reviewTrace } = await generateDynamicQuestions(examType, reviewConfig, groqKey);
      if (!mountedRef.current) return;
      if (reviewTrace) console.info('[Trace] Review generation:', reviewTrace);

      if (fetched?.length > 0) {
        const bp = EXAM_BLUEPRINTS[examType];
        const { questions: refined } = await runValidationPipeline(
          fetched,
          examType,
          bp?.level || 'Intermediate-Level',
          groqKey,
          (msg) => safeSetLoadingText(msg),
          usingShared ? 1 : undefined
        );
        if (!mountedRef.current) return;
        aiQuestions = refined.map(q => {
          const safeAnswer = typeof q.answer === 'string' ? q.answer : '';
          let opts = Array.isArray(q.options) ? q.options.map(o => typeof o === 'string' ? o : '') : ['A', 'B', 'C', 'D'];
          while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
          const shuffled = [...opts].sort(() => Math.random() - 0.5);
          const norm3 = s => s.trim().replace(/\s+/g, ' ').toLowerCase();
          const ci3 = shuffled.findIndex(o => norm3(o) === norm3(safeAnswer));
          return { ...q, options: shuffled, correctIndex: ci3 !== -1 ? ci3 : 0 };
        });
      }
    }

    const combined = [...originalQuestions, ...aiQuestions].sort(() => Math.random() - 0.5);
    if (combined.length === 0) {
      safeSetApiError('Could not build a review session. Please try again.');
      safeSetGameState('results');
      return;
    }

    setIsReviewMode(true);
    setReviewQuestionHashes(hashes);
    setQuestions(combined);
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(combined.length * SECONDS_PER_QUESTION);
    safeSetGameState('exam');
  }, [examType, examConfig, apiKeys, buildAgenticPrompt, safeSetLoadingText, safeSetApiError, safeSetGameState]);

  // ── handleCancelToMenu ─────────────────────────────────────────────────────
  const handleCancelToMenu = useCallback(() => {
    setShowCancelModal(false);
    setIsReviewMode(false);
    setReviewQuestionHashes([]);
    setGameState('menu');
  }, []);

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

  return {
    gameState,
    setGameState,
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    userAnswers,
    flaggedQuestions,
    setFlaggedQuestions,
    timeRemaining,
    loadingText,
    apiError,
    setApiError,
    docPassages,
    lastValidationLog,
    isReviewMode,
    showCancelModal,
    setShowCancelModal,
    showGrid,
    setShowGrid,
    resultsData,
    handleAnswerSelect,
    handleStartExam,
    handleStartReview,
    handleCancelToMenu,
    finishExam,
  };
}
