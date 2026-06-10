import { useNavigate } from 'react-router-dom';

/**
 * LandingPage — introduces EcoForge 3D and offers a "Start Quiz" CTA.
 *
 * Requirements satisfied:
 *   Req 1.1 — displays "EcoForge 3D" and tagline "Forge a Greener Future"
 *   Req 1.2 — description ≤ 100 words
 *   Req 1.3 — "Start Quiz" button present
 *   Req 1.4 — navigates to /quiz via React Router (no full reload)
 */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen px-6 py-12 sm:px-10 lg:px-16 hero-spotlight overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-16 -left-20 w-56 h-56 rounded-full bg-eco-500/20 blur-3xl animate-drift"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-eco-700/30 blur-3xl animate-drift"
        style={{ animationDelay: '1.6s' }}
      />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center min-h-[calc(100vh-6rem)]">
        <section className="text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-eco-700 bg-eco-900/55 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-eco-300 mb-6">
            <span aria-hidden="true">🌍</span>
            Climate Habit Simulator
          </p>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.02] mb-4">
            EcoForge{' '}
            <span className="text-eco-400">3D</span>
          </h1>

          <p className="text-xl sm:text-2xl text-eco-300 font-medium mb-6">
            Forge a Greener Future
          </p>

          <p className="max-w-2xl text-base sm:text-lg text-eco-100/90 leading-relaxed mb-8">
            Your lifestyle shapes a living 3D island. Answer five quick questions about
            your daily habits — transport, diet, energy use — to get a Carbon Score.
            Log eco-friendly actions every day to watch your island transform from a
            smog-covered wasteland into a lush, clean paradise powered by wind and solar.
            AI-generated advice from Gemini keeps you motivated along the way.
          </p>

          <div className="flex flex-wrap gap-3 mb-9" aria-label="Key features">
            {[
              { icon: '📊', label: 'Carbon Quiz' },
              { icon: '🏝️', label: '3D Island' },
              { icon: '📅', label: 'Daily Actions' },
              { icon: '🤖', label: 'AI Advisor' },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-eco-700/80 bg-eco-900/60 text-eco-200 text-sm font-semibold px-4 py-1.5"
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <button
              onClick={() => navigate('/quiz')}
              className="
                px-10 py-4 rounded-2xl text-lg font-bold
                bg-eco-400 hover:bg-eco-300 active:bg-eco-500 text-eco-950
                shadow-[0_12px_40px_rgba(22,163,74,0.35)]
                transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-200 focus-visible:ring-offset-2 focus-visible:ring-offset-eco-950
              "
            >
              Start Quiz
            </button>
            <p className="text-xs text-eco-600 select-none">
              No account required &middot; No data stored on servers
            </p>
          </div>
        </section>

        <aside className="glass-panel rounded-3xl p-6 sm:p-7 lg:p-8">
          <h2 className="text-xl font-semibold text-eco-200 mb-5">What Happens Next</h2>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Take the 5-question quiz', desc: 'We estimate your starting carbon score from your daily habits.' },
              { step: '02', title: 'Explore your 3D island', desc: 'Your environment reflects your current footprint state.' },
              { step: '03', title: 'Log eco actions daily', desc: 'Each action boosts your score and visually improves the island.' },
              { step: '04', title: 'Get AI suggestions', desc: 'Gemini gives focused encouragement and one practical tip.' },
            ].map((item) => (
              <article key={item.step} className="rounded-2xl border border-eco-700/60 bg-eco-950/55 p-4">
                <p className="text-xs text-eco-500 font-semibold tracking-wide">STEP {item.step}</p>
                <h3 className="text-base font-semibold text-white mt-0.5">{item.title}</h3>
                <p className="text-sm text-eco-200/90 mt-1">{item.desc}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
