-- Add email_sent column if it doesn't exist
-- NOTE: already applied to production — SQLite has no "ADD COLUMN IF NOT
-- EXISTS", so re-running this file fails here if you forget it's done.
-- Left as a record; don't re-run this line.
-- ALTER TABLE feedback ADD COLUMN email_sent INTEGER DEFAULT 0;

-- Added: acknowledgments page config (single JSON row)
CREATE TABLE IF NOT EXISTS acknowledgments (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  config_json   TEXT NOT NULL,
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- Added: Firebase-based admin allowlist
CREATE TABLE IF NOT EXISTS admins (
  email       TEXT PRIMARY KEY,
  added_by    TEXT,
  added_at    TEXT DEFAULT (datetime('now'))
);

-- Added: Custom schools & programs catalog config
CREATE TABLE IF NOT EXISTS schools_programs (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  config_json TEXT NOT NULL,
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- Added: Per-account user data
CREATE TABLE IF NOT EXISTS user_data (
  uid         TEXT NOT NULL,
  key         TEXT NOT NULL,
  value_json  TEXT NOT NULL,
  updated_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (uid, key)
);

-- Added: Generic page content CMS
CREATE TABLE IF NOT EXISTS page_content (
  page_slug   TEXT PRIMARY KEY,
  content_json TEXT NOT NULL,
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- Added: Site activity & stats counter
CREATE TABLE IF NOT EXISTS site_stats (
  key         TEXT PRIMARY KEY,
  value       INTEGER DEFAULT 0,
  updated_at  TEXT DEFAULT (datetime('now'))
);
