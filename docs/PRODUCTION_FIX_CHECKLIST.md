# 🔧 PRODUCTION FIX CHECKLIST

> **Quick-start guide for fixing production UAT issues**  
> **Est. Time**: 10-15 minutes  
> **Last Updated**: 2025-12-17

## 📊 Pre-Flight Check

Before starting, gather this information:

- [ ] Supabase Project ID: `____________________`
- [ ] Production URL: `____________________`
- [ ] Affected User Emails: `____________________`
- [ ] Number of Users Without Profiles: `____`

---

## ⚡ STEP 1: Install Database Trigger (5 min)

### Action

Install the database trigger that auto-creates profiles for new users.

### Steps

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to: **SQL Editor** (left sidebar)

2. **Run Trigger Installation SQL**
   - Open file: `scripts/create-profile-trigger.sql` in your code editor
   - Copy the ENTIRE file contents
   - Paste into Supabase SQL Editor
   - Click **Run** button

3. **Verify Installation**
   - Paste and run this query:

   ```sql
   SELECT
     t.tgname AS trigger_name,
     CASE
       WHEN t.tgenabled = 'O' THEN '✅ Enabled'
       ELSE '❌ Disabled'
     END as status
   FROM pg_trigger t
   JOIN pg_class c ON t.tgrelid = c.oid
   JOIN pg_namespace n ON c.relnamespace = n.oid
   WHERE c.relname = 'users'
     AND n.nspname = 'auth'
     AND t.tgname = 'on_auth_user_created';
   ```

   - **Expected**: 1 row with status "✅ Enabled"
   - **If no rows**: Trigger installation failed, re-run step 2

### Checkpoint

- [ ] Trigger exists and is enabled

---

## 💾 STEP 2: Backfill Affected Users (2 min)

### Action

Create profiles for all existing users who don't have one.

### Steps

1. **Check How Many Users Need Backfill**

   ```sql
   SELECT
     COUNT(*) FILTER (WHERE p.id IS NULL) as missing_profiles,
     COUNT(*) FILTER (WHERE p.id IS NOT NULL) as have_profiles
   FROM auth.users au
   LEFT JOIN public.profiles p ON au.id = p.id
   WHERE au.email_confirmed_at IS NOT NULL;
   ```

   - Note the `missing_profiles` count: `____`

