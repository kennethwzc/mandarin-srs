# CRITICAL BUG: User Profile Not Created After Registration

## Bug Summary
After creating a new account, confirming email, and logging in, users see "Failed to load dashboard data" and "Tenant or user not found" errors. The root cause is that **user profiles are never created in the application database** during the signup flow.

## Environment
- **Deployment**: Vercel Production
- **Database**: PostgreSQL (Neon) via Supabase
- **Auth**: Supabase Auth

## Steps to Reproduce
1. Go to `/signup` and create account with email/password
2. Check email and click confirmation link
3. Redirected to `/api/auth/callback` (email confirmation handler)
4. Log in with the same credentials
5. Navigate to `/dashboard` → See "Failed to load dashboard data"
6. Navigate to `/lessons` → See "Error Loading Lessons - Tenant or user not found"

## Expected Behavior
1. User creates account successfully
2. User confirms email via link
3. **Profile record is created in `profiles` table**
4. User logs in
5. Dashboard and lessons load properly with user data

## Actual Behavior
- Auth user is created in Supabase Auth (`auth.users`)
- Email confirmation works
- **Profile is NEVER created in `profiles` table**
- Login succeeds (auth works)
- Dashboard/lessons fail because profile doesn't exist

---

## Root Cause Analysis

### The Problem
The signup flow has **3 missing pieces**:

1. **No profile creation after signup** — `lib/supabase/auth.ts:26-50`
   - `signUp()` only creates auth user, not application profile
   - There's a `createUserProfile()` function in `lib/db/queries.ts:93-104` but it's **never called**

2. **No profile creation in callback** — `app/api/auth/callback/route.ts:29-42`
   - Callback only exchanges code for session
   - Doesn't check if profile exists or create one

3. **No duplicate email validation** — `app/(auth)/signup/page.tsx:30-68`
   - No check if email already exists before signup
   - Supabase Auth might allow duplicate signups

### Why Dashboard/Lessons Fail

**Dashboard** (`app/api/dashboard/stats/route.ts:48-51`):
```typescript
const [overallStats, dailyStats, lessonProgress] = await Promise.all([
  getDashboardStats(user.id),  // ← Calls getUserProfile(user.id)
  getDailyStatsRange(user.id, startDate, endDate),
  getUserLessonProgress(user.id),
])
```

**getDashboardStats** (`lib/db/queries.ts:135`):
```typescript
const profile = await getUserProfile(userId)  // ← Returns null!
```

When `profile` is null, all streak/stats data fails.

**Lessons** (`lib/db/queries.ts:422`):
```typescript
export async function getUserLessonProgress(userId: string) {
  const lessons = await getAllLessons()
  // Queries user_items table which has foreign key to profiles
  // If profile doesn't exist, queries fail
}
```

---

## SOLUTION: Fix Registration Flow

### Option 1: Create Profile in Callback (RECOMMENDED)

**File**: `app/api/auth/callback/route.ts`

**Current code** (lines 29-42):
```typescript
if (code) {
  const supabase = await createClient()

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      // ... error handling
    }

    // Success - redirect to dashboard
    return NextResponse.redirect(new URL(next, request.url))
  }
}
```

**Fix needed**:
```typescript
if (code) {
  const supabase = await createClient()

  try {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'invalid_code')
      return NextResponse.redirect(errorUrl)
    }

    // ✅ NEW: Check if profile exists, create if not
    if (data.user) {
      const { getUserProfile, createUserProfile } = await import('@/lib/db/queries')

      const existingProfile = await getUserProfile(data.user.id)

      if (!existingProfile) {
        console.log('Profile not found for user, creating...', data.user.id)

        try {
          await createUserProfile(
            data.user.id,
            data.user.email || '',
            data.user.user_metadata?.username
          )
          console.log('Profile created successfully')
        } catch (profileError) {
          console.error('Failed to create profile:', profileError)
          // Continue anyway - profile might exist due to race condition
        }
      }
    }

    // Success - redirect to dashboard
    return NextResponse.redirect(new URL(next, request.url))
  } catch (err) {
    console.error('Unexpected error in callback:', err)
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'callback_error')
    return NextResponse.redirect(errorUrl)
  }
}
```

**Why this approach?**
- Centralized: All signups (email, OAuth, etc.) go through callback
- Idempotent: Safe to call multiple times
- No database triggers needed

---

### Option 2: Create Database Trigger (ALTERNATIVE)

If you have Supabase access, create this SQL trigger:

