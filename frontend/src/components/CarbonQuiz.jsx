import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { computeInitialScore, QUIZ_DELTAS } from '../utils/carbonCalculator.js';
import { saveScore, saveTransportChoice } from '../utils/scoreManager.js';

/**
 * Quiz questions in the required order (Req 2.1):
 * 1. Transportation, 2. AC usage, 3. Diet, 4. Electricity, 5. Reusable products
 */
const QUESTIONS = [
  {
    id: 'transport',
    text: 'How do you usually get around?',
    emoji: '🚗',
    answers: [
      { label: 'Walk',        delta: QUIZ_DELTAS.transport.walk,       hint: 'Healthiest option' },
      { label: 'Bicycle',     delta: QUIZ_DELTAS.transport.bicycle,    hint: 'Zero emissions' },
      { label: 'Bus',         delta: QUIZ_DELTAS.transport.bus,        hint: 'Shared transport' },
      { label: 'Train',       delta: QUIZ_DELTAS.transport.train,      hint: 'Low-carbon transit' },
      { label: 'Motorcycle',  delta: QUIZ_DELTAS.transport.motorcycle, hint: 'Moderate emissions' },
      { label: 'Car',         delta: QUIZ_DELTAS.transport.car,        hint: 'High emissions' },
    ],
  },
  {
    id: 'ac',
    text: 'How many hours per day do you run air conditioning?',
    emoji: '❄️',
    answers: [
      { label: '0–2 hours',  delta: QUIZ_DELTAS.ac['0-2h'],  hint: 'Minimal usage' },
      { label: '2–5 hours',  delta: QUIZ_DELTAS.ac['2-5h'],  hint: 'Moderate usage' },
      { label: '5–8 hours',  delta: QUIZ_DELTAS.ac['5-8h'],  hint: 'High usage' },
      { label: '8+ hours',   delta: QUIZ_DELTAS.ac['8h+'],   hint: 'Very high usage' },
    ],
  },
  {
    id: 'diet',
    text: 'Which best describes your diet?',
    emoji: '🥗',
    answers: [
      { label: 'Vegetarian',  delta: QUIZ_DELTAS.diet.vegetarian, hint: 'Lowest footprint' },
      { label: 'Mixed',       delta: QUIZ_DELTAS.diet.mixed,      hint: 'Moderate footprint' },
      { label: 'Heavy meat',  delta: QUIZ_DELTAS.diet.heavyMeat,  hint: 'Higher footprint' },
    ],
  },
  {
    id: 'electricity',
    text: 'How would you rate your household electricity usage?',
    emoji: '⚡',
    answers: [
      { label: 'Low',    delta: QUIZ_DELTAS.electricity.low,    hint: 'Energy-efficient home' },
      { label: 'Medium', delta: QUIZ_DELTAS.electricity.medium, hint: 'Average household' },
      { label: 'High',   delta: QUIZ_DELTAS.electricity.high,   hint: 'Heavy appliance use' },
    ],
  },
  {
    id: 'reusable',
    text: 'How often do you use reusable products (bags, bottles, containers)?',
    emoji: '♻️',
    answers: [
      { label: 'Always',    delta: QUIZ_DELTAS.reusable.always,    hint: 'Great habit' },
      { label: 'Sometimes', delta: QUIZ_DELTAS.reusable.sometimes, hint: 'Good effort' },
      { label: 'Never',     delta: QUIZ_DELTAS.reusable.never,     hint: 'Room to improve' },
    ],
  },
];

/**
 * CarbonQuiz — 5-question quiz that computes the initial Carbon_Score.
 *
 * Requirements satisfied:
 * Req 2.1  — 5 questions in the required topic order
 * Req 2.2  — advances on selection, no back navigation
 * Req 2.3  — correct point deltas per answer
 * Req 2.4  — score = 50 + sum(deltas)
 * Req 2.5  — clamped to 0 minimum (via computeInitialScore)
 * Req 2.6  — clamped to 100 maximum (via computeInitialScore)
 * Req 2.7  — persists via saveScore
 * Req 2.8  — shows error banner on save failure, stays on final screen
 * Req 2.9  — navigates to /island on success
 * Req 2.10 — handled in App.jsx (redirect if score exists)
 * Req 8.4  — fieldset/radio for keyboard navigation
 */
