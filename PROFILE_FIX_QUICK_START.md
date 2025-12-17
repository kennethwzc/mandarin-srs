# Profile Creation Fix - Quick Start Guide

## 🚨 EMERGENCY FIX: 5 Steps to Resolution

If users are getting "Tenant or user not found" errors, follow these 5 steps:

---

## Step 1: Install Database Trigger (2 minutes)

**Where**: Supabase Dashboard > SQL Editor

**What to do**: Copy and paste **ALL** content from `/scripts/create-profile-trigger.sql` and click "Run"

**Expected**: Success message, no errors

✅ Done? \_\_\_\_

---

## Step 2: Configure RLS Policies (1 minute)

**Where**: Supabase Dashboard > SQL Editor

**What to run**:

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

✅ Done? \_\_\_\_

---

## Step 3: Backfill Existing Users (1 minute)

**Where**: Supabase Dashboard > SQL Editor

**What to run**:

```sql
-- Create profiles for users that don't have them
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

**Expected**: "INSERT X" where X is the number of users fixed

✅ Done? \_\_\_\_

---

## Step 4: Verify Fix (1 minute)

**Where**: Supabase Dashboard > SQL Editor

**What to run**:

```sql
-- Check that all users now have profiles
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
  END as overall_status
FROM user_counts uc
CROSS JOIN profile_counts pc
CROSS JOIN trigger_check tc
CROSS JOIN policy_check policyc;
```

**Expected**: `overall_status = '✅ ALL CHECKS PASSED'`

✅ Done? \_\_\_\_

---

## Step 5: Test (2 minutes)

### Test A: Existing User

1. Log in as existing user
2. Dashboard should load ✅
3. Lessons page should load ✅

### Test B: New User

1. Sign up with new email
2. Confirm email
3. Dashboard should load ✅
4. Lessons page should load ✅

✅ Done? \_\_\_\_

---

## ✅ SUCCESS!

If all 5 steps show ✅, the issue is fixed!

**What changed**:

- ✅ Database trigger auto-creates profiles on signup
- ✅ RLS policies allow safe profile creation
- ✅ Existing users now have profiles
- ✅ Code has better error logging

---

## 🚨 Still Having Issues?

### Quick Troubleshooting

**Problem**: Verification shows "ISSUES DETECTED"

**Solution**: Check individual counts in verification query:

- If `trigger_installed = 0`: Re-run Step 1
- If `rls_policies < 4`: Re-run Step 2
- If `confirmed_users > total_profiles`: Re-run Step 3

---

**Problem**: New users still can't access dashboard

**Solution**: Check server logs for errors:

```bash
# Look for these in your Next.js console:
❌ CRITICAL: Failed to create profile
```

If you see this, check:

1. Is `SUPABASE_SERVICE_ROLE_KEY` set correctly?
2. Do RLS policies allow insertion?

---

**Problem**: Specific user can't access dashboard

**Solution**: Manually create their profile:

```sql
-- Replace YOUR_USER_ID and user@email.com
INSERT INTO public.profiles (id, email, created_at, updated_at)
VALUES ('YOUR_USER_ID', 'user@email.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

---

## 📚 More Help

For detailed explanations and advanced troubleshooting:

- See: `PROFILE_CREATION_FIX_GUIDE.md`
- See: `scripts/profile-fix-queries.sql`

For backfill script (alternative to SQL):

- Run: `tsx scripts/backfill-profiles.ts`

---

## 🎯 Summary

**Time Required**: ~7 minutes  
**Difficulty**: Easy (copy/paste SQL)  
**Risk Level**: Low (safe operations)  
**Result**: Users can access platform without errors

**Before**: ❌ Users get "Tenant or user not found"  
**After**: ✅ Users access dashboard and lessons successfully

---

**Fix completed on**: **\*\***\_\_\_\_**\*\***  
**Completed by**: **\*\***\_\_\_\_**\*\***  
**Users fixed**: **\*\***\_\_\_\_**\*\***  
**Status**: ✅ Working / ⚠️ Issues / ❌ Failed
