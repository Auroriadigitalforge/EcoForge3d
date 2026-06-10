import { useState } from 'react';
import { loadScore, saveScore } from '../utils/scoreManager.js';

/**
 * useScore — central score state hook.
 *
 * Reads the Carbon_Score from localStorage on mount (via lazy initializer so
 * it only runs once). Provides a `setScore` function that clamps, persists,
 * and triggers a React re-render in one call.
 *
 * Usage:
 *   const { score, setScore } = useScore();
 */
export function useScore() {
  // Lazy initializer: called once on mount, not on every re-render
  const [score, setScoreState] = useState(() => loadScore());

  /**
   * Updates the Carbon_Score.
   * - Persists to localStorage via saveScore (which handles clamping).
   * - Triggers a React re-render with the clamped value.
   * - Throws if localStorage.setItem fails — callers should wrap in try/catch
   *   when a write error needs to be surfaced to the user (e.g. CarbonQuiz).
   */
  function setScore(newScore) {
    const saved = saveScore(newScore);
    setScoreState(saved);
  }

  return { score, setScore };
}
