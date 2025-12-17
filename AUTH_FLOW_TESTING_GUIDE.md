# 🧪 Authentication Flow Testing Guide

## Quick Reference

**Estimated Testing Time**: 15-20 minutes  
**Required**: Fresh browser session or incognito mode  
**Test Email**: Use a real email you can access

---

## ✅ Test 1: Complete Signup Flow (5 minutes)

### Steps

1. **Open homepage**

   ```
   http://localhost:3000/
   ```

2. **Click "Get Started" button**
   - Should navigate to `/signup`

3. **Fill signup form**
   - Email: `your-test-email@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`

4. **Click "Create Account"**

   **✅ Expected Results**:
   - Toast appears: "Account created! Please check your email..."
   - Redirected to `/confirm-email?email=your-test-email@example.com`
   - See page with:
     - Mail icon
     - "Check your email" heading
     - Your email address in bold
     - "Resend confirmation email" link
     - "Go to Login" button

5. **Try to access dashboard** (open new tab)

   ```
   http://localhost:3000/dashboard
   ```

   **✅ Expected Result**:
   - Immediately redirected back to `/confirm-email`
   - Console log shows: `[Middleware] ⚠️  Session exists but email not confirmed`

6. **Check your email inbox**
   - Look for "Confirm Your Email" from Supabase
   - Check spam folder if not in inbox

7. **Click confirmation link in email**

   **✅ Expected Results**:
   - Link opens in browser
   - Redirected through `/api/auth/callback`
   - Finally land on `/dashboard` OR `/login`
   - Console log shows: `Profile created successfully for user: [id]`

8. **If redirected to login, log in**
   - Use same email/password from step 3

9. **Verify dashboard loads**

   **✅ Expected Results**:
   - Dashboard shows stats (all zeros for new user - OK)
   - No error messages
   - Can navigate to Lessons, Reviews, etc.

### Verification Queries

```sql
-- Check user was created with confirmed email
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'your-test-email@example.com';

-- Check profile was created
SELECT
  id,
  email,
  created_at
FROM public.profiles
WHERE email = 'your-test-email@example.com';
```

**Expected**: Both queries return 1 row with matching ID

---

## ✅ Test 2: Resend Confirmation Email (3 minutes)

### Steps

1. **Create another test account**
   - Use different email: `test2@example.com`
   - Follow steps 1-4 from Test 1

2. **On confirmation page**
   - DON'T click email link yet
   - Click "Resend confirmation email" button

   **✅ Expected Results**:
   - Toast appears: "Confirmation email sent!"
   - Button shows "Sending..." briefly
   - Receive second email

3. **Wait 2 minutes and resend again**
   - Should work (no rate limiting issues)

4. **Click link in SECOND email**
   - Should work same as first email
   - Confirms account successfully

### Notes

