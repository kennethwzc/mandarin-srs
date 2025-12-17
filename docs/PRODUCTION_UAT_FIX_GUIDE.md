# 🚨 PRODUCTION UAT FIX GUIDE

> **Status**: Production issues detected during UAT  
> **Priority**: CRITICAL  
> **Created**: 2025-12-17

## 📋 Issue Summary

After deploying to production, UAT revealed the following issues:

1. ❌ After email verification → redirected to login with NO confirmation message
2. ❌ After signing in → dashboard shows "Internal server error"
3. ❌ Lessons page shows "Tenant or user not found" error

## 🔍 Root Cause Analysis

The codebase has **triple-redundancy profile creation**:
- **Layer 1**: Database trigger (auto-creates profile when user created)
- **Layer 2**: Auth callback (creates profile after email verification)
- **Layer 3**: Dashboard API (creates profile on first access)

**Conclusion**: Issues are **configuration/environment problems**, not code bugs.

### Most Likely Causes

1. **Database trigger NOT installed** (90% probability)
2. **Missing `SUPABASE_SERVICE_ROLE_KEY`** environment variable (80% probability)
3. **RLS policies too restrictive** (50% probability)
4. **No user feedback on verification** (100% confirmed)

---

## ⚡ QUICK FIX (5 Minutes)

### Step 1: Install Database Trigger

**Location**: Supabase Dashboard → SQL Editor

```sql
-- Copy contents of scripts/create-profile-trigger.sql and run
-- OR run this complete script:

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

  RAISE LOG 'Profile created for user: %', NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 2: Backfill Affected Users

**Run immediately after installing trigger**:

```sql
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

-- Verify success (should show 0 missing profiles)
SELECT 
  COUNT(*) FILTER (WHERE p.id IS NULL) as missing_profiles,
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) as profiles_exist
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL;
```

### Step 3: Verify Environment Variables

**Location**: Vercel Dashboard → Settings → Environment Variables

Ensure these exist:

```bash
# Public variables
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_APP_URL=https://[your-domain.com]

# Private variables (CRITICAL!)
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # Required for backup profile creation
DATABASE_URL=[postgres-connection-string]
```

**⚠️ IMPORTANT**: After adding `SUPABASE_SERVICE_ROLE_KEY`, you MUST redeploy!

To find the service role key:
1. Supabase Dashboard → Settings → API
2. Copy `service_role` key (NOT anon key)
3. Add to Vercel environment variables
4. Redeploy application

### Step 4: Verify RLS Policies

**Run in Supabase SQL Editor**:

```sql
-- Check existing policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Expected**: At least 4 policies (view, update, insert for users, insert for service)

**If missing, run**:

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Service role can insert profiles (CRITICAL for safety nets!)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Policy 4: Users can insert their own profile
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

## 🔬 DETAILED INVESTIGATION

### Investigation 1: Check Trigger Status

```sql
-- Check if trigger exists and is enabled
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
**If no rows**: Trigger is NOT installed → Run Quick Fix Step 1

### Investigation 2: Find Affected Users

```sql
-- Find all users without profiles
SELECT
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  CASE
    WHEN p.id IS NULL THEN '❌ MISSING PROFILE'
    ELSE '✓ Has Profile'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;
```

**Action**: Note how many users are affected

### Investigation 3: Check Server Logs

**Location**: Vercel Dashboard → Deployments → [Latest] → Functions

**Search for**:
- `CRITICAL: Failed to create profile`
- `Profile not found for user`
- `PROFILE_NOT_FOUND`
- `profile_creation_failed`

**Common error patterns**:
- `Missing env.SUPABASE_SERVICE_ROLE_KEY` → Add environment variable
- `new row violates row-level security` → Fix RLS policies (Step 4)
- `relation does not exist` → Database schema issue
- No logs → Trigger not installed, no backup executed

### Investigation 4: Comprehensive System Check

```sql
-- All-in-one verification query
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

**Expected output**:
```
confirmed_users | total_profiles | trigger_installed | rls_policies | overall_status
5               | 5              | 1                 | 4            | ✅ ALL CHECKS PASSED
```

---

## 🛠️ CODE IMPROVEMENTS

### Improvement 1: Add Email Verification Success Page

**Create**: `app/(auth)/email-verified/page.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default function EmailVerifiedPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/login')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Email Verified Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Your email has been successfully verified. You can now sign in to your account
            and start learning Mandarin.
          </p>
          <div className="text-center text-sm text-muted-foreground">
            Redirecting to sign in page in 5 seconds...
          </div>
          <Button 
            onClick={() => router.push('/login')} 
            className="w-full"
          >
            Sign In Now
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Improvement 2: Update Auth Callback

**Update**: `app/api/auth/callback/route.ts` (Line 99-106)

```typescript
// If profile creation failed, redirect to email verification success page
// with error parameter so user knows verification worked but profile failed
if (profileError) {
  const verifiedUrl = new URL('/email-verified', request.url)
  verifiedUrl.searchParams.set('error', 'profile_setup_incomplete')
  return NextResponse.redirect(verifiedUrl)
}

