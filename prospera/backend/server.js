// server.js — Prospera Backend Entry Point
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

// Initialize database
initializeDatabase();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const globalLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests. Please wait and try again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const aiLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'AI request limit reached. Please wait a moment.' }
});

app.use(globalLimit);
app.use('/api/ai', aiLimit);
app.use('/api/leads/scrape', rateLimit({ windowMs: 60000, max: 5 }));

// Body parsing & compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Prospera API', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/ai', require('./routes/ai'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', ...(process.env.NODE_ENV === 'development' && { details: err.message }) });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Prospera API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Connected' : '⚠️  Not configured'}`);
  console.log(`🗺️  Google Places: ${process.env.GOOGLE_PLACES_API_KEY ? '✅ Connected' : '⚠️  Demo mode'}\n`);
});

module.exports = app;
