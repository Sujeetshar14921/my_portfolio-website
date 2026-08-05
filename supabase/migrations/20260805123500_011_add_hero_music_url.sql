-- Add hero music URL to profiles for uploaded song playback in the hero section
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hero_music_url text NOT NULL DEFAULT '';