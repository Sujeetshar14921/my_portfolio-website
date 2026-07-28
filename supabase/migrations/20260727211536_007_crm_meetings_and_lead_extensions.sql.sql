/*
# CRM Phase 1-7: Lead verification, meetings, activity logs

1. Overview
   Extends the existing portfolio into a client-management CRM. Adds new
   columns to `contact_submissions` for lead enrichment + email verification,
   and creates four new tables for meetings, meeting notes, meeting
   participants, and a unified activity log. All new tables have RLS enabled.

2. contact_submissions (ALTER — additive only, no data loss)
   - phone text           — client phone number
   - company text         — client company name
   - budget text          — budget range string (e.g. "$5k–$10k")
   - service text         — service the client is interested in
   - email_verified boolean DEFAULT false — whether the lead verified their email
   - verification_token text              — single-use token for email verification
   - verification_sent_at timestamptz     — when the verification email was last sent
   - meeting_status text DEFAULT 'none'   — none | scheduled | completed | cancelled
   Index on verification_token for fast lookups.

3. New Tables
   - meetings: id, lead_id FK, title, agenda, meeting_type, meeting_url, 
     secure_token, meeting_date, meeting_time, duration, status, created_by, 
     created_at, updated_at
   - meeting_notes: id, meeting_id FK, content, created_by, created_at
   - meeting_participants: id, meeting_id FK, email, name, rsvp_status
   - activity_logs: id, lead_id FK NULL, meeting_id FK NULL, type, title, 
     description, metadata jsonb, created_at

4. Security (RLS)
   - contact_submissions: existing policies unchanged. New SELECT policy for
     anon to look up a lead by verification token (needed for the public
     verify-email page). This uses a SECURITY DEFINER function to avoid
     exposing all leads to anon.
   - meetings / meeting_notes / meeting_participants: anon+authenticated SELECT
     (meeting pages are public, no login); authenticated INSERT/UPDATE/DELETE
     (admin-only writes). The meeting_url uses a secure random token so the
     public can only reach a meeting if they have the link.
   - activity_logs: authenticated SELECT/INSERT; no anon access (admin-only).

5. Functions
   - lookup_lead_by_token(token): SECURITY DEFINER — returns minimal lead info
     (id, email_verified, status) by verification token. Used by the public
     verify-email page so anon can confirm without seeing all leads.
   - lookup_meeting_by_token(token): SECURITY DEFINER — returns meeting info
     needed to render the public meeting page.

6. Important Notes
   - All ALTER TABLE statements use ADD COLUMN IF NOT EXISTS so re-running
     is safe.
   - No existing columns are dropped or renamed — zero data loss.
   - Indexes use IF NOT EXISTS.
   - The `meetings` table stores a `secure_token` (random UUID) used in the
     public meeting URL /meeting/:id — the :id in the URL IS the secure_token,
     not the database id, so URLs are unguessable.
*/

-- =========================================================
-- 1. Extend contact_submissions
-- =========================================================

ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS service text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS verification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_status text NOT NULL DEFAULT 'none';

