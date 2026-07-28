/*
# Fix lookup_meeting_by_token: missing secure_token in return columns

## Root cause of "admin <-> client video call not connecting"

The public meeting page (client side) loads meeting data via the
`lookup_meeting_by_token` RPC (see 007_crm_meetings_and_lead_extensions).
That function's RETURNS TABLE never included `secure_token`:

  RETURNS TABLE (
    id uuid, title text, agenda text, meeting_type text, meeting_url text,
    meeting_date date, meeting_time time, duration int, status text
  )

Both MeetingPage.tsx (client) and AdminMeetingPage.tsx (admin) build the
Jitsi room name as:

  roomName: `sujeetsharma-${m.secure_token}`

The admin fetches the meeting row directly from the `meetings` table (so
`secure_token` is present). The client fetches it through this RPC, where
`secure_token` was never selected/returned — so `m.secure_token` was
always `undefined` on the client, producing the room name
`sujeetsharma-undefined` instead of the real token. Host and client ended
up in two completely different Jitsi rooms, so they could never see or
hear each other even though both "joined" successfully.

## Fix
Drop and recreate the function to return the full set of columns the
frontend's `Meeting` type expects (including `secure_token`), so client
and host always compute the identical room name.

Safe to re-run: uses DROP FUNCTION IF EXISTS + CREATE.
*/

DROP FUNCTION IF EXISTS lookup_meeting_by_token(p_token uuid);

CREATE OR REPLACE FUNCTION lookup_meeting_by_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  lead_id uuid,
  title text,
  agenda text,
  meeting_type text,
  meeting_url text,
  secure_token uuid,
  meeting_date date,
  meeting_time time,
  duration int,
  status text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, lead_id, title, agenda, meeting_type, meeting_url, secure_token,
         meeting_date, meeting_time, duration, status, created_by,
         created_at, updated_at, started_at, ended_at, duration_seconds
  FROM meetings
  WHERE secure_token = p_token
  LIMIT 1;
$$;
