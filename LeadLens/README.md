# PROSPERA — AI-Powered B2B Lead Intelligence Platform

> Find every prospect. Know their pain. Close the deal.

Prospera is a full-stack B2B lead generation platform that outperforms MapLeads with:
- **Gemini AI pain point analysis** from real Google reviews
- **Hyper-personalized cold emails** (not templates — genuine per-business writing)
- **AI opportunity scoring** (1 to 100) based on sentiment, ratings, and industry signals
- **Campaign-based CRM** with pipeline tracking
- **GPS territory map view** (via Leaflet)
- **CSV export** for every campaign

---

## 5 Name Options for This Service

| Name | Concept |
|------|---------|
| **Prospera** | From "prosper" — growth and intelligence |
| **SignalHunt** | Hunt for the right signals in business data |
| **LeadLens** | Zoom in on the best prospects |
| **PitchRoot** | Root your pitch in real intelligence |
| **ReachIQ** | Intelligent outreach at scale |

---

## Tech Stack

### Backend
- **Node.js + Express** — REST API server
- **SQLite (better-sqlite3)** — zero-config embedded database
- **Google Gemini 1.5 Flash** — AI analysis and email generation
- **Google Places API** — business data extraction (200+ countries)
- **Hunter.io API** — email finder by domain
- **JWT + bcrypt** — authentication and security
- **Helmet + CORS + Rate Limiting** — production security

### Frontend
- **React 18 + Vite** — fast dev + optimized builds
- **React Router v6** — SPA routing with auth guards
- **Recharts** — pipeline funnel visualization
- **React Leaflet** — GPS territory map
- **Glassmorphism design system** — custom CSS with DM Serif Display + Syne fonts

---

## Required APIs

| API | Purpose | Free Tier | Docs |
|-----|---------|-----------|------|
| **Google Gemini** | AI analysis + email generation | 15 req/min (free) | https://aistudio.google.com |
| **Google Places** | Business search + reviews | $200/month credit | https://developers.google.com/maps/documentation/places |
| **Hunter.io** | Email finder by domain | 25/month free | https://hunter.io/api-keys |
| **Abstract API** | Email validation | 100/month free | https://www.abstractapi.com |

> **Without a Google Places API key:** The system returns realistic demo data so you can test the full UI flow.

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
node server.js
```

The server starts at `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:3000`.

---

## Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=any_long_random_string_here

# Optional (demo mode without these)
GOOGLE_PLACES_API_KEY=your_google_places_key
HUNTER_API_KEY=your_hunter_io_key
```

---

## Data Flow

```
User types query + location
        ↓
Backend calls Google Places API (Text Search)
        ↓
Returns up to 50 businesses with 30+ fields
        ↓
For each business: Hunter.io fetches email from domain
        ↓
Leads stored in SQLite with initial AI score
        ↓
User clicks "Enrich" on any lead
        ↓
Backend fetches Place Details (reviews) from Google
        ↓
Gemini AI analyzes reviews → pain points + opportunity score
        ↓
Gemini AI writes unique cold email referencing their specific situation
        ↓
Lead updated with enriched data, email ready to send/copy
```

---

## Security Measures

- JWT authentication with 7-day expiry
- bcrypt password hashing (12 rounds)
- Rate limiting: 100 req/15min global, 10 req/min for AI endpoints
- Input validation via express-validator
- Helmet.js security headers
- CORS whitelist
- SQL injection protection via parameterized queries (better-sqlite3)
- No sensitive data in URL parameters

---

## Gap Analysis vs MapLeads

| Feature | MapLeads | Prospera |
|---------|---------|---------|
| Business scraping | ✅ Google Maps | ✅ Google Places API (structured) |
| Email finding | ✅ Basic | ✅ Hunter.io domain search |
| AI email writing | ✅ Generic templates | ✅ Gemini per-business personalization |
| Pain point analysis | ❌ None | ✅ Gemini review analysis |
| Opportunity scoring | ❌ None | ✅ 1 to 100 AI score |
| Campaign CRM | ❌ Basic | ✅ Full pipeline tracking |
| CSV export | ✅ | ✅ |
| Auth / multi-user | ❌ | ✅ JWT-based |
| Self-hostable | ❌ | ✅ SQLite, no infra needed |

---

## Folder Structure

```
prospera/
├── backend/
│   ├── database/db.js          # SQLite schema + init
│   ├── middleware/auth.js       # JWT middleware
│   ├── routes/
│   │   ├── auth.js             # Register, login, /me
│   │   ├── campaigns.js        # Campaign CRUD
│   │   ├── leads.js            # Leads + scraping + export
│   │   └── ai.js               # Gemini endpoints + stats
│   ├── services/
│   │   ├── geminiService.js    # AI pain points + email gen
│   │   └── placesService.js    # Google Places + Hunter
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Express entry point
│
└── frontend/
    ├── src/
    │   ├── api/client.js       # Axios API layer
    │   ├── hooks/useAuth.js    # Auth context + hook
    │   ├── components/
    │   │   ├── Layout.jsx      # Sidebar navigation
    │   │   └── Layout.css
    │   ├── pages/
    │   │   ├── Landing.jsx     # Marketing landing
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx   # Stats + pipeline chart
    │   │   ├── Campaigns.jsx   # Campaign list + create
    │   │   ├── CampaignDetail.jsx
    │   │   └── Leads.jsx       # Main lead table + scrape
    │   ├── App.jsx             # Router + auth guards
    │   ├── index.css           # Glassmorphism design system
    │   └── main.jsx
    ├── index.html
    └── vite.config.js
```

---

## License

MIT — build freely, deploy confidently.
