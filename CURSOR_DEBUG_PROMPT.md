# 🐛 Critical UAT Bug: Email Verification & Profile Creation Failure

## Problem Statement

After a new user creates an account and verifies their email:
1. ❌ User is redirected to sign-in page with NO confirmation that email was verified
2. ❌ After signing in, dashboard shows "Internal Server Error"
3. ❌ Lesson page shows "Tenant or user not found" error

## Root Cause Hypothesis

The email verification flow is NOT properly creating user profiles, causing RLS (Row Level Security) policies to block database access. This results in cascading failures across the application.

---

## Investigation & Fix Strategy

### Phase 1: Verify Profile Creation Flow (CRITICAL)

**File:** `/app/api/auth/callback/route.ts` (Lines 65-101)

**What to check:**
```typescript
// THIS SECTION SHOULD CREATE PROFILES BUT MAY BE FAILING SILENTLY
if (data.user) {
  const { getUserProfile, createUserProfile } = await import('@/lib/db/queries')

  try {
    const existingProfile = await getUserProfile(data.user.id)

    if (!existingProfile) {
      console.log('Profile not found for user, creating...', data.user.id)
      await createUserProfile(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata?.username
      )
      console.log('Profile created successfully for user:', data.user.id)
    }
  } catch (profileError) {
    console.error('❌ CRITICAL: Failed to create profile:', {
      userId: data.user.id,
      email: data.user.email,
      error: profileError instanceof Error ? profileError.message : profileError,
    })

    // Redirect to error page
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'profile_creation_failed')
    return NextResponse.redirect(errorUrl)
  }
}
```

**Action Items:**
1. Check production server logs for `"Profile not found for user, creating..."` message
2. Check for `"❌ CRITICAL: Failed to create profile:"` errors
3. Verify if this code block is even executing (add more logging if needed)

**Debugging additions:**
```typescript
// ADD EXTENSIVE LOGGING BEFORE PROFILE CREATION
console.log('=== AUTH CALLBACK DEBUG ===', {
  userId: data.user.id,
  email: data.user.email,
  emailConfirmed: data.user.email_confirmed_at,
  userMetadata: data.user.user_metadata,
  timestamp: new Date().toISOString()
})

// AFTER PROFILE CREATION ATTEMPT
console.log('=== PROFILE CREATION RESULT ===', {
  userId: data.user.id,
  profileExists: !!existingProfile,
  attemptedCreation: !existingProfile,
  timestamp: new Date().toISOString()
})
```

---

### Phase 2: Check Database Connection & RLS Policies

**Files to verify:**
- `/lib/db/queries.ts` (Lines 93-104) - `createUserProfile()` function
- `/scripts/profile-fix-queries.sql` (Lines 75-105) - RLS policies

**Action Items:**

1. **Test database connectivity in auth callback:**
   ```typescript
   // Add this test query before profile creation
   console.log('Testing DB connection...')
   const testQuery = await db.select().from(schema.profiles).limit(1)
   console.log('DB connection successful, sample profiles found:', testQuery.length)
   ```

2. **Verify RLS policies are active:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename = 'profiles';
   ```

3. **Check if profiles table exists and has correct structure:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
   ORDER BY ordinal_position;
   ```

4. **Verify database trigger is installed:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT trigger_name, event_manipulation, event_object_table, action_statement
   FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```

---

### Phase 3: Fix Immediate User Experience Issues

**Problem 1: No feedback after email verification**

**File:** `/app/api/auth/callback/route.ts` (Lines 104-106)

**Current code:**
```typescript
const successUrl = new URL(next, request.url)
successUrl.searchParams.set('verified', 'true')
return NextResponse.redirect(successUrl)
```

**Issue:** If session isn't properly set, user gets redirected to login instead of dashboard

**Fix:** Add session validation before redirect
```typescript
// VERIFY SESSION WAS ACTUALLY SET
const { data: sessionCheck } = await supabase.auth.getSession()

if (!sessionCheck.session) {
  console.error('❌ Session not set after code exchange!')
  const errorUrl = new URL('/login', request.url)
  errorUrl.searchParams.set('error', 'session_failed')
  errorUrl.searchParams.set('message', 'Email verified but session creation failed. Please sign in.')
  return NextResponse.redirect(errorUrl)
}

