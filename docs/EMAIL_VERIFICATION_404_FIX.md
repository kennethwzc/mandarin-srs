# Fix Email Verification 404 Error

## Problem

When clicking the email verification link, you get a 404 page instead of being redirected to the callback route.

## Root Cause

The redirect URL in Supabase Dashboard doesn't match the callback route URL.

## Solution

### Step 1: Verify Callback Route Exists

The callback route is at: `/app/api/auth/callback/route.ts`
This creates the endpoint: `http://localhost:3000/api/auth/callback`

### Step 2: Configure Supabase Redirect URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `kunqvklwntfaovoxghxl`
3. Navigate to: **Authentication → URL Configuration**

4. **Site URL:**
   - Set to: `http://localhost:3000` (for development)

5. **Redirect URLs:**
   - Add these URLs (one per line):
     ```
     http://localhost:3000/api/auth/callback
     http://localhost:3000/**
     ```

   **Important:** The redirect URL must be `/api/auth/callback` (not `/auth/callback`)

6. Click **Save**

### Step 3: Verify Email Redirect in Code

The signup function should use:

```typescript
emailRedirectTo: `${window.location.origin}/api/auth/callback`
```

This is already configured correctly in `lib/supabase/auth.ts`.

### Step 4: Test Email Verification

1. Sign up with a test email
2. Check your email for the verification link
3. The link should look like:
   ```
   https://kunqvklwntfaovoxghxl.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=http://localhost:3000/api/auth/callback
   ```
4. Click the link
5. You should be redirected to `/api/auth/callback` which then redirects to `/dashboard`

## Troubleshooting

### Still Getting 404?

1. **Check Supabase Dashboard:**
   - Authentication → URL Configuration
   - Ensure `http://localhost:3000/api/auth/callback` is in Redirect URLs
   - Ensure Site URL is `http://localhost:3000`

2. **Check the Email Link:**
   - Right-click the verification link and "Copy link address"
   - Check if `redirect_to` parameter points to `/api/auth/callback`
   - If it points to `/auth/callback`, the Supabase config is wrong

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Check Network tab for failed requests
   - Check Console for errors

4. **Verify Route Exists:**
   - Manually visit: `http://localhost:3000/api/auth/callback?code=test`
   - Should redirect to login (not 404)

### Common Issues

**Issue:** Redirect URL shows `/auth/callback` in email

- **Fix:** Update Supabase Dashboard → Authentication → URL Configuration
- Add `http://localhost:3000/api/auth/callback` to Redirect URLs

**Issue:** 404 on `/api/auth/callback`

- **Fix:** Verify the route file exists at `app/api/auth/callback/route.ts`
- Restart dev server: `pnpm dev`

**Issue:** Redirects to login with "invalid_code" error

- **Fix:** The code might be expired or already used
- Try signing up again to get a fresh verification link

## Production Setup

For production, update:

1. **Site URL:** `https://your-domain.com`
2. **Redirect URLs:** Add `https://your-domain.com/api/auth/callback`
3. **Email Redirect:** Code already uses `window.location.origin` (will auto-detect)
