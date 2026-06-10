# EcoForge 3D

AI-Powered Carbon Footprint Awareness Platform — Hackathon MVP

---

## Quick Start

### 1. Install dependencies

```bash
# From the repo root (installs both frontend and backend via workspaces)
npm install
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set your GEMINI_API_KEY
```

### 3. Run both servers

```bash
# Starts frontend (Vite, port 5173) + backend (Express, port 3001) concurrently
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
Hackathon/
├── frontend/                  # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/        # LandingPage, CarbonQuiz, EcoIsland3D, ActionLogger,
│   │   │                      # ScoreCard, AIAdvisor, Navbar, Footer
│   │   ├── pages/             # IslandPage (assembles island view)
│   │   ├── utils/             # carbonCalculator.js, scoreManager.js
│   │   ├── hooks/             # useScore.js
│   │   ├── __tests__/         # Vitest + fast-check property tests
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                   # Node.js + Express
│   ├── routes/
│   │   └── advisor.js         # POST /api/advisor
│   ├── services/
│   │   └── gemini.js          # Gemini API HTTP client
│   ├── __tests__/
│   │   └── advisor.test.js
│   ├── index.js
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json               # Root workspace config
└── README.md
```

---

## Environment Variables

| Variable          | Location        | Required | Default                   | Description                    |
|-------------------|-----------------|----------|---------------------------|--------------------------------|
| `GEMINI_API_KEY`  | `backend/.env`  | Yes      | —                         | Google Gemini API key          |
| `PORT`            | `backend/.env`  | No       | `3001`                    | Express server port            |
| `FRONTEND_ORIGIN` | `backend/.env`  | No       | `http://localhost:5173`   | CORS allowed origin            |

---

## Scripts

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run dev`        | Start frontend + backend concurrently (root)     |
| `npm run build`      | Build frontend for production                    |
| `npm run test` (fe)  | Run frontend tests once (Vitest)                 |
| `npm run test` (be)  | Run backend tests once (Vitest)                  |

---

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Three.js, React Router
- **Backend**: Node.js, Express, dotenv, cors
- **AI**: Google Gemini API (`gemini-1.5-flash`)
- **Storage**: Browser `localStorage` (no database)
- **Testing**: Vitest, fast-check, @testing-library/react
