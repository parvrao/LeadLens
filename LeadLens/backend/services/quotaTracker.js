// services/quotaTracker.js
// In-memory quota tracking to prevent runaway API calls
// Resets when server restarts (good enough for Render free tier)

const counts = {
  gemini: { count: 0, resetAt: Date.now() + 60000 },       // 15/min free tier
  places: { count: 0, resetAt: Date.now() + 86400000 },    // daily
  hunter: { count: 0, resetAt: Date.now() + 2592000000 }   // monthly
};

const LIMITS = {
  gemini: 14,     // Gemini free: 15/min — we use 14 to be safe
  places: 900,    // Conservative daily Places limit
  hunter: 24      // Hunter free: 25/month — use 24 to be safe
};

const WINDOWS = {
  gemini: 60 * 1000,           // 1 minute
  places: 24 * 60 * 60 * 1000, // 24 hours
  hunter: 30 * 24 * 60 * 60 * 1000 // 30 days
};

function checkAndIncrement(service) {
  const tracker = counts[service];
  const now = Date.now();

  // Reset window if expired
  if (now > tracker.resetAt) {
    tracker.count = 0;
    tracker.resetAt = now + WINDOWS[service];
  }

  if (tracker.count >= LIMITS[service]) {
    const waitMs = tracker.resetAt - now;
    const waitSec = Math.ceil(waitMs / 1000);
    return {
      allowed: false,
      error: `${service} quota limit reached. Resets in ${waitSec < 60 ? waitSec + 's' : Math.ceil(waitSec/60) + 'm'}.`
    };
  }

  tracker.count++;
  return { allowed: true, remaining: LIMITS[service] - tracker.count };
}

function getStatus() {
  return Object.entries(counts).reduce((acc, [service, data]) => {
    acc[service] = {
      used: data.count,
      limit: LIMITS[service],
      remaining: Math.max(0, LIMITS[service] - data.count),
      resetsAt: new Date(data.resetAt).toISOString()
    };
    return acc;
  }, {});
}

module.exports = { checkAndIncrement, getStatus };