export default function CarbonQuiz() {
  const navigate  = useNavigate();
  const [step, setStep]       = useState(0);
  const [deltas, setDeltas]   = useState([]);
  const [saveError, setSaveError] = useState(null);

  const question     = QUESTIONS[step];
  const totalSteps   = QUESTIONS.length;
  const progress     = ((step) / totalSteps) * 100;

  function handleAnswer(delta, transportLabel) {
    const nextDeltas = [...deltas, delta];

    if (step === 0) {
      saveTransportChoice(transportLabel);
    }

    if (nextDeltas.length < totalSteps) {
      setDeltas(nextDeltas);
      setStep(s => s + 1);
    } else {
      const score = computeInitialScore(nextDeltas);
      try {
        saveScore(score);
        navigate('/island');
      } catch {
        setSaveError('Could not save your score. Please try again or free up browser storage.');
      }
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-eco-500/20 blur-3xl animate-drift"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-eco-800/40 blur-3xl animate-drift"
        style={{ animationDelay: '1.4s' }}
      />

      {/* Header */}
      <div className="w-full max-w-2xl mb-6 relative">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-eco-300">Carbon Footprint Quiz</h1>
          <span className="text-sm text-eco-500" aria-live="polite">
            Question {step + 1} of {totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-2 bg-eco-800 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Progress: Question ${step + 1} of ${totalSteps}`}
        >
          <div
            className="h-full bg-eco-400 rounded-full transition-all duration-500"
            style={{ width: `${progress + (1 / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl relative">
        <div aria-hidden="true" className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-eco-300/70 to-transparent" />

        {/* Save error banner — Req 2.8 */}
        {saveError && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-900/60 border border-red-700 rounded-lg text-sm text-red-200"
          >
            ⚠️ {saveError}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            {/* FIX: Simplified the legend by removing nested block h2 headers to align with HTML standards */}
            <legend className="w-full mb-6 block text-lg sm:text-xl font-semibold text-white leading-snug">
              <span className="flex items-center gap-3">
                <span className="text-4xl" aria-hidden="true">{question.emoji}</span>
                <span>{question.text}</span>
              </span>
            </legend>

            {/* FIX: Transformed pseudo-buttons into semantic, keyboard navigable radio options */}
            <div className="flex flex-col gap-3" role="radiogroup" aria-label={question.text}>
              {question.answers.map(({ label, delta, hint }) => (
                <label
                  key={label}
                  className="
                    w-full text-left flex items-center justify-between
                    px-5 py-4 rounded-2xl border border-eco-700/70
                    bg-eco-900/50 hover:bg-eco-800/65 hover:border-eco-500
                    text-white transition-all duration-150 cursor-pointer
                    hover:translate-x-0.5 active:scale-[0.98] select-none
                    focus-within:ring-2 focus-within:ring-eco-400 focus-within:ring-offset-2 focus-within:ring-offset-eco-900
                  "
                >
                  <input
                    type="radio"
                    name={`quiz-option-${question.id}`}
                    value={label}
                    onChange={() => handleAnswer(delta, label)}
                    className="sr-only"
                    aria-label={`${label}. ${hint}`}
                  />
                  <span className="font-medium text-base">{label}</span>
                  <span className="text-xs text-eco-300/90 ml-3 shrink-0" aria-hidden="true">
                    {hint}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </form>
      </div>

      {/* No back navigation — Req 2.2 */}
      <p className="mt-6 text-xs text-eco-700 select-none">
        Select an answer to continue &middot; No back navigation
      </p>
    </main>
  );
}