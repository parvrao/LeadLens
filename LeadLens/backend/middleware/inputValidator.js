// middleware/inputValidator.js

function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/\0/g, '').slice(0, maxLength);
}

function sanitizeObject(obj, depth = 0) {
  if (depth > 5) return obj;
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') clean[key] = sanitizeString(value);
    else if (typeof value === 'object' && value !== null && !Array.isArray(value)) clean[key] = sanitizeObject(value, depth + 1);
    else clean[key] = value;
  }
  return clean;
}

function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = sanitizeObject(req.body);
  if (req.query && typeof req.query === 'object') req.query = sanitizeObject(req.query);
  next();
}

function validateScrapeInput(req, res, next) {
  const { query, location, maxResults } = req.body;
  if (!query || query.trim().length < 2) return res.status(400).json({ error: 'Business category must be at least 2 characters.' });
  if (!location || location.trim().length < 2) return res.status(400).json({ error: 'Location must be at least 2 characters.' });
  if (query.length > 200) return res.status(400).json({ error: 'Business category too long.' });
  if (location.length > 200) return res.status(400).json({ error: 'Location too long.' });
  if (maxResults !== undefined) req.body.maxResults = Math.min(50, Math.max(1, parseInt(maxResults) || 20));
  next();
}

function validateCampaignInput(req, res, next) {
  const { name, offerDescription } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Campaign name must be at least 2 characters.' });
  if (name.length > 150) return res.status(400).json({ error: 'Campaign name too long.' });
  if (!offerDescription || offerDescription.trim().length < 10) return res.status(400).json({ error: 'Offer description must be at least 10 characters.' });
  if (offerDescription.length > 2000) return res.status(400).json({ error: 'Offer description too long.' });
  next();
}

module.exports = { sanitizeInputs, validateScrapeInput, validateCampaignInput };
