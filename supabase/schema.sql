-- ═══════════════════════════════════════════════════════════════════════════
--  ZC OCW — Supabase Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Course overrides ─────────────────────────────────────────────────────────
--  Stores admin-set metadata enriching YouTube playlists.
CREATE TABLE IF NOT EXISTS course_overrides (
  playlist_id   TEXT        PRIMARY KEY,
  school_id     TEXT,
  program_id    TEXT,
  course_code   TEXT,
  instructor    TEXT,
  semester      TEXT,
  level         TEXT,
  description   TEXT,
  tags          TEXT[]      DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Materials ─────────────────────────────────────────────────────────────────
--  Each row is one downloadable file or link attached to a course.
CREATE TABLE IF NOT EXISTS materials (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id   TEXT        NOT NULL,
  type          TEXT        NOT NULL,   -- 'slides' | 'problem' | 'exam' | etc.
  label         TEXT        NOT NULL,
  url           TEXT,                   -- external link OR null if stored in Supabase Storage
  file_path     TEXT,                   -- Supabase Storage path: 'materials/{playlist_id}/{filename}'
  file_size     BIGINT,                 -- bytes (filled in by upload function)
  mime_type     TEXT,
  added_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS materials_playlist_idx ON materials(playlist_id);

-- ── Books ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id   TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  author        TEXT,
  edition       TEXT,
  isbn          TEXT,
  url           TEXT,
  added_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS books_playlist_idx ON books(playlist_id);

-- ── Updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER course_overrides_updated_at
  BEFORE UPDATE ON course_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
--  Row-Level Security (RLS)
--  Public can READ everything.
--  Only authenticated admins can INSERT / UPDATE / DELETE.
--  We use a simple shared secret via Supabase's service role key on the server,
--  and the anon key for reads.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE course_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE books            ENABLE ROW LEVEL SECURITY;

-- Public reads
CREATE POLICY "Public read overrides"  ON course_overrides FOR SELECT USING (true);
CREATE POLICY "Public read materials"  ON materials        FOR SELECT USING (true);
CREATE POLICY "Public read books"      ON books            FOR SELECT USING (true);

-- Service-role writes (anon key is read-only; service key bypasses RLS)
-- When you call Supabase from the admin panel, it uses the service key stored
-- in your .env — this is safe because that key is only in the backend/server.
-- For this project we use the service key server-side (Vercel functions) only.

-- ══════════════════════════════════════════════════════════════════════════════
--  Storage bucket
--  Create this in Dashboard → Storage → New bucket
--  Name: materials
--  Public: true (files are accessible by URL)
-- ══════════════════════════════════════════════════════════════════════════════
-- Note: Run this only if you prefer SQL over the Dashboard UI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true)
-- ON CONFLICT DO NOTHING;
