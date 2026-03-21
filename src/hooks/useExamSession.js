/**
 * hooks/useExamSession.js
 *
 * Owns all exam session state and the handlers that mutate it.
 * The timer lives here because it directly drives setTimeRemaining
 * and reads examStateRef — co-locating them avoids prop drilling
 * between hooks.
 *
 * Exports everything App.jsx needs to pass down to screen components.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { EXAM_BLUEPRINTS }          from '../utils/constants';
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

const BASE_URL = import.meta.env.MODE === 'development'
  ? '/api'
  : 'https://splunkmockexam.gtaad-innovations.com/api';

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
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
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
      signal:  AbortSignal.timeout(8000),
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
  const timerRef    = useRef(null);
  const examStateRef = useRef({ examType, questions, userAnswers });

  useEffect(() => {
    examStateRef.current = { examType, questions, userAnswers };
  }, [examType, questions, userAnswers]);

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
    const rawKey     = apiKeys[examConfig.aiProvider];
    const currentKey = (examConfig.aiProvider === 'llama' && (!rawKey || !rawKey.trim()))
      ? DEFAULT_GROQ_KEY
      : rawKey;

    if (!currentKey || currentKey.trim() === '') {
      setApiError(`Please enter an API key for ${examConfig.aiProvider.toUpperCase()} in the Advanced Settings to generate the exam.`);
      return;
    }

    const groqKey        = apiKeys['llama'];
    const usingSharedKey = !groqKey || groqKey.trim() === '' || groqKey === DEFAULT_GROQ_KEY;

    if (usingSharedKey && examConfig.aiProvider === 'llama') {
      const usage = await checkAndIncrementUsage(BASE_URL);
      if (!usage.allowed) {
        setApiError(usage.message);
        return;
      }
      if (usage.remaining !== null && usage.remaining <= 2) {
        console.info(`[Usage] ${usage.remaining} shared-key exam${usage.remaining !== 1 ? 's' : ''} remaining today`);
      }
    }

    setGameState('loading');
    setLoadingText('Retrieving relevant Splunk documentation...');

    // RAG + seen concepts in parallel
    const [passages, seenConcepts] = await Promise.all([
      fetchDocPassages(BASE_URL, examType, examConfig.selectedTopics),
      getRecentSeenConcepts(examType),
    ]);

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

    setLoadingText(`Generating ${examConfig.numQuestions} dynamic questions using ${examConfig.aiProvider.toUpperCase()}...`);

    const { questions: fetchedQuestions, error, trace: genTrace } = await generateDynamicQuestions(examType, enrichedConfig, currentKey);
    if (genTrace) console.info('[Trace] Generation:', genTrace);
    if (error)    setApiError(error);

    if (!fetchedQuestions || !Array.isArray(fetchedQuestions) || fetchedQuestions.length === 0) {
      setApiError(prev => prev || 'The AI generated an invalid or empty set of questions.');
      setGameState('menu');
      return;
    }

    const validationKey = usingSharedKey ? DEFAULT_GROQ_KEY : groqKey;
    const bp            = EXAM_BLUEPRINTS[examType];

    const { questions: validatedQuestions, validationLog } = await runValidationPipeline(
      fetchedQuestions,
      examType,
      bp?.level || 'Intermediate-Level',
      validationKey,
      (msg) => setLoadingText(msg),
      usingSharedKey ? 1 : undefined
    );

    setLastValidationLog(validationLog);

    // Persist generation trace
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
      }).catch(() => {});
    }

    const randomizedQuestions = validatedQuestions.map(randomizeQuestion);

    setQuestions(randomizedQuestions);
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(randomizedQuestions.length * 52);
    setGameState('exam');
  }, [apiKeys, examConfig, examType, buildAgenticPrompt]);

  // ── handleStartReview ──────────────────────────────────────────────────────
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

    const hashes      = originalQuestions.map(q => q._hash).filter(Boolean);
    const topicErrors = {};
    dueItems.forEach(item => {
      topicErrors[item.topic] = (topicErrors[item.topic] || 0) + item.times_missed;
    });
    const weakTopics = Object.entries(topicErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    const aiCount    = Math.min(originalQuestions.length, 15);
    let   aiQuestions = [];

    if (weakTopics.length > 0 && aiCount > 0) {
      setLoadingText(`Generating ${aiCount} fresh questions on your weak topics...`);
      const reviewConfig = {
        ...examConfig,
        numQuestions:   aiCount,
        selectedTopics: weakTopics,
        customPrompt:   buildAgenticPrompt(examType, aiCount, weakTopics, examConfig.aiProvider),
        passages:       [],
      };
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
    // state
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
    // derived
    resultsData,
    // handlers
    handleAnswerSelect,
    handleStartExam,
    handleStartReview,
    handleCancelToMenu,
    finishExam,
  };
}