// Add verified=true parameter for toast notification
const successUrl = new URL(next, request.url)
successUrl.searchParams.set('verified', 'true')

console.log('✅ Redirecting to:', successUrl.toString())
return NextResponse.redirect(successUrl)
```

**Problem 2: Login page doesn't show verification success**

**File:** `/app/(auth)/login/page.tsx`

**Add error handling for verification flow:**
```typescript
// Add to LoginPage component after existing useEffect
useEffect(() => {
  const verified = searchParams.get('verified')
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  if (verified === 'true') {
    toast.success('Email verified successfully!', {
      description: 'You can now sign in to your account.',
      duration: 5000,
    })
  }

  if (error === 'session_failed' && message) {
    toast.info('Verification Complete', {
      description: message,
      duration: 7000,
    })
  }

  if (error === 'profile_creation_failed') {
    toast.error('Account Setup Error', {
      description: 'Your email was verified but profile creation failed. Please contact support.',
      duration: 10000,
    })
  }
}, [searchParams])
```

---

### Phase 4: Fix Database Access Errors

**Problem 3: "Tenant or user not found" in Dashboard**

**File:** `/app/api/dashboard/stats/route.ts` (Lines 37-80)

**Current implementation has fallback but may not work in production**

**Enhanced fix:**
```typescript
// BEFORE fetching dashboard stats
console.log('=== DASHBOARD STATS REQUEST ===', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString()
})

// Check if profile exists, create if not (safety net)
const { getUserProfile, createUserProfile } = await import('@/lib/db/queries')

let profile = await getUserProfile(user.id)
console.log('Profile check result:', { exists: !!profile, userId: user.id })

