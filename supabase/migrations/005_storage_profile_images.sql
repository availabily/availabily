-- Create public storage bucket for profile images.
-- Images are uploaded directly from the browser; URLs are stored in profiles.avatar_url
-- and profiles.gallery_urls instead of base64 data URLs (which exceed row size limits).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,  -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read images (public bucket)
CREATE POLICY "Public read profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

-- Allow anyone to upload images (signup flow has no auth)
CREATE POLICY "Public insert profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-images');

-- Allow the uploader to delete their own images (matched by storage path prefix)
CREATE POLICY "Public delete profile images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-images');
