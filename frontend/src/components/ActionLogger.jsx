import { useState, useEffect, useRef } from 'react';
import { applyAction, ACTION_POINTS } from '../utils/carbonCalculator.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Action definitions with display metadata. */
const ACTIONS = [
  { name: 'Used Reusable Bottle',      emoji: '🫙', points: ACTION_POINTS['Used Reusable Bottle'] },
  { name: 'Planted a Tree',            emoji: '🌳', points: ACTION_POINTS['Planted a Tree'] },
  { name: 'Rode a Bicycle',            emoji: '🚴', points: ACTION_POINTS['Rode a Bicycle'] },
  { name: 'Used Public Transport',     emoji: '🚌', points: ACTION_POINTS['Used Public Transport'] },
  { name: 'Saved Electricity',         emoji: '💡', points: ACTION_POINTS['Saved Electricity'] },
  { name: 'Avoided Plastic',           emoji: '♻️', points: ACTION_POINTS['Avoided Plastic'] },
  { name: 'Walked Instead of Driving', emoji: '🚶', points: ACTION_POINTS['Walked Instead of Driving'] },
];

/** How long (ms) the confirmation/duplicate toast stays visible (Req 8.5 — ≥3 s). */
const TOAST_DURATION_MS = 3500;

/** Returns the localStorage key for today's action log (ISO YYYY-MM-DD local time). */
function todayKey() {
  return `ecoforge_actions_${new Date().toLocaleDateString('en-CA')}`;
}

/** Reads today's logged action names from localStorage. */
function readTodayLog() {
  try {
    return JSON.parse(localStorage.getItem(todayKey()) || '[]');
  } catch {
    return [];
  }
}

