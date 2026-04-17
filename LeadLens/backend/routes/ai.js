const express = require('express');
const router = express.Router();
const { analyzePainPoints, generatePersonalizedEmail } = require('../services/geminiService');
const { getStatus } = require('../services/quotaTracker');
const { db } = require('../database/db');

const DEMO_USER_ID = 'demo-user-001';

function ensureDemoUser() {
  db.prepare(`INSERT OR IGNORE INTO users (id, email, password_hash, name, plan, scrapes_used, scrapes_limit)
    VALUES (?, 'demo@prospera.app', 'demo', 'Demo User', 'pro', 0, 1000)`).run(DEMO_USER_ID);
  return DEMO_USER_ID;
}

// GET /api/ai/stats
router.get('/stats', (req, res) => {
  const userId = ensureDemoUser();
  try {
    // Check if leads table exists first
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='leads'"
    ).get();

    if (!tableExists) {
      return res.json({
        stats: {
          totalLeads: 0, enrichedLeads: 0, withEmails: 0,
          contacted: 0, replied: 0, converted: 0,
          avgScore: 0, activeCampaigns: 0,
          user: { scrapes_used: 0, scrapes_limit: 1000 }
        }
      });
    }

    const stats = {
      totalLeads:      db.prepare('SELECT COUNT(*) as c FROM leads WHERE user_id = ?').get(userId)?.c || 0,
      enrichedLeads:   db.prepare('SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND enriched_at IS NOT NULL').get(userId)?.c || 0,
      withEmails:      db.prepare('SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND email IS NOT NULL').get(userId)?.c || 0,
      contacted:       db.prepare("SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND status = 'contacted'").get(userId)?.c || 0,
      replied:         db.prepare("SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND status = 'replied'").get(userId)?.c || 0,
      converted:       db.prepare("SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND status = 'converted'").get(userId)?.c || 0,
      avgScore:        db.prepare('SELECT AVG(score) as avg FROM leads WHERE user_id = ? AND score > 0').get(userId)?.avg || 0,
      activeCampaigns: db.prepare("SELECT COUNT(*) as c FROM campaigns WHERE user_id = ? AND status = 'active'").get(userId)?.c || 0,
      user:            { scrapes_used: 0, scrapes_limit: 1000 }
    };
    res.json({ stats });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/analyze
router.post('/analyze', async (req, res) => {
  const { businessName, category, reviews, rating } = req.body;
  if (!businessName) return res.status(400).json({ error: 'businessName is required' });
  try {
    const analysis = await analyzePainPoints({ businessName, category, reviews, rating });
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// POST /api/ai/email
router.post('/email', async (req, res) => {
  const { businessData, offerDescription } = req.body;
  if (!businessData || !offerDescription) {
    return res.status(400).json({ error: 'businessData and offerDescription required' });
  }
  try {
    const emailData = await generatePersonalizedEmail(businessData, offerDescription);
    res.json({ emailData });
  } catch (err) {
    res.status(500).json({ error: 'Email generation failed: ' + err.message });
  }
});

// GET /api/ai/quota
router.get('/quota', (req, res) => {
  res.json({ quota: getStatus() });
});

module.exports = router;
