/**
 * POST /api/advisor
 *
 * Proxies eco-action feedback requests to the Gemini API.
 * The API key lives exclusively on the server — never sent to the client.
 *
 * Requirements satisfied:
 *   Req 6.3 — exact prompt template
 *   Req 6.4 — response truncated to 50 words
 *   Req 6.6 — 500 on Gemini error / timeout
 *   Req 6.8 — 500 with exact message when GEMINI_API_KEY not set
 *   Req 6.9 — 400 when action field missing or empty
 *   Req 9.2 — accepts POST with JSON body containing `action` string
 *   Req 9.3 — 400 for malformed JSON (handled by express.json() in index.js)
 *             and for missing/empty action (handled here)
 *   Req 9.4 — API key never included in any response payload
 *   Req 9.6 — 500 with exact message when GEMINI_API_KEY not set
 */

import { Router } from 'express';
import { callGemini } from '../services/gemini.js';

const router = Router();

router.post('/advisor', async (req, res) => {
  // req.body may be undefined if Content-Type header was missing;
  // express.json() will have already returned 400 for truly malformed JSON.
  const body   = req.body ?? {};
  const action = body.action;
  const score  = body.score; // optional — included in prompt when present

  // Req 6.9 / 9.3: validate action field
  if (!action || typeof action !== 'string' || !action.trim()) {
    return res.status(400).json({ error: 'Missing or empty action field.' });
  }

  // Validate score when provided — must be a number in [0, 100]
  const scoreValue = (typeof score === 'number' && score >= 0 && score <= 100)
    ? Math.round(score)
    : undefined;

  // Req 6.8 / 9.6: API key guard — checked at request time, not at startup
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: API key not set.' });
  }

  try {
    const rawText  = await callGemini(apiKey, action.trim(), scoreValue);

    // Req 6.4: truncate to at most 50 words, preserving the original word order
    const truncated = rawText.split(/\s+/).filter(Boolean).slice(0, 50).join(' ');

    // Req 9.4: never include apiKey in response — only return truncated advice
    return res.status(200).json({ advice: truncated });

  } catch (err) {
    // Req 6.6: return 500 with the error message from the Gemini client
    // callGemini throws descriptive errors that do not contain the API key
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

export default router;
