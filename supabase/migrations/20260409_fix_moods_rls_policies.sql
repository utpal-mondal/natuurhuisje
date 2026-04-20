-- Fix RLS policies for moods table to use correct admin_users table reference

-- Update the is_admin function to use correct admin_users table reference
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.auth_user_id = user_id AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read moods" ON public.moods;
DROP POLICY IF EXISTS "Admins can insert moods" ON public.moods;
DROP POLICY IF EXISTS "Admins can update moods" ON public.moods;
DROP POLICY IF EXISTS "Admins can delete moods" ON public.moods;

-- Recreate policies with corrected function
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
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
