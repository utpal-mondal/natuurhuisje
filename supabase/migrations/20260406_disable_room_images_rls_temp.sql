-- TEMPORARY: Disable RLS for room_images to fix immediate issue
-- WARNING: This is a temporary fix for development only
-- TODO: Re-enable RLS with proper policies before production

ALTER TABLE room_images DISABLE ROW LEVEL SECURITY;
