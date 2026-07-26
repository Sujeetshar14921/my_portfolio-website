/*
# Create storage bucket for media uploads

1. Storage bucket
- `media` bucket for public images and PDFs
- File size limit: 10MB
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif, application/pdf

2. Security
- Public read access
- Authenticated users can upload, update, delete
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_media" ON storage.objects;
CREATE POLICY "public_read_media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "auth_upload_media" ON storage.objects;
CREATE POLICY "auth_upload_media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "auth_update_media" ON storage.objects;
CREATE POLICY "auth_update_media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "auth_delete_media" ON storage.objects;
CREATE POLICY "auth_delete_media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');