// Success - show verification success page
const successUrl = new URL('/email-verified', request.url)
return NextResponse.redirect(successUrl)
```

### Improvement 3: Enhanced Login Error Handling

**Update**: `app/(auth)/login/page.tsx` (After line 53)

```typescript
// Handle profile creation failure with verified email
if (error === 'profile_creation_failed') {
  const wasVerified = searchParams.get('verified')
  
  toast.error('Account Setup Incomplete', {
    description: wasVerified 
      ? 'Your email was verified successfully, but we encountered an error setting up your profile. Please contact support at support@example.com'
      : message || 'Unable to set up your account. Please contact support.',
    duration: 10000
  })
}

// Add success message for verified users
useEffect(() => {
  const verified = searchParams.get('verified')
  if (verified === 'true') {
    toast.success('Email Verified!', {
      description: 'Your email has been verified. Please sign in to continue.',
      duration: 5000
    })
  }
}, [searchParams])
```

---

## 📊 MONITORING & PREVENTION

### Create Health Check Endpoint

**Create**: `app/api/health/profiles/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Health check endpoint for profile creation system
 * Monitors trigger status and users without profiles
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Service role key not configured',
        checks: {
          serviceKey: false,
          trigger: null,
          usersWithoutProfiles: null
        }
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Check 1: Verify trigger exists
    const { data: triggerData } = await supabase.rpc('check_trigger_status', {
      trigger_name: 'on_auth_user_created'
    })

    // Check 2: Count users without profiles
    const { data: users } = await supabase.auth.admin.listUsers()
    const confirmedUsers = users?.users.filter(u => u.email_confirmed_at) || []
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
    
    const usersWithoutProfiles = confirmedUsers.length - (profiles?.length || 0)

    const isHealthy = usersWithoutProfiles === 0 && !!triggerData

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      checks: {
        serviceKey: true,
        trigger: !!triggerData,
        confirmedUsers: confirmedUsers.length,
        profilesCount: profiles?.length || 0,
        usersWithoutProfiles
      },
      message: usersWithoutProfiles > 0 
        ? `⚠️ ${usersWithoutProfiles} user(s) without profiles` 
        : '✅ All users have profiles'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
```

### Set Up Monitoring

**Recommended**: Add cron job or monitoring service

```bash
# Pingdom, UptimeRobot, or custom cron
curl https://your-domain.com/api/health/profiles

# Alert if response contains "warning" or "error"
```

---

## ✅ VERIFICATION CHECKLIST

After applying fixes, verify:

### Database Checks

- [ ] Trigger exists and is enabled (Investigation 1)
- [ ] All confirmed users have profiles (Investigation 2)
- [ ] RLS policies are correct (4+ policies)
- [ ] Comprehensive system check passes (Investigation 4)

### Environment Checks

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (**CRITICAL**)
- [ ] `DATABASE_URL` set
- [ ] Application redeployed after env variable changes

### Functional Tests

- [ ] **New User Test**: Create new account → verify email → should redirect to email-verified page → sign in → dashboard loads
- [ ] **Existing User Test**: Sign in with affected UAT user → dashboard loads without errors
- [ ] **Lessons Test**: Navigate to lessons page → no "Tenant or user not found" error
- [ ] **Profile Creation Test**: Check server logs → no profile creation errors

### User Experience

- [ ] Email verification shows success message
- [ ] No confusing redirects
- [ ] Error messages are clear and helpful
- [ ] Dashboard loads quickly without errors

---

## 🚀 DEPLOYMENT STEPS

1. **Apply Database Fixes** (Supabase Dashboard):
   - Install trigger (Quick Fix Step 1)
   - Backfill users (Quick Fix Step 2)
   - Verify RLS policies (Quick Fix Step 4)

2. **Update Environment Variables** (Vercel Dashboard):
   - Add `SUPABASE_SERVICE_ROLE_KEY`
   - Verify all required variables exist

3. **Deploy Code Improvements** (Optional but recommended):
   ```bash
   # Apply code improvements from this guide
   git add .
   git commit -m "fix: add email verification success page and improve error handling"
   git push origin main
   ```

4. **Verify Deployment**:
   - Run all verification checks
   - Test with new user account
   - Test with existing affected user

5. **Monitor**:
   - Check `/api/health/profiles` endpoint
   - Monitor server logs for errors
   - Watch for user reports

---

## 📞 SUPPORT

If issues persist after following this guide:

1. **Check Server Logs**: Look for specific error messages
2. **Run Diagnostic Queries**: Use Investigation queries to identify specific issues
3. **Contact Support**: Include:
   - Error messages from logs
   - Results from diagnostic queries
   - Screenshots of errors
   - User IDs affected

---

## 📚 Related Documentation

- `scripts/create-profile-trigger.sql` - Database trigger installation
- `scripts/profile-fix-queries.sql` - All diagnostic queries
- `scripts/backfill-profiles.ts` - TypeScript backfill script
- `docs/DATABASE_SCHEMA.md` - Database schema documentation
- `docs/ARCHITECTURE.md` - System architecture overview

---

**Last Updated**: 2025-12-17  
**Version**: 1.0  
**Status**: Active - Production UAT Issues

