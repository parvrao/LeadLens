// routes/ai.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { analyzePainPoints, generatePersonalizedEmail } = require('../services/geminiService');
const { db } = require('../database/db');

// POST /api/ai/analyze — analyze a business for pain points
router.post('/analyze', auth, async (req, res) => {
  const { businessName, category, reviews, rating } = req.body;

  if (!businessName) return res.status(400).json({ error: 'businessName is required' });

  try {
    const analysis = await analyzePainPoints({ businessName, category, reviews, rating });
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// POST /api/ai/email — generate a personalized email
router.post('/email', auth, async (req, res) => {
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

// GET /api/ai/stats — dashboard intelligence summary
router.get('/stats', auth, (req, res) => {
  const userId = req.user.id;

  const stats = {
    totalLeads: db.prepare('SELECT COUNT(*) as c FROM leads WHERE user_id = ?').get(userId).c,
    enrichedLeads: db.prepare('SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND enriched_at IS NOT NULL').get(userId).c,
    withEmails: db.prepare('SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND email IS NOT NULL').get(userId).c,
    contacted: db.prepare("SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND status = 'contacted'").get(userId).c,
    replied: db.prepare("SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND status = 'replied'").get(userId).c,
    converted: db.prepare("SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND status = 'converted'").get(userId).c,
    avgScore: db.prepare('SELECT AVG(score) as avg FROM leads WHERE user_id = ? AND score > 0').get(userId).avg || 0,
    topCategory: db.prepare('SELECT category, COUNT(*) as c FROM leads WHERE user_id = ? GROUP BY category ORDER BY c DESC LIMIT 1').get(userId),
    activeCampaigns: db.prepare("SELECT COUNT(*) as c FROM campaigns WHERE user_id = ? AND status = 'active'").get(userId).c,
    user: db.prepare('SELECT scrapes_used, scrapes_limit FROM users WHERE id = ?').get(userId)
  };

  res.json({ stats });
});

module.exports = router;
