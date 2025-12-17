# 🔍 DIAGNOSTIC VERIFICATION - Production Issues

> Run these checks to verify all fixes are in place

## ✅ What's Been Done

- [x] Code deployed with improvements (commit: e30e09d)
- [x] Email verification success page created
- [x] Better error messages deployed
- [x] Health check endpoint created

## ⚠️ What Still Needs to Be Done

These are the **critical** fixes that actually resolve the errors:

### Check 1: Database Trigger Installation

**Status**: ❓ UNKNOWN - Need to verify

**How to Check**:
Run this in Supabase SQL Editor:

```sql
SELECT
  t.tgname AS trigger_name,
  p.proname AS function_name,
  CASE
    WHEN t.tgenabled = 'O' THEN '✅ Enabled'
    ELSE '❌ Disabled or Missing'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND n.nspname = 'auth'
  AND t.tgname = 'on_auth_user_created';
```

**Expected**: 1 row with status "✅ Enabled"

**If No Results**: Trigger is NOT installed → This is why errors persist!

---

### Check 2: Users Without Profiles

**Status**: ❓ UNKNOWN - Need to verify

**How to Check**:
Run this in Supabase SQL Editor:

```sql
SELECT
  COUNT(*) FILTER (WHERE p.id IS NULL) as missing_profiles,
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) as have_profiles,
  COUNT(*) as total_confirmed_users
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL;
```

**Expected**: `missing_profiles = 0`

**If missing_profiles > 0**: Users don't have profiles → This causes "Tenant or user not found" error!

---

### Check 3: Service Role Key

**Status**: ❓ UNKNOWN - Need to verify

**How to Check**:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Look for: `SUPABASE_SERVICE_ROLE_KEY`

**Expected**: Variable exists with a long key starting with `eyJ...`

**If Missing**: Backup profile creation won't work

---

### Check 4: RLS Policies

**Status**: ❓ UNKNOWN - Need to verify

**How to Check**:
Run this in Supabase SQL Editor:

```sql
SELECT
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Expected**: At least 4 policies

**If Less Than 4**: RLS might be blocking profile access

---

## 🚨 Most Likely Issue

Based on the errors you're seeing, the issue is:

**Users don't have profiles in the database**

This happens because:

1. Database trigger was never installed (or failed to install)
2. Existing users were never backfilled
3. New users are created but trigger isn't working

---

## 🔧 IMMEDIATE FIX

### Step 1: Verify Trigger Status (30 seconds)

Run this query in Supabase:

```sql
-- Check if trigger exists
SELECT
  COUNT(*) as trigger_exists
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND n.nspname = 'auth'
  AND t.tgname = 'on_auth_user_created'
  AND t.tgenabled = 'O';
```

**Result**:

- `trigger_exists = 1` → Trigger is installed ✅
- `trigger_exists = 0` → **TRIGGER NOT INSTALLED** ❌ ← This is the problem!

### Step 2: Find Users Without Profiles (30 seconds)

```sql
-- Count users missing profiles
SELECT
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;
```

**This shows you exactly which users are affected**

### Step 3: Fix It NOW (2 minutes)

**If trigger_exists = 0** (trigger not installed):

1. Copy ENTIRE contents of `scripts/create-profile-trigger.sql`
2. Paste in Supabase SQL Editor
3. Click RUN
4. Should see "Success. No rows returned"

**Then backfill existing users**:

```sql
-- Create profiles for all users without them
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
```

### Step 4: Verify Fix (30 seconds)

```sql
-- This should return 0 missing profiles
SELECT
  COUNT(*) FILTER (WHERE p.id IS NULL) as missing_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL;
```

**Expected**: `missing_profiles = 0`

---

## 🧪 Test After Fix

1. **Test Health Endpoint**:

   ```bash
   curl https://your-domain.vercel.app/api/health/profiles
   ```

   Should return: `"status": "healthy"`

2. **Test Dashboard**:
   - Sign in with affected user
   - Dashboard should load without errors

3. **Test Lessons**:
   - Navigate to Lessons page
   - Should work without "Tenant or user not found" error

---

## 📊 Complete System Check

Run this all-in-one diagnostic:

```sql
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
    AND t.tgenabled = 'O'
),
policy_check AS (
  SELECT COUNT(*) as policy_count
  FROM pg_policies
  WHERE tablename = 'profiles'
)
SELECT
  uc.total_users as confirmed_users,
  pc.total_profiles as total_profiles,
  uc.total_users - pc.total_profiles as users_missing_profiles,
  tc.trigger_exists as trigger_installed,
  policyc.policy_count as rls_policies,
  CASE
    WHEN uc.total_users = pc.total_profiles
      AND tc.trigger_exists = 1
      AND policyc.policy_count >= 4
    THEN '✅ ALL CHECKS PASSED'
    WHEN uc.total_users != pc.total_profiles
    THEN '❌ USERS MISSING PROFILES'
    WHEN tc.trigger_exists = 0
    THEN '❌ TRIGGER NOT INSTALLED'
    WHEN policyc.policy_count < 4
    THEN '❌ RLS POLICIES INCOMPLETE'
    ELSE '❌ ISSUES DETECTED'
  END as status,
  CASE
    WHEN uc.total_users != pc.total_profiles
    THEN 'Run backfill query to create missing profiles'
    WHEN tc.trigger_exists = 0
    THEN 'Run scripts/create-profile-trigger.sql in SQL Editor'
    WHEN policyc.policy_count < 4
    THEN 'Run RLS policy setup from docs/PRODUCTION_FIX_CHECKLIST.md'
    ELSE 'All good!'
  END as action_needed
FROM user_counts uc
CROSS JOIN profile_counts pc
CROSS JOIN trigger_check tc
CROSS JOIN policy_check policyc;
```

**This one query tells you exactly what's wrong and what to do!**

---

## 🎯 Summary

Your code deployment is complete, but the **database fixes haven't been applied yet**.

The errors you're seeing are because:

1. ❌ Database trigger not installed
2. ❌ Users don't have profiles
3. ❌ Service role key might not be set

**To fix**: Run the diagnostic queries above to identify exactly what's missing, then apply the fixes.

**Time needed**: 5-10 minutes

---

**Created**: 2025-12-17  
**Status**: Diagnostic - Waiting for verification
