import { deriveState } from '../utils/carbonCalculator.js';

/**
 * State → visual config mapping.
 */
const STATE_CONFIG = {
  Polluted: {
    emoji:      '🏭',
    bar:        'bg-red-500',
    label:      'text-red-400',
    border:     'border-red-800',
    bg:         'bg-red-950/40',
    description: 'High carbon footprint',
  },
  Neutral: {
    emoji:      '🌤️',
    bar:        'bg-yellow-400',
    label:      'text-yellow-300',
    border:     'border-yellow-800',
    bg:         'bg-yellow-950/30',
    description: 'Moderate carbon footprint',
  },
  Green: {
    emoji:      '🌿',
    bar:        'bg-eco-400',
    label:      'text-eco-400',
    border:     'border-eco-700',
    bg:         'bg-eco-950/40',
    description: 'Low carbon footprint',
  },
};

/**
 * ScoreCard — displays the current Carbon_Score and Island_State.
 *
 * Requirements satisfied:
 *   Req 3.1 — shows numeric Carbon_Score on load and on change
 *   Req 3.2 — shows Island_State label with correct thresholds
 *   Req 3.3 — React prop re-render is synchronous (well inside 500 ms)
 *   Req 8.5 — aria-live="polite" announces changes to screen readers
 */
export default function ScoreCard({ score }) {
  const state  = deriveState(score);
  const config = STATE_CONFIG[state];

  return (
    <div
      className={`rounded-2xl border ${config.border} ${config.bg} p-5 shadow-lg`}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-eco-400 uppercase tracking-wider">
          Carbon Score
        </span>
        <span className="text-2xl" aria-hidden="true">{config.emoji}</span>
      </div>

      {/* Numeric score */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-5xl font-bold text-white tabular-nums">{score}</span>
        <span className="text-lg text-eco-500">/100</span>
      </div>

      {/* State label */}
      <p className={`text-base font-semibold ${config.label} mb-3`}>
        {state}
        <span className="sr-only"> — {config.description}</span>
      </p>

      {/* Score bar */}
      <div
        className="w-full h-3 bg-eco-800/60 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Carbon score: ${score} out of 100`}
      >
        <div
          className={`h-full ${config.bar} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Threshold labels */}
      <div className="flex justify-between mt-1 text-xs text-eco-700 select-none">
        <span>Polluted</span>
        <span>Neutral</span>
        <span>Green</span>
      </div>
    </div>
  );
}
