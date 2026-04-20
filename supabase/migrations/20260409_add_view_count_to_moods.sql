-- Add view_count to moods to track how many users viewed each mood

ALTER TABLE public.moods
ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;
