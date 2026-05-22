# DevTrackr

DevTrackr is an AI-powered GitHub sprint analytics dashboard. It ingests GitHub repository activity, caches structured analytics in MongoDB, and uses Gemini structured JSON outputs to produce sprint summaries, bottleneck alerts, and actionable recommendations.

## Architecture

- `backend`: Express API, GitHub OAuth, Octokit ingestion, MongoDB persistence, Gemini analysis worker.
- `frontend`: React + Vite + Tailwind dashboard with Recharts visualizations.

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment examples and fill in credentials:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Run development servers:

   ```bash
   npm run dev
   ```

## Required services

- MongoDB connection string
- GitHub OAuth app credentials
- `GEMINI_API_KEY` for Google GenAI

