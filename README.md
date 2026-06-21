# EcoForge 3D

EcoForge 3D is a smart, context-aware carbon footprint assistant for the sustainability and climate-action vertical. It helps a user estimate their carbon habits, turns those choices into a visual 3D island state, and gives practical AI-style guidance for improving everyday behavior.

Live site: https://auroriadigitalforge.github.io/EcoForge3d/

## Chosen Vertical

Sustainability / climate action.

The target persona is a student or everyday user who wants fast, understandable feedback about daily habits such as transport, electricity use, diet, air conditioning, and reusable-product use.

## Approach and Logic

The app combines a deterministic scoring model with an assistant layer:

- A five-question quiz calculates the initial carbon score from user context.
- Eco actions logged in-session adjust the score within a 10-100 floor/ceiling.
- The 3D island changes based on score, making the user's impact visible.
- The AI advisor calls the Express backend (`POST /api/advisor`), which proxies the request to Gemini server-side so the API key is never exposed to the browser.
- On GitHub Pages, where no backend server is hosted, the frontend detects this and uses a deterministic fallback response instead, so the demo stays usable without credentials.
- If the backend request fails for any reason (network error, timeout, missing key), the app degrades gracefully to the same fallback rather than breaking the advisor panel.

## How the Solution Works

1. The user answers the carbon quiz.
2. The app computes a carbon score using weighted answer deltas.
3. The user sees an interactive low-poly island powered by Three.js.
4. The user logs eco actions.
5. The assistant generates targeted advice based on the logged action and current score.

## Repository and Deployment

This repository is designed for a single-branch GitHub Pages submission.

- Default branch: `main`
- GitHub Pages source: `main` branch, `/docs` folder
- Production build output: `docs/`
- No deployment branch is required

## Project Structure

```text
EcoForge3d/
├── backend/
│   ├── routes/
│   ├── services/
│   └── __tests__/
├── docs/
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── utils/appLogic.js
│       └── __tests__/
├── .gitignore
├── package.json
└── README.md
```

## Local Setup

Install dependencies:

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

Create the backend environment file:

```bash
# macOS / Linux
cp backend/.env.example backend/.env

# Windows (cmd)
copy backend\.env.example backend\.env
```

Set `GEMINI_API_KEY` in `backend/.env` if you want to test real Gemini responses locally.

Run the frontend:

```bash
npm run dev:frontend
```

Run the backend in a second terminal:

```bash
npm run dev:backend
```

Open:

```text
http://localhost:5173
```

## Scripts

```bash
npm run dev:frontend   # start Vite frontend
npm run dev:backend    # start Express backend
npm run build          # build production site into docs/
npm run test           # run frontend and backend tests
npm run deploy         # same as build for single-branch Pages deployment
```

## Assumptions

- GitHub Pages hosts only the static frontend.
- The Express backend is for local development and can be deployed separately later if real hosted Gemini responses are required.
- The static GitHub Pages demo uses a fallback advisor response so judges can test the flow without backend credentials.
- The repository must stay on one branch, so the production build is committed to root `docs/` instead of using a `gh-pages` branch.

## Evaluation Notes

- Code quality: a single source of truth for scoring/state logic (`utils/appLogic.js`), organized backend routes, services, and tests.
- Security: API key stays server-side; `.env` is gitignored; `.env.example` documents required variables as placeholders only.
- Efficiency: Vite production build, minimal backend proxy, no database — session state lives in memory.
- Testing: Vitest with property-based tests (fast-check) cover the scoring/state logic on both frontend and backend.
- Accessibility: semantic controls, focus states, ARIA labels, progress indicators, and keyboard-friendly interactions are included.
