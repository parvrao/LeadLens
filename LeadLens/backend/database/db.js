const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'prospera.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      plan TEXT DEFAULT 'free',
      scrapes_used INTEGER DEFAULT 0,
      scrapes_limit INTEGER DEFAULT 50,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      offer_description TEXT,
      target_industry TEXT,
      target_location TEXT,
      leads_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scrape_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      campaign_id TEXT,
      query TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      results_count INTEGER DEFAULT 0,
      error TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
    CREATE INDEX IF NOT EXISTS idx_scrape_jobs_user ON scrape_jobs(user_id);
  `);

  // Always recreate leads table with correct nullable campaign_id
  try {
    const tableInfo = db.prepare("PRAGMA table_info(leads)").all();
    const campaignCol = tableInfo.find(c => c.name === 'campaign_id');
    const needsMigration = !campaignCol || campaignCol.notnull === 1;

    if (needsMigration && campaignCol) {
      console.log('🔧 Migrating leads table...');
      db.exec(`
        ALTER TABLE leads RENAME TO leads_old;
        CREATE TABLE leads (
          id TEXT PRIMARY KEY, campaign_id TEXT, user_id TEXT NOT NULL,
          business_name TEXT NOT NULL, category TEXT, address TEXT, city TEXT,
          state TEXT, country TEXT, postal_code TEXT, phone TEXT, email TEXT,
          website TEXT, google_rating REAL, review_count INTEGER DEFAULT 0,
          pain_points TEXT, ai_summary TEXT, personalized_email TEXT,
          email_subject TEXT, linkedin_url TEXT, instagram_url TEXT, facebook_url TEXT,
          status TEXT DEFAULT 'new', score INTEGER DEFAULT 0,
          lat REAL, lng REAL, place_id TEXT, raw_reviews TEXT, enriched_at TEXT,
          created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
        );
        INSERT INTO leads SELECT * FROM leads_old;
        DROP TABLE leads_old;
      `);
      console.log('✅ Leads table migrated');
    } else if (!campaignCol) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY, campaign_id TEXT, user_id TEXT NOT NULL,
          business_name TEXT NOT NULL, category TEXT, address TEXT, city TEXT,
          state TEXT, country TEXT, postal_code TEXT, phone TEXT, email TEXT,
          website TEXT, google_rating REAL, review_count INTEGER DEFAULT 0,
          pain_points TEXT, ai_summary TEXT, personalized_email TEXT,
          email_subject TEXT, linkedin_url TEXT, instagram_url TEXT, facebook_url TEXT,
          status TEXT DEFAULT 'new', score INTEGER DEFAULT 0,
          lat REAL, lng REAL, place_id TEXT, raw_reviews TEXT, enriched_at TEXT,
          created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
        CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);
        CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      `);
    }
  } catch(e) {
    console.log('Migration note:', e.message);
  }

  console.log('✅ Database ready at', DB_PATH);
}

module.exports = { db, initializeDatabase };
