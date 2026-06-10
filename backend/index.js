/**
 * EcoForge 3D — Express backend entry point.
 *
 * Requirements satisfied:
 *   Req 9.1 — PORT from env, defaults to 3001
 *   Req 9.5 — CORS origin from FRONTEND_ORIGIN env, defaults to http://localhost:5173
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import advisorRouter from './routes/advisor.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Req 9.5 — CORS restricted to frontend origin
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
}));

// Req 9.2 — parse JSON bodies; Express automatically returns 400 for malformed JSON
app.use(express.json());

// Handle JSON parse errors from express.json() — return 400 with clear message
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body.' });
  }
  next(err);
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api', advisorRouter);

// Health check — useful for confirming server is up during development
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ---------------------------------------------------------------------------
// Global error handler — catches anything unhandled in route handlers
// API key must never appear in responses (Req 9.4) — do not echo err.message
// for unknown errors without sanitising.
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
  console.error('[EcoForge] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`EcoForge 3D backend listening on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[EcoForge] WARNING: GEMINI_API_KEY is not set. /api/advisor will return 500.');
  }
});
