# Test Account Verification Guide

## Quick Methods for Development

### Method 1: Disable Email Confirmation (Recommended for Testing)

**Best for:** Local development and testing

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Authentication → Settings**
4. Scroll to **"Email Auth"** section
5. **Toggle OFF** "Enable email confirmations"
6. Click **Save**

**Result:** Users can log in immediately after signup without email verification.

**⚠️ Remember:** Re-enable this for production!

---

### Method 2: Manual Verification in Supabase Dashboard

**Best for:** One-off test account verification

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Authentication → Users**
4. Find your test user by email
5. Click the **three dots (⋮)** next to the user
6. Select **"Verify email"** or manually set **"Email Confirmed"** to `true`

**Result:** User account is immediately verified and can log in.

---

### Method 3: Check Verification Email

**Best for:** Testing the full email flow

1. Sign up with a real email address
2. Check your email inbox (and spam folder)
3. Look for email from Supabase with subject: **"Confirm your signup"**
4. Click the verification link in the email
5. You'll be redirected to: `http://localhost:3000/auth/callback?code=...`
6. The app will automatically verify your account and redirect to dashboard

**Note:** The verification link format:

```
https://[your-project].supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=http://localhost:3000/auth/callback
```

---

### Method 4: Use Supabase Email Testing (Development)

**Best for:** Testing without real email addresses

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Authentication → Email Templates**
4. Check **"Enable email testing"** (if available)
5. Verification emails will appear in Supabase logs instead of being sent

**Note:** This feature may not be available on all Supabase plans.

---

## Verification Flow in the App

When a user signs up:

1. **Signup** (`/signup`) → User enters email/password
2. **Supabase** → Sends verification email (if enabled)
3. **User clicks link** → Redirects to `/auth/callback?code=...`
4. **Callback route** → Exchanges code for session
5. **Redirect** → User goes to `/dashboard`

The callback route (`/app/api/auth/callback/route.ts`) handles:

- Extracting the verification code from URL
- Exchanging code for session via `supabase.auth.exchangeCodeForSession()`
- Redirecting to dashboard on success
- Redirecting to login with error on failure

---

## Troubleshooting

### Issue: "Invalid verification code" error

**Causes:**

- Code expired (verification links expire after 24 hours)
- Code already used
- Wrong redirect URL configured

**Solutions:**

1. Check Supabase Dashboard → Authentication → URL Configuration
2. Ensure `http://localhost:3000/auth/callback` is in Redirect URLs
3. Try signing up again to get a fresh verification link

### Issue: No verification email received

**Causes:**

- Email in spam folder
- Email confirmation disabled
- Wrong email address

**Solutions:**

1. Check spam/junk folder
2. Verify email address is correct
3. Check Supabase Dashboard → Authentication → Settings
4. Use Method 1 or 2 above for immediate testing

### Issue: Can't log in after signup

**Causes:**

- Email not verified (if confirmation is enabled)
- Wrong password
- Account doesn't exist

**Solutions:**

1. Verify email using one of the methods above
2. Use "Forgot password" to reset if needed
3. Check Supabase Dashboard → Authentication → Users to see user status

---

## Recommended Setup for Development

**For local development, use Method 1:**

- Disable email confirmation
- Faster testing workflow
- No need to check emails
- Users can log in immediately

**For staging/production:**

- Enable email confirmation
- Use real email addresses
- Test the full verification flow
- Monitor email delivery

---

## Quick Commands

### Check if user is verified (Supabase SQL Editor)

```sql
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'test@example.com';
```

If `email_confirmed_at` is `NULL`, the user is not verified.

### Manually verify user (Supabase SQL Editor)

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'test@example.com';
```

⚠️ **Warning:** Only use SQL commands in development. Never modify production data directly.
