-- Migration to support Stats Baseline Reset
-- Run this in Supabase SQL Editor

-- 1. Add completed_at to tasks to track when a task was finished
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. Add stats_reset_at to user_preferences to track the baseline for dashboard filtering
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS stats_reset_at TIMESTAMPTZ;

-- Comment for clarity
COMMENT ON COLUMN public.tasks.completed_at IS 'Timestamp when the task was marked as completed';
COMMENT ON COLUMN public.user_preferences.stats_reset_at IS 'Baseline timestamp for filtering stats on the dashboard';
