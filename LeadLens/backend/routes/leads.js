const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sanitizeInputs, validateScrapeInput, validateCampaignInput } = require("../middleware/inputValidator");
const { db } = require('../database/db');
const { searchBusinesses, getPlaceDetails, findEmail } = require('../services/placesService');
const { enrichLead, generatePersonalizedEmail } = require('../services/geminiService');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

const DEMO_USER_ID = 'demo-user-001';

function ensureDemoUser() {
  db.prepare(`INSERT OR IGNORE INTO users (id, email, password_hash, name, plan, scrapes_used, scrapes_limit)
    VALUES (?, 'demo@prospera.app', 'demo', 'Demo User', 'pro', 0, 1000)`).run(DEMO_USER_ID);
  return DEMO_USER_ID;
}

router.get('/', (req, res) => {
  const userId = ensureDemoUser();
  const { campaignId, status, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM leads WHERE user_id = ?';
  const params = [userId];
  if (campaignId) { query += ' AND campaign_id = ?'; params.push(campaignId); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (business_name LIKE ? OR city LIKE ? OR category LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY score DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const leads = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM leads WHERE user_id = ?').get(userId).count;
  res.json({ leads, total, page: parseInt(page), limit: parseInt(limit) });
});

router.post("/scrape", sanitizeInputs, validateScrapeInput, async (req, res) => {
  const userId = ensureDemoUser();
  const { query, location, campaignId, maxResults = 20 } = req.body;
  if (!query || !location) return res.status(400).json({ error: 'Query and location are required' });

  const jobId = uuidv4();
  db.prepare(`INSERT INTO scrape_jobs (id, user_id, campaign_id, query, location, status, started_at)
    VALUES (?, ?, ?, ?, ?, 'running', datetime('now'))`).run(jobId, userId, campaignId || null, query, location);

  (async () => {
    try {
      const businesses = await searchBusinesses(query, location, 50000, Math.min(maxResults, 50));
      db.prepare('UPDATE scrape_jobs SET total = ? WHERE id = ?').run(businesses.length, jobId);
      const campaign = campaignId ? db.prepare('SELECT offer_description FROM campaigns WHERE id = ?').get(campaignId) : null;
      let inserted = 0;
      for (const biz of businesses) {
        const existing = db.prepare('SELECT id FROM leads WHERE place_id = ? AND user_id = ?').get(biz.placeId, userId);
        if (existing) continue;
        let email = null;
        if (biz.website) email = await findEmail(biz.website, biz.businessName).catch(() => null);
        const leadId = uuidv4();
        db.prepare(`INSERT INTO leads (id, campaign_id, user_id, business_name, category, address, city, state, country,
          phone, email, website, google_rating, review_count, status, score, lat, lng, place_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, datetime('now'))`)
          .run(leadId, campaignId || null, userId, biz.businessName, biz.category, biz.address, biz.city,
            biz.state, biz.country, biz.phone, email, biz.website, biz.rating, biz.reviewCount,
            Math.floor(30 + Math.random() * 40), biz.lat, biz.lng, biz.placeId);
        inserted++;
        db.prepare('UPDATE scrape_jobs SET progress = ?, results_count = ? WHERE id = ?').run(inserted, inserted, jobId);
      }
      db.prepare(`UPDATE scrape_jobs SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(jobId);
    } catch (err) {
      db.prepare(`UPDATE scrape_jobs SET status = 'failed', error = ? WHERE id = ?`).run(err.message, jobId);
    }
  })();

  res.json({ jobId, message: 'Scrape started.' });
});

router.get('/job/:jobId', (req, res) => {
  const job = db.prepare('SELECT * FROM scrape_jobs WHERE id = ?').get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ job });
});

router.post('/:id/enrich', async (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  try {
    let reviews = [];
    if (lead.place_id && process.env.GOOGLE_PLACES_API_KEY) {
      const details = await getPlaceDetails(lead.place_id);
      if (details?.reviews) reviews = details.reviews;
    }
    const campaign = lead.campaign_id ? db.prepare('SELECT offer_description FROM campaigns WHERE id = ?').get(lead.campaign_id) : null;
    const leadData = { id: lead.id, businessName: lead.business_name, category: lead.category, city: lead.city, rating: lead.google_rating, reviewCount: lead.review_count, reviews };
    const { analysis, emailData } = await enrichLead(leadData, campaign?.offer_description);
    db.prepare(`UPDATE leads SET pain_points=?, ai_summary=?, score=?, personalized_email=?, email_subject=?,
      raw_reviews=?, enriched_at=datetime('now'), updated_at=datetime('now') WHERE id=?`)
      .run(JSON.stringify(analysis.painPoints), analysis.summary, analysis.outreachScore,
        emailData?.body || null, emailData?.subject || null, JSON.stringify(reviews), lead.id);
    res.json({ lead: db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id), analysis, emailData });
  } catch (err) {
    res.status(500).json({ error: 'AI enrichment failed: ' + err.message });
  }
});

router.put('/:id', (req, res) => {
  const { status, email, phone } = req.body;
  db.prepare(`UPDATE leads SET status=COALESCE(?,status), email=COALESCE(?,email), phone=COALESCE(?,phone),
    updated_at=datetime('now') WHERE id=?`).run(status, email, phone, req.params.id);
  res.json({ lead: db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ message: 'Lead deleted' });
});

router.get('/export/csv', async (req, res) => {
  const userId = DEMO_USER_ID;
  const { campaignId } = req.query;
  const leads = db.prepare(`SELECT * FROM leads WHERE user_id = ? ${campaignId ? 'AND campaign_id = ?' : ''} ORDER BY score DESC`)
    .all(...[userId, ...(campaignId ? [campaignId] : [])]);
  const exportDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);
  const filePath = path.join(exportDir, `leads_${Date.now()}.csv`);
  const writer = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'business_name', title: 'Business Name' }, { id: 'category', title: 'Category' },
      { id: 'city', title: 'City' }, { id: 'state', title: 'State' },
      { id: 'phone', title: 'Phone' }, { id: 'email', title: 'Email' },
      { id: 'website', title: 'Website' }, { id: 'google_rating', title: 'Rating' },
      { id: 'review_count', title: 'Reviews' }, { id: 'score', title: 'AI Score' },
      { id: 'status', title: 'Status' }, { id: 'email_subject', title: 'Email Subject' },
      { id: 'personalized_email', title: 'Personalized Email' }, { id: 'ai_summary', title: 'AI Summary' }
    ]
  });
  await writer.writeRecords(leads);
  res.download(filePath, 'prospera_leads.csv', () => fs.unlinkSync(filePath));
});

module.exports = router;
