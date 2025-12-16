-- ============================================================================
-- Auto-create User Profile Trigger
-- ============================================================================
-- This trigger automatically creates a profile in the public.profiles table
-- whenever a new user is created in the auth.users table.
--
-- INSTALLATION INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
--
-- WHAT IT DOES:
-- - Automatically creates a profile when user confirms email
-- - Extracts username from user metadata if provided
-- - Uses ON CONFLICT to prevent duplicate profiles
-- - Runs as SECURITY DEFINER to bypass RLS
--
-- TESTING:
-- After running this trigger, create a new user account and verify that
-- a corresponding profile is created in the public.profiles table.
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new profile for the user
  INSERT INTO public.profiles (id, email, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Log the profile creation
  RAISE LOG 'Profile created for user: %', NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger that fires when new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a profile in public.profiles when a new user registers';

-- ============================================================================
-- Backfill Existing Users Without Profiles (OPTIONAL)
-- ============================================================================
-- Run this section only if you have existing users without profiles
-- Uncomment the lines below to backfill:

/*
INSERT INTO public.profiles (id, email, username, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'username',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the trigger is working:

/*
SELECT
  au.id as auth_user_id,
  au.email as auth_email,
  au.created_at as auth_created,
  p.id as profile_id,
  p.email as profile_email,
  p.created_at as profile_created,
  CASE
    WHEN p.id IS NULL THEN 'MISSING PROFILE ❌'
    ELSE 'Profile exists ✓'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 20;
*/