if (!profile) {
  console.error('⚠️  Profile not found for user:', {
    userId: user.id,
    email: user.email,
  })

  try {
    console.log('Attempting to create missing profile...')
    profile = await createUserProfile(user.id, user.email || '')
    console.log('✅ Successfully created profile for user:', user.id)

    // VERIFY CREATION
    const verifyProfile = await getUserProfile(user.id)
    if (!verifyProfile) {
      throw new Error('Profile creation succeeded but verification failed')
    }
  } catch (createError) {
    console.error('❌ CRITICAL: Profile creation failed in dashboard:', {
      userId: user.id,
      error: createError instanceof Error ? createError.message : createError,
      stack: createError instanceof Error ? createError.stack : undefined
    })

    return NextResponse.json(
      {
        error: 'User profile could not be created. Please contact support.',
        errorCode: 'PROFILE_NOT_FOUND',
        supportDetails: {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 404 }
    )
  }
}
```

**Problem 4: "Tenant or user not found" in Lessons**

**File:** `/app/(app)/lessons/page.tsx` (Line 63)

**Current code calls `getAllLessons()` without profile check**

**Fix:** Add profile validation before fetching lessons
```typescript
// ADD THIS BEFORE getAllLessons() call
import { getUserProfile, createUserProfile } from '@/lib/db/queries'

// Verify profile exists
let profile = await getUserProfile(user.id)

if (!profile) {
  console.error('No profile found in lessons page, creating...', user.id)
  try {
    profile = await createUserProfile(user.id, user.email || '')
    console.log('Profile created successfully in lessons page')
  } catch (error) {
    console.error('Failed to create profile in lessons page:', error)
    throw new Error('User profile not found. Please refresh the page or contact support.')
  }
}

// NOW safe to fetch lessons
const lessons = await getAllLessons()
```

---

### Phase 5: Install Database Trigger (Defensive Layer)

**File:** `/scripts/create-profile-trigger.sql`

**This creates automatic profile creation at the database level**

**Action:** Run this SQL in Supabase SQL Editor:

```sql
-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to auto-create profiles
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

  RAISE LOG 'Profile created/updated for user: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create trigger for email confirmation
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run if email_confirmed_at changed from NULL to a timestamp
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
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

    RAISE LOG 'Profile created/updated on email confirmation for user: %', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in email confirmation trigger for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_user_email_confirmed();
```

**Why this helps:**
- Catches users who slip through application-level profile creation
- Works even if auth callback fails or times out
- Creates profiles at the database layer (most reliable)

---

### Phase 6: Backfill Existing Users

**File:** `/scripts/backfill-profiles.ts`

**For any existing auth users without profiles:**

```bash
# Run this script to create profiles for all auth users
npx tsx scripts/backfill-profiles.ts
```

**Or run this SQL directly in Supabase:**

```sql
-- Find users without profiles
SELECT au.id, au.email, au.created_at, au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
AND au.email_confirmed_at IS NOT NULL;

-- Create missing profiles (run after verifying above)
INSERT INTO public.profiles (id, email, username, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'username',
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;
```

---

## Testing Checklist

After implementing fixes, test these scenarios:

### ✅ New User Signup Flow
1. Create new account with email + password
2. Check email for verification link
3. Click verification link
4. **Expected:** Redirected to dashboard with success toast
5. **Expected:** Dashboard loads without errors
6. **Expected:** Lessons page loads without errors
7. **Expected:** Profile exists in database

### ✅ Database Verification
```sql
-- After new signup, verify profile was created
SELECT * FROM public.profiles WHERE email = 'test@example.com';

-- Should return 1 row with all fields populated
```

### ✅ Error Handling
1. Manually delete a user's profile: `DELETE FROM profiles WHERE id = '...'`
2. Have user reload dashboard
3. **Expected:** Dashboard API creates missing profile automatically
4. **Expected:** No "Tenant or user not found" errors

### ✅ Server Logs
Check for these log messages:
- ✅ `"Profile created successfully for user: ..."`
- ✅ `"✅ Successfully created profile for user: ..."`
- ❌ `"❌ CRITICAL: Failed to create profile:"` (should NOT appear)
- ✅ `"Profile created/updated for user: ..."` (from database trigger)

---

## Priority Order

1. **HIGHEST PRIORITY:** Install database triggers (Phase 5) - This fixes the root cause
2. **HIGH PRIORITY:** Backfill existing users (Phase 6) - Fixes current broken accounts
3. **HIGH PRIORITY:** Add logging to auth callback (Phase 1) - Helps debug in production
4. **MEDIUM PRIORITY:** Fix user feedback (Phase 3) - Improves UX
5. **LOW PRIORITY:** Add defensive checks to pages (Phase 4) - Belt and suspenders

---

## Files That Need Changes

### Must Edit:
1. `/app/api/auth/callback/route.ts` - Add extensive logging
2. `/app/(auth)/login/page.tsx` - Add verification success feedback
3. Run SQL in Supabase - Install triggers and backfill profiles

### Should Edit:
4. `/app/api/dashboard/stats/route.ts` - Enhanced logging for debugging
5. `/app/(app)/lessons/page.tsx` - Add profile check before fetching lessons

### Optional:
6. `/middleware.ts` - Could add profile existence check (but triggers should prevent this)

---

## Environment Checks

Before starting, verify:
```bash
# Check you're on the correct branch
git status

# Check environment variables
cat .env.local | grep SUPABASE

# Verify Supabase connection
npx supabase status

# Check if migrations are applied
npx drizzle-kit studio  # View current database state
```

---

## Success Criteria

✅ New users see "Email verified successfully!" toast after verification
✅ Dashboard loads immediately without errors
✅ Lessons page loads without "Tenant or user not found"
✅ All auth users have corresponding profiles in database
✅ Database triggers auto-create profiles for any new signups
✅ Server logs show successful profile creation
✅ No RLS errors in production logs

---

## Rollback Plan

If changes break something:
```bash
# Revert code changes
git reset --hard HEAD

# Remove database triggers
# Run in Supabase SQL Editor:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_email_confirmed();
```

---

## Additional Context

### Related Files to Review:
- `/COMPLETE_FIX_SUMMARY.md` - Previous fix documentation
- `/BEFORE_AFTER_COMPARISON.md` - Shows error scenarios
- `/PROFILE_FIX_README.md` - Historical context
- `/lib/db/schema.ts` (Lines 62-93) - Profile table schema
- `/lib/db/queries.ts` (Lines 75-104) - Profile queries

### Key Insights:
1. The app has THREE layers of profile creation (callback, API fallback, trigger)
2. All three can fail if database connectivity issues exist
3. RLS policies block ALL queries if profile doesn't exist
4. Middleware validates auth but NOT profile existence
5. Error messages come from Supabase RLS, not application code

### Questions to Answer:
- Are database triggers actually installed in production?
- Is the auth callback route executing at all?
- Are there any network/timeout issues between Vercel and Supabase?
- Is RLS enabled on the profiles table in production?
- Are there any migration differences between dev and prod?
