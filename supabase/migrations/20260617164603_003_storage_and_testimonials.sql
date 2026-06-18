
-- Storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "public_read_media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

CREATE POLICY "auth_upload_media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "auth_update_media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media');

CREATE POLICY "auth_delete_media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT '',
  company     text NOT NULL DEFAULT '',
  avatar_url  text NOT NULL DEFAULT '',
  content     text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0,
  published   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_testimonials" ON testimonials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_testimonials" ON testimonials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_testimonials" ON testimonials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_testimonials" ON testimonials FOR DELETE TO authenticated USING (true);

-- Seed sample testimonials
INSERT INTO testimonials (name, role, company, avatar_url, content, sort_order, published) VALUES
  ('Sarah Chen', 'CTO', 'TechVentures', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2', 'Sujeet delivered an outstanding platform that exceeded all expectations. His attention to detail and proactive communication made the project a true success.', 1, true),
  ('Marcus Holt', 'Product Manager', 'Innovatech', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2', 'Working with Sujeet was a fantastic experience. He turned complex requirements into a clean, intuitive product in record time.', 2, true),
  ('Priya Patel', 'Founder', 'LaunchPad AI', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2', 'Sujeet has a rare combination of technical depth and design sensibility. He built our AI dashboard from scratch and it looks world-class.', 3, true)
ON CONFLICT DO NOTHING;
