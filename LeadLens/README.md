# Prospera — AI Lead Generation Platform

Find business leads from Google Maps. Analyze pain points with Gemini AI. Send personalized cold emails automatically.

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Add GEMINI_API_KEY and a JWT_SECRET string to .env
node server.js
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Render Deployment

### Backend (Web Service)
- Language: Node
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Env vars: `GEMINI_API_KEY`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGINS=https://your-frontend.onrender.com`

### Frontend (Static Site)
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Env vars: `VITE_API_URL=https://your-backend.onrender.com/api`
- Redirects/Rewrites: Source `/*` → Destination `/index.html` → Action `Rewrite`

## Required APIs

| API | Use | Free Tier | Link |
|-----|-----|-----------|------|
| Google Gemini | AI analysis + email writing | 15 req/min free | https://aistudio.google.com |
| Google Places | Business data from Maps | $200/mo credit | https://console.cloud.google.com |
| Hunter.io | Email finder by domain | 25/mo free | https://hunter.io |

Without Google Places API key — demo data is returned automatically so you can test everything.
