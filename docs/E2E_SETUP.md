# E2E Tests Setup

## Required GitHub Secrets

For E2E and accessibility tests to pass in CI, the following secrets must be set in the GitHub repository settings:

### Required Secrets

1. **`SUPABASE_URL`** - Your Supabase project URL
   - Example: `https://xxxxx.supabase.co`
   - Used as `NEXT_PUBLIC_SUPABASE_URL` in tests

2. **`SUPABASE_ANON_KEY`** - Your Supabase anonymous/public key
   - This is the public anon key, safe to use in CI
   - Used as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in tests

3. **`DATABASE_URL`** - Your Supabase database connection string
   - Example: `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - Find in: Supabase Dashboard → Settings → Database → Connection string (URI - Transaction mode)
   - Required for server-side database queries during E2E tests

4. **`TEST_USER_EMAIL`** (optional) - Email for test user account
   - Default: `test@example.com`
   - Should be a real user in your Supabase database

5. **`TEST_USER_PASSWORD`** (optional) - Password for test user
   - Default: `testpassword123`
   - Should match the test user's password

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
