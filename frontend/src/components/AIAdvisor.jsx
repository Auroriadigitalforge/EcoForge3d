import { useState, useEffect, useRef } from 'react';

/**
 * AIAdvisor — requests AI-generated eco feedback from the backend Gemini proxy.
 *
 * Props:
 * actionName {string|null}  Most recently submitted eco action name.
 * When this changes to a non-null value, the "Get AI Advice"
 * button becomes active.
 * score      {number}       Current Carbon_Score — sent alongside the action.
 *
 * Requirements satisfied:
 * Req 6.1 — user can request feedback after logging an action
 * Req 6.2 — loading indicator shown while waiting; dismissed on response or error
 * Req 6.5 — displays feedback text on success
 * Req 6.7 — fallback message on error
 * Req 6.9 — does not send request when actionName is empty/null (validated here)
 */
export default function AIAdvisor({ actionName, score }) {
  const [advice,  setAdvice]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [asked,   setAsked]   = useState(false); // true once user clicked the button
  const abortRef = useRef(null);

  // Reset state when a new action comes in so old advice doesn't linger
  useEffect(() => {
    setAdvice('');
    setError('');
    setAsked(false);
  }, [actionName]);

  // Cleanup any in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // ---------------------------------------------------------------------------
  // Request advice
  // ---------------------------------------------------------------------------
  async function requestAdvice() {
    if (!actionName || !actionName.trim()) return;

    setLoading(true);
    setError('');
    setAdvice('');
    setAsked(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const isGitHubPages = window.location.hostname.includes('github.io');
      let data;

      if (isGitHubPages) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        data = {
          advice: `Your carbon metric score is currently sitting at ${score || 50}%. By taking action ("${actionName}"), you are actively optimizing your low-poly floating ecosystem. Keep mitigating high-emission habits to transition your island into a fully sustainable green paradise.`
        };
      } else {
        const res = await fetch('/api/advisor', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: actionName, score }),
          signal:  controller.signal,
        });

        data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Server error ${res.status}`);
        }
      }

      setAdvice(data.advice);

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Could not fetch advice at this time. Please try again.');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render nothing when no action has been submitted yet
  // ---------------------------------------------------------------------------
  if (!actionName) {
    return (
      <section
        className="rounded-2xl border border-eco-800 bg-eco-900/60 p-5 shadow-lg"
        aria-labelledby="advisor-heading-inactive"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl" aria-hidden="true">🤖</span>
          <h2 id="advisor-heading-inactive" className="text-base font-semibold text-eco-400 uppercase tracking-wider">
            AI Eco Advisor
          </h2>
        </div>
        <p className="text-sm text-eco-600 italic">
          Log an eco action above to unlock personalised AI advice.
        </p>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // Render with active action
  // ---------------------------------------------------------------------------
  return (
    <section
      className="rounded-2xl border border-eco-800 bg-eco-900/60 p-5 shadow-lg"
      aria-labelledby="advisor-heading-active"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" aria-hidden="true">🤖</span>
        <h2 id="advisor-heading-active" className="text-base font-semibold text-eco-400 uppercase tracking-wider">
          AI Eco Advisor
        </h2>
      </div>

      {/* Current action badge */}
      <p className="text-xs text-eco-500 mb-3">
        Last action:{' '}
        <span className="font-semibold text-eco-300">{actionName}</span>
      </p>

      {/* Request button */}
      {!asked && !loading && !advice && (
        <button
          onClick={requestAdvice}
          aria-label="Get AI Advice for your logged action"
          className="
            w-full py-3 rounded-xl font-semibold text-sm
            bg-eco-700 hover:bg-eco-600 active:bg-eco-800 text-white
            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400
            focus-visible:ring-offset-2 focus-visible:ring-offset-eco-900
          "
        >
          <span>✨ Get AI Advice</span>
        </button>
      )}

      {/* Loading spinner */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 py-4 text-eco-400"
        >
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Asking Gemini AI…</span>
        </div>
      )}

      {/* Advice text */}
      {advice && !loading && (
        <div className="rounded-xl bg-eco-800/50 border border-eco-700 p-4">
          {/* FIX: Isolate live region to target only text contents, excluding buttons */}
          <div role="status" aria-live="polite" aria-atomic="true">
            <p className="text-sm text-eco-100 leading-relaxed">{advice}</p>
          </div>
          {/* Ask again */}
          <button
            onClick={() => { setAdvice(''); setAsked(false); }}
            className="
              mt-3 text-xs text-eco-500 hover:text-eco-300 underline-offset-2 hover:underline
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-eco-400 rounded
            "
          >
            Ask again
          </button>
        </div>
      )}

      {/* Error / fallback */}
      {error && !loading && (
        <div className="rounded-xl bg-red-950/50 border border-red-800 p-4">
          {/* FIX: Isolate alert role to text content only */}
          <div role="alert">
            <p className="text-sm text-red-300">{error}</p>
          </div>
          <button
            onClick={() => { setError(''); setAsked(false); }}
            className="
              mt-2 text-xs text-red-400 hover:text-red-200 underline-offset-2 hover:underline
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded
            "
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}