# E2E Test Setup Guide

## Issue: E2E Tests Failing Due to Email Confirmation

### Root Cause

After implementing the email verification flow, E2E tests started failing because:

1. The middleware now checks if user emails are confirmed
2. Unconfirmed users are redirected to `/confirm-email`
3. The test user's email wasn't confirmed, causing all tests to fail

### Solution Overview

The E2E auth setup now attempts to confirm the test user's email using the Supabase Admin API before running tests. However, this requires the `SUPABASE_SERVICE_ROLE_KEY` to be available.

## GitHub Actions Setup (REQUIRED FOR CI)

### Steps to Fix E2E Tests in CI:

1. **Get your Supabase Service Role Key:**
   - Go to your Supabase project dashboard
   - Navigate to: **Settings** → **API**
   - Copy the **service_role** key (NOT the anon key)
   - ⚠️ **NEVER commit this key to git - it has full database access**

2. **Add to GitHub Secrets:**
   - Go to your GitHub repository
   - Click: **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Paste your service role key
   - Click **Add secret**

3. **Verify other required secrets are set:**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - `DATABASE_URL` - Your database connection string
   - `TEST_USER_EMAIL` - Email for test user (defaults to test@example.com)
   - `TEST_USER_PASSWORD` - Password for test user (defaults to testpassword123)

4. **Re-run the CI workflow:**
   - After adding the secret, push a new commit or re-run the workflow
   - E2E tests should now pass

## Local Development Setup (OPTIONAL)

### For local E2E testing:

1. **Create `.env.local`** (if not exists):

   ```bash
   # Required for E2E tests
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://...

   # Optional - test credentials
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=testpassword123
   ```

2. **Run E2E tests locally:**
   ```bash
   pnpm test:e2e
   ```

## Alternative: Manual Email Confirmation

If you can't access the service role key, you can manually confirm the test user:

1. **Go to Supabase Dashboard:**
   - Navigate to **Authentication** → **Users**

2. **Find the test user:**
   - Look for `test@example.com` (or your TEST_USER_EMAIL)

3. **Confirm the email:**
   - Click on the user
   - Find "Email Confirmed" field
   - Set to `true` / confirmed

4. **Re-run tests:**
   - The test user will now pass email verification

## How It Works

### Auth Setup Flow:

```
1. E2E auth setup starts
2. ✅ Check if SUPABASE_SERVICE_ROLE_KEY is available
   - Valid key → Use Admin API to confirm test user email
   - Missing/invalid → Skip admin API, continue with warning
3. Navigate to /login page
4. Fill in test credentials
5. Submit login form
6. Check navigation result:
   - /dashboard → ✅ Success
   - /login → ❌ Login failed
   - /confirm-email → ❌ Email not confirmed (need admin API)
7. Save authentication state
8. Run E2E tests
```

### Middleware Flow:

```
User requests protected route
  ↓
Middleware checks auth cookie
  ↓
Is session valid? → NO → Redirect to /login
  ↓ YES
Is email confirmed? → NO → Redirect to /confirm-email
  ↓ YES
✅ Allow access to route
```

## Troubleshooting

### Error: "Invalid API key"

**Cause:** SUPABASE_SERVICE_ROLE_KEY is not set or is invalid

**Fix:**

- Add the correct service role key to GitHub Secrets
- OR manually confirm test user email in Supabase dashboard

### Error: "Still on login page - authentication may have failed"

**Cause:** Test credentials are incorrect or user doesn't exist

**Fix:**

- Verify TEST_USER_EMAIL and TEST_USER_PASSWORD are correct
- Create the test user in Supabase Auth
- Ensure user email is confirmed

### Error: "Redirected to /confirm-email"

**Cause:** Test user email is not confirmed

**Fix:**

- Add SUPABASE_SERVICE_ROLE_KEY to GitHub Secrets
- OR manually confirm email in Supabase dashboard

### Tests pass locally but fail in CI

**Cause:** Environment variables not set in GitHub Actions

**Fix:**

- Verify all secrets are added to GitHub repository settings
- Check secret names match exactly (case-sensitive)
- Re-run the workflow after adding secrets

## Security Notes

⚠️ **IMPORTANT SECURITY WARNINGS:**

1. **Never commit service role key to git**
   - It has full access to your database
   - Always use environment variables or secrets

2. **Keep test credentials simple**
   - Use a dedicated test account
   - Don't use real user data

3. **Rotate keys if exposed**
   - If you accidentally commit a key, rotate it immediately in Supabase
   - Revoke the old key

4. **Restrict test user permissions**
   - Consider using Row Level Security (RLS) policies
   - Limit what the test user can access

## CI/CD Workflow Files

### E2E Test Workflow

Location: `.github/workflows/e2e-tests.yml`

This workflow runs Playwright E2E tests and requires:

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY ← **Must be set for email confirmation**
- TEST_USER_EMAIL (optional)
- TEST_USER_PASSWORD (optional)

### CI Workflow

Location: `.github/workflows/ci.yml`

This workflow runs linting, typecheck, unit tests, and build.
Does NOT require SUPABASE_SERVICE_ROLE_KEY (unit tests don't need it).

## Additional Resources

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Playwright Test Authentication](https://playwright.dev/docs/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**Last Updated:** 2025-12-17
**Status:** E2E tests now handle missing admin API gracefully, but REQUIRE it for CI to pass
