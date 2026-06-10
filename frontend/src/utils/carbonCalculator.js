/** Clamps `value` to [min, max]. */
export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Computes the initial Carbon_Score from an array of quiz answer deltas.
 * Formula: clamp(50 + sum(deltas), 0, 100)
 */
export function computeInitialScore(deltas) {
  const sum = deltas.reduce((acc, d) => acc + d, 0);
  return clamp(50 + sum);
}

/**
 * Applies an eco-action's point delta to the current score.
 * Formula: clamp(currentScore + pointDelta, 0, 100)
 */
export function applyAction(currentScore, pointDelta) {
  return clamp(currentScore + pointDelta);
}

/**
 * Derives the Island_State label from a Carbon_Score.
 * 0–30  → 'Polluted'
 * 31–70 → 'Neutral'
 * 71–100 → 'Green'
 */
export function deriveState(score) {
  if (score <= 30) return 'Polluted';
  if (score <= 70) return 'Neutral';
  return 'Green';
}

// ---------------------------------------------------------------------------
// Point-delta lookup tables
// ---------------------------------------------------------------------------

export const QUIZ_DELTAS = {
  transport:   { walk: 20, bicycle: 15, bus: 5, train: 5, motorcycle: -5, car: -15 },
  ac:          { '0-2h': 10, '2-5h': 0, '5-8h': -10, '8h+': -20 },
  diet:        { vegetarian: 10, mixed: 0, heavyMeat: -10 },
  electricity: { low: 10, medium: 0, high: -10 },
  reusable:    { always: 10, sometimes: 5, never: -10 },
};

export const ACTION_POINTS = {
  'Used Reusable Bottle':       5,
  'Planted a Tree':            20,
  'Rode a Bicycle':            10,
  'Used Public Transport':     10,
  'Saved Electricity':         10,
  'Avoided Plastic':           10,
  'Walked Instead of Driving': 15,
};

export const STATE_THRESHOLDS = {
  POLLUTED_MAX: 30,
  GREEN_MIN:    71,
};
