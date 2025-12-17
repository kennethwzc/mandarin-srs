# Profile Creation Fix - Complete Implementation Guide

## 🚨 PROBLEM SUMMARY

**Issue**: Users experiencing "Tenant or user not found" errors on Dashboard and Lessons pages after email confirmation.

**Root Cause**: User profiles are not being created in `public.profiles` table after signup and email confirmation.

**Impact**: Users cannot access dashboard or lessons after successfully signing up and confirming their email.

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

Before implementing fixes, gather this information:

- [ ] Supabase Project URL: `_______________________`
- [ ] Access to Supabase Dashboard SQL Editor
- [ ] `SUPABASE_SERVICE_ROLE_KEY` from .env file
- [ ] Number of existing users without profiles: `_______`

---

## 🔍 STEP 1: INVESTIGATION (Run these in Supabase SQL Editor)

### 1.1 Check if Database Trigger Exists

```sql
-- Check if trigger exists
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
```

**Expected Result**: One row showing the trigger exists  
**If Empty**: Trigger is NOT installed ❌ (this is likely your main issue)

**Your Result**: `___________________`

---

### 1.2 Find Users Without Profiles

```sql
-- Find users without profiles
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
```

**Record the number of users with MISSING PROFILE**: `_______`

---

### 1.3 Check RLS Policies

```sql
-- Check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- Check existing policies
SELECT
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public'
ORDER BY policyname;
```

**Record RLS Status**: Enabled? `___` (Yes/No)  
**Record Number of Policies**: `_______`

---

## 🔧 STEP 2: INSTALL DATABASE TRIGGER

### 2.1 Install Trigger (PRIMARY FIX)

**Action**: In Supabase Dashboard > SQL Editor, run the **ENTIRE** contents of:

```
/scripts/create-profile-trigger.sql
```

**What it does**:

- Creates `handle_new_user()` function
- Sets up trigger to auto-create profiles on user signup
- Runs with `SECURITY DEFINER` to bypass RLS
- Handles conflicts gracefully

**Verification**: Run this query after installation:

```sql
-- Verify trigger was created
SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  'Trigger installed ✅' as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND n.nspname = 'auth'
  AND t.tgname = 'on_auth_user_created';
```

**Expected**: One row with `enabled = 'O'` (O = Origin, means enabled)

✅ Trigger installed successfully: `_______` (Yes/No)

---

## 🔧 STEP 3: CONFIGURE RLS POLICIES

### 3.1 Set Up Correct RLS Policies

**Action**: In Supabase Dashboard > SQL Editor, run:

```sql
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
```

**Verification**:

```sql
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'profiles';
```

**Expected**: At least 4 policies

✅ RLS policies configured: `_______` (Yes/No)

---

## 🔧 STEP 4: BACKFILL EXISTING USERS

### Option A: Using SQL (Recommended for small number of users)

**Action**: In Supabase Dashboard > SQL Editor, run:

```sql
-- Backfill profiles for existing users
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
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as total_confirmed_users
FROM auth.users au
INNER JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL;
```

**Record**: Profiles created: `_______`

✅ Backfill complete (SQL): `_______` (Yes/No)

---

### Option B: Using TypeScript Script (Recommended for many users or complex cases)

**Action**: Run from your terminal:

```bash
# Make sure tsx is installed
pnpm add -D tsx

# Run the backfill script
tsx scripts/backfill-profiles.ts
```

**Expected Output**:

```
🚀 Starting profile backfill process...
📊 Fetching all users from auth.users...
✓ Found X total users

✓ Profile exists for user@example.com
✅ Created profile for newuser@example.com
...

============================================================
📈 BACKFILL SUMMARY
============================================================
✅ Created:           X
⏭️  Skipped (exists):   X
❌ Failed:            0
📊 Total processed:   X
============================================================
```

✅ Backfill complete (Script): `_______` (Yes/No)

---

## 🔧 STEP 5: CODE IMPROVEMENTS (Already Implemented)

The following code improvements have been made:

### 5.1 Enhanced Error Logging in Auth Callback

**File**: `/app/api/auth/callback/route.ts`

**Changes**:

- ✅ Detailed error logging with userId, email, error message, and stack trace
- ✅ No longer silently continues on profile creation failure
- ✅ Redirects to login with clear error message if profile creation fails

### 5.2 Enhanced Error Logging in Dashboard API

**File**: `/app/api/dashboard/stats/route.ts`

**Changes**:

- ✅ Improved error logging with structured data
- ✅ More descriptive error messages
- ✅ Development-only error details in response

### 5.3 Backfill Utility Script

**File**: `/scripts/backfill-profiles.ts` (NEW)

**Purpose**:

- ✅ Safely backfill profiles for existing users
- ✅ Detailed progress logging
- ✅ Error handling with summary report

---

## ✅ STEP 6: TESTING

### 6.1 Test New User Signup

**Actions**:

1. Sign up with a new email address
2. Confirm email via verification link
3. Should redirect to dashboard successfully
4. Dashboard should load without errors
5. Navigate to Lessons page - should load without errors

✅ New user signup works: `_______` (Yes/No)

