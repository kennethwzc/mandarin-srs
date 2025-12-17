-- ==========================================
-- PRODUCTION SETUP VERIFICATION SCRIPT
-- ==========================================
-- Run this in Supabase Dashboard → SQL Editor
-- This will check all aspects of your production setup

-- ==========================================
-- CHECK 1: Verify Trigger Installation
-- ==========================================
SELECT 
  'CHECK 1: TRIGGER STATUS' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ TRIGGER INSTALLED'
    ELSE '❌ TRIGGER NOT FOUND - Run scripts/create-profile-trigger.sql'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND n.nspname = 'auth'
  AND t.tgname = 'on_auth_user_created'
  AND t.tgenabled = 'O';

-- ==========================================
-- CHECK 2: Verify Function Exists
-- ==========================================
SELECT 
  'CHECK 2: FUNCTION STATUS' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ FUNCTION EXISTS'
    ELSE '❌ FUNCTION NOT FOUND - Run scripts/create-profile-trigger.sql'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user'
  AND n.nspname = 'public';

-- ==========================================
-- CHECK 3: Compare Users vs Profiles
-- ==========================================
WITH user_stats AS (
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users
  FROM auth.users
),
profile_stats AS (
  SELECT COUNT(*) as total_profiles
  FROM public.profiles
)
SELECT 
  'CHECK 3: USER/PROFILE COUNT' as check_name,
  us.total_users,
  us.confirmed_users,
  ps.total_profiles,
  (us.confirmed_users - ps.total_profiles) as missing_profiles,
  CASE 
    WHEN us.confirmed_users = ps.total_profiles THEN '✅ ALL USERS HAVE PROFILES'
    ELSE '❌ ' || (us.confirmed_users - ps.total_profiles)::text || ' USERS MISSING PROFILES'
  END as status
FROM user_stats us
CROSS JOIN profile_stats ps;

-- ==========================================
-- CHECK 4: Find Users WITHOUT Profiles
-- ==========================================
SELECT 
  'CHECK 4: USERS WITHOUT PROFILES' as check_name,
  au.id as user_id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ EMAIL NOT VERIFIED'
    ELSE '❌ PROFILE MISSING'
  END as issue
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- ==========================================
-- CHECK 5: Recent User Activity (Last 10)
-- ==========================================
SELECT 
  'CHECK 5: RECENT USERS' as check_name,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ HAS PROFILE'
    ELSE '❌ NO PROFILE'
  END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;

-- ==========================================
-- CHECK 6: RLS Policies on Profiles Table
-- ==========================================
SELECT 
  'CHECK 6: RLS POLICIES' as check_name,
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ RLS POLICIES CONFIGURED'
    ELSE '❌ MISSING RLS POLICIES - Need at least 4'
  END as status
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- ==========================================
-- CHECK 7: List All RLS Policies
-- ==========================================
SELECT 
  'CHECK 7: RLS POLICY DETAILS' as check_name,
  policyname,
  cmd as command,
  permissive,
  CASE 
    WHEN roles = '{public}' THEN 'public'
    ELSE array_to_string(roles, ', ')
  END as applies_to
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public'
ORDER BY cmd;

-- ==========================================
-- CHECK 8: Test Profile Creation (Dry Run)
-- ==========================================
-- This checks if we CAN create a profile without actually doing it
DO $$
DECLARE
  test_user_id uuid;
  test_email text;
  profile_exists boolean;
BEGIN
  -- Get a real user without a profile (if any)
  SELECT au.id, au.email INTO test_user_id, test_email
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
    AND au.email_confirmed_at IS NOT NULL
  LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'CHECK 8: Found user without profile: % (%)', test_email, test_user_id;
    RAISE NOTICE '❌ ACTION NEEDED: Run backfill query to create missing profiles';
  ELSE
    RAISE NOTICE 'CHECK 8: ✅ All confirmed users have profiles';
  END IF;
END $$;

-- ==========================================
-- BACKFILL QUERY (Run if users missing profiles)
-- ==========================================
-- Uncomment and run if CHECK 3 shows missing_profiles > 0:

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
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();
*/

-- ==========================================
-- SUMMARY
-- ==========================================
SELECT 
  '======================================' as summary,
  'RUN ALL CHECKS ABOVE' as instruction,
  'If any check fails, follow the action in the status column' as next_steps;

