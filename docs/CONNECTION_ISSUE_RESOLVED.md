# Database Connection Issue - Resolution

## Problem Statement

`pnpm db:push` was failing/hanging when trying to connect to Supabase PostgreSQL database.

## Root Cause Analysis

### Primary Issues Found

1. **DNS Resolution Failure for Direct Connection**
   - `db.kunqvklwntfaovoxghxl.supabase.co` — Does not resolve (IPv6 only)
   - System network is IPv4 only
   - Supabase requires IPv4 add-on for direct connections

2. **Drizzle-kit Interactive Prompts**
   - `pnpm db:push` hung on interactive prompts
   - Terminal wasn't displaying prompts
   - No way to respond to confirmation dialogs

3. **Environment Variable Loading**
   - `lib/db/client.ts` checked `DATABASE_URL` at import time
   - Scripts using `tsx` didn't auto-load `.env.local`
   - Caused "DATABASE_URL is not set" errors

## Solutions Implemented

### 1. Use Session Pooler (Primary Fix)

**Old (broken):**

```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.kunqvklwntfaovoxghxl.supabase.co:5432/postgres
```

**New (working):**

```env
DATABASE_URL=postgresql://postgres.kunqvklwntfaovoxghxl:PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

**Why this works:**

- Pooler uses AWS infrastructure with IPv4 support
- Handles connection pooling better for serverless
- More reliable than direct connections
- Recommended by Supabase for Next.js applications

### 2. Direct Migration Script

Created `scripts/run-migration.ts`:

- Bypasses drizzle-kit
- Runs SQL migration directly using postgres client
- No interactive prompts
- Works reliably every time

**Usage:**

```bash
pnpm tsx scripts/run-migration.ts
```

### 3. Auto-load Environment Variables

Updated `lib/db/client.ts`:

- Automatically loads `.env.local` if `DATABASE_URL` not present
- Prevents "not set" errors in scripts
- Makes db client work in any context

## Verification

✅ **Connection successful:**

```
Server time: 2025-12-14T16:48:31.053Z
PostgreSQL: PostgreSQL 17.6
```

✅ **Migration successful:**

- 8 tables created
- All indexes created
- All RLS policies enabled
- All triggers created

✅ **Seed successful:**

- 10 radicals
- 15 characters
- 15 vocabulary words
- 3 lessons

## Future-Proof Solution

### For Development

**Database operations will work from:**

- ✅ Next.js Server Components (uses client.ts)
- ✅ Next.js API Routes (uses client.ts)
- ✅ Server Actions (uses client.ts)
- ✅ CLI scripts (auto-loads .env.local)
- ✅ Drizzle Studio (uses drizzle.config.ts)

### For Production (Vercel)

Set these environment variables in Vercel:

- `DATABASE_URL` — Use Session Pooler URL
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Migration Scripts Available

1. **`pnpm tsx scripts/run-migration.ts`** — Direct SQL execution (recommended)
2. **`pnpm db:push`** — Drizzle Kit (may hang on prompts)
3. **Supabase SQL Editor** — Manual paste (always works)

## Best Practices Going Forward

### Always Use Session Pooler

Session Pooler is better for serverless applications:

- Handles connection pooling
- Better performance
- IPv4 compatible
- Recommended by Supabase

### Get Connection String from Supabase

**Settings → Database → Connection string → Session pooler**

Format:

```
postgresql://postgres.[PROJECT]:PASSWORD@aws-[REGION].pooler.supabase.com:5432/postgres
```

### Test Connection Before Deploying

```bash
node -e "
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
sql\`SELECT NOW()\`.then(r => console.log('✅ Connected:', r[0].now)).catch(e => console.log('❌ Failed:', e.message)).finally(() => sql.end());
"
```

## Resolution Summary

| Issue                  | Root Cause                  | Solution                    |
| ---------------------- | --------------------------- | --------------------------- |
| DNS not resolving      | IPv6-only direct connection | Use Session Pooler          |
| drizzle-kit hanging    | Interactive prompts         | Use direct migration script |
| DATABASE_URL not found | Import-time check           | Auto-load .env.local        |

**Status:** ✅ **RESOLVED** — All database operations working correctly

## Verification Commands

```bash
# Test connection
node -e "require('postgres')(process.env.DATABASE_URL, {max:1})\`SELECT 1\`.then(()=>console.log('✅')).catch(e=>console.log('❌',e.message))"

# Run migration
pnpm tsx scripts/run-migration.ts

# Seed database
pnpm db:seed

# Open Drizzle Studio
pnpm db:studio
```

All commands should work without issues now.
