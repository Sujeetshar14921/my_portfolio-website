/*
# Meeting System Realtime Presence & Chat

## Overview
Upgrades the meeting system to support Google Meet-style features:
- Waiting room (client waits for host)
- Real-time participant presence tracking (join/leave)
- In-meeting chat messages
- Expanded meeting status pipeline (scheduled → waiting_for_host → host_joined → client_joined → in_progress → completed → cancelled)
- Live notifications to admin dashboard via Supabase Realtime

## 1. Modified Tables

### meetings
- Changed `status` to a broader set of states. The column is TEXT so new values are added without altering type.
  New valid statuses: 'scheduled', 'waiting_for_host', 'host_joined', 'client_joined', 'in_progress', 'completed', 'cancelled'
- Added `started_at` (timestamptz, nullable) — when the host joined and meeting went live
- Added `ended_at` (timestamptz, nullable) — when the meeting was ended
- Added `duration_seconds` (integer, nullable) — computed meeting duration on end

### meeting_participants
- Added `role` (text, default 'client') — 'host' or 'client'
- Added `joined_at` (timestamptz, nullable) — first join timestamp
- Added `left_at` (timestamptz, nullable) — leave timestamp
- Added `is_online` (boolean, default false) — live presence flag

## 2. New Tables

### meeting_chat_messages
Real-time in-meeting chat. Columns:
- id (uuid, PK)
- meeting_id (uuid, FK → meetings)
- sender_name (text) — display name
- sender_role (text) — 'host' or 'client'
- message (text)
- created_at (timestamptz, default now())

## 3. Realtime
- Enables Supabase Realtime publication on: meetings, meeting_participants, meeting_chat_messages
- The frontend subscribes to INSERT/UPDATE/DELETE events for live dashboard updates

## 4. Security (RLS)
- All tables use `TO anon, authenticated` because meeting links are public (no login required to join)
- meeting_chat_messages: anon can read/insert (chat is open to anyone in the meeting)
- meeting_participants: anon can read/insert/update (presence tracking from public meeting page)
- meetings: anon can read (to load meeting by token) and update status (host/client status changes)

## 5. Notes
- No data is lost — all columns are additive (ALTER TABLE ADD COLUMN)
- Existing scheduled meetings remain valid with status 'scheduled'
- The lookup_meeting_by_token function already returns full meeting rows
*/
