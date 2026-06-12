import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clearTransportChoice } from '../utils/scoreManager.js';

/**
 * Navbar — appears on the Island view.
 * Shows the app name/logo and a "Retake Quiz" link.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show "Retake Quiz" when on the island (not on landing/quiz)
  const onIsland = location.pathname === '/island';

  function handleRetakeQuiz() {
    // Clear saved score so the quiz runs fresh
    localStorage.removeItem('ecoforge_carbon_score');
    clearTransportChoice();
    navigate('/quiz');
  }

  return (
    <nav 
      className="w-full px-4 sm:px-6 py-3 flex items-center justify-between z-10 border-b border-eco-800/80 bg-eco-950/65 backdrop-blur-md"
      aria-label="Primary Navigation"
    >
      {/* FIX: The explanatory comment is now safely placed inside the semantic root component */}
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded-lg px-1"
        aria-label="EcoForge 3D home"
      >
        <span className="text-2xl drop-shadow" aria-hidden="true">🌿</span>
        <span className="text-lg sm:text-xl font-extrabold text-white group-hover:text-eco-300 transition-colors">
          EcoForge <span className="text-eco-400">3D</span>
        </span>
      </Link>

      {/* Actions */}
      {onIsland && (
        <button
          onClick={handleRetakeQuiz}
          aria-label="Reset your current progress and retake the carbon footprint quiz"
          className="
            text-sm font-medium px-4 py-2 rounded-xl border border-eco-700/80
            bg-eco-900/40 hover:bg-eco-800/60 text-eco-200 hover:text-white
            transition-all duration-150 active:scale-[0.97]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400
            focus-visible:ring-offset-2 focus-visible:ring-offset-eco-950
          "
        >
          Retake Quiz
        </button>
      )}
    </nav>
  );
}