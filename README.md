# EcoForge 3D

EcoForge 3D is a smart, context-aware carbon footprint assistant for the sustainability and climate-action vertical. It helps a user estimate their carbon habits, turns those choices into a visual 3D island state, and gives practical AI-style guidance for improving everyday behavior.

Live site: https://auroriadigitalforge.github.io/EcoForge3d/

## Chosen Vertical

Sustainability / climate action.

The target persona is a student or everyday user who wants fast, understandable feedback about daily habits such as transport, electricity use, diet, air conditioning, and reusable-product use.

## Approach and Logic

The app combines a deterministic scoring model with an assistant layer:

- A five-question quiz calculates the initial carbon score from user context.
- The score is clamped between 0 and 100 and saved in browser localStorage.
- The 3D island changes based on score, making the user's impact visible.
- Logged eco actions update the experience and unlock assistant feedback.
- The AI advisor uses the latest action and score to provide short, practical guidance.
- Locally, the frontend can call the Express backend, which proxies Gemini requests safely without exposing the API key.
- On GitHub Pages, where no backend server is hosted, the frontend provides a deterministic fallback response so the demo remains usable.

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
├── docs/
├── frontend/
│   ├── public/
│   └── src/
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

- Code quality: organized React components, utility modules, backend routes, and tests.
- Security: API key stays server-side; `.env` is ignored; `.env.example` documents required variables.
- Efficiency: Vite production build, minimal backend proxy, browser localStorage instead of unnecessary database setup.
- Testing: Vitest, React Testing Library, and property tests cover score and interaction logic.
- Accessibility: semantic controls, focus states, ARIA labels, progress indicators, and keyboard-friendly interactions are included.
