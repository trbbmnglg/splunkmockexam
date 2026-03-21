/**
 * hooks/useKeyboard.js
 *
 * Handles left/right arrow key navigation between exam questions.
 * Uses a ref to read current state without re-registering the listener
 * on every render — same pattern as the original App.jsx.
 */

import { useEffect, useRef } from 'react';

export function useKeyboard({ currentQuestionIndex, questionsLength, showGrid, showCancelModal, gameState, setCurrentQuestionIndex }) {
  const stateRef = useRef({
    currentQuestionIndex,
    questionsLength,
    showGrid,
    showCancelModal,
    gameState,
  });

  useEffect(() => {
    stateRef.current = { currentQuestionIndex, questionsLength, showGrid, showCancelModal, gameState };
  }, [currentQuestionIndex, questionsLength, showGrid, showCancelModal, gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const s = stateRef.current;
      if (s.gameState !== 'exam' || s.showGrid || s.showCancelModal) return;
      if (e.key === 'ArrowRight' && s.currentQuestionIndex < s.questionsLength - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
      if (e.key === 'ArrowLeft' && s.currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentQuestionIndex]);
}
