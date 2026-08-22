-- Added: Firebase-based admin allowlist
CREATE TABLE IF NOT EXISTS admins (
  email       TEXT PRIMARY KEY,
  added_by    TEXT,
  added_at    TEXT DEFAULT (datetime('now'))
);

-- Added: acknowledgments page config (single JSON row)
CREATE TABLE IF NOT EXISTS acknowledgments (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  config_json   TEXT NOT NULL,
  updated_at    TEXT DEFAULT (datetime('now'))
);