---

### 6.2 Verify All Users Have Profiles

**Action**: Run in Supabase SQL Editor:

```sql
-- Check for any remaining missing profiles
SELECT
  COUNT(*) FILTER (WHERE p.id IS NULL) as missing_profiles,
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) as profiles_exist,
  COUNT(*) as total_users
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL;
```

**Expected**: `missing_profiles = 0`

✅ All users have profiles: `_______` (Yes/No)

---

### 6.3 Test Existing User Login

**Actions**:

1. Log in as an existing user (who previously had issues)
2. Dashboard should load successfully
3. Lessons page should load successfully
4. No "Tenant or user not found" errors

✅ Existing users can access dashboard: `_______` (Yes/No)

---

### 6.4 Monitor Server Logs

**Action**: Watch your Next.js console for:

**Good Signs**:

- ✅ `Successfully created profile for user: [userId]`
- ✅ `Profile exists for [email]`

**Bad Signs (investigate if you see these)**:

- ❌ `❌ CRITICAL: Failed to create profile`
- ❌ `Profile not found for user`

---

## 📊 VERIFICATION CHECKLIST

Run this comprehensive verification query:

```sql
-- Comprehensive verification
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
    ELSE '❌ ISSUES DETECTED'
  END as status
FROM user_counts uc
CROSS JOIN profile_counts pc
CROSS JOIN trigger_check tc
CROSS JOIN policy_check policyc;
```

**Expected Result**:

- `confirmed_users` = `total_profiles`
- `trigger_installed` = 1
- `rls_policies` >= 4
- `status` = '✅ ALL CHECKS PASSED'

---

## 🎯 SUCCESS CRITERIA

All of the following should be true:

- [ ] ✅ Database trigger installed and enabled
- [ ] ✅ RLS policies configured (at least 4 policies)
- [ ] ✅ All existing users have profiles (0 missing)
- [ ] ✅ New user signup creates profile automatically
- [ ] ✅ Dashboard loads without errors
- [ ] ✅ Lessons page loads without errors
- [ ] ✅ No "Tenant or user not found" errors
- [ ] ✅ Server logs show successful profile creation
- [ ] ✅ Backfill script runs successfully (if used)

---

## 🔄 TRIPLE-REDUNDANCY SYSTEM

After all fixes are implemented, you have **three layers** of protection:

### Layer 1: Database Trigger (Primary)

- Automatically creates profile when user signs up
- Runs at database level (most reliable)
- Bypasses RLS with SECURITY DEFINER

### Layer 2: Auth Callback (Safety Net)

- Creates profile during email confirmation if trigger failed
- Uses service role credentials
- Fails loudly with clear error message

### Layer 3: Dashboard API (Fallback)

- Creates profile on first dashboard visit if both above failed
- Last resort safety net
- Logs detailed error information

**Result**: Profile creation should never fail silently!

---

## 🐛 TROUBLESHOOTING

### Issue: Trigger installed but profiles not created

**Solution**:

1. Check if trigger is enabled: `SELECT tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
2. Check Supabase logs: Dashboard > Logs > Database
3. Look for "Profile created for user" log messages

### Issue: Backfill script fails with connection error

**Solution**:

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is set
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (NOT the anon key!)
3. Check if service role key has admin permissions

### Issue: RLS blocking profile creation

**Solution**:

1. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ```
2. Try creating a profile
3. Re-enable RLS and create proper policies:
   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ```

### Issue: Users still getting errors after all fixes

**Solution**:

1. Check if the specific user has a profile:
   ```sql
   SELECT * FROM public.profiles WHERE id = '[user-id]';
   ```
2. Check server logs for detailed error messages
3. Try manually creating the profile:
   ```sql
   INSERT INTO public.profiles (id, email, created_at, updated_at)
   VALUES ('[user-id]', '[email]', NOW(), NOW())
   ON CONFLICT (id) DO NOTHING;
   ```

---

## 📞 SUPPORT

If you continue to experience issues after following this guide:

1. **Gather Information**:
   - Run all verification queries
   - Copy server logs showing errors
   - Note which step in this guide failed

2. **Check**:
   - Supabase Dashboard > Logs > Database (for trigger errors)
   - Next.js server console (for application errors)
   - Browser console (for client-side errors)

3. **Common Issues**:
   - Service role key not set or incorrect
   - RLS policies too restrictive
   - Database trigger not enabled
   - Network/connection issues

---

## 📝 COMPLETION SIGN-OFF

**Date Completed**: `_______________`

**Implemented By**: `_______________`

**Results**:

- Users backfilled: `_______`
- Trigger installed: Yes / No
- RLS configured: Yes / No
- All tests passed: Yes / No

**Notes**:

```
____________________________________________
____________________________________________
____________________________________________
```

---

## 🚀 NEXT STEPS

After successful implementation:

1. **Monitor** server logs for next 24-48 hours
2. **Test** with a few new user signups
3. **Document** any edge cases encountered
4. **Update** this guide if you discover improvements

✅ **FIX COMPLETE** - Users should now be able to sign up and access the platform without profile errors!