- Supabase has 60-second rate limit on email resends
- Old links still work (don't expire immediately)

---

## ✅ Test 3: Sign Out Functionality (3 minutes)

### Steps

1. **Log in to application**
   - Use account from Test 1

2. **Navigate to Settings**

   ```
   http://localhost:3000/settings
   ```

3. **Scroll to bottom**

   **✅ Expected to see**:
   - Red/destructive card titled "Sign Out"
   - Description: "Sign out of your account"
   - Red button with logout icon and "Sign Out" text

4. **Click "Sign Out" button**

   **✅ Expected Results**:
   - Toast appears: "Signed out successfully"
   - Redirected to homepage `/`
   - No longer authenticated

5. **Try to access dashboard**

   ```
   http://localhost:3000/dashboard
   ```

   **✅ Expected Result**:
   - Redirected to `/login?redirectTo=/dashboard`
   - Console log: `[Middleware] ❌ No valid session on protected route`

6. **Verify session cleared**
   - Open browser DevTools
   - Go to Application → Cookies
   - Check: `sb-kunqvklwntfaovoxghxl-auth-token` should be deleted

---

## ✅ Test 4: Protected Routes While Logged Out (2 minutes)

### Steps

1. **Ensure you're logged out** (from Test 3)

2. **Try accessing protected routes directly**:

   **Route**: `/dashboard`

   ```
   http://localhost:3000/dashboard
   ```

   **✅ Expected**: Redirect to `/login?redirectTo=/dashboard`

   **Route**: `/lessons`

   ```
   http://localhost:3000/lessons
   ```

   **✅ Expected**: Redirect to `/login?redirectTo=/lessons`

   **Route**: `/reviews`

   ```
   http://localhost:3000/reviews
   ```

   **✅ Expected**: Redirect to `/login?redirectTo=/reviews`

   **Route**: `/settings`

   ```
   http://localhost:3000/settings
   ```

   **✅ Expected**: Redirect to `/login?redirectTo=/settings`

3. **Check console logs**
   - Should see: `[Middleware] ❌ No valid session on protected route`
   - Should see: `redirecting to login`

---

## ✅ Test 5: Public Routes (2 minutes)

### Steps

1. **While logged out, access public routes**:

   **Homepage**:

   ```
   http://localhost:3000/
   ```

   **✅ Expected**: Loads successfully

   **Login**:

   ```
   http://localhost:3000/login
   ```

   **✅ Expected**: Loads successfully

   **Signup**:

   ```
   http://localhost:3000/signup
   ```

   **✅ Expected**: Loads successfully

   **Confirm Email**:

   ```
   http://localhost:3000/confirm-email
   ```

   **✅ Expected**: Loads successfully (shows generic message without email param)

2. **While logged in, try login page**:
   - Log in first
   - Go to `/login`

   **✅ Expected**: Redirected to `/dashboard`
   **Console**: `[Middleware] ✅ Authenticated user on login, redirecting to dashboard`

---

## ✅ Test 6: Email Confirmation Required (3 minutes)

### Steps

1. **Create new account**
   - Use fresh email: `test3@example.com`
   - Complete signup form

2. **On confirmation page, DON'T click email link**

3. **Try to access protected routes**:

   **Dashboard**:

   ```
   http://localhost:3000/dashboard
   ```

   **✅ Expected**:
   - Redirect to `/confirm-email`
   - Console: `[Middleware] ⚠️  Session exists but email not confirmed`

   **Lessons**:

   ```
   http://localhost:3000/lessons
   ```

   **✅ Expected**: Redirect to `/confirm-email`

4. **Now confirm email**
   - Click link in email
   - Login if needed

5. **Try dashboard again**

   **✅ Expected**: Now loads successfully

### This Tests

- Middleware properly checks email confirmation
- Unconfirmed users can't access protected content
- After confirmation, access is granted

---

## ✅ Test 7: Multiple Browser Tabs (2 minutes)

### Steps

1. **Log in to application in Tab 1**

2. **Open Tab 2, navigate to dashboard**

   ```
   http://localhost:3000/dashboard
   ```

   **✅ Expected**: Dashboard loads (session shared)

3. **In Tab 1, go to Settings and sign out**

4. **Switch back to Tab 2**
   - Refresh page OR
   - Click any navigation link

   **✅ Expected**: Redirected to login

### This Tests

- Sign out clears global session
- All tabs respect authentication state

---

## ✅ Test 8: Return URL After Login (2 minutes)

### Steps

1. **While logged out, try to access lessons**:

   ```
   http://localhost:3000/lessons
   ```

2. **Redirected to login**
   - URL should be: `/login?redirectTo=/lessons`

3. **Log in with credentials**

4. **After successful login**

   **✅ Expected**: Redirected to `/lessons` (not dashboard)

### This Tests

- Middleware preserves intended destination
- Login redirects to originally requested page

---

## 🐛 Common Issues & Fixes

### Issue: "Stuck in redirect loop"

**Symptoms**: Page keeps redirecting between `/dashboard` and `/confirm-email`

**Fix**:

```bash
# Clear all cookies
# Or use incognito mode
# Try signup again
```

### Issue: "Middleware not logging anything"

**Fix**:

1. Check `middleware.ts` is in project root
2. Restart dev server: `pnpm dev`
3. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Issue: "Email not arriving"

**Check**:

1. Spam folder
2. Supabase Dashboard → Authentication → Email Templates (enabled?)
3. Supabase logs for email sending errors

**Fix**:

- Use "Resend confirmation email" button
- Check Supabase SMTP settings

### Issue: "Sign out doesn't work"

**Check**:

1. Console for errors
2. `lib/hooks/use-auth.ts` - `signOut` function exists?
3. Browser blocks cookies?

**Debug**:

```typescript
// Add to handleSignOut in settings/page.tsx
console.log('Attempting sign out...')
await signOut()
console.log('Sign out completed')
```

### Issue: "Dashboard still shows 'Please sign in'"

**Fix**: This shouldn't happen anymore (we changed it to redirect)

**If it does**:

1. Clear Next.js cache: `rm -rf .next`
2. Rebuild: `pnpm build`
3. Restart: `pnpm dev`

---

## 📊 Success Criteria

After running all tests, you should have:

- [x] **Signup redirects to confirmation page** (not dashboard)
- [x] **Email confirmation enforced** (unconfirmed users can't access protected routes)
- [x] **Sign out button works** (clears session, redirects to homepage)
- [x] **Protected routes redirect to login** (not showing error messages)
- [x] **Public routes always accessible**
- [x] **Return URLs preserved** (login redirects to intended destination)
- [x] **Middleware logs show correct scenarios**
- [x] **No console errors** (except expected auth errors)

---

## 🔍 Middleware Log Reference

### Expected Console Logs

**Scenario 1: Unauthenticated user**

```
[Middleware] ========================================
[Middleware] Path: /dashboard
[Middleware] Cookie exists: false
[Middleware] Cookie value length: 0
[Middleware] Has valid session: false
[Middleware] Email confirmed: false
[Middleware] Fully authenticated: false
[Middleware] ========================================
[Middleware] ❌ No valid session on protected route, redirecting to login
```

**Scenario 2: Session but email not confirmed**

```
[Middleware] ========================================
[Middleware] Path: /dashboard
[Middleware] Cookie exists: true
[Middleware] Cookie value length: 856
[Middleware] Has valid session: true
[Middleware] Email confirmed: false
[Middleware] Fully authenticated: false
[Middleware] ========================================
[Middleware] ⚠️  Session exists but email not confirmed, redirecting to confirm-email
```

**Scenario 3: Fully authenticated**

```
[Middleware] ========================================
[Middleware] Path: /dashboard
[Middleware] Cookie exists: true
[Middleware] Cookie value length: 856
[Middleware] Has valid session: true
[Middleware] Email confirmed: true
[Middleware] Fully authenticated: true
[Middleware] ========================================
[Middleware] ✅ Allowing access to: /dashboard
```

---

## 🚀 Quick Test Script

Run this in your terminal to test basic flow:

```bash
# Start dev server
pnpm dev

# Open browser
open http://localhost:3000

# In browser console, run:
console.clear()

# Watch for middleware logs as you navigate
# They should appear in terminal (server-side logs)
```

---

## 📞 Need Help?

If tests fail:

1. Check `AUTH_FLOW_FIX_COMPLETE.md` for troubleshooting
2. Review middleware logs for unexpected behavior
3. Verify Supabase configuration
4. Clear browser cache/cookies and retry

---

**Testing Status**: Ready to execute  
**Estimated Time**: 15-20 minutes  
**Difficulty**: Easy (step-by-step guide)

**Happy Testing! 🎉**
