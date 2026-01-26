-- Repair permissions and ensure RLS policies are correct for cross-device sync
-- Run this in Supabase SQL Editor

-- 1. Ensure table exists with all columns
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  onboarding_completed boolean DEFAULT false,
  stats_reset_at timestamptz,
  vault_salt text,
  vault_initialized boolean DEFAULT false,
  encryption_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts/duplicates
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;

-- 4. Re-create robust policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Grant access to authenticated users (just in case public role was revoked)
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

-- 6. Verify column comments
COMMENT ON COLUMN public.user_preferences.vault_salt IS 'Base64 encoded salt for PBKDF2 key derivation';
