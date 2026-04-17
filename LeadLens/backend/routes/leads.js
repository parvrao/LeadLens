// routes/leads.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const { db } = require('../database/db');
const { searchBusinesses, getPlaceDetails, findEmail } = require('../services/placesService');
const { enrichLead, generatePersonalizedEmail, generateBatchEmails } = require('../services/geminiService');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

// GET /api/leads — list leads for user (with filters)
router.get('/', auth, (req, res) => {
  const { campaignId, status, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM leads WHERE user_id = ?';
  const params = [req.user.id];

  if (campaignId) { query += ' AND campaign_id = ?'; params.push(campaignId); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (business_name LIKE ? OR city LIKE ? OR category LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  query += ' ORDER BY score DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const leads = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM leads WHERE user_id = ?').get(req.user.id).count;

  res.json({ leads, total, page: parseInt(page), limit: parseInt(limit) });
});

// POST /api/leads/scrape — trigger a scrape job
router.post('/scrape', auth, async (req, res) => {
  const { query, location, campaignId, maxResults = 20 } = req.body;

  if (!query || !location) {
    return res.status(400).json({ error: 'Query and location are required' });
  }

  // Check usage limits
  const user = db.prepare('SELECT scrapes_used, scrapes_limit FROM users WHERE id = ?').get(req.user.id);
  if (user.scrapes_used >= user.scrapes_limit) {
    return res.status(429).json({ error: 'Monthly scrape limit reached. Upgrade your plan for more.' });
  }

  const jobId = uuidv4();
  db.prepare(`
    INSERT INTO scrape_jobs (id, user_id, campaign_id, query, location, status, started_at)
    VALUES (?, ?, ?, ?, ?, 'running', datetime('now'))
  `).run(jobId, req.user.id, campaignId || null, query, location);

  // Start async scrape
  (async () => {
    try {
      const businesses = await searchBusinesses(query, location, 50000, Math.min(maxResults, 50));

      db.prepare('UPDATE scrape_jobs SET total = ? WHERE id = ?').run(businesses.length, jobId);

      const campaign = campaignId
        ? db.prepare('SELECT offer_description FROM campaigns WHERE id = ?').get(campaignId)
        : null;

      let inserted = 0;
      for (const biz of businesses) {
        // Skip duplicates
        const existing = db.prepare('SELECT id FROM leads WHERE place_id = ? AND user_id = ?').get(biz.placeId, req.user.id);
        if (existing) continue;

        // Optionally get email from website domain
        let email = null;
        if (biz.website) {
          email = await findEmail(biz.website, biz.businessName).catch(() => null);
        }

        const leadId = uuidv4();
        db.prepare(`
          INSERT INTO leads (id, campaign_id, user_id, business_name, category, address, city, state, country,
            phone, email, website, google_rating, review_count, status, score, lat, lng, place_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, datetime('now'))
        `).run(leadId, campaignId || null, req.user.id, biz.businessName, biz.category,
          biz.address, biz.city, biz.state, biz.country,
          biz.phone, email, biz.website, biz.rating, biz.reviewCount,
          Math.floor(30 + Math.random() * 40), // initial score
          biz.lat, biz.lng, biz.placeId
        );

        inserted++;
        db.prepare('UPDATE scrape_jobs SET progress = ?, results_count = ? WHERE id = ?').run(inserted, inserted, jobId);
      }

      // Update usage counter
      db.prepare('UPDATE users SET scrapes_used = scrapes_used + ? WHERE id = ?').run(inserted, req.user.id);
      db.prepare(`UPDATE scrape_jobs SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(jobId);

    } catch (err) {
      console.error('Scrape error:', err.message);
      db.prepare(`UPDATE scrape_jobs SET status = 'failed', error = ? WHERE id = ?`).run(err.message, jobId);
    }
  })();

  res.json({ jobId, message: 'Scrape started. Check job status for progress.' });
});

// GET /api/leads/job/:jobId — poll scrape job status
router.get('/job/:jobId', auth, (req, res) => {
  const job = db.prepare('SELECT * FROM scrape_jobs WHERE id = ? AND user_id = ?').get(req.params.jobId, req.user.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ job });
});

// POST /api/leads/:id/enrich — AI enrich a single lead
router.post('/:id/enrich', auth, async (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  try {
    // Get reviews if we have a place ID
    let reviews = [];
    if (lead.place_id && process.env.GOOGLE_PLACES_API_KEY) {
      const details = await getPlaceDetails(lead.place_id);
      if (details?.reviews) reviews = details.reviews;
    }

    // Get offer from campaign if available
    const campaign = lead.campaign_id
      ? db.prepare('SELECT offer_description FROM campaigns WHERE id = ?').get(lead.campaign_id)
      : null;

    const leadData = {
      id: lead.id,
      businessName: lead.business_name,
      category: lead.category,
      city: lead.city,
      rating: lead.google_rating,
      reviewCount: lead.review_count,
      reviews
    };

    const { analysis, emailData } = await enrichLead(leadData, campaign?.offer_description);

    const painPointsStr = JSON.stringify(analysis.painPoints);

    db.prepare(`
      UPDATE leads SET
        pain_points = ?,
        ai_summary = ?,
        score = ?,
        personalized_email = ?,
        email_subject = ?,
        raw_reviews = ?,
        enriched_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      painPointsStr,
      analysis.summary,
      analysis.outreachScore,
      emailData?.body || null,
      emailData?.subject || null,
      JSON.stringify(reviews),
      lead.id
    );

    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);
    res.json({ lead: updated, analysis, emailData });

  } catch (err) {
    console.error('Enrich error:', err.message);
    res.status(500).json({ error: 'AI enrichment failed: ' + err.message });
  }
});

// POST /api/leads/batch-email — generate emails for multiple leads
router.post('/batch-email', auth, async (req, res) => {
  const { leadIds, offerDescription } = req.body;
  if (!leadIds?.length || !offerDescription) {
    return res.status(400).json({ error: 'leadIds and offerDescription required' });
  }

  const leads = db.prepare(
    `SELECT * FROM leads WHERE id IN (${leadIds.map(() => '?').join(',')}) AND user_id = ?`
  ).all(...leadIds, req.user.id);

  res.json({ message: 'Processing started', total: leads.length });

  // Generate in background
  (async () => {
    for (const lead of leads) {
      try {
        const emailData = await generatePersonalizedEmail({
          businessName: lead.business_name,
          category: lead.category,
          city: lead.city,
          rating: lead.google_rating,
          reviewCount: lead.review_count,
          painPoints: lead.pain_points ? JSON.parse(lead.pain_points) : [],
          keyInsight: lead.ai_summary
        }, offerDescription);

        db.prepare(`
          UPDATE leads SET personalized_email = ?, email_subject = ?, updated_at = datetime('now') WHERE id = ?
        `).run(emailData.body, emailData.subject, lead.id);

        await new Promise(r => setTimeout(r, 2000)); // Rate limit
      } catch (err) {
        console.error('Batch email error for lead', lead.id, err.message);
      }
    }
  })();
});

// PUT /api/leads/:id — update lead status/notes
router.put('/:id', auth, (req, res) => {
  const lead = db.prepare('SELECT id FROM leads WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const { status, email, phone, notes } = req.body;
  db.prepare(`
    UPDATE leads SET
      status = COALESCE(?, status),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(status, email, phone, req.params.id);

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  res.json({ lead: updated });
});

// DELETE /api/leads/:id
router.delete('/:id', auth, (req, res) => {
  const lead = db.prepare('SELECT id FROM leads WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ message: 'Lead deleted' });
});

// GET /api/leads/export/csv — export leads to CSV
router.get('/export/csv', auth, async (req, res) => {
  const { campaignId } = req.query;
  const leads = db.prepare(
    `SELECT * FROM leads WHERE user_id = ? ${campaignId ? 'AND campaign_id = ?' : ''} ORDER BY score DESC`
  ).all(...[req.user.id, ...(campaignId ? [campaignId] : [])]);

  const exportDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

  const filePath = path.join(exportDir, `leads_${Date.now()}.csv`);

  const writer = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'business_name', title: 'Business Name' },
      { id: 'category', title: 'Category' },
      { id: 'city', title: 'City' },
      { id: 'state', title: 'State' },
      { id: 'phone', title: 'Phone' },
      { id: 'email', title: 'Email' },
      { id: 'website', title: 'Website' },
      { id: 'google_rating', title: 'Rating' },
      { id: 'review_count', title: 'Reviews' },
      { id: 'score', title: 'AI Score' },
      { id: 'status', title: 'Status' },
      { id: 'email_subject', title: 'Email Subject' },
      { id: 'personalized_email', title: 'Personalized Email' },
      { id: 'ai_summary', title: 'AI Summary' }
    ]
  });

  await writer.writeRecords(leads);
  res.download(filePath, 'prospera_leads.csv', () => fs.unlinkSync(filePath));
});

module.exports = router;
