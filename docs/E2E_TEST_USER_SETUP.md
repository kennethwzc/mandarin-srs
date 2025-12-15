# E2E Test User Setup

## Issue: Login Failed with 400 Status

Your E2E tests are failing because the test user credentials are invalid.

**Error:** `[Auth Setup] Login response status: 400`  
**Message:** `Login failed with error: Login failed`

## Solution: Create Test User in Supabase

### Step 1: Check Your GitHub Secrets

Go to: https://github.com/kennethwzc/mandarin-srs/settings/secrets/actions

Make note of what you set for:

- `TEST_USER_EMAIL` (e.g., `test@example.com`)
- `TEST_USER_PASSWORD` (e.g., `testpassword123`)

### Step 2: Create User in Supabase

#### Option A: Via Supabase Dashboard (Easiest)

1. **Go to**: https://supabase.com/dashboard
2. **Select**: Your "mandarin-srs" project
3. **Navigate to**: Authentication → Users
4. **Click**: "Add user" → "Create new user"
5. **Fill in**:
   ```
   Email: test@example.com
   Password: testpassword123
   ```
   (Use the exact values from your GitHub secrets)
6. **✅ Important**: Check "Auto Confirm User"
   - This skips email verification
   - Required for E2E tests to work
7. **Click**: "Create user"

#### Option B: Via SQL (Advanced)

1. **Go to**: Supabase → SQL Editor
2. **Run this query**:

```sql
-- Create test user (modify email/password to match your secrets)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',  -- ⚠️ Match your TEST_USER_EMAIL secret
  crypt('testpassword123', gen_salt('bf')),  -- ⚠️ Match your TEST_USER_PASSWORD secret
  now(),  -- email_confirmed_at = now() means it's verified
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false
);
```

### Step 3: Verify User Exists

Run this query to confirm the user was created:

```sql
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'test@example.com';  -- Use your TEST_USER_EMAIL
```

**Expected result:**

- Should return 1 row
- `email_confirmed_at` should have a timestamp (not null)

### Step 4: Re-run CI

Once the user is created, trigger CI again:

```bash
git commit --allow-empty -m "chore: trigger CI after creating test user"
git push
```

## Troubleshooting

### If you see "Invalid login credentials"

The user exists but the password is wrong. Either:

1. **Reset the password** in Supabase Dashboard
2. Or **update GitHub secret** `TEST_USER_PASSWORD` to match

### If you see "Email not confirmed"

The user exists but email isn't verified. Either:

1. **Set confirmed_at** in SQL:
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = now()
   WHERE email = 'test@example.com';
   ```
2. Or **check "Auto Confirm User"** when creating

### If you see "User not found"

The user doesn't exist at all. Follow Step 2 to create it.

## Best Practices

1. ✅ **Use dedicated test email**: `test+e2e@yourdomain.com`
2. ✅ **Keep credentials simple**: Easy to remember, not your real password
3. ✅ **Document in team docs**: So everyone knows the test credentials
4. ✅ **Separate from production**: Never use real user accounts

## Quick Verification Script

You can test login locally:

```bash
# Set your Supabase URL and anon key
export SUPABASE_URL="https://kunqvklwntfaovoxghxl.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Try to login (requires curl and jq)
curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }' | jq
```

**Expected:** Should return an `access_token` if credentials are correct.  
**If fails:** Will return error message explaining why.
