# E2E Tests Setup

## 🚨 Critical: All 5 GitHub Secrets Required

For E2E and accessibility tests to pass in CI, **ALL** of the following secrets must be set in your GitHub repository:

### Required Secrets

1. **`SUPABASE_URL`** ✅ Required
   - Your Supabase project URL
   - Example: `https://xxxxx.supabase.co`
   - Find in: Supabase Dashboard → Settings → API → Project URL

2. **`SUPABASE_ANON_KEY`** ✅ Required
   - Your Supabase anonymous/public key (NOT the service role key)
   - Find in: Supabase Dashboard → Settings → API → Project API keys → anon public

3. **`DATABASE_URL`** ✅ **CRITICAL - Most Common Missing Secret**
   - Your Supabase database connection string with password
   - Example: `postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - **How to get it:**
     1. Go to Supabase Dashboard → Settings → Database
     2. Scroll to "Connection string" section
     3. Select "URI" tab
     4. Copy the string (it includes your password)
     5. **⚠️ IMPORTANT: Change port from `:5432` to `:6543`** (use pooler, not direct connection)
        - Direct connection (port 5432) is often firewalled in GitHub Actions
        - Pooler connection (port 6543) is optimized for serverless/CI environments
   - ⚠️ **Without this, the login page will freeze with disabled inputs**

4. **`TEST_USER_EMAIL`** (Defaults to `test@example.com` if not set)
   - Email for test user account
   - Should be a real confirmed user in your Supabase Auth

5. **`TEST_USER_PASSWORD`** (Defaults to `testpassword123` if not set)
   - Password for test user
   - Should match the test user's actual password

### Setting GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its value
5. Save

### Test User Setup

Create a test user in your Supabase database:

```sql
-- Run in Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('test@example.com', crypt('testpassword123', gen_salt('bf')), now());
```

Or use the Supabase Auth UI to create the user manually.

### Verifying Setup

After setting secrets, push a commit to trigger CI:

```bash
git commit --allow-empty -m "chore: trigger CI to test secrets"
git push
```

Check the GitHub Actions tab to see if E2E tests pass.

## Local E2E Testing

To run E2E tests locally:

```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install chromium

# Run all E2E tests
pnpm test:e2e

# Run with UI (interactive)
pnpm test:e2e:ui

# Run accessibility tests only
pnpm test:a11y
```

Make sure your `.env.local` file has the Supabase credentials set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Tests timeout or fail with "Failed to load dashboard data"

- Check that Supabase secrets are set correctly
- Verify test user exists and can authenticate
- Check Supabase project is running and accessible

### Color contrast violations

- Fixed by reducing destructive color lightness in `app/globals.css`
- Now uses HSL(0, 84.2%, 42%) instead of 60.2%

### Keyboard navigation failures

- Fixed by adding focus-visible styles to sidebar links
- Updated test to check for actual box-shadow instead of string "ring"

### Screen reader landmarks missing

- Already have `<main>` and `<nav>` semantic HTML in layouts
- Should pass without additional changes
