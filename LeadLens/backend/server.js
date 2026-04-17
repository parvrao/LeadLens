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

app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

app.use(cors({ origin: '*', credentials: false }));
app.options('*', cors());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please wait and try again.' }
}));

const scrapeLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Scrape limit reached. Max 10 per hour.' } });
const aiLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 30, message: { error: 'AI limit reached. Max 30 per hour.' } });

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(compression());

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/leads/scrape', scrapeLimit);
app.use('/api/leads', require('./routes/leads'));
app.use('/api/ai/analyze', aiLimit);
app.use('/api/ai/email', aiLimit);
app.use('/api/ai', require('./routes/ai'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 LeadLens API on http://localhost:${PORT}`);
  console.log(`🤖 Gemini: ${process.env.GEMINI_API_KEY ? '✅' : '⚠️  Not set'}`);
  console.log(`🗺️  Places: ${process.env.GOOGLE_PLACES_API_KEY ? '✅' : '⚠️  Demo mode'}\n`);
});

module.exports = app;
