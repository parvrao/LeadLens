require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

initializeDatabase();

// ── Security headers ───────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// ── Strict CORS — only allow your frontend ────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and listed origins only
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

// ── Rate limiting — tiered by endpoint sensitivity ────────────

// Global: 150 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' }
}));

// Scraping: max 10 scrape jobs per hour per IP (protects Google Places quota)
const scrapeLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Scrape limit reached. Maximum 10 scrapes per hour.' }
});

// AI enrichment: max 30 per hour per IP (protects Gemini quota)
const aiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'AI enrichment limit reached. Maximum 30 per hour.' }
});

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));  // Reduced from 10mb — no need for more
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(compression());

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ── Health check (no sensitive info exposed) ──────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes with targeted rate limits ─────────────────────────
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/leads/scrape', scrapeLimit);   // Apply scrape limit before leads router
app.use('/api/leads', require('./routes/leads'));
app.use('/api/ai/analyze', aiLimit);         // Apply AI limit
app.use('/api/ai/email', aiLimit);
app.use('/api/ai', require('./routes/ai'));

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });  // Don't expose route details
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  // Log full error internally but never expose stack traces to client
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'Request not allowed' });
  }
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 LeadLens API running on http://localhost:${PORT}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Connected' : '⚠️  Not configured'}`);
  console.log(`🗺️  Google Places: ${process.env.GOOGLE_PLACES_API_KEY ? '✅ Connected' : '⚠️  Demo mode'}`);
  console.log(`🔒 CORS: ${allowedOrigins.join(', ')}\n`);
});

module.exports = app;