/** Writes the updated today log back to localStorage. */
function writeTodayLog(log) {
  localStorage.setItem(todayKey(), JSON.stringify(log));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ActionLogger — lets the user log one eco action per day per action type.
 *
 * Props:
 *   score          {number}    Current Carbon_Score (0–100)
 *   setScore       {Function}  Setter from useScore — clamps, persists, triggers re-render
 *   onActionSubmit {Function}  Called with the submitted action name after a successful log
 *                              (used by IslandPage to trigger AIAdvisor)
 *
 * Requirements satisfied:
 *   Req 5.1 — all 7 eco actions with correct point values
 *   Req 5.2 — submit disabled until one action is selected; validation message shown
 *   Req 5.3 — carbon_calculator.applyAction adds points
 *   Req 5.4 — clamped to 100 (via applyAction)
 *   Req 5.5 — setScore persists to localStorage
 *   Req 5.6/5.7 — island transition is handled by EcoIsland3D watching score prop
 *   Req 5.8 — confirmation message contains action name + points awarded
 *   Req 5.9 — duplicate same-day action: message shown, no points added
 *   Req 8.4 — radio inputs with labels for keyboard navigation
 *   Req 8.5 — toast visible for ≥ 3 seconds
 */
export default function ActionLogger({ score, setScore, onActionSubmit }) {
  const [selected,    setSelected]    = useState(null);   // action name or null
  const [toast,       setToast]       = useState(null);   // { message, type: 'success'|'duplicate'|'validation' }
  const [todayLogged, setTodayLogged] = useState(() => readTodayLog());
  const [attempted,   setAttempted]   = useState(false);  // submit pressed with no selection
  const toastTimerRef = useRef(null);

  // Re-read today's log when the date changes (edge case: tab open past midnight)
  useEffect(() => {
    setTodayLogged(readTodayLog());
  }, []);

  // Clear toast timer on unmount
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function showToast(message, type) {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  function handleSubmit(e) {
    e.preventDefault();

    // Req 5.2: validate selection
    if (!selected) {
      setAttempted(true);
      showToast('Please select an action before submitting.', 'validation');
      return;
    }

    setAttempted(false);
    const log = readTodayLog();

    // Req 5.9: duplicate check
    if (log.includes(selected)) {
      showToast(`You've already logged "${selected}" today.`, 'duplicate');
      return;
    }

    // Req 5.3 / 5.4: apply delta and clamp
    const action     = ACTIONS.find(a => a.name === selected);
    const newScore   = applyAction(score, action.points);

    // Req 5.5: persist via useScore setter
    setScore(newScore);

    // Persist today's log
    log.push(selected);
    writeTodayLog(log);
    setTodayLogged([...log]);

    // Req 5.8: confirmation message with name + points
    showToast(`✓ ${selected} logged! +${action.points} pts`, 'success');

    // Notify parent (IslandPage) so AIAdvisor can offer feedback
    if (onActionSubmit) onActionSubmit(selected);

    // Reset selection
    setSelected(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <section
      className="rounded-2xl border border-eco-800 bg-eco-900/60 p-5 shadow-lg"
      aria-label="Daily Action Logger"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" aria-hidden="true">📅</span>
        <h2 className="text-base font-semibold text-eco-400 uppercase tracking-wider">
          Daily Actions
        </h2>
      </div>

      {/* Toast notification — Req 5.8, 5.9, 8.5 */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`
            mb-4 px-4 py-3 rounded-xl text-sm font-medium border
            transition-all duration-300
            ${toast.type === 'success'
              ? 'bg-eco-900 border-eco-600 text-eco-300'
              : toast.type === 'duplicate'
              ? 'bg-yellow-950/60 border-yellow-700 text-yellow-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
            }
          `}
        >
          {toast.message}
        </div>
      )}

      {/* Action selection form */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Req 8.4: fieldset + radio inputs for keyboard navigation */}
        <fieldset>
          <legend className="sr-only">Select an eco action to log</legend>

          <div className="flex flex-col gap-2 mb-4" role="radiogroup">
            {ACTIONS.map(({ name, emoji, points }) => {
              const alreadyLogged = todayLogged.includes(name);
              const isSelected    = selected === name;

              return (
                <label
                  key={name}
                  className={`
                    flex items-center justify-between gap-3
                    px-4 py-3 rounded-xl border cursor-pointer
                    transition-all duration-150 select-none
                    ${alreadyLogged
                      ? 'border-eco-900 bg-eco-950/30 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-eco-500 bg-eco-800/60 ring-2 ring-eco-400'
                      : 'border-eco-800 bg-eco-800/30 hover:border-eco-600 hover:bg-eco-800/50'
                    }
                    focus-within:ring-2 focus-within:ring-eco-400 focus-within:ring-offset-2 focus-within:ring-offset-eco-900
                  `}
                >
                  {/* Hidden radio — keyboard accessible via Tab + Space/Enter (Req 8.4) */}
                  <input
                    type="radio"
                    name="eco-action"
                    value={name}
                    checked={isSelected}
                    disabled={alreadyLogged}
                    onChange={() => {
                      setSelected(name);
                      setAttempted(false);
                    }}
                    className="sr-only"
                    aria-describedby={alreadyLogged ? `logged-${name}` : undefined}
                  />

                  {/* Left: emoji + name */}
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0" aria-hidden="true">{emoji}</span>
                    <span className={`text-sm font-medium truncate ${alreadyLogged ? 'text-eco-600' : 'text-white'}`}>
                      {name}
                    </span>
                    {alreadyLogged && (
                      <span id={`logged-${name}`} className="text-xs text-eco-600 shrink-0">
                        (done today)
                      </span>
                    )}
                  </span>

                  {/* Right: points badge */}
                  <span
                    className={`
                      shrink-0 text-xs font-bold px-2 py-0.5 rounded-full
                      ${alreadyLogged
                        ? 'bg-eco-900 text-eco-700'
                        : isSelected
                        ? 'bg-eco-500 text-eco-950'
                        : 'bg-eco-800 text-eco-400'
                      }
                    `}
                    aria-label={`+${points} points`}
                  >
                    +{points}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Validation message — Req 5.2 */}
          {attempted && !selected && (
            <p
              role="alert"
              className="mb-3 text-xs text-red-400 flex items-center gap-1"
            >
              <span aria-hidden="true">⚠️</span>
              Please select an action before submitting.
            </p>
          )}

          {/* Submit button — disabled until selection made (Req 5.2) */}
          <button
            type="submit"
            disabled={!selected}
            aria-disabled={!selected}
            className={`
              w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400
              focus-visible:ring-offset-2 focus-visible:ring-offset-eco-900
              ${selected
                ? 'bg-eco-500 hover:bg-eco-400 active:bg-eco-600 text-eco-950 shadow-md hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-eco-900 text-eco-700 cursor-not-allowed'
              }
            `}
          >
            {selected ? `Log Action (+${ACTIONS.find(a => a.name === selected)?.points ?? 0} pts)` : 'Select an action'}
          </button>
        </fieldset>
      </form>

      {/* Today's progress summary */}
      {todayLogged.length > 0 && (
        <div className="mt-4 pt-4 border-t border-eco-800">
          <p className="text-xs text-eco-600 mb-2 uppercase tracking-wide">Logged today</p>
          <div className="flex flex-wrap gap-1">
            {todayLogged.map(name => {
              const action = ACTIONS.find(a => a.name === name);
              return action ? (
                <span
                  key={name}
                  className="text-xs bg-eco-950 border border-eco-800 text-eco-500 rounded-full px-2 py-0.5 flex items-center gap-1"
                >
                  <span aria-hidden="true">{action.emoji}</span>
                  {name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </section>
  );
}
