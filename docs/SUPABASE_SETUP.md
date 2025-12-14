# Supabase Setup Guide

## 1. Create Supabase Project

### Sign Up / Log In

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (recommended) or email

### Create New Project

1. Click "New Project"
2. Select your organization (or create new)
3. Project settings:
   - **Name**: mandarin-srs-prod (or your choice)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier (sufficient for MVP)
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

## 2. Get API Credentials

### Project API Settings

1. Navigate to: Settings → API (left sidebar)
2. Copy these values:

**Project URL:**

```
https://[your-project-ref].supabase.co
```

Save as: `NEXT_PUBLIC_SUPABASE_URL`

**anon/public key:**

```
eyJhbGc...
```

Save as: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- ✅ Safe to expose to client
- ⚠️ Has limited permissions (RLS enforced)

**service_role key:**

```
eyJhbGc...
```

Save as: `SUPABASE_SERVICE_ROLE_KEY`

- ❌ NEVER expose to client
- ⚠️ Bypasses RLS - server use only

### Database Connection String

1. Navigate to: Settings → Database
2. Connection string (URI):

```
postgresql://postgres:[YOUR-PASSWORD]@db.[your-project-ref].supabase.co:5432/postgres
```

Save as: `DATABASE_URL`

- Replace `[YOUR-PASSWORD]` with database password from step 1
- Used by Drizzle ORM for migrations

## 3. Configure Authentication

### Email Auth Settings

1. Navigate to: Authentication → Providers
2. Email provider should be enabled by default
3. Configure settings:

**Email Templates** (Authentication → Email Templates):

- Customize confirmation email
- Customize password reset email
- Add your app branding

**URL Configuration** (Authentication → URL Configuration):

- Site URL: `http://localhost:3000` (development)
- Redirect URLs: Add:
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback` (production - add later)

### Password Requirements

1. Navigate to: Authentication → Settings
2. Set password policy:
   - Minimum length: 8 characters
   - Require uppercase: Yes (recommended)
   - Require lowercase: Yes (recommended)
   - Require numbers: Yes (recommended)
   - Require special characters: Optional

## 4. Database Setup

### Initial Tables

Tables will be created via Drizzle migrations in PROMPT 3.
For now, verify database connection:

1. Navigate to: Database → Tables
2. Should see default Supabase tables:
   - `auth.users`
   - `auth.sessions`

### Enable Row Level Security (RLS)

⚠️ Critical for security - will be configured in PROMPT 3

1. All user data tables will have RLS enabled
2. Policies will ensure users can only access their own data
3. Content tables will be read-only for authenticated users

## 5. Local Development Setup

### Update .env.local

Copy credentials to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[password]@db.[your-project-ref].supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Verify Connection

Test connection by running health check:

```bash
pnpm dev
# Visit http://localhost:3000/api/health
```

## 6. Production Deployment (Vercel)

### Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`

3. Set environment: Production, Preview, Development (all three)
4. Click "Save"
5. Redeploy application

### Update Supabase Redirect URLs

1. In Supabase: Authentication → URL Configuration
2. Add production URLs:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/auth/callback`

## 7. Security Checklist

✅ Service role key is in .env.local (git ignored)
✅ Service role key is NOT in .env.example
✅ Service role key is only used server-side
✅ RLS will be enabled on all user tables (PROMPT 3)
✅ Anon key is public-safe (RLS enforced)
✅ Password policy is strong (8+ chars, mixed case)
✅ Email confirmation enabled
✅ No storage buckets needed (pinyin input app - no audio files)

## 8. Monitoring & Logs

### Supabase Dashboard

Monitor your application:

1. **Database**: Query performance, active connections
2. **Auth**: User signups, login attempts
3. **Logs**: Real-time logs for debugging

### Set Up Alerts (Optional - Paid Plan)

1. Navigate to: Settings → Alerts
2. Configure alerts for:
   - Database size nearing limit
   - API quota usage
   - Error rate spikes

## Troubleshooting

### Can't connect to database

- Verify DATABASE_URL is correct
- Check password has no special characters (URL encode if needed)
- Ensure IP whitelist allows connections (free tier allows all)

### Auth not working

- Check redirect URLs match exactly (including http/https)
- Verify anon key is correct
- Check browser console for errors

### Rate Limiting

- Free tier: 50,000 monthly active users
- API requests: Generous limits on free tier
- Database: 500MB storage on free tier

## Next Steps

After Supabase setup:

1. ✅ Complete PROMPT 2 (Supabase Integration) - you are here
2. → Run PROMPT 3 (Database Schema)
3. → Run PROMPT 4 (SRS Algorithm)
4. → Run PROMPT 5 (Review Interface - Pinyin Input)

## Important Notes

⚠️ **NO STORAGE BUCKETS NEEDED**
This app does NOT use audio files. Users type pinyin to learn.
Skip any storage/file upload setup - it's not required.
