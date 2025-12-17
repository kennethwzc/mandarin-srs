-- ==========================================
-- DASHBOARD ERROR DIAGNOSIS SCRIPT
-- ==========================================
-- Run this in Supabase SQL Editor to find why dashboard shows errors

-- ==========================================
-- CHECK 1: Verify your user has a profile
-- ==========================================
-- Replace 'YOUR_EMAIL' with your actual test email
SELECT 
  '=== CHECK 1: USER AND PROFILE STATUS ===' as check,
  au.id as user_id,
  au.email,
  au.email_confirmed_at,
  au.created_at as user_created,
  p.id as profile_id,
  p.email as profile_email,
  p.created_at as profile_created,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Profile EXISTS'
    ELSE '❌ Profile MISSING'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'YOUR_EMAIL@example.com'  -- ← CHANGE THIS!
ORDER BY au.created_at DESC
LIMIT 1;

-- ==========================================
-- CHECK 2: Count all users vs profiles
-- ==========================================
SELECT 
  '=== CHECK 2: OVERALL COUNTS ===' as check,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) - 
  (SELECT COUNT(*) FROM public.profiles) as missing_profiles;

-- ==========================================
-- CHECK 3: List ALL users without profiles
-- ==========================================
SELECT 
  '=== CHECK 3: USERS WITHOUT PROFILES ===' as check,
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;

-- ==========================================
-- CHECK 4: Check RLS policies on profiles table
-- ==========================================
SELECT 
  '=== CHECK 4: RLS POLICIES ===' as check,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ==========================================
-- CHECK 5: Test if we can SELECT from profiles
-- ==========================================
-- This simulates what the dashboard API does
DO $$
DECLARE
  test_user_id uuid;
  profile_count int;
BEGIN
  -- Get a confirmed user
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email_confirmed_at IS NOT NULL
  LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    -- Try to select their profile
    SELECT COUNT(*) INTO profile_count
    FROM public.profiles
    WHERE id = test_user_id;

    RAISE NOTICE '=== CHECK 5: PROFILE QUERY TEST ===';
    RAISE NOTICE 'Test user ID: %', test_user_id;
    RAISE NOTICE 'Profile found: %', (profile_count > 0);
    
    IF profile_count = 0 THEN
      RAISE NOTICE '❌ PROBLEM: Profile exists in table but query returned 0';
      RAISE NOTICE 'This suggests an RLS policy issue';
    ELSE
      RAISE NOTICE '✅ Profile query works correctly';
    END IF;
  END IF;
END $$;

-- ==========================================
-- CHECK 6: Verify table structure
-- ==========================================
SELECT 
  '=== CHECK 6: PROFILES TABLE COLUMNS ===' as check,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ==========================================
-- MANUAL BACKFILL (if needed)
-- ==========================================
-- If CHECK 3 shows users without profiles, uncomment and run this:

/*
INSERT INTO public.profiles (id, email, username, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Verify it worked
SELECT 
  'BACKFILL COMPLETE' as status,
  COUNT(*) as profiles_created
FROM public.profiles;
*/

-- ==========================================
-- CHECK 7: Recent profiles (to verify backfill worked)
-- ==========================================
SELECT 
  '=== CHECK 7: RECENT PROFILES ===' as check,
  id,
  email,
  username,
  created_at,
  updated_at,
  CASE 
    WHEN updated_at > created_at + interval '10 seconds' THEN '🔄 Updated via backfill'
    ELSE '✅ Created normally'
  END as creation_method
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

