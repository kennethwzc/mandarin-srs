-- ============================================================================
-- Profile Creation Fix - Quick Reference SQL Queries
-- ============================================================================
-- Use this file as a quick reference for all SQL commands needed
-- Run these in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: INVESTIGATION QUERIES
-- ============================================================================

-- Query 1.1: Check if database trigger exists
-- Expected: One row if trigger is installed
SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND n.nspname = 'auth'
  AND t.tgname = 'on_auth_user_created';

-- Query 1.2: Find users without profiles
-- Shows which users are missing profiles
SELECT
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  p.id as profile_id,
  CASE
    WHEN p.id IS NULL THEN '❌ MISSING PROFILE'
    ELSE '✓ Has Profile'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;

-- Query 1.3: Check RLS status
-- Expected: rowsecurity = true
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- Query 1.4: Check existing RLS policies
-- Shows current security policies
SELECT
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================================
-- PART 2: TRIGGER INSTALLATION (Run scripts/create-profile-trigger.sql instead)
-- ============================================================================
-- DO NOT RUN THIS SECTION - Use scripts/create-profile-trigger.sql file
-- This is here for reference only

-- ============================================================================
-- PART 3: RLS POLICY CONFIGURATION
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Service role can insert profiles (for safety nets)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Policy 4: Authenticated users can insert their own profile (one-time)
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify policies were created
SELECT COUNT(*) as policy_count, 'Expected: 4 or more' as note
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================================================
-- PART 4: BACKFILL EXISTING USERS
-- ============================================================================

-- Backfill profiles for users without them
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

-- Verify backfill success
SELECT 
  COUNT(*) as users_with_profiles,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as total_confirmed_users,
  CASE 
    WHEN COUNT(*) = (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL)
    THEN '✅ All users have profiles'
    ELSE '❌ Some users missing profiles'
  END as status
FROM auth.users au
INNER JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL;

-- ============================================================================
-- PART 5: VERIFICATION QUERIES
-- ============================================================================

-- Query 5.1: Check for any remaining missing profiles
SELECT
  COUNT(*) FILTER (WHERE p.id IS NULL) as missing_profiles,
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) as profiles_exist,
  COUNT(*) as total_users
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL;

-- Query 5.2: Verify trigger is working
SELECT 
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  CASE 
    WHEN t.tgenabled = 'O' THEN '✅ Trigger enabled'
    ELSE '❌ Trigger disabled'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND n.nspname = 'auth'
  AND t.tgname = 'on_auth_user_created';

-- Query 5.3: Comprehensive system check
WITH user_counts AS (
  SELECT COUNT(*) as total_users
  FROM auth.users
  WHERE email_confirmed_at IS NOT NULL
),
profile_counts AS (
  SELECT COUNT(*) as total_profiles
  FROM public.profiles
),
trigger_check AS (
  SELECT COUNT(*) as trigger_exists
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = 'users'
    AND n.nspname = 'auth'
    AND t.tgname = 'on_auth_user_created'
),
policy_check AS (
  SELECT COUNT(*) as policy_count
  FROM pg_policies
  WHERE tablename = 'profiles'
)
SELECT
  uc.total_users as confirmed_users,
  pc.total_profiles as total_profiles,
  tc.trigger_exists as trigger_installed,
  policyc.policy_count as rls_policies,
  CASE
    WHEN uc.total_users = pc.total_profiles 
      AND tc.trigger_exists = 1 
      AND policyc.policy_count >= 4
    THEN '✅ ALL CHECKS PASSED'
    ELSE '❌ ISSUES DETECTED - Review individual counts'
  END as overall_status
FROM user_counts uc
CROSS JOIN profile_counts pc
CROSS JOIN trigger_check tc
CROSS JOIN policy_check policyc;

-- ============================================================================
-- PART 6: TROUBLESHOOTING QUERIES
-- ============================================================================

-- Query 6.1: Find specific user's profile status
-- Replace '[user-id]' with actual user ID
/*
SELECT
  au.id as user_id,
  au.email,
  au.email_confirmed_at,
  p.id as profile_id,
  p.created_at as profile_created_at,
  CASE
    WHEN p.id IS NULL THEN '❌ Profile missing'
    ELSE '✅ Profile exists'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.id = '[user-id]';
*/

-- Query 6.2: Manually create profile for specific user (emergency fix)
-- Replace '[user-id]' and '[email]' with actual values
/*
INSERT INTO public.profiles (id, email, created_at, updated_at)
VALUES ('[user-id]', '[email]', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
*/

-- Query 6.3: Check database logs for trigger errors
-- This requires superuser access - may not work on Supabase
/*
SELECT 
  log_time,
  message
FROM pg_stat_statements
WHERE query LIKE '%handle_new_user%'
ORDER BY log_time DESC
LIMIT 10;
*/

-- Query 6.4: List all users and their profile status (detailed)
SELECT
  au.id,
  au.email,
  au.created_at as user_created,
  au.email_confirmed_at,
  au.last_sign_in_at,
  p.id as profile_id,
  p.created_at as profile_created,
  p.username,
  CASE
    WHEN p.id IS NULL THEN '❌ MISSING'
    WHEN p.created_at > au.created_at + INTERVAL '5 minutes' THEN '⚠️  DELAYED'
    ELSE '✅ OK'
  END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;

-- ============================================================================
-- PART 7: CLEANUP QUERIES (Use with caution)
-- ============================================================================

-- Query 7.1: Remove duplicate profiles (if any)
-- This keeps the oldest profile for each user
/*
DELETE FROM public.profiles
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) AS rn
    FROM public.profiles
  ) t
  WHERE t.rn > 1
);
*/

-- Query 7.2: Temporarily disable RLS (for testing only)
-- WARNING: Only use for debugging, re-enable immediately after
/*
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
*/

-- Query 7.3: Re-enable RLS (use after testing)
/*
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- EXECUTION ORDER SUMMARY
-- ============================================================================
/*
RECOMMENDED EXECUTION ORDER:

1. Run PART 1 queries (Investigation) - Understand current state
2. Run scripts/create-profile-trigger.sql - Install trigger
3. Run PART 3 queries (RLS Configuration) - Set up security
4. Run PART 4 queries (Backfill) - Fix existing users
5. Run PART 5 queries (Verification) - Confirm success
6. Use PART 6 queries (Troubleshooting) - Only if issues persist

IMPORTANT NOTES:
- Always read comments before running queries
- Some queries are commented out and require parameter replacement
- Backup your database before running cleanup queries
- Monitor server logs after making changes
*/

