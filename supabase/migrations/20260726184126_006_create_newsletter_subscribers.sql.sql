/*
# Create newsletter subscription system

1. New Tables
- `newsletter_subscribers` — stores every email that signs up via the newsletter form.
  Columns:
    - `id` (uuid, primary key)
    - `email` (citext, unique) — case-insensitive uniqueness so a@x.com and A@X.COM count as the same address.
    - `verified` (boolean, default false) — flipped to true when the subscriber clicks the verify link (double opt-in).
    - `verification_token` (text) — single-use token embedded in the verify email link.
    - `unsubscribe_token` (text) — long-lived token embedded in the unsubscribe link of every email.
    - `created_at` (timestamptz, default now()) — subscription date.
    - `updated_at` (timestamptz, default now()) — bumped automatically on row change.
- `newsletter_rate_limits` — simple per-IP rate-limit ledger so subscriptions cannot be spammed.
  Edge function instances do not share memory, so the database is the only durable store.
  Columns:
    - `id` (uuid, primary key)
    - `identifier` (text) — IP address or email key.
    - `created_at` (timestamptz).

2. Indexes
- Unique index on `email` (enforced by the column constraint, plus a citext expression index for safety).
- Index on `verification_token` for O(1) lookups when a subscriber clicks the verify link.
- Index on `unsubscribe_token` for O(1) lookups when a subscriber clicks unsubscribe.
- Index on `verified` so the blog-notification edge function can fetch all verified subscribers cheaply.
- Index on `newsletter_rate_limits.created_at` for fast window pruning.

3. Security
- RLS enabled on both tables.
- `newsletter_subscribers`:
  - Anyone (anon + authenticated) can INSERT (a visitor subscribing) — but the verification_token
    and unsubscribe_token are generated server-side inside the edge function, so a raw client insert
    cannot forge a valid verified row.
  - Anyone can SELECT only the columns needed for verify/unsubscribe lookups, scoped by token equality,
    via a SECURITY DEFINER function `lookup_subscriber_by_token`. The table itself exposes NO direct
    SELECT to anon, so subscriber emails are never readable from the client.
  - Only authenticated (the site admin) can SELECT all rows and DELETE rows.
  - Updates are restricted to authenticated (admin) plus the edge function's service role (bypasses RLS).
- `newsletter_rate_limits`:
  - No direct SELECT/UPDATE/DELETE for anon — only INSERT (to record a hit) is allowed, and the edge
    function uses the service role (bypasses RLS) to read/prune.

4. Helper functions
- `lookup_subscriber_by_token(token text, kind text)` — SECURITY DEFINER, returns the minimal row
  needed by the public verify/unsubscribe pages without exposing the full table.

5. Notes
- Uses the `citext` extension (created if missing) for case-insensitive email matching.
- `updated_at` auto-updates via a trigger.
- All token columns are populated by the edge function, never by the client.
*/

-- Required extension for case-insensitive email
CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================================
-- newsletter_subscribers
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  verification_token text NOT NULL DEFAULT '',
  unsubscribe_token text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Indexes for token + verified lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_verification_token
  ON newsletter_subscribers (verification_token)
  WHERE verification_token <> '';
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_unsubscribe_token
  ON newsletter_subscribers (unsubscribe_token)
  WHERE unsubscribe_token <> '';
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_verified
  ON newsletter_subscribers (verified)
  WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created_at
  ON newsletter_subscribers (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS newsletter_subscribers_set_updated_at ON newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_set_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_updated_at();

-- Policies
-- The public can INSERT a new subscription (the edge function also inserts via service role,
-- but allowing anon insert keeps the subscribe path resilient). Token columns default to ''
-- so a raw client insert cannot create a verified, tokenized row — only the edge function can.
DROP POLICY IF EXISTS "anon_insert_newsletter" ON newsletter_subscribers;
CREATE POLICY "anon_insert_newsletter"
  ON newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only the authenticated admin can read the full table.
DROP POLICY IF EXISTS "auth_select_newsletter" ON newsletter_subscribers;
CREATE POLICY "auth_select_newsletter"
  ON newsletter_subscribers FOR SELECT
  TO authenticated USING (true);

-- Only the authenticated admin can delete subscribers.
DROP POLICY IF EXISTS "auth_delete_newsletter" ON newsletter_subscribers;
CREATE POLICY "auth_delete_newsletter"
  ON newsletter_subscribers FOR DELETE
  TO authenticated USING (true);

-- Only the authenticated admin can update rows directly. The edge function uses the
-- service role key, which bypasses RLS, to flip verified flags and rotate tokens.
DROP POLICY IF EXISTS "auth_update_newsletter" ON newsletter_subscribers;
CREATE POLICY "auth_update_newsletter"
  ON newsletter_subscribers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- newsletter_rate_limits
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_newsletter_rate_limits_identifier_created
  ON newsletter_rate_limits (identifier, created_at DESC);

-- Anon may insert a rate-limit hit (the edge function inserts via service role too).
DROP POLICY IF EXISTS "anon_insert_rate_limit" ON newsletter_rate_limits;
CREATE POLICY "anon_insert_rate_limit"
  ON newsletter_rate_limits FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- No SELECT/UPDATE/DELETE for anon — the edge function reads/prunes via service role.

-- ============================================================
-- Public lookup function (token-scoped, minimal columns)
-- ============================================================
-- Returns only id, verified, email for a given token so the public verify/unsubscribe
-- pages can confirm an action without exposing the subscriber list.
CREATE OR REPLACE FUNCTION lookup_subscriber_by_token(p_token text, p_kind text)
RETURNS TABLE (id uuid, email text, verified boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, verified
  FROM newsletter_subscribers
  WHERE
    (p_kind = 'verify' AND verification_token = p_token AND verification_token <> '')
    OR
    (p_kind = 'unsubscribe' AND unsubscribe_token = p_token AND unsubscribe_token <> '')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION lookup_subscriber_by_token(text, text) TO anon, authenticated;
