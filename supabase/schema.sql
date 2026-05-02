-- Align OS — Supabase schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS align_teams (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT '파운데이션',
  target_size  INTEGER NOT NULL DEFAULT 4,
  kickoff      JSONB DEFAULT '{"availability":{},"proposal":null,"agreements":{}}',
  created_at   BIGINT
);

CREATE TABLE IF NOT EXISTS align_members (
  id               TEXT PRIMARY KEY,
  team_id          TEXT NOT NULL REFERENCES align_teams(id) ON DELETE CASCADE,
  name             TEXT NOT NULL DEFAULT '',
  role             TEXT NOT NULL DEFAULT 'UX',
  generation       TEXT DEFAULT '34기',
  phone            TEXT DEFAULT '',
  sns_link         TEXT DEFAULT '',
  photo_url        TEXT DEFAULT '',          -- base64 data URL (320×320 JPEG)
  portfolio_links  JSONB DEFAULT '[]',
  work_items       JSONB DEFAULT '[]',       -- [{url: base64, description: str}]
  work_styles      JSONB DEFAULT '[]',
  style_reasons    JSONB DEFAULT '{}',
  research_topics  JSONB DEFAULT '[]',
  research_subject TEXT DEFAULT '',
  schedule         JSONB DEFAULT '{"start":"오전","night":"비선호","place":"출퇴근"}',
  pursuits         TEXT DEFAULT '',
  avoid            TEXT DEFAULT '',
  intro            TEXT DEFAULT '',
  created_at       BIGINT
);

-- Row Level Security — public read/write (no auth for MVP)
ALTER TABLE align_teams   ENABLE ROW LEVEL SECURITY;
ALTER TABLE align_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public_read"   ON align_teams   FOR SELECT USING (true);
  CREATE POLICY "public_insert" ON align_teams   FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update" ON align_teams   FOR UPDATE USING (true);

  CREATE POLICY "public_read"   ON align_members FOR SELECT USING (true);
  CREATE POLICY "public_insert" ON align_members FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update" ON align_members FOR UPDATE USING (true);
  CREATE POLICY "public_delete" ON align_members FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE align_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE align_members;
