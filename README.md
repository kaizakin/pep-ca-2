# DevTrackr

DevTrackr is an AI-powered GitHub sprint analytics dashboard for engineering teams. It connects to a user’s GitHub account, ingests structured repository activity, caches sprint analytics in MongoDB, and uses Gemini structured JSON outputs to generate sprint summaries, bottleneck alerts, inactive-contributor signals, and prioritized recommendations.

The product is intentionally mechanics-first: instead of sending huge raw diffs to an LLM, DevTrackr aggregates clean GitHub activity data first, then sends compact structured payloads to Gemini.

![DevTrackr landing page](assets/screenshot-2026-05-22_13-27-27.png)

![DevTrackr analytics dashboard](assets/screenshot-2026-05-22_13-26-34.png)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [How the app works](#how-the-app-works)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [GitHub OAuth setup](#github-oauth-setup)
- [Local development](#local-development)
- [Using the app](#using-the-app)
- [GitHub webhooks](#github-webhooks)
- [API reference](#api-reference)
- [Data model overview](#data-model-overview)
- [Validation and build](#validation-and-build)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)

---

## Features

### Landing page

- Minimal, monochrome landing page inspired by a clean developer-tool aesthetic.
- The app always opens to the landing page at `/`.
- GitHub OAuth only starts when the user clicks **Analyze my GitHub stats**.

### GitHub OAuth

- GitHub OAuth login via the backend.
- Stores access tokens encrypted with AES-256-GCM.
- Issues a signed JWT for frontend API requests.
- Redirects authenticated users to `/dashboard` after OAuth completes.

### GitHub repository ingestion

DevTrackr uses Octokit to collect structured repository activity without sending raw diffs to Gemini.

It aggregates:

- Commit SHA
- Commit author
- Commit timestamp
- Commit message
- Additions and deletions
- Files changed
- Pull request state
- PR comments and review comments count
- PR additions, deletions, and changed files
- PR cycle time
- Issue labels
- Issue close velocity

### Gemini-powered sprint intelligence

The backend uses `@google/genai` and `gemini-3.5-flash` to generate structured JSON analytics.

Gemini returns:

- `sprintSummary`
- `inactiveContributors`
- `bottlenecks`
- `recommendations`

The response is constrained with `responseMimeType: 'application/json'` and `responseSchema`, so the frontend can safely render typed insight blocks without regex parsing.

### Cached analytics dashboard

The dashboard renders cached MongoDB analytics instead of waiting on GitHub and Gemini every page load.

It includes:

- Total commits
- Line delta
- Merged/open PR count
- Average PR cycle time
- Sprint burn-up / code velocity chart
- Work distribution donut chart
- PR cycle time chart
- AI insights terminal
- Bottleneck cards
- Recommendation cards

### Background refresh and webhook support

- A scheduled worker refreshes stale repositories.
- GitHub webhooks can mark repositories stale after `push`, `pull_request`, `issues`, and `issue_comment` events.
- This avoids aggressive REST polling and helps stay under GitHub API rate limits.

---

## Tech stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React icons

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- GitHub OAuth
- Octokit REST API
- Google GenAI SDK
- JWT authentication
- AES-256-GCM token encryption
- Node Cron background worker

### External services

- GitHub OAuth App
- GitHub REST API
- Gemini API
- MongoDB local instance or MongoDB Atlas

---

## Architecture

```mermaid
graph TD
  Landing[Landing Page] --> CTA[Analyze my GitHub stats]
  CTA --> OAuth[GitHub OAuth]
  OAuth --> API[Express Backend]
  API --> JWT[JWT Session]
  API --> Mongo[(MongoDB)]
  API --> GitHub[GitHub REST API]
  API --> Gemini[Gemini Structured Outputs]
  GitHub --> Webhooks[GitHub Webhooks]
  Webhooks --> API
  API --> Cache[Analytics Cache]
  Cache --> Dashboard[React Dashboard]
```

### Runtime request flow

```mermaid
sequenceDiagram
  participant User
  participant UI as React UI
  participant API as Express API
  participant GH as GitHub
  participant DB as MongoDB
  participant AI as Gemini

  User->>UI: Visit /
  UI-->>User: Show landing page
  User->>UI: Click Analyze my GitHub stats
  UI->>API: GET /api/auth/github
  API->>GH: Redirect to GitHub OAuth
  GH->>API: OAuth callback with code
  API->>GH: Exchange code for access token
  API->>DB: Store encrypted token and repos
  API-->>UI: Redirect to /auth/callback?token=JWT
  UI->>UI: Save JWT and redirect to /dashboard
  UI->>API: GET /api/analytics
  API->>DB: Read cached analytics
  DB-->>API: Cached dashboard payload
  API-->>UI: Analytics JSON
  UI-->>User: Render dashboard

  User->>UI: Refresh analytics
  UI->>API: POST /api/analytics/:owner/:repo/refresh
  API->>GH: Fetch structured GitHub activity
  API->>AI: Generate structured sprint insights
  API->>DB: Upsert analytics cache
  API-->>UI: Updated analytics JSON
```

---

## How the app works

### 1. User lands on `/`

The app always starts with the landing page. A logged-in user is not automatically pushed into the dashboard. This keeps the first impression clean and ensures OAuth only starts after intent.

### 2. User clicks **Analyze my GitHub stats**

The CTA points to:

```text
http://localhost:4000/api/auth/github
```

The backend creates a short-lived OAuth state token and redirects to GitHub.

### 3. GitHub redirects back to the backend

GitHub sends the OAuth code to:

```text
http://localhost:4000/api/auth/github/callback
```

The backend exchanges the code for an access token, encrypts the token, stores the user profile and repository list, signs a JWT, and redirects the browser to the frontend callback page.

### 4. Frontend stores JWT and opens `/dashboard`

The frontend callback route stores the JWT in local storage and redirects to:

```text
http://localhost:5173/dashboard
```

### 5. Dashboard loads cached analytics

The dashboard calls the backend cache endpoints. If no analytics exist yet, the user can choose a repository and click **Refresh analytics**.

### 6. Refresh analytics runs GitHub + Gemini pipeline

The refresh route:

1. Decrypts the user’s GitHub token.
2. Uses Octokit to fetch commits, PRs, and issues.
3. Builds compact chart and metric payloads.
4. Sends structured activity data to Gemini.
5. Stores metrics, charts, raw activity, AI output, and `calculatedAt` in MongoDB.
6. Returns the updated dashboard payload.

---

## Repository structure

```text
.
├── assets/
│   ├── screenshot-2026-05-22_13-26-34.png
│   └── screenshot-2026-05-22_13-27-27.png
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.js
│       │   └── env.js
│       ├── middleware/
│       │   └── auth.js
│       ├── models/
│       │   ├── RepositoryAnalytics.js
│       │   └── User.js
│       ├── routes/
│       │   ├── analytics.js
│       │   ├── auth.js
│       │   └── webhooks.js
│       ├── services/
│       │   ├── crypto.js
│       │   ├── gemini.js
│       │   └── github.js
│       └── workers/
│           └── analyticsWorker.js
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── components/
│       │   ├── AiInsights.tsx
│       │   ├── AuthCallback.tsx
│       │   ├── Charts.tsx
│       │   ├── Login.tsx
│       │   └── MetricCard.tsx
│       └── lib/
│           └── api.ts
├── package.json
├── package-lock.json
└── README.md
```

---

## Prerequisites

Install or configure the following before running DevTrackr:

- Node.js 18+
- npm
- MongoDB local instance or MongoDB Atlas database
- GitHub OAuth App
- Gemini API key

---

## Environment variables

### Backend environment

Create `backend/.env` from the example file:

```bash
cp backend/.env.example backend/.env
```

Example:

```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/devtrackr
JWT_SECRET=replace-with-a-long-random-secret
TOKEN_ENCRYPTION_KEY=replace-with-32-byte-base64-key
GITHUB_CLIENT_ID=replace-me
GITHUB_CLIENT_SECRET=replace-me
GITHUB_WEBHOOK_SECRET=replace-me
GEMINI_API_KEY=replace-me
ANALYTICS_CRON=*/15 * * * *
```

#### `PORT`

Backend server port. Default local URL:

```text
http://localhost:4000
```

#### `CLIENT_URL`

Frontend origin. For local development:

```text
http://localhost:5173
```

#### `MONGODB_URI`

MongoDB connection string. Local example:

```text
mongodb://127.0.0.1:27017/devtrackr
```

MongoDB Atlas example:

```text
mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/devtrackr
```

#### `JWT_SECRET`

Secret used to sign frontend bearer tokens. Use a long random string of at least 24 characters.

#### `TOKEN_ENCRYPTION_KEY`

Secret used for AES-256-GCM encryption of GitHub access tokens.

Generate one with:

```bash
openssl rand -base64 32
```

#### `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

Credentials from your GitHub OAuth App.

#### `GITHUB_WEBHOOK_SECRET`

Optional secret for validating GitHub webhook signatures.

#### `GEMINI_API_KEY`

Google GenAI API key used by `@google/genai`.

#### `ANALYTICS_CRON`

Cron expression for the background analytics refresh worker.

Default:

```text
*/15 * * * *
```

This runs every 15 minutes.

### Frontend environment

Create `frontend/.env` from the example file:

```bash
cp frontend/.env.example frontend/.env
```

Example:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## GitHub OAuth setup

Create a GitHub OAuth App from:

```text
GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
```

For local development, use:

```text
Homepage URL:
http://localhost:5173
```

```text
Authorization callback URL:
http://localhost:4000/api/auth/github/callback
```

The callback URL must point to the backend because the backend exchanges the OAuth code for an access token.

After the backend finishes authentication, it redirects the browser to:

```text
http://localhost:5173/auth/callback?token=...
```

Then the frontend stores the token and navigates to:

```text
http://localhost:5173/dashboard
```

---

## Local development

### 1. Install dependencies

From the repository root:

```bash
npm install
```

### 2. Configure environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in the required backend credentials.

### 3. Start MongoDB

If using local MongoDB, ensure it is running:

```bash
mongod
```

If using MongoDB Atlas, set `MONGODB_URI` in `backend/.env`.

### 4. Start the full app

```bash
npm run dev
```

This starts both workspaces:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```

### 5. Verify backend health

Open:

```text
http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "devtrackr-api"
}
```

---

## Using the app

1. Open the frontend:

   ```text
   http://localhost:5173
   ```

2. Click **Analyze my GitHub stats**.

3. Approve the GitHub OAuth request.

4. After redirect, open or remain on:

   ```text
   http://localhost:5173/dashboard
   ```

5. Choose a repository from the sidebar.

6. Click **Refresh analytics**.

7. Wait for DevTrackr to:

   - fetch GitHub activity,
   - build chart metrics,
   - ask Gemini for structured insights,
   - cache results in MongoDB,
   - render the dashboard.

---

## GitHub webhooks

DevTrackr supports GitHub webhooks to reduce polling.

Set the webhook payload URL to:

```text
http://localhost:4000/api/webhooks/github
```

For local webhook testing, expose the backend with a tunnel such as ngrok, then use the public URL:

```text
https://your-ngrok-domain.ngrok-free.app/api/webhooks/github
```

Recommended webhook events:

- `push`
- `pull_request`
- `issues`
- `issue_comment`

If `GITHUB_WEBHOOK_SECRET` is set, DevTrackr validates the `x-hub-signature-256` header before processing webhook payloads.

When a webhook event arrives, DevTrackr marks matching repository analytics as stale by clearing `lastSyncedAt`. The scheduled worker can then refresh the repository without constantly polling GitHub.

---

## API reference

### Health

#### `GET /health`

Returns service health.

```json
{
  "status": "ok",
  "service": "devtrackr-api"
}
```

### Authentication

#### `GET /api/auth/github`

Starts GitHub OAuth by redirecting to GitHub.

#### `GET /api/auth/github/callback`

Receives GitHub OAuth callback, exchanges the code for an access token, stores encrypted credentials, signs a JWT, and redirects back to the frontend.

#### `GET /api/auth/me`

Requires bearer token.

Returns the authenticated user and synced repositories.

```http
Authorization: Bearer <jwt>
```

#### `POST /api/auth/repositories/sync`

Requires bearer token.

Refreshes the authenticated user’s repository list from GitHub.

### Analytics

All analytics endpoints require bearer auth.

```http
Authorization: Bearer <jwt>
```

#### `GET /api/analytics`

Returns all cached analytics for the authenticated user.

#### `GET /api/analytics/:owner/:repo`

Returns cached analytics for a specific repository.

#### `POST /api/analytics/:owner/:repo/refresh`

Runs the full analytics pipeline for a repository:

1. Fetch GitHub activity.
2. Aggregate metrics and charts.
3. Generate Gemini insights.
4. Store analytics in MongoDB.
5. Return the updated analytics payload.

### Webhooks

#### `POST /api/webhooks/github`

Receives GitHub webhook events and marks matching repositories as stale.

---

## Data model overview

### User

Stored in `backend/src/models/User.js`.

Main fields:

- `githubId`
- `login`
- `avatarUrl`
- `encryptedAccessToken`
- `repositories`

The access token is stored as encrypted parts:

- `iv`
- `authTag`
- `ciphertext`

### RepositoryAnalytics

Stored in `backend/src/models/RepositoryAnalytics.js`.

Main fields:

- `userId`
- `owner`
- `repo`
- `fullName`
- `calculatedAt`
- `sprintWindow`
- `metrics`
- `charts`
- `ai`
- `rawActivity`

### Metrics

```js
{
  totalCommits,
  totalAdditions,
  totalDeletions,
  openPullRequests,
  mergedPullRequests,
  closedIssues,
  averagePrCycleHours
}
```

### Charts

```js
{
  codeVelocity,
  workDistribution,
  prCycleTime
}
```

### AI output

```js
{
  sprintSummary,
  inactiveContributors,
  bottlenecks,
  recommendations
}
```

---

## Gemini structured output

The backend uses Gemini with a response schema so responses are JSON-first and frontend-safe.

Simplified shape:

```js
{
  sprintSummary: string,
  inactiveContributors: string[],
  bottlenecks: string[],
  recommendations: [
    {
      priority: 'HIGH' | 'MEDIUM' | 'LOW',
      actionItem: string
    }
  ]
}
```

This is implemented in:

```text
backend/src/services/gemini.js
```

---

## Available scripts

### Root workspace

```bash
npm run dev
```

Runs frontend and backend concurrently.

```bash
npm run build
```

Builds/checks both workspaces.

```bash
npm run lint
```

Runs lint/build checks for workspaces that define a lint script.

```bash
npm run start
```

Starts the backend workspace.

### Backend

```bash
npm run dev --workspace backend
```

Starts the backend in watch mode with `tsx`.

```bash
npm run build --workspace backend
```

Runs `node --check` over backend source files.

```bash
npm run start --workspace backend
```

Starts the backend server.

### Frontend

```bash
npm run dev --workspace frontend
```

Starts Vite.

```bash
npm run build --workspace frontend
```

Builds the frontend for production.

```bash
npm run preview --workspace frontend
```

Previews the production build.

---

## Validation and build

Run the full workspace validation:

```bash
npm run build
```

The backend build performs JavaScript syntax checks with `node --check`.

The frontend build runs Vite production compilation.

A Vite chunk-size warning can appear because dashboard dependencies such as Recharts increase the bundle size. The app still builds successfully. If needed, this can be improved later with route-level code splitting or dynamic imports for chart components.

---

## Troubleshooting

### “This site can’t be reached” after clicking the GitHub button

The landing page sends users to:

```text
http://localhost:4000/api/auth/github
```

If the backend is not running, the browser cannot reach that URL.

Check:

```text
http://localhost:4000/health
```

If health does not load:

- ensure `npm run dev` is running,
- ensure `backend/.env` exists,
- ensure MongoDB is reachable,
- ensure required environment variables are valid.

### GitHub OAuth callback fails

Verify the GitHub OAuth app settings:

```text
Homepage URL:
http://localhost:5173
```

```text
Authorization callback URL:
http://localhost:4000/api/auth/github/callback
```

The callback must be the backend URL, not the frontend URL.

### Backend exits immediately

The backend validates environment variables at startup. Missing or invalid values cause the process to exit.

Check:

- `MONGODB_URI`
- `JWT_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GEMINI_API_KEY`

### MongoDB connection errors

If using local MongoDB, start it:

```bash
mongod
```

If using Atlas, confirm:

- username/password are correct,
- IP address is allowlisted,
- database URI is valid.

### Refresh analytics fails

Possible causes:

- GitHub token does not have repository access.
- GitHub REST rate limit was exceeded.
- Gemini API key is missing or invalid.
- Repository is private and the OAuth scope is insufficient.
- MongoDB write failed.

### Dashboard has no data

Click **Refresh analytics** for a selected repository. The app does not generate analytics automatically on first login because repository analysis can be slow and can consume API quota.

---

## Security notes

- GitHub access tokens are encrypted with AES-256-GCM before being saved.
- JWTs are signed with `JWT_SECRET` and expire after 7 days.
- Webhook signatures are verified when `GITHUB_WEBHOOK_SECRET` is configured.
- Secrets should never be committed to git.
- `.env` files are ignored by `.gitignore`.
- For production, use HTTPS for both frontend and backend.
- For production, replace `localhost` URLs with deployed domains.

---

## Production deployment notes

For deployment, update these values:

### Backend

```env
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=mongodb+srv://...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GEMINI_API_KEY=...
```

### Frontend

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```
