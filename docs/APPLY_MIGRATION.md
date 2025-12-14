# How to Apply Database Migration

## Issue

The `pnpm db:push` command requires a valid `DATABASE_URL` with the correct password.

## Solution Options

### Option 1: Update DATABASE_URL (Recommended)

1. Open your `.env.local` file
2. Find the `DATABASE_URL` line:

```env
DATABASE_URL=postgresql://postgres:GENERATE STRONG PASSWORD - SAVE IT!@db.kunqvklwntfaovoxghxl.supabase.co:5432/postgres
```

3. Replace `GENERATE STRONG PASSWORD - SAVE IT!` with your actual database password
4. The password is the one you created when setting up your Supabase project

**If you forgot your password:**

1. Go to Supabase Dashboard → Settings → Database
2. Click "Reset Database Password"
3. Generate a new password and save it
4. Update `.env.local` with the new password

Then run:

```bash
pnpm db:push
```

### Option 2: Use Supabase SQL Editor (Quick Fix)

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `lib/db/migrations/0000_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run"
6. Wait for completion (should see "Success" message)

This will create all tables, indexes, and RLS policies.

### Option 3: Use Migration Script

Run the TypeScript migration script:

```bash
pnpm tsx scripts/apply-migration.ts
```

This uses the Supabase service role key to apply the migration.

## Verify Migration

After applying the migration, verify in Supabase Dashboard:

### 1. Check Tables

Go to: Database → Tables

You should see:

- ✅ profiles
- ✅ radicals
- ✅ characters
- ✅ vocabulary
- ✅ lessons
- ✅ user_items
- ✅ review_history
- ✅ daily_stats

### 2. Check RLS Policies

Go to: Authentication → Policies

You should see policies for:

- ✅ profiles (view/update/insert own profile)
- ✅ user_items (view/insert/update/delete own items)
- ✅ review_history (view/insert own history)
- ✅ daily_stats (view/insert/update own stats)
- ✅ Content tables (public read access)

### 3. Check Enums

Go to: Database → Types

You should see:

- ✅ item_type
- ✅ srs_stage
- ✅ question_type
- ✅ hsk_level

## Seed Database

After migration is successful, seed the database:

```bash
pnpm db:seed
```

This will populate:

- 10 radicals
- 15 HSK 1 characters
- 15 HSK 1 vocabulary words
- 3 lessons

## Troubleshooting

### Error: "DATABASE_URL is not set"

- Check `.env.local` exists
- Check `DATABASE_URL` is set
- Restart your dev server

### Error: "getaddrinfo ENOTFOUND"

- Your `DATABASE_URL` has an invalid password
- Update with correct password from Supabase
- Or use Option 2 (SQL Editor)

### Error: "relation already exists"

- Tables already exist
- Either:
  - Skip migration (tables are already there)
  - Drop tables manually and re-run
  - Modify migration to use `CREATE TABLE IF NOT EXISTS`

### Error: Permission denied

- Check you're using the service role key
- Verify RLS policies allow the operation
- Check Supabase project permissions

## Next Steps

After migration and seed:

1. Verify tables in Supabase Dashboard
2. Test RLS policies
3. Proceed to PROMPT 4 (SRS Algorithm)
