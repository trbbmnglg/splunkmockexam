/**
 * useExamSession — orchestrates the full exam lifecycle:
 * menu → config → loading → exam → results, plus review mode.
 *
 * Helpers and timer logic are extracted into separate modules:
 *   examSessionHelpers.js — pure functions (shuffleWithCorrect, fetchDocPassages, etc.)
 *   useExamTimer.js       — countdown timer hook
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { EXAM_BLUEPRINTS, SECONDS_PER_QUESTION, MAX_REVIEW_QUESTIONS } from '../utils/constants';
import { DEFAULT_GROQ_KEY, generateDynamicQuestions } from '../utils/api';
import { runValidationPipeline } from '../utils/agentValidator';
import {
  updateProfile, getWrongAnswerBank, clearReviewedAnswers,
  saveSeenConcepts, getRecentSeenConcepts, getUserId,
} from '../utils/agentAdaptive';
import { isTrackingEnabled, signedBody } from '../utils/privacyToken';
import { BASE_URL } from '../utils/baseUrl';
import { normalizeString, isUsingSharedKey } from '../utils/helpers';
import { getFlagPatterns } from '../utils/questionFlags';
import { shuffleWithCorrect, fetchDocPassages, checkAndIncrementUsage, randomizeQuestion } from './examSessionHelpers';
import { useExamTimer } from './useExamTimer';

/**
 * Core exam session hook.
 *
 * @param {object} params
 * @param {string} params.examType - Selected exam type (e.g. "User", "Power User").
 * @param {object} params.examConfig - Exam configuration (numQuestions, selectedTopics, useTimer, aiProvider, etc.).
 * @param {object} params.apiKeys - Provider → API key map.
 * @param {Function} params.buildAgenticPrompt - Prompt builder function.
 * @returns {object} Session state and action handlers.
 */
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
  const examStateRef = useRef({ examType, questions, userAnswers });
  const mountedRef   = useRef(true);

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

  // ── Timer (extracted hook) ────────────────────────────────────────────────
  const timerRef = useExamTimer({
    gameState,
    useTimer: examConfig.useTimer,
    setTimeRemaining,
    setGameState,
    setIsReviewMode,
    setReviewQuestionHashes,
    examStateRef,
  });

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
    const snapshotKeys = { ...apiKeys };
    const rawKey     = snapshotKeys[examConfig.aiProvider];
    const currentKey = (examConfig.aiProvider === 'llama' && (!rawKey || !rawKey.trim()))
      ? DEFAULT_GROQ_KEY
      : rawKey;

    if (!currentKey || currentKey.trim() === '') {
      safeSetApiError(`Please enter an API key for ${examConfig.aiProvider.toUpperCase()} in the Advanced Settings to generate the exam.`);
      return;
    }

    const groqKey     = snapshotKeys['llama'];
    const usingShared = isUsingSharedKey(groqKey);

    if (usingShared && examConfig.aiProvider === 'llama') {
      const usage = await checkAndIncrementUsage(BASE_URL);
      if (!mountedRef.current) return;
      if (!usage.allowed) { safeSetApiError(usage.message); return; }
      if (usage.remaining !== null && usage.remaining <= 2) {
        console.info(`[Usage] ${usage.remaining} shared-key exam${usage.remaining !== 1 ? 's' : ''} remaining today`);
      }
    }

    safeSetGameState('loading');
    safeSetLoadingText('Retrieving relevant Splunk documentation...');

    const [passages, seenConcepts, flagPatterns] = await Promise.all([
      fetchDocPassages(BASE_URL, examType, examConfig.selectedTopics),
      getRecentSeenConcepts(examType),
      getFlagPatterns(examType),
    ]);
    if (!mountedRef.current) return;

    setDocPassages(passages);
    if (passages.length > 0)      console.log(`[Layer2] Retrieved ${passages.length} doc passages for grounding`);
    if (seenConcepts.length > 0)  console.log(`[Dedup] Loaded ${seenConcepts.length} previously seen concepts for exclusion`);
    if (flagPatterns.length > 0)  console.log(`[Flags] Loaded ${flagPatterns.length} user flag patterns for quality warnings`);

    const promptWithDocs = buildAgenticPrompt(examType, examConfig.numQuestions, examConfig.selectedTopics, examConfig.aiProvider, passages, seenConcepts, flagPatterns);
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
      fetchedQuestions, examType, bp?.level || 'Intermediate-Level',
      validationKey, (msg) => safeSetLoadingText(msg), usingShared ? 1 : undefined
    );
    if (!mountedRef.current) return;

    setLastValidationLog(validationLog);

    if (genTrace) {
      const traceBody = signedBody(getUserId(), {
        examType,
        trace: {
          ...genTrace,
          questionCount:      validatedQuestions.length,
          validationCycles:   validationLog.length,
          validationFailures: validationLog.reduce((s, c) => s + c.failureCount, 0),
          ragPassageCount:    passages.length,
        },
      });
      if (traceBody) {
        fetch(`${BASE_URL}/traces`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(traceBody),
        }).catch(err => console.warn('[Trace] Telemetry POST failed:', err.message));
      }
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
      question: item.question,
      options:  shuffleWithCorrect(item.correct_answer),
      correctIndex: 0,
      answer:   item.correct_answer,
      topic:    item.topic,
      _hash:    item.question_hash,
    })).map(q => {
      const shuffled = [...q.options].sort(() => Math.random() - 0.5);
      const ci = shuffled.findIndex(o => normalizeString(o) === normalizeString(q.answer));
      return { ...q, options: shuffled, correctIndex: ci !== -1 ? ci : 0 };
    });

    const hashes      = originalQuestions.map(q => q._hash).filter(Boolean);
    const topicErrors = {};
    dueItems.forEach(item => {
      topicErrors[item.topic] = (topicErrors[item.topic] || 0) + item.times_missed;
    });
    const weakTopics = Object.entries(topicErrors).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

    const aiCount     = Math.min(originalQuestions.length, MAX_REVIEW_QUESTIONS);
    let   aiQuestions = [];

    if (weakTopics.length > 0 && aiCount > 0) {
      safeSetLoadingText(`Generating ${aiCount} fresh questions on your weak topics...`);

      // Fetch seen concepts to prevent regenerating questions the user already failed
      const seenConcepts = await getRecentSeenConcepts(examType);
      if (!mountedRef.current) return;

      const reviewConfig = {
        ...examConfig,
        numQuestions: aiCount, selectedTopics: weakTopics,
        customPrompt: buildAgenticPrompt(examType, aiCount, weakTopics, examConfig.aiProvider, [], seenConcepts),
        passages: [],
      };
      const groqKey     = apiKeys['llama'] || DEFAULT_GROQ_KEY;
      const usingShared = isUsingSharedKey(apiKeys['llama']);

      const { questions: fetched, trace: reviewTrace } = await generateDynamicQuestions(examType, reviewConfig, groqKey);
      if (!mountedRef.current) return;
      if (reviewTrace) console.info('[Trace] Review generation:', reviewTrace);

      if (fetched?.length > 0) {
        const bp = EXAM_BLUEPRINTS[examType];
        const { questions: refined } = await runValidationPipeline(
          fetched, examType, bp?.level || 'Intermediate-Level',
          groqKey, (msg) => safeSetLoadingText(msg), usingShared ? 1 : undefined
        );
        if (!mountedRef.current) return;
        aiQuestions = refined.map(q => {
          const safeAnswer = typeof q.answer === 'string' ? q.answer : '';
          let opts = Array.isArray(q.options) ? q.options.map(o => typeof o === 'string' ? o : '') : ['A', 'B', 'C', 'D'];
          while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
          const shuffled = [...opts].sort(() => Math.random() - 0.5);
          const ci = shuffled.findIndex(o => normalizeString(o) === normalizeString(safeAnswer));
          return { ...q, options: shuffled, correctIndex: ci !== -1 ? ci : 0 };
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
      if (userAnswers[index] === q.correctIndex) correct++;
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
    gameState, setGameState,
    questions, currentQuestionIndex, setCurrentQuestionIndex,
    userAnswers, flaggedQuestions, setFlaggedQuestions,
    timeRemaining, loadingText,
    apiError, setApiError,
    docPassages, lastValidationLog, isReviewMode,
    showCancelModal, setShowCancelModal,
    showGrid, setShowGrid,
    resultsData,
    handleAnswerSelect, handleStartExam, handleStartReview,
    handleCancelToMenu, finishExam,
  };
}
