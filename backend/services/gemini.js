/**
 * gemini.js — Gemini API HTTP client.
 *
 * Constructs the exact prompt template required by Req 6.3 and calls the
 * Gemini REST API with a 10-second AbortController timeout (Req 6.6).
 *
 * The API key is passed in as a parameter — this module never reads from
 * process.env directly, keeping it fully testable in isolation.
 *
 * Requirements satisfied:
 *   Req 6.3 — prompt template: "Analyze this eco action: {action}.
 *              Current score: {score}. Provide estimated impact, an encouraging
 *              message, and one improvement suggestion. Max 50 words."
 *   Req 6.6 — AbortController timeout of 10 seconds; throws on timeout/HTTP error
 *   Req 9.4 — apiKey never appears in thrown error messages
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const TIMEOUT_MS = 10_000;

/**
 * Calls the Gemini generateContent endpoint.
 *
 * @param {string}          apiKey  Server-side Gemini API key (never logged/returned)
 * @param {string}          action  Eco action name, e.g. "Planted a Tree"
 * @param {number|undefined} score  Current Carbon_Score (0–100); omitted when undefined
 * @returns {Promise<string>} Raw response text from Gemini (may exceed 50 words — caller truncates)
 * @throws {Error} Descriptive error that does NOT contain the apiKey value
 */
export async function callGemini(apiKey, action, score) {
  // Req 6.3 — exact prompt template
  const scoreClause = score !== undefined ? ` Current score: ${score}.` : '';
  const prompt =
    `Analyze this eco action: ${action}.${scoreClause} ` +
    `Provide estimated impact, an encouraging message, and one improvement suggestion. Max 50 words.`;

  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Minimal generation config — keep responses short and fast
        generationConfig: {
          maxOutputTokens: 120,
          temperature:     0.7,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    // Req 6.6 — timeout produces a specific message; other network errors propagate
    if (err.name === 'AbortError') {
      throw new Error('Gemini API request timed out.');
    }
    throw new Error(`Network error reaching Gemini API: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  // Req 6.6 — non-2xx status
  if (!response.ok) {
    // Do NOT include apiKey in the error message (Req 9.4)
    throw new Error(`Gemini API returned ${response.status} ${response.statusText}.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Gemini API returned an unreadable response body.');
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty or missing content in Gemini API response.');
  }

  return text;
}

/**
 * Builds the prompt string for a given action and optional score.
 * Exported separately so it can be verified in property-based tests (Property 9).
 *
 * @param {string}          action
 * @param {number|undefined} score
 * @returns {string}
 */
export function buildPrompt(action, score) {
  const scoreClause = score !== undefined ? ` Current score: ${score}.` : '';
  return (
    `Analyze this eco action: ${action}.${scoreClause} ` +
    `Provide estimated impact, an encouraging message, and one improvement suggestion. Max 50 words.`
  );
}