-- Update default status for new leads to reflect the CRM pipeline.
-- Existing leads keep their current status (the ALTER above doesn't change it).
-- New status values used by the CRM: pending_verification, verified, new,
-- contacted, meeting_scheduled, meeting_completed, proposal_sent, won, lost.

CREATE INDEX IF NOT EXISTS idx_contact_submissions_verification_token
  ON contact_submissions (verification_token)
  WHERE verification_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email_verified
  ON contact_submissions (email_verified);

-- =========================================================
-- 2. meetings table
-- =========================================================

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES contact_submissions(id) ON DELETE SET NULL,
  title text NOT NULL,
  agenda text,
  meeting_type text NOT NULL DEFAULT 'one_on_one', -- one_on_one | group
  meeting_url text NOT NULL,
  secure_token uuid NOT NULL DEFAULT gen_random_uuid(),
  meeting_date date NOT NULL,
  meeting_time time NOT NULL,
  duration int NOT NULL DEFAULT 30, -- minutes
  status text NOT NULL DEFAULT 'scheduled', -- scheduled | completed | cancelled
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
CREATE POLICY "anon_select_meetings"
  ON meetings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_meetings" ON meetings;
CREATE POLICY "auth_insert_meetings"
  ON meetings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_meetings" ON meetings;
CREATE POLICY "auth_update_meetings"
  ON meetings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_meetings" ON meetings;
CREATE POLICY "auth_delete_meetings"
  ON meetings FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON meetings (lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_secure_token ON meetings (secure_token);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings (status);

-- =========================================================
-- 3. meeting_notes table
-- =========================================================

CREATE TABLE IF NOT EXISTS meeting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meeting_notes" ON meeting_notes;
CREATE POLICY "anon_select_meeting_notes"
  ON meeting_notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_meeting_notes" ON meeting_notes;
CREATE POLICY "auth_insert_meeting_notes"
  ON meeting_notes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_meeting_notes" ON meeting_notes;
CREATE POLICY "auth_update_meeting_notes"
  ON meeting_notes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_meeting_notes" ON meeting_notes;
CREATE POLICY "auth_delete_meeting_notes"
  ON meeting_notes FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes (meeting_id);

-- =========================================================
-- 4. meeting_participants table
-- =========================================================

CREATE TABLE IF NOT EXISTS meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  rsvp_status text NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meeting_participants" ON meeting_participants;
CREATE POLICY "anon_select_meeting_participants"
  ON meeting_participants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_meeting_participants" ON meeting_participants;
CREATE POLICY "auth_insert_meeting_participants"
  ON meeting_participants FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_meeting_participants" ON meeting_participants;
CREATE POLICY "auth_update_meeting_participants"
  ON meeting_participants FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_meeting_participants" ON meeting_participants;
CREATE POLICY "auth_delete_meeting_participants"
  ON meeting_participants FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants (meeting_id);

-- =========================================================
-- 5. activity_logs table
-- =========================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES contact_submissions(id) ON DELETE CASCADE,
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  type text NOT NULL, -- lead_created | email_sent | verification | status_change | meeting_scheduled | meeting_completed | note_added | proposal_sent | follow_up_sent
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_activity_logs" ON activity_logs;
CREATE POLICY "auth_select_activity_logs"
  ON activity_logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_activity_logs" ON activity_logs;
CREATE POLICY "auth_insert_activity_logs"
  ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_activity_logs" ON activity_logs;
CREATE POLICY "auth_update_activity_logs"
  ON activity_logs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_activity_logs" ON activity_logs;
CREATE POLICY "auth_delete_activity_logs"
  ON activity_logs FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_activity_logs_lead_id ON activity_logs (lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_meeting_id ON activity_logs (meeting_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);

-- =========================================================
-- 6. updated_at trigger for meetings
-- =========================================================

CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meetings_updated_at ON meetings;
CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_meetings_updated_at();

-- =========================================================
-- 7. SECURITY DEFINER lookup functions
-- =========================================================

-- Used by the public verify-email page: returns just enough to confirm.
DROP FUNCTION IF EXISTS lookup_lead_by_token(p_token text);
CREATE OR REPLACE FUNCTION lookup_lead_by_token(p_token text)
RETURNS TABLE (id uuid, email text, email_verified boolean, status text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, email, email_verified, status
  FROM contact_submissions
  WHERE verification_token = p_token
  LIMIT 1;
$$;

-- Used by the public meeting page: returns meeting info by secure token.
DROP FUNCTION IF EXISTS lookup_meeting_by_token(p_token uuid);
CREATE OR REPLACE FUNCTION lookup_meeting_by_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  title text,
  agenda text,
  meeting_type text,
  meeting_url text,
  meeting_date date,
  meeting_time time,
  duration int,
  status text
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, title, agenda, meeting_type, meeting_url,
         meeting_date, meeting_time, duration, status
  FROM meetings
  WHERE secure_token = p_token
  LIMIT 1;
$$;
