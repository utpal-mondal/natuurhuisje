-- Create storage bucket for destination videos

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'destinations',
  'destinations',
  true,
  52428800, -- 50MB in bytes
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
) ON CONFLICT (id) DO NOTHING;

-- Create policies for the destinations bucket
DROP POLICY IF EXISTS "Anyone can view destination videos" ON storage.objects;
CREATE POLICY "Anyone can view destination videos" ON storage.objects
FOR SELECT
USING (bucket_id = 'destinations');

DROP POLICY IF EXISTS "Admins can upload destination videos" ON storage.objects;
CREATE POLICY "Admins can upload destination videos" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'destinations' AND 
  is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update destination videos" ON storage.objects;
CREATE POLICY "Admins can update destination videos" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'destinations' AND 
  is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can delete destination videos" ON storage.objects;
CREATE POLICY "Admins can delete destination videos" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'destinations' AND 
  is_admin(auth.uid())
);
