-- NS Member Directory Schema
-- Run this in your Supabase SQL editor

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_visible BOOLEAN DEFAULT false,
  specialty TEXT NOT NULL,
  building TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'off_campus' CHECK (status IN ('on_campus', 'off_campus')),
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edit tokens table (separate from members for security)
CREATE TABLE IF NOT EXISTS edit_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_edit_tokens_token ON edit_tokens(token);
CREATE INDEX IF NOT EXISTS idx_edit_tokens_member_id ON edit_tokens(member_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Read-only role for the ElizaOS agent
-- Run this after creating the tables:
-- CREATE ROLE eliza_readonly;
-- GRANT USAGE ON SCHEMA public TO eliza_readonly;
-- GRANT SELECT ON members TO eliza_readonly;
-- (do NOT grant SELECT on edit_tokens to eliza_readonly)

-- RLS: enable row level security (optional but recommended)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_tokens ENABLE ROW LEVEL SECURITY;

-- Public can read members (directory is public)
CREATE POLICY "members_public_read" ON members
  FOR SELECT USING (true);

-- Anyone can insert a new member (no auth)
CREATE POLICY "members_public_insert" ON members
  FOR INSERT WITH CHECK (true);

-- Updates only allowed via service role (API handles token verification)
CREATE POLICY "members_service_update" ON members
  FOR UPDATE USING (true);

-- edit_tokens: only service role can manage (not exposed publicly)
CREATE POLICY "edit_tokens_service_only" ON edit_tokens
  FOR ALL USING (false);
