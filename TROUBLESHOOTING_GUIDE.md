# 🔧 Production Troubleshooting Guide

You've deployed the fix and run the database script, but still seeing errors. Let's diagnose the issue systematically.

---

## ⚠️ Most Common Issue: Browser Cache

**The #1 reason you're still seeing errors is that your browser is using the OLD JavaScript code.**

### Quick Fix - Force Refresh

1. **Chrome/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Firefox**: `Ctrl+Shift+Del` → Clear Everything → Reload
3. **Safari**: `Cmd+Option+E` → Reload

### Better Fix - Hard Clear

1. Open DevTools (`F12` or `Cmd+Option+I`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Close all tabs of your site and reopen

### Nuclear Option - Clear Everything

```
Chrome: Settings → Privacy → Clear browsing data →
  ✅ Cached images and files
  ✅ Cookies and other site data
  Time range: Last 24 hours
```

---

## 🔍 Step-by-Step Diagnosis

### STEP 1: Verify Deployment Completed

**Check GitHub Actions:**
https://github.com/kennethwzc/mandarin-srs/actions

Look for:

- ✅ Latest commit shows green checkmark
- Build completed recently (within last 10 minutes)
- All 4 jobs passed (TypeScript, Lint, Test, Build)

**Check Vercel/Netlify/Your Host:**

- Go to your hosting dashboard
- Verify latest deployment is "Ready" or "Published"
- Check deployment time matches your commit time

**If deployment is NOT complete:**

- Wait for it to finish (usually 3-5 minutes)
- Refresh your browser AFTER deployment completes

---

### STEP 2: Verify Database Trigger Installed

Run this in **Supabase Dashboard → SQL Editor**:

```sql
-- Quick check
SELECT COUNT(*) as trigger_installed
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND n.nspname = 'auth'
  AND t.tgname = 'on_auth_user_created'
  AND t.tgenabled = 'O';
```

**Expected Result:** `1`

**If you see `0`:**

- The trigger script didn't run correctly
- Go to Supabase Dashboard → SQL Editor
- Copy/paste the ENTIRE contents of `scripts/create-profile-trigger.sql`
- Click "Run" and verify "Success" message

---

### STEP 3: Verify Your Test User Has a Profile

Run this in **Supabase Dashboard → SQL Editor** (replace with your test email):

```sql
-- Replace 'your-test-email@example.com' with your actual test email
SELECT
  au.id as user_id,
  au.email,
  au.email_confirmed_at,
  au.created_at as user_created,
  p.id as profile_id,
  p.created_at as profile_created,
  CASE
    WHEN p.id IS NOT NULL THEN '✅ Profile exists'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email not verified'
    ELSE '❌ Profile missing - run backfill'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'your-test-email@example.com';
```

**If status is "❌ Profile missing":**

Run this backfill query:

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

---

### STEP 4: Check Production Environment Variables

**In Vercel/Netlify/Your Host Dashboard:**

Verify these variables are set:

```bash
# Public variables (visible in browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Server variables (CRITICAL!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...  ← MUST BE SET!
DATABASE_URL=postgresql://postgres:...
```

**⚠️ CRITICAL:** `SUPABASE_SERVICE_ROLE_KEY` is required for backup profile creation!

**Where to find Service Role Key:**

1. Supabase Dashboard → Settings → API
2. Look for "Project API keys"
3. Copy the `service_role` key (NOT the `anon` key)
4. Add to your hosting platform's environment variables
5. **MUST REDEPLOY after adding!**

---

### STEP 5: Test With Completely New Account

**Why?** Old accounts created before the fix might have issues.

1. Use a **different email** (not one you tested before)
2. Clear browser cache first
3. Sign up → Check email → Click verification link
4. You should see: **"✅ Email Verified!"** page for 3 seconds
5. Then redirect to login page
6. Sign in and check dashboard

**If you DON'T see the "Email Verified" page:**

- The new code is NOT deployed yet
- Wait for deployment to complete
- Clear browser cache and try again

---

## 🧪 Comprehensive Database Check

Run the comprehensive verification script we created:

```bash
# In Supabase Dashboard → SQL Editor
# Copy and run: scripts/verify-production-setup.sql
```

This will check:

- ✅ Trigger installation
- ✅ Function existence
- ✅ User/profile counts
- ✅ Missing profiles
- ✅ RLS policies
- ✅ Recent user activity

**Screenshot the results** and share if you need help interpreting them.

---

## 🐛 Check Browser Console for Errors

1. Open DevTools (`F12` or `Cmd+Option+I`)
2. Go to "Console" tab
3. Reload the page
4. Look for red error messages
5. **Common errors and fixes:**

### Error: "Failed to fetch" or "Network error"

- **Fix:** Check Supabase project is not paused
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

### Error: "JWTExpired" or "Invalid JWT"

- **Fix:** Sign out and sign in again
- Clear cookies: DevTools → Application → Clear site data

### Error: "Row level security" or "Permission denied"

- **Fix:** RLS policies not configured correctly
- Run the RLS policy creation from `scripts/create-profile-trigger.sql`

### Error: "User profile could not be created"

- **Fix:** `SUPABASE_SERVICE_ROLE_KEY` not set in production
- Add it to environment variables and redeploy

---

## 📊 Check Server Logs

**If you're using Vercel:**

1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Go to "Functions" tab
4. Look for API routes that failed
5. Check error messages

**If you're using Netlify:**

1. Go to Netlify Dashboard → Your Site
2. Click "Functions" in the sidebar
3. Check recent function logs

**What to look for:**

- "Profile not found" → User missing profile in database
- "Missing env.SUPABASE_SERVICE_ROLE_KEY" → Environment variable not set
- "JWTExpired" → Session expired, user needs to re-login

---

## ✅ Expected Behavior After Fix

### Email Verification Flow:

1. Click email verification link
2. See "✅ Email Verified!" page (3 seconds)
3. Auto-redirect to login page
4. Sign in with your credentials
5. Dashboard loads successfully

### Dashboard:

- Shows "0 lessons completed, 0 reviews today" (for new users)
- NO error messages
- Stats cards display correctly

### Lessons Page:

- Shows available lessons
- NO "Tenant or user not found" error

---

## 🆘 Still Not Working?

Run these diagnostic commands and share the output:

### 1. Database Status

```sql
-- In Supabase SQL Editor
SELECT
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  (SELECT COUNT(*) FROM public.profiles) as profiles,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_count;
```

### 2. Your Test User Status

```sql
-- Replace with your email
SELECT
  au.email,
  au.email_confirmed_at IS NOT NULL as email_verified,
  p.id IS NOT NULL as has_profile,
  au.created_at,
  p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'your-test-email@example.com';
```

### 3. Check Deployment Git Hash

Open your production site and check the browser console:

```javascript
// Run in browser console
console.log(document.documentElement.innerHTML.includes('email-verified'))
// Should return: true (if new code is deployed)
```

---

## 🔄 Nuclear Reset (Last Resort)

If nothing works:

1. **Clear ALL browser data**
   - Settings → Privacy → Clear ALL browsing data
   - Close and reopen browser

2. **Create brand new test account**
   - Use email you've NEVER used before
   - Use incognito/private window

3. **Verify deployment is latest**
   - Check GitHub commit hash
   - Check hosting platform deployment time
   - Wait 10 minutes after deployment completes

4. **Run database backfill again**

   ```sql
   -- Force create profiles for all users
   INSERT INTO public.profiles (id, email, username, created_at, updated_at)
   SELECT au.id, au.email, au.raw_user_meta_data->>'username', au.created_at, NOW()
   FROM auth.users au
   LEFT JOIN public.profiles p ON au.id = p.id
   WHERE p.id IS NULL AND au.email_confirmed_at IS NOT NULL
   ON CONFLICT (id) DO NOTHING;
   ```

5. **Check environment variables are saved**
   - Verify in hosting dashboard
   - Especially `SUPABASE_SERVICE_ROLE_KEY`
   - Redeploy after adding any missing vars

---

## 📝 Checklist Before Asking for Help

If you need to ask for help, please provide:

- [ ] Output of `scripts/verify-production-setup.sql`
- [ ] Screenshot of GitHub Actions (all green?)
- [ ] Screenshot of hosting deployment status
- [ ] Screenshot of browser console errors (if any)
- [ ] Confirmation you cleared browser cache
- [ ] Email address of test account you're using
- [ ] Output of the diagnostic SQL queries above
- [ ] Confirmation `SUPABASE_SERVICE_ROLE_KEY` is set in production

This will help diagnose the issue much faster! 🚀
