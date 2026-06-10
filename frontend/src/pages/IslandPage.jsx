import { useState, useEffect, useRef } from 'react';
import Navbar         from '../components/Navbar.jsx';
import Footer         from '../components/Footer.jsx';
import ScoreCard      from '../components/ScoreCard.jsx';
import EcoIsland3D   from '../components/EcoIsland3D.jsx';
import ActionLogger  from '../components/ActionLogger.jsx';
import AIAdvisor     from '../components/AIAdvisor.jsx';
import { useScore }  from '../hooks/useScore.js';
import { deriveState } from '../utils/carbonCalculator.js';

const STATE_TRANSITION_MSG = {
  Polluted: '🏭 Island is now Polluted — log actions to improve!',
  Neutral:  '🌤️ Island reached Neutral — great progress!',
  Green:    '🌿 Island is Green — amazing work!',
};

export default function IslandPage() {
  const { score, setScore } = useScore();
  
  // FIXED: Initializing with 'initial_load' instead of null to shield 
  // the backend Gemini API route from breaking on the first render cycle.
  const [lastAction,  setLastAction]  = useState('initial_load');
  const [toast,       setToast]       = useState(null);
  const [stateBanner, setStateBanner] = useState(null);

  const prevScoreRef = useRef(score);
  const prevStateRef = useRef(deriveState(score));
  const toastTimer   = useRef(null);
  const bannerTimer  = useRef(null);

  // Score-change toast + state-boundary banner (Req 8.5)
  useEffect(() => {
    const prev     = prevScoreRef.current;
    const prevSt   = prevStateRef.current;
    const newState = deriveState(score);

    if (score !== prev) {
      const delta = score - prev;
      clearTimeout(toastTimer.current);
      setToast(`Score: ${prev} → ${score} (${delta > 0 ? '+' : ''}${delta} pts)`);
      toastTimer.current = setTimeout(() => setToast(null), 3500);

      if (newState !== prevSt) {
        clearTimeout(bannerTimer.current);
        setStateBanner(STATE_TRANSITION_MSG[newState]);
        bannerTimer.current = setTimeout(() => setStateBanner(null), 5000);
      }

      prevScoreRef.current = score;
      prevStateRef.current = newState;
    }
  }, [score]);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(bannerTimer.current);
  }, []);

  return (
    /*
     * height:100vh via inline style — more reliable than h-screen across browsers,
     * especially after the quiz navigation triggers a fresh mount.
     * overflow-hidden prevents the page from growing beyond the viewport.
     */
    <div style={{ height: '100vh' }} className="flex flex-col bg-eco-950 overflow-hidden">

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── State boundary banner ── */}
      {stateBanner && (
        <div
          role="status"
          aria-live="assertive"
          className="w-full px-4 py-2 text-center text-sm font-semibold bg-eco-800 border-b border-eco-700 text-eco-100"
        >
          {stateBanner}
        </div>
      )}

      {/*
       * Main area.
       * flex-1 + min-h-0 are both required:
       * flex-1   → grows to fill the space between Navbar and Footer
       * min-h-0  → allows flex children to shrink, so the canvas container
       * can use height: 100% relative to this element
       */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row">

        {/*
         * Canvas container.
         *
         * The key insight: on desktop (lg+) this is a flex child with flex-1,
         * and its height is determined by the flex parent (main).  We need
         * position:absolute + inset-0 on the inner div so Three.js can measure
         * a non-zero clientWidth/clientHeight via ResizeObserver.
         *
         * On mobile the container has a fixed height via clamp(), and the
         * inner div fills it with h-full.
         */}
        <div
          className="relative lg:flex-1 lg:min-h-0 shrink-0"
          style={{
            // Mobile: clamp between 220px and 55vw (roughly square on phones).
            // Desktop (lg): overridden to fill flex parent — set via CSS class below.
            height: 'clamp(220px, 55vw, 60vh)',
          }}
        >
          {/*
           * On desktop we need height:100% to override the clamp above.
           * We can't do this in Tailwind with a responsive inline style, so
           * we use an absolutely-positioned fill layer that is only rendered
           * on lg+ screens, and a relative-positioned fill for mobile.
           */}
          <style>{`
            @media (min-width: 1024px) {
              .canvas-outer { height: 100% !important; }
            }
          `}</style>
          <div className="canvas-outer w-full h-full">
            <EcoIsland3D score={score} />
          </div>

          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-white/30 select-none pointer-events-none hidden lg:block">
            Drag to rotate · Scroll to zoom
          </p>
        </div>

        {/* ── Sidebar ── */}
        <aside
          className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-3 p-4 overflow-y-auto bg-eco-950/90 border-t border-eco-800 lg:border-t-0 lg:border-l"
          aria-label="Island dashboard"
        >
          <ScoreCard score={score} />

          <ActionLogger
            score={score}
            setScore={setScore}
            onActionSubmit={(name) => setLastAction(name)}
          />

          <AIAdvisor actionName={lastAction} score={score} />
        </aside>
      </main>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Score change toast (Req 8.5) ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-eco-800 border border-eco-600 text-eco-100 text-sm font-medium px-5 py-3 rounded-2xl shadow-xl pointer-events-none whitespace-nowrap"
        >
          {toast}
        </div>
      )}
    </div>
  );
}