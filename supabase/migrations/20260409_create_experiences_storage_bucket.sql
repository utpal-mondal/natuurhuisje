-- Create storage bucket for experience videos

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'experiences',
  'experiences',
  true,
  52428800, -- 50MB in bytes
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
) ON CONFLICT (id) DO NOTHING;

-- Create policies for the experiences bucket
DROP POLICY IF EXISTS "Anyone can view experience videos" ON storage.objects;
CREATE POLICY "Anyone can view experience videos" ON storage.objects
FOR SELECT
USING (bucket_id = 'experiences');

DROP POLICY IF EXISTS "Admins can upload experience videos" ON storage.objects;
CREATE POLICY "Admins can upload experience videos" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'experiences' AND 
  is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update experience videos" ON storage.objects;
CREATE POLICY "Admins can update experience videos" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'experiences' AND 
  is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can delete experience videos" ON storage.objects;
CREATE POLICY "Admins can delete experience videos" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'experiences' AND 
  is_admin(auth.uid())
);