2. **Run Backfill Script**

   ```sql
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

3. **Verify Backfill Success**
   - Re-run the query from step 1
   - **Expected**: `missing_profiles = 0`

### Checkpoint

- [ ] All confirmed users now have profiles
- [ ] `missing_profiles` count is 0

---

## 🔐 STEP 3: Verify RLS Policies (3 min)

### Action

Ensure Row Level Security policies allow profile creation.

### Steps

1. **Check Existing Policies**

   ```sql
   SELECT
     policyname,
     cmd
   FROM pg_policies
   WHERE tablename = 'profiles'
   ORDER BY policyname;
   ```

   - Count how many policies exist: `____`
   - **Expected**: At least 4 policies

2. **Install Missing Policies** (if less than 4)

   ```sql
   -- Enable RLS
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

   -- Policy 1: Users can view own profile
   DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
   CREATE POLICY "Users can view own profile"
     ON public.profiles FOR SELECT
     USING (auth.uid() = id);

   -- Policy 2: Users can update own profile
   DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
   CREATE POLICY "Users can update own profile"
     ON public.profiles FOR UPDATE
     USING (auth.uid() = id)
     WITH CHECK (auth.uid() = id);

   -- Policy 3: Service role can insert profiles
   DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
   CREATE POLICY "Service role can insert profiles"
     ON public.profiles FOR INSERT
     WITH CHECK (true);

   -- Policy 4: Users can create own profile
   DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
   CREATE POLICY "Users can create own profile"
     ON public.profiles FOR INSERT
     WITH CHECK (auth.uid() = id);
   ```

3. **Verify Policies**
   - Re-run query from step 1
   - **Expected**: 4 or more policies

### Checkpoint

- [ ] RLS is enabled on profiles table
- [ ] At least 4 policies exist

---

## 🔑 STEP 4: Configure Environment Variables (3 min)

### Action

Ensure all required environment variables are set in production.

### Steps

1. **Open Vercel Dashboard** (or your hosting provider)
   - Navigate to your project
   - Go to: **Settings** → **Environment Variables**

2. **Verify Required Variables Exist**
   - [ ] `NEXT_PUBLIC_SUPABASE_URL`
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - [ ] `NEXT_PUBLIC_APP_URL`
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRITICAL**
   - [ ] `DATABASE_URL`

3. **Add Missing Service Role Key** (if not present)
   - Go to Supabase Dashboard → Settings → API
   - Find section: **Project API keys**
   - Copy the `service_role` key (NOT the anon key!)
   - Add to Vercel:
     - Name: `SUPABASE_SERVICE_ROLE_KEY`
     - Value: `[paste service role key]`
     - Environment: Production
   - **⚠️ IMPORTANT**: Click **Redeploy** after adding!

### Checkpoint

- [ ] All 5 required environment variables are set
- [ ] Service role key is present
- [ ] Application redeployed (if env vars changed)

---

## 🧪 STEP 5: Functional Testing (5 min)

### Test 1: New User Registration

1. **Create Test Account**
   - Open production URL in incognito window
   - Click "Sign Up"
   - Use test email: `test+[timestamp]@example.com`
   - Create account

2. **Verify Email**
   - Check email inbox
   - Click verification link
   - **Expected**: Redirect to "Email Verified Successfully" page

3. **Sign In**
   - Click "Sign In Now" or wait for auto-redirect
   - Sign in with test credentials
   - **Expected**: Dashboard loads without errors

4. **Check Profile Created**
   - In Supabase SQL Editor, run:

   ```sql
   SELECT * FROM public.profiles
   WHERE email = 'test+[your-timestamp]@example.com';
   ```

   - **Expected**: Profile exists

### Test 2: Existing Affected User

1. **Sign In with UAT User**
   - Use one of the previously affected user accounts
   - **Expected**: Dashboard loads successfully

2. **Navigate to Lessons**
   - Click "Lessons" in navigation
   - **Expected**: Lessons page loads without "Tenant or user not found" error

3. **Check Dashboard Stats**
   - View dashboard
   - **Expected**: Stats display correctly, no errors

### Test 3: Health Check Endpoint

1. **Call Health Endpoint**

   ```bash
   curl https://[your-domain.com]/api/health/profiles
   ```

2. **Verify Response**
   ```json
   {
     "status": "healthy",
     "checks": {
       "serviceKey": true,
       "confirmedUsers": 5,
       "profilesCount": 5,
       "usersWithoutProfiles": 0
     },
     "message": "✅ All confirmed users have profiles"
   }
   ```

### Checkpoint

- [ ] New user can register, verify email, and sign in
- [ ] Email verification shows success page
- [ ] Dashboard loads without errors
- [ ] Lessons page works for all users
- [ ] Health check returns "healthy"

---

## 📊 FINAL VERIFICATION

### Comprehensive System Check

Run this all-in-one query in Supabase SQL Editor:

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

### Expected Output

| confirmed_users | total_profiles | trigger_installed | rls_policies | overall_status       |
| --------------- | -------------- | ----------------- | ------------ | -------------------- |
| 5               | 5              | 1                 | 4            | ✅ ALL CHECKS PASSED |

### Final Checklist

- [ ] `confirmed_users` = `total_profiles`
- [ ] `trigger_installed` = 1
- [ ] `rls_policies` >= 4
- [ ] `overall_status` = "✅ ALL CHECKS PASSED"

---

## 🎉 SUCCESS CRITERIA

Your production environment is fully fixed when:

✅ Database trigger is installed and enabled  
✅ All confirmed users have profiles (0 missing)  
✅ RLS policies are correctly configured (4+ policies)  
✅ Environment variables are set (including service role key)  
✅ New users can register and verify email successfully  
✅ Email verification shows success page with clear feedback  
✅ Existing users can sign in and access dashboard  
✅ Lessons page loads without "Tenant or user not found" error  
✅ Health check endpoint returns "healthy" status  
✅ Comprehensive system check passes all criteria

---

## 🚨 Troubleshooting

### Issue: Trigger Not Installing

**Symptoms**: Query returns no rows when checking trigger status

**Solutions**:

1. Ensure you copied the ENTIRE SQL file (including comments)
2. Check for syntax errors in SQL editor
3. Verify you have admin permissions in Supabase
4. Try running sections separately (DROP, CREATE FUNCTION, CREATE TRIGGER)

### Issue: Backfill Not Working

**Symptoms**: `missing_profiles` count not decreasing

**Solutions**:

1. Check if RLS policies are blocking INSERT
2. Verify users have `email_confirmed_at` set
3. Check for database errors in Supabase logs
4. Try creating one profile manually to test INSERT permission

### Issue: Service Role Key Not Working

**Symptoms**: "Service role key not configured" error

**Solutions**:

1. Verify you copied the `service_role` key (not `anon` key)
2. Ensure key has no extra spaces or newlines
3. Check environment variable name is exactly `SUPABASE_SERVICE_ROLE_KEY`
4. **CRITICAL**: Redeploy application after adding env var
5. Clear cache and force redeploy if needed

### Issue: Users Still Getting Errors

**Symptoms**: Dashboard shows errors even after fixes

**Solutions**:

1. Check server logs for specific error messages
2. Verify affected user has profile in database
3. Clear browser cache and cookies
4. Try signing out and back in
5. Check if there are pending database migrations

---

## 📞 Need Help?

If you're still experiencing issues after following this checklist:

1. **Collect Diagnostic Information**
   - Screenshot of comprehensive system check results
   - Server logs from last 15 minutes
   - Specific error messages from browser console
   - User IDs or emails of affected users

2. **Check Related Documentation**
   - `docs/PRODUCTION_UAT_FIX_GUIDE.md` - Detailed investigation guide
   - `scripts/profile-fix-queries.sql` - All diagnostic queries
   - `scripts/create-profile-trigger.sql` - Trigger installation

3. **Contact Support**
   - Include all diagnostic information
   - Specify which steps you've completed
   - Provide comprehensive system check results

---

**Estimated Total Time**: 10-15 minutes  
**Difficulty**: Intermediate  
**Prerequisites**: Admin access to Supabase and hosting platform

**Last Updated**: 2025-12-17  
**Version**: 1.0
