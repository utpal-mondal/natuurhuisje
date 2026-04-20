-- Create storage bucket for mood assets (thumbnail images + videos)

INSERT INTO storage.buckets (id, name, public)
VALUES ('moods', 'moods', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read mood assets" ON storage.objects;
CREATE POLICY "Public read mood assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'moods');

DROP POLICY IF EXISTS "Admins can upload mood assets" ON storage.objects;
CREATE POLICY "Admins can upload mood assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'moods'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update mood assets" ON storage.objects;
CREATE POLICY "Admins can update mood assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'moods'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'moods'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete mood assets" ON storage.objects;
CREATE POLICY "Admins can delete mood assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'moods'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.role = 'admin'
  )
);
