const KEY = 'ecoforge_carbon_score';
const TRANSPORT_KEY = 'ecoforge_transport_choice';

/**
 * Reads the Carbon_Score from localStorage.
 * Returns a valid integer in [0, 100].
 * Falls back to 50 if the stored value is absent or invalid.
 */
export function loadScore() {
  const raw    = localStorage.getItem(KEY);
  const parsed = Number(raw);
  const valid  = Number.isInteger(parsed) && parsed >= 0 && parsed <= 100;
  return valid ? parsed : 50;
}

/**
 * Clamps `score` to [0, 100], serializes it, and writes to localStorage.
 * Returns the clamped value that was actually saved.
 * Throws if localStorage.setItem fails (e.g. storage quota exceeded).
 */
export function saveScore(score) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  localStorage.setItem(KEY, JSON.stringify(clamped));
  return clamped;
}

/**
 * Reads the selected transport mode from localStorage.
 * Returns null when no transport has been chosen yet.
 */
export function loadTransportChoice() {
  const raw = localStorage.getItem(TRANSPORT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string' && parsed.trim()) {
      return parsed.trim();
    }
  } catch {
    // Fall through to the raw value below.
  }

  return raw.trim() || null;
}

/**
 * Persists the selected transport mode.
 * Stores a normalized lowercase string so the 3D scene can use it directly.
 */
export function saveTransportChoice(choice) {
  const normalized = typeof choice === 'string' ? choice.trim().toLowerCase() : '';

  if (!normalized) {
    localStorage.removeItem(TRANSPORT_KEY);
    return null;
  }

  localStorage.setItem(TRANSPORT_KEY, JSON.stringify(normalized));
  return normalized;
}

/** Clears the selected transport mode. */
export function clearTransportChoice() {
  localStorage.removeItem(TRANSPORT_KEY);
}
