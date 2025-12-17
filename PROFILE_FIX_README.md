# Profile Creation Fix - Documentation Guide

## 🎯 Which Document Should I Use?

Choose the right guide based on your situation:

---

### ⚡ **EMERGENCY FIX** (Start Here!)

**You need**: Quick fix ASAP, users are waiting

**Use**: `PROFILE_FIX_QUICK_START.md`

**Time**: ~7 minutes  
**Format**: 5-step checklist with copy/paste SQL

---

### 📚 **COMPREHENSIVE GUIDE**

**You need**: Detailed explanations, troubleshooting, understanding the system

**Use**: `PROFILE_CREATION_FIX_GUIDE.md`

**Time**: ~30 minutes (includes investigation)  
**Format**: Complete guide with investigation, fixes, testing, and troubleshooting

---

### 💻 **SQL REFERENCE**

**You need**: All SQL queries in one place for copy/paste

**Use**: `scripts/profile-fix-queries.sql`

**Time**: Variable  
**Format**: Organized SQL queries by section (investigation, fixes, verification)

---

### 📊 **IMPLEMENTATION STATUS**

**You need**: See what's been done and what's left to do

**Use**: `PROFILE_FIX_IMPLEMENTATION_SUMMARY.md`

**Time**: 5 minutes to read  
**Format**: Summary of code changes, pending tasks, checklist

---

### 🔧 **BACKFILL SCRIPT**

**You need**: Programmatic way to fix existing users

**Use**: Run `tsx scripts/backfill-profiles.ts`

**Prerequisites**:

- `NEXT_PUBLIC_SUPABASE_URL` in .env
- `SUPABASE_SERVICE_ROLE_KEY` in .env
- `tsx` installed (`pnpm add -D tsx`)

---

## 🚀 Recommended Flow

### First Time Setup

```
1. Read: PROFILE_FIX_QUICK_START.md (understand what to do)
   ↓
2. Run: Scripts and SQL from quick start guide
   ↓
3. Verify: Run verification queries
   ↓
4. Test: Test with existing and new users
   ↓
5. Monitor: Watch server logs for 24-48 hours
```

### If Issues Persist

```
1. Check: PROFILE_CREATION_FIX_GUIDE.md → Troubleshooting section
   ↓
2. Run: Diagnostic queries from scripts/profile-fix-queries.sql
   ↓
3. Review: Server logs for CRITICAL errors
   ↓
4. Try: Manual profile creation for affected users
```

---

## 📁 All Files Created

### Documentation Files

- ✅ `PROFILE_FIX_README.md` ← You are here
- ✅ `PROFILE_FIX_QUICK_START.md` ← Start here for quick fix
- ✅ `PROFILE_CREATION_FIX_GUIDE.md` ← Comprehensive guide
- ✅ `PROFILE_FIX_IMPLEMENTATION_SUMMARY.md` ← What's done/pending
- ✅ `scripts/profile-fix-queries.sql` ← All SQL queries

### Code Files

- ✅ `scripts/backfill-profiles.ts` ← Backfill utility script (NEW)
- ✅ `app/api/auth/callback/route.ts` ← Enhanced error handling (MODIFIED)
- ✅ `app/api/dashboard/stats/route.ts` ← Enhanced error handling (MODIFIED)
- ✅ `scripts/create-profile-trigger.sql` ← Database trigger (EXISTING - needs to be run)

---

## ⚡ Quick Command Reference

### Run Backfill Script

```bash
tsx scripts/backfill-profiles.ts
```

### Install Dependencies (if needed)

```bash
pnpm add -D tsx
```

### Check Logs

```bash
# Watch Next.js server logs
pnpm dev

# Look for:
# ✅ Successfully created profile for user
# ❌ CRITICAL: Failed to create profile
```

---

## 🎯 Quick Verification

After implementing fixes, run this ONE query to verify everything:

```sql
-- Paste in Supabase Dashboard > SQL Editor
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

**Expected Result**: `overall_status = '✅ ALL CHECKS PASSED'`

---

## 🆘 Emergency Contacts

### If You See These Errors

**Error**: "Tenant or user not found"  
**Fix**: Follow `PROFILE_FIX_QUICK_START.md` immediately

**Error**: "Profile creation failed" in logs  
**Fix**: Check `PROFILE_CREATION_FIX_GUIDE.md` → Troubleshooting section

**Error**: Verification shows "ISSUES DETECTED"  
**Fix**: Check individual counts in verification query, re-run failed steps

---

## ✅ Success Indicators

You'll know the fix is working when:

1. ✅ New users can sign up and access dashboard immediately
2. ✅ Existing users can log in and access dashboard
3. ✅ No "Tenant or user not found" errors
4. ✅ Server logs show "Successfully created profile" messages
5. ✅ Verification query shows "ALL CHECKS PASSED"
6. ✅ All confirmed users have profiles (0 missing)

---

## 📊 System Architecture

### How Profile Creation Works (After Fix)

```
User Signs Up
     ↓
Database Trigger Creates Profile ← PRIMARY (Most Reliable)
     ↓ (if fails)
Auth Callback Creates Profile ← SAFETY NET #1
     ↓ (if fails)
Dashboard API Creates Profile ← SAFETY NET #2
     ↓ (if fails)
Clear Error Message to User ← FAIL LOUDLY, DON'T FAIL SILENTLY
```

**Result**: Triple redundancy ensures profiles are always created!

---

## 🔥 TL;DR

1. **Problem**: Users can't access dashboard after signup
2. **Cause**: Profiles not created automatically
3. **Solution**: Database trigger + safety nets + backfill
4. **Time**: ~7 minutes to implement
5. **Start Here**: `PROFILE_FIX_QUICK_START.md`

---

**Questions?** Check `PROFILE_CREATION_FIX_GUIDE.md` for detailed answers!

**Ready?** Open `PROFILE_FIX_QUICK_START.md` and start fixing! 🚀
