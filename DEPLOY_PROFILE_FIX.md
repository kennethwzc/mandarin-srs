# 🚀 Quick Deploy Guide - Profile Fix

## Prerequisites

- [x] All code changes committed
- [ ] Supabase dashboard access
- [ ] Vercel deployment access

---

## Step 1: Deploy Code (2 minutes)

```bash
# Review changes
git status

# Commit
git add .
git commit -m "fix: auto-create user profiles during signup

- Add profile creation in auth callback route
- Add duplicate email validation in signup page
- Add profile existence check in dashboard API
- Add user-friendly error handling in dashboard page
- Add database trigger for redundancy"

# Push to production
git push origin main
```

**Monitor deployment**: https://vercel.com/[your-project]

---

## Step 2: Install Database Trigger (3 minutes)

1. Open **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy **entire contents** of `scripts/create-profile-trigger.sql`
4. Paste and click **Run**
5. Look for success message

**Verify trigger installed**:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Should return 1 row.

---

## Step 3: Check Existing Users (2 minutes)

```sql
-- Find users without profiles
SELECT
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL;
```

**If results = 0**: Skip to Step 4  
**If results > 0**: Continue with backfill

---

## Step 3a: Backfill Profiles (ONLY IF NEEDED)

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

**Verify backfill**:

```sql
-- Should return 0
SELECT COUNT(*) FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL AND au.email_confirmed_at IS NOT NULL;
```

---

## Step 4: Test New Signup (5 minutes)

### 4.1 Create Test Account

1. Go to `https://[your-domain]/signup`
2. Sign up with: `test-[timestamp]@example.com`
3. Check email and click confirmation link
4. Should redirect to dashboard

### 4.2 Verify Profile Created

```sql
SELECT
  au.id,
  au.email,
  au.email_confirmed_at,
  p.id as profile_id,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'test-[timestamp]@example.com';
```

**Expected**: Profile exists with matching ID

### 4.3 Test Dashboard

1. Login with test account
2. Dashboard should load **without errors**
3. Check `/lessons` page - should load successfully
4. Check `/progress` page - should load successfully

---

## Step 5: Monitor Logs (10 minutes)

### Vercel Logs

Watch for:

- ✅ "Profile created successfully for user: [id]"
- ⚠️ "Profile not found for user, creating..."
- ❌ Any "Failed to create profile" errors

### Database Logs (optional)

```sql
-- Check recent profile creations
SELECT
  id,
  email,
  created_at,
  updated_at
FROM public.profiles
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Code deployed to Vercel (check deployment status)
- [ ] Database trigger installed (query `pg_trigger`)
- [ ] Existing users backfilled (0 missing profiles)
- [ ] Test signup completes successfully
- [ ] Test user profile created in database
- [ ] Dashboard loads for new user
- [ ] Lessons page loads for new user
- [ ] No errors in Vercel logs
- [ ] No PROFILE_NOT_FOUND errors

---

## 🆘 Rollback (If Needed)

```bash
# Rollback code
git revert HEAD
git push origin main
```

```sql
-- Remove database trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

---

## 📊 Post-Deployment Metrics

Monitor for 24 hours:

| Metric                   | Target                      |
| ------------------------ | --------------------------- |
| New user signups         | All complete successfully   |
| Dashboard load errors    | 0                           |
| PROFILE_NOT_FOUND errors | 0                           |
| Support tickets          | No "can't access dashboard" |

---

## 🎯 Expected Outcomes

1. **All new users** get profiles automatically
2. **Zero dashboard errors** for new users
3. **Zero PROFILE_NOT_FOUND** errors in logs
4. **Support tickets** about access issues drop to zero

---

## 📝 Notes

- Profile creation adds ~50-100ms to signup flow (negligible)
- Database trigger provides redundancy (recommended)
- Existing users unaffected by changes
- All changes are backward compatible

---

## 📞 Questions?

- Review: `docs/USER_PROFILE_FIX_MIGRATION.md`
- Summary: `USER_PROFILE_FIX_COMPLETE.md`
- Support: [Your contact]

---

**Estimated Total Time**: 15-20 minutes  
**Risk Level**: Low (multiple safety nets)  
**Rollback Time**: < 2 minutes

**Status**: Ready to Deploy ✅
