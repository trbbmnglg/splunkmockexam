/**
 * useExamTimer — manages the countdown timer for the exam session.
 * Extracted from useExamSession to reduce hook complexity.
 */
import { useEffect, useRef } from 'react';
import { updateProfile, saveSeenConcepts } from '../utils/agentAdaptive';

/**
 * Runs a countdown timer during the exam. On timeout, saves the profile
 * and transitions to the results screen.
 *
 * @param {object} params
 * @param {string} params.gameState - Current game state ("menu"|"config"|"loading"|"exam"|"results").
 * @param {boolean} params.useTimer - Whether the timer is enabled.
 * @param {Function} params.setTimeRemaining - Setter for time remaining.
 * @param {Function} params.setGameState - Setter for game state.
 * @param {Function} params.setIsReviewMode - Setter for review mode flag.
 * @param {Function} params.setReviewQuestionHashes - Setter for review hashes.
 * @param {React.RefObject} params.examStateRef - Ref holding { examType, questions, userAnswers }.
 */
export function useExamTimer({
  gameState, useTimer, setTimeRemaining, setGameState,
  setIsReviewMode, setReviewQuestionHashes, examStateRef,
}) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (gameState === 'exam' && useTimer) {
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
  }, [gameState, useTimer]);

  return timerRef;
}
