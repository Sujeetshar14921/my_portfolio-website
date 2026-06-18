/*
# Create profiles table

1. New Tables
- `profiles` — site owner profile data (name, role, bio, links, resume, education, experience, achievements).
  Publicly readable (anon + authenticated SELECT), admin-writable (authenticated INSERT/UPDATE/DELETE).
2. Security
- RLS enabled. anon can SELECT; authenticated can SELECT, INSERT, UPDATE, DELETE.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Alex Morgan',
  role text NOT NULL DEFAULT 'Full Stack Developer',
  tagline text NOT NULL DEFAULT 'Building exceptional digital experiences',
  bio text NOT NULL DEFAULT '',
  photo_url text NOT NULL DEFAULT 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=600',
  resume_url text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  github_url text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  calendly_url text NOT NULL DEFAULT '',
  education jsonb NOT NULL DEFAULT '[]',
  experience jsonb NOT NULL DEFAULT '[]',
  achievements jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_profiles" ON profiles;
CREATE POLICY "anon_read_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_profiles" ON profiles;
CREATE POLICY "auth_insert_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_profiles" ON profiles;
CREATE POLICY "auth_update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_profiles" ON profiles;
CREATE POLICY "auth_delete_profiles" ON profiles FOR DELETE
  TO authenticated USING (true);

-- Seed default profile
INSERT INTO profiles (name, role, tagline, bio, email, linkedin_url, github_url, education, experience, achievements)
VALUES (
  'Alex Morgan',
  'Full Stack Developer',
  'Building exceptional digital experiences with modern web technologies',
  'I''m a full stack developer with 7+ years of experience building high-performance web applications. I specialize in React, Node.js, and cloud architecture, with a passion for creating intuitive user experiences backed by robust, scalable systems. When I''m not coding, you''ll find me contributing to open source, writing about web development, or exploring new technologies.',
  'alex@alexmorgan.dev',
  'https://linkedin.com/in/alexmorgan',
  'https://github.com/alexmorgan',
  '[{"institution":"MIT","degree":"B.S. Computer Science","year":"2016"},{"institution":"Stanford","degree":"M.S. Software Engineering","year":"2018"}]'::jsonb,
  '[{"company":"TechCorp","role":"Senior Full Stack Developer","period":"2021 - Present","description":"Leading development of microservices architecture serving 2M+ users"},{"company":"StartupXYZ","role":"Full Stack Developer","period":"2018 - 2021","description":"Built and scaled the core platform from 0 to 500K users"},{"company":"WebAgency","role":"Frontend Developer","period":"2016 - 2018","description":"Delivered 20+ client projects with React and Vue.js"}]'::jsonb,
  '["AWS Solutions Architect Certified","Google Cloud Professional Developer","Top 5% Stack Overflow Contributor","Speaker at ReactConf 2023"]'::jsonb
) ON CONFLICT DO NOTHING;
