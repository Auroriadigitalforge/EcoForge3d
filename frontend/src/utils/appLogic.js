/**
 * appLogic.js — pure, framework-free scoring and state logic for EcoForge 3D.
 *
 * Extracted from App.jsx so the rules that decide the island's visual state
 * and the user's Carbon_Score can be unit-tested directly, without mounting
 * React or a WebGL context. Behaviour matches what the app has always run —
 * this module is the single source of truth, no thresholds were changed.
 */

/** Carbon_Score boundaries used by deriveState(). */
export const STATE_THRESHOLDS = {
  POLLUTED_MAX: 39, // score <= 39  -> Polluted
  GREEN_MIN: 76,    // score >= 76  -> Green
  // 40-75 inclusive -> Neutral
};

/**
 * Derives the Island_State label from a Carbon_Score (0-100).
 */
export function deriveState(score) {
  if (score < 40) return 'Polluted';
  if (score <= 75) return 'Neutral';
  return 'Green';
}

/**
 * Converts a Carbon_Score (0-100, higher = cleaner) into a 0-1 pollution
 * level (higher = dirtier) used to scale smoke density in the 3D scene.
 * Clamps the input defensively in case an out-of-range value reaches it.
 */
export function getPollutionLevel(score) {
  return 1 - Math.max(0, Math.min(100, score)) / 100;
}

/**
 * Applies a logged eco-action's point delta to the current score.
 * Adding an action raises the score (capped at 100); removing one
 * (un-toggling) lowers it but never below 10, so the island can always
 * recover without a full reset.
 */
export function applyActionDelta(currentScore, points, isAdding) {
  return isAdding
    ? Math.min(100, currentScore + points)
    : Math.max(10, currentScore - points);
}

/**
 * Sums the five carbon-quiz answer scores into the initial Carbon_Score.
 * Each answer is already a positive point value (5-20), so the result
 * naturally falls within 25-100 — no extra clamping required.
 */
export function computeQuizScore(answers) {
  return (
    answers.transport +
    answers.ac +
    answers.diet +
    answers.electricity +
    answers.waste
  );
}
