-- ─────────────────────────────────────────────────────────────────────────────
--  ZC OCW — D1 Database Schema
--  Run with: wrangler d1 execute zc-ocw-db --local --file=schema.sql
--  Then for production: wrangler d1 execute zc-ocw-db --remote --file=schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Course metadata enrichment (one row per YouTube playlist)
CREATE TABLE IF NOT EXISTS course_overrides (
  playlist_id   TEXT PRIMARY KEY,
  school_id     TEXT,
  program_id    TEXT,
  course_code   TEXT,
  instructor    TEXT,
  semester      TEXT,
  level         TEXT,
  description   TEXT,
  tags          TEXT DEFAULT '[]',   -- stored as JSON string
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- Downloadable materials per course
CREATE TABLE IF NOT EXISTS materials (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  playlist_id   TEXT NOT NULL,
  type          TEXT NOT NULL,
  label         TEXT NOT NULL,
  url           TEXT,
  file_key      TEXT,     -- R2 object key (if uploaded, not linked)
  file_size     INTEGER,
  mime_type     TEXT,
  added_at      TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_materials_playlist ON materials(playlist_id);

-- Textbooks per course
CREATE TABLE IF NOT EXISTS books (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  playlist_id   TEXT NOT NULL,
  title         TEXT NOT NULL,
  author        TEXT,
  edition       TEXT,
  isbn          TEXT,
  url           TEXT,
  added_at      TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_books_playlist ON books(playlist_id);
