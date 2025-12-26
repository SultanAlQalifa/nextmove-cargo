-- Add missing content column to academy_lessons
ALTER TABLE public.academy_lessons
ADD COLUMN IF NOT EXISTS content TEXT;