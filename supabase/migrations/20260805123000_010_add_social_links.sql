-- Add social links to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS x_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS youtube_url text NOT NULL DEFAULT '';