```sql
-- Create function to handle new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Run in Supabase Dashboard:**
1. Go to SQL Editor
2. Paste and run the above SQL
3. Trigger will auto-create profiles for all new signups

---

## SOLUTION: Add Duplicate Email Validation

**File**: `app/(auth)/signup/page.tsx`

**Current code** (lines 47-55):
```typescript
try {
  const { error } = await signUp(email, password)

  if (error) {
    toast.error('Signup failed', {
      description: error,
    })
    return
  }
```

**Fix needed**:
```typescript
try {
  const { error } = await signUp(email, password)

  if (error) {
    // ✅ NEW: Check for duplicate email error
    if (error.includes('already registered') || error.includes('already exists')) {
      toast.error('Email already registered', {
        description: 'This email is already in use. Please log in or use a different email.',
      })
    } else {
      toast.error('Signup failed', {
        description: error,
      })
    }
    return
  }
```

**Better approach**: Add validation BEFORE calling `signUp()`:

```typescript
setIsLoading(true)

try {
  // ✅ NEW: Check if email exists first
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  const { data: existingUsers } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .limit(1)

  if (existingUsers && existingUsers.length > 0) {
    toast.error('Email already registered', {
      description: 'This email is already in use. Please log in or reset your password.',
    })
    return
  }

  const { error } = await signUp(email, password)
  // ... rest of code
```

---

## SOLUTION: Add Graceful Error Handling

### Fix Dashboard API

**File**: `app/api/dashboard/stats/route.ts`

**Add profile validation** (after line 35):
```typescript
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// ✅ NEW: Check if profile exists
const { getUserProfile, createUserProfile } = await import('@/lib/db/queries')
const profile = await getUserProfile(user.id)

if (!profile) {
  console.error('Profile not found for user:', user.id)

  // Try to create profile (safety net)
  try {
    await createUserProfile(user.id, user.email || '')
    console.log('Created missing profile for user:', user.id)
  } catch (createError) {
    console.error('Failed to create profile:', createError)
    return NextResponse.json(
      {
        error: 'User profile not found. Please contact support.',
        errorCode: 'PROFILE_NOT_FOUND'
      },
      { status: 404 }
    )
  }
}
```

### Fix Dashboard Page

**File**: `app/(app)/dashboard/page.tsx`

Find where data is loaded and add error handling:

```typescript
// Show helpful error message
if (error?.errorCode === 'PROFILE_NOT_FOUND') {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-xl font-bold mb-4">Account Setup Incomplete</h2>
      <p className="text-muted-foreground mb-4">
        Your account was created but needs to be set up. Please contact support.
      </p>
      <Button onClick={() => window.location.href = '/support'}>
        Contact Support
      </Button>
    </div>
  )
}
```

---

## Testing Checklist

After implementing fixes, test:

### 1. New User Signup Flow
- [ ] Create account with new email
- [ ] Receive confirmation email
- [ ] Click confirmation link
- [ ] **Verify profile is created** (check database or Supabase dashboard)
- [ ] Log in
- [ ] Dashboard loads without errors
- [ ] Lessons page loads without errors

### 2. Duplicate Email Handling
- [ ] Try to sign up with existing email
- [ ] See clear error message: "Email already registered"
- [ ] Error suggests logging in instead

### 3. Edge Cases
- [ ] User signs up but doesn't confirm email → profile not created yet (expected)
- [ ] User confirms email → profile created automatically
- [ ] User signs up twice with same email → second signup rejected
- [ ] Existing users (created before fix) can still log in

### 4. Database Verification

Check Supabase Dashboard → Database → Table Editor:

```sql
-- Check if profiles table has matching auth users
SELECT
  au.id as auth_user_id,
  au.email as auth_email,
  p.id as profile_id,
  p.email as profile_email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

**Expected result**: No rows (all auth users have profiles)

---

## Files to Modify

1. **`app/api/auth/callback/route.ts`** (PRIMARY FIX)
   - Add profile creation after email confirmation
   - Lines 29-45

2. **`app/(auth)/signup/page.tsx`** (DUPLICATE EMAIL CHECK)
   - Add email validation before signup
   - Lines 30-68

3. **`app/api/dashboard/stats/route.ts`** (ERROR HANDLING)
   - Add profile existence check
   - Add safety net profile creation
   - Lines 25-36

4. **`app/(app)/dashboard/page.tsx`** (UI ERROR HANDLING)
   - Add user-friendly error message
   - Search for where data is loaded/displayed

5. **OPTIONAL: Create database trigger** (Supabase SQL)
   - Run SQL in Supabase Dashboard

---

## Migration Plan for Existing Users

If you already have users in production without profiles:

### 1. Identify Affected Users

```sql
-- Find auth users without profiles
SELECT
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL;
```

### 2. Create Missing Profiles

```sql
-- Create profiles for all confirmed auth users
INSERT INTO public.profiles (id, email, username)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'username'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;
```

---

## Summary

**Root Cause**: Profile creation is missing from signup flow

**Primary Fix**: Add profile creation in `/app/api/auth/callback/route.ts`

**Secondary Fixes**:
- Duplicate email validation
- Graceful error handling
- Safety net profile creation

**Best Approach**: Implement callback fix + database trigger for redundancy

**Testing**: Verify new signups create profiles and dashboard loads properly
