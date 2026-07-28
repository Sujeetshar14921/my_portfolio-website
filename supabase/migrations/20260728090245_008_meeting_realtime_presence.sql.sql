-- Add new columns to meetings table (additive, no data loss)
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS ended_at timestamptz;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- Add presence columns to meeting_participants
ALTER TABLE meeting_participants ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'client';
ALTER TABLE meeting_participants ADD COLUMN IF NOT EXISTS joined_at timestamptz;
ALTER TABLE meeting_participants ADD COLUMN IF NOT EXISTS left_at timestamptz;
ALTER TABLE meeting_participants ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false;

-- Create meeting_chat_messages table
CREATE TABLE IF NOT EXISTS meeting_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_role text NOT NULL DEFAULT 'client',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meeting_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chat" ON meeting_chat_messages;
CREATE POLICY "anon_select_chat" ON meeting_chat_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat" ON meeting_chat_messages;
CREATE POLICY "anon_insert_chat" ON meeting_chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Update meeting_participants policies for new columns
DROP POLICY IF EXISTS "anon_select_participants" ON meeting_participants;
CREATE POLICY "anon_select_participants" ON meeting_participants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_participants" ON meeting_participants;
CREATE POLICY "anon_insert_participants" ON meeting_participants FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_participants" ON meeting_participants;
CREATE POLICY "anon_update_participants" ON meeting_participants FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Ensure meetings table allows anon updates (for status changes from meeting pages)
DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
CREATE POLICY "anon_select_meetings" ON meetings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
CREATE POLICY "anon_update_meetings" ON meetings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable Supabase Realtime on all three tables
ALTER TABLE meetings REPLICA IDENTITY FULL;
ALTER TABLE meeting_participants REPLICA IDENTITY FULL;
ALTER TABLE meeting_chat_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  -- Add tables to the realtime publication if not already members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'meeting_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meeting_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'meeting_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meeting_chat_messages;
  END IF;
END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meeting_participants_online ON meeting_participants(meeting_id) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_meeting_chat_meeting ON meeting_chat_messages(meeting_id, created_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
