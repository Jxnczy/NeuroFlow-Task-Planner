-- Migration to add Vault Metadata to user_preferences
-- Run this in Supabase SQL Editor

-- Add vault columns
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS vault_salt text,
ADD COLUMN IF NOT EXISTS vault_initialized boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS encryption_enabled boolean DEFAULT false;

-- Comment on columns
COMMENT ON COLUMN public.user_preferences.vault_salt IS 'Base64 encoded salt for PBKDF2 key derivation';
COMMENT ON COLUMN public.user_preferences.vault_initialized IS 'True if user has set up the vault';
COMMENT ON COLUMN public.user_preferences.encryption_enabled IS 'True if encryption is active';
