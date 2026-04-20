-- Make thumbnail_url column nullable in moods table since we're not using it anymore

ALTER TABLE public.moods ALTER COLUMN thumbnail_url DROP NOT NULL;

-- Update existing RLS policies to remove references to thumbnail_url
DROP POLICY IF EXISTS "Admins can read moods" ON public.moods;
DROP POLICY IF EXISTS "Admins can insert moods" ON public.moods;
DROP POLICY IF EXISTS "Admins can update moods" ON public.moods;
DROP POLICY IF EXISTS "Admins can delete moods" ON public.moods;

-- Recreate policies without thumbnail_url references
CREATE POLICY "Admins can read moods" ON public.moods
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert moods" ON public.moods
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update moods" ON public.moods
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete moods" ON public.moods
FOR DELETE
USING (is_admin(auth.uid()));

-- Ensure permissions are granted
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moods TO authenticated;
