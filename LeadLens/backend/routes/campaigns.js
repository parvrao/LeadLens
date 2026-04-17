const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/db');

const DEMO_USER_ID = 'demo-user-001';

// Ensure demo user exists
function ensureDemoUser() {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(DEMO_USER_ID);
  if (!existing) {
    db.prepare(`INSERT OR IGNORE INTO users (id, email, password_hash, name, plan, scrapes_used, scrapes_limit)
      VALUES (?, 'demo@prospera.app', 'demo', 'Demo User', 'pro', 0, 1000)`).run(DEMO_USER_ID);
  }
  return DEMO_USER_ID;
}

router.get('/', (req, res) => {
  const userId = ensureDemoUser();
  const campaigns = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM leads WHERE campaign_id = c.id) AS leads_count,
      (SELECT COUNT(*) FROM leads WHERE campaign_id = c.id AND status = 'contacted') AS contacted_count
    FROM campaigns c WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId);
  res.json({ campaigns });
});

router.post('/', [body('name').trim().isLength({ min: 2 }), body('offerDescription').trim().isLength({ min: 10 })], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  const userId = ensureDemoUser();
  const { name, description, offerDescription, targetIndustry, targetLocation } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO campaigns (id, user_id, name, description, offer_description, target_industry, target_location)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, userId, name, description || '', offerDescription, targetIndustry || '', targetLocation || '');
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  res.status(201).json({ campaign });
});

router.get('/:id', (req, res) => {
  const userId = ensureDemoUser();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const stats = db.prepare(`SELECT COUNT(*) as total,
    SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) as new_leads,
    SUM(CASE WHEN status='contacted' THEN 1 ELSE 0 END) as contacted,
    SUM(CASE WHEN status='replied' THEN 1 ELSE 0 END) as replied,
    SUM(CASE WHEN status='converted' THEN 1 ELSE 0 END) as converted,
    AVG(score) as avg_score FROM leads WHERE campaign_id = ?`).get(campaign.id);
  res.json({ campaign, stats });
});

router.put('/:id', (req, res) => {
  const userId = ensureDemoUser();
  const campaign = db.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const { name, description, offerDescription, targetIndustry, targetLocation, status } = req.body;
  db.prepare(`UPDATE campaigns SET name=COALESCE(?,name), description=COALESCE(?,description),
    offer_description=COALESCE(?,offer_description), target_industry=COALESCE(?,target_industry),
    target_location=COALESCE(?,target_location), status=COALESCE(?,status), updated_at=datetime('now')
    WHERE id=? AND user_id=?`).run(name, description, offerDescription, targetIndustry, targetLocation, status, req.params.id, userId);
  res.json({ campaign: db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', (req, res) => {
  const userId = ensureDemoUser();
  const campaign = db.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  res.json({ message: 'Campaign deleted' });
});

module.exports = router;
