/*
# Create profiles and testimonials tables

1. New Tables
- `profiles` — site owner profile (name, bio, links, education, experience, achievements)
- `testimonials` — client testimonials shown on the site

2. Security
- RLS enabled on both tables.
- Public readable, authenticated can write.
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
CREATE POLICY "anon_read_profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_profiles" ON profiles;
CREATE POLICY "auth_insert_profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_profiles" ON profiles;
CREATE POLICY "auth_update_profiles" ON profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_profiles" ON profiles;
CREATE POLICY "auth_delete_profiles" ON profiles FOR DELETE TO authenticated USING (true);

INSERT INTO profiles (name, role, tagline, bio, email, linkedin_url, github_url, education, experience, achievements)
VALUES (
  'Alex Morgan',
  'Full Stack Developer',
  'Building exceptional digital experiences with modern web technologies',
  'I''m a full stack developer with 7+ years of experience building high-performance web applications. I specialize in React, Node.js, and cloud architecture.',
  'alex@alexmorgan.dev',
  'https://linkedin.com/in/alexmorgan',
  'https://github.com/alexmorgan',
  '[{"institution":"MIT","degree":"B.S. Computer Science","year":"2016"},{"institution":"Stanford","degree":"M.S. Software Engineering","year":"2018"}]'::jsonb,
  '[{"company":"TechCorp","role":"Senior Full Stack Developer","period":"2021 - Present","description":"Leading development of microservices architecture serving 2M+ users"},{"company":"StartupXYZ","role":"Full Stack Developer","period":"2018 - 2021","description":"Built and scaled the core platform from 0 to 500K users"}]'::jsonb,
  '["AWS Solutions Architect Certified","Google Cloud Professional Developer","Top 5% Stack Overflow Contributor"]'::jsonb
) ON CONFLICT DO NOTHING;

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_testimonials" ON testimonials;
CREATE POLICY "select_testimonials" ON testimonials FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_testimonials" ON testimonials;
CREATE POLICY "insert_testimonials" ON testimonials FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_testimonials" ON testimonials;
CREATE POLICY "update_testimonials" ON testimonials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_testimonials" ON testimonials;
CREATE POLICY "delete_testimonials" ON testimonials FOR DELETE TO authenticated USING (true);

INSERT INTO testimonials (name, role, company, avatar_url, content, sort_order, published) VALUES
  ('Sarah Chen', 'CTO', 'TechVentures', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2', 'Delivered an outstanding platform that exceeded all expectations.', 1, true),
  ('Marcus Holt', 'Product Manager', 'Innovatech', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2', 'Working together was a fantastic experience. Turned complex requirements into a clean product.', 2, true),
  ('Priya Patel', 'Founder', 'LaunchPad AI', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2', 'Rare combination of technical depth and design sensibility. Built our AI dashboard from scratch.', 3, true)
ON CONFLICT DO NOTHING;
