# Production Database Checklist (Supabase)

Complete guide for setting up and optimizing your Supabase database for production.

## 🎯 Overview

This checklist ensures your database is:

- ✅ **Secure** - Protected with RLS and proper authentication
- ✅ **Fast** - Optimized with indexes and connection pooling
- ✅ **Reliable** - Backed up and monitored
- ✅ **Scalable** - Ready to handle growth

---

## 📋 Pre-Production Checklist

### 1. Plan Upgrade

- [ ] **Upgrade to Supabase Pro plan** ($25/month minimum)
  - Required for production workloads
  - Provides better performance, backups, and support
  - Link: https://app.supabase.com/project/[project]/settings/billing

**Why Pro?**

- Daily backups (7-day retention)
- Connection pooling (required for Next.js)
- Better CPU and RAM allocation
- Email support
- No pausing of inactive projects

### 2. Database Configuration

- [ ] **Enable connection pooling** (Transaction mode)
  - Go to: Settings → Database → Connection Pooling
  - Mode: Transaction (recommended for serverless)
  - Port: 6543 (default)
  - Update `DATABASE_URL` to use pooling URL

**Connection String Format:**

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

- [ ] **Set performance settings**
  ```sql
  -- Increase shared buffers (25% of RAM)
  ALTER SYSTEM SET shared_buffers = '256MB';
  -- Increase work memory for complex queries
  ALTER SYSTEM SET work_mem = '64MB';
  -- Enable query plan caching
  ALTER SYSTEM SET plan_cache_mode = 'auto';
  ```

### 3. Security Configuration

- [ ] **Row Level Security (RLS) enabled on ALL tables**

  ```sql
  -- Check RLS status for all tables
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';

  -- Enable RLS if not already enabled
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
  ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  ```

- [ ] **RLS policies configured correctly**

  ```sql
  -- Example: Users can only see their own data
  CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);
  ```

- [ ] **Service role key secured** (never expose to client!)
  - Store in Vercel environment variables only
  - Use for server-side operations only
  - Never log or display in error messages

- [ ] **Database roles configured**
  ```sql
  -- Verify roles
  SELECT rolname, rolsuper, rolcreatedb
  FROM pg_roles
  WHERE rolname LIKE 'postgres%' OR rolname LIKE 'anon%';
  ```

### 4. Performance Optimization

- [ ] **Indexes created for all foreign keys**

  ```sql
  -- Check missing indexes on foreign keys
  SELECT
    tc.table_name,
    kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = tc.table_name
        AND indexdef LIKE '%' || kcu.column_name || '%'
    );

  -- Create missing indexes
  CREATE INDEX idx_cards_user_id ON cards(user_id);
  CREATE INDEX idx_reviews_user_id ON reviews(user_id);
  CREATE INDEX idx_reviews_card_id ON reviews(card_id);
  ```

- [ ] **Composite indexes for common queries**

  ```sql
  -- For queries like: WHERE user_id = X AND next_review < NOW()
  CREATE INDEX idx_cards_user_next_review
    ON cards(user_id, next_review)
    WHERE next_review IS NOT NULL;

  -- For queries like: WHERE user_id = X AND status = 'active'
  CREATE INDEX idx_lessons_user_status
    ON user_lessons(user_id, status);
  ```

- [ ] **ANALYZE tables for query planner**

  ```sql
  -- Update statistics for all tables
  ANALYZE users;
  ANALYZE lessons;
  ANALYZE cards;
  ANALYZE reviews;
  ```

- [ ] **Vacuum tables to reclaim space**
  ```sql
  -- Vacuum all tables (do this during low-traffic hours)
  VACUUM ANALYZE;
  ```

### 5. Data Validation

- [ ] **Check for data integrity issues**

  ```sql
  -- Check for orphaned cards (user_id doesn't exist)
  SELECT COUNT(*) FROM cards c
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.user_id);

  -- Check for orphaned reviews (card_id doesn't exist)
  SELECT COUNT(*) FROM reviews r
  WHERE NOT EXISTS (SELECT 1 FROM cards c WHERE c.id = r.card_id);

  -- Check for invalid enum values
  SELECT DISTINCT status FROM user_lessons
  WHERE status NOT IN ('not_started', 'in_progress', 'completed');
  ```

- [ ] **Verify constraints**

  ```sql
  -- Check NOT NULL constraints
  SELECT
    table_name,
    column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND is_nullable = 'NO';

  -- Check unique constraints
  SELECT
    tc.table_name,
    kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'UNIQUE';
  ```

### 6. Backup and Recovery

- [ ] **Daily backups enabled** (included in Pro plan)
  - Verify: Settings → Database → Backups
  - Retention: 7 days (Pro) or 30 days (Team)

- [ ] **Test backup restoration**

  ```bash
  # Download a backup
  # Go to: Supabase Dashboard → Settings → Database → Backups → Download

  # Test restore locally (Docker)
  docker run --name postgres-test -e POSTGRES_PASSWORD=test -p 5433:5432 -d postgres:15
  psql -h localhost -p 5433 -U postgres -f backup.sql
  ```

- [ ] **Export schema for version control**

  ```bash
  # Export current schema
  pg_dump $DATABASE_URL --schema-only > schema.sql

  # Commit to git
  git add schema.sql
  git commit -m "chore: update database schema for production"
  ```

### 7. Monitoring Setup

- [ ] **Enable query logging** (for slow query analysis)
  - Go to: Settings → Database → Logging
  - Enable: Slow queries (> 1 second)

- [ ] **Set up alerts** in Supabase dashboard:
  - High CPU usage (> 80%)
  - High memory usage (> 80%)
  - High disk usage (> 80%)
  - Failed queries spike

- [ ] **Monitor connection pool**
  ```sql
  -- Check active connections
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
  -- Check connection pool settings
  SHOW max_connections;
  SHOW superuser_reserved_connections;
  ```

### 8. Content Population

- [ ] **Import lessons data**

  ```bash
  # Import lessons
  pnpm tsx scripts/import-content.ts

  # Verify import
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM lessons;"
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM content;"
  ```

- [ ] **Create test user** for QA

  ```sql
  -- Create test user (via Supabase Auth UI or API)
  -- Then verify in database
  SELECT id, email, created_at FROM auth.users WHERE email = 'test@example.com';
  ```

---

## 🚀 Deployment Day Checklist

### Pre-Deployment (1 hour before)

- [ ] **Final backup**

  ```sql
  -- Trigger manual backup in Supabase dashboard
  -- Settings → Database → Backups → Create Backup
  ```

- [ ] **Verify connection pooling is working**

  ```bash
  # Test connection with pooling URL
  psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

  # Should connect successfully
  \conninfo
  ```

- [ ] **Check disk space**

  ```sql
  SELECT pg_size_pretty(pg_database_size('postgres')) as database_size;
  ```

- [ ] **Check for long-running queries**
  ```sql
  SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
  FROM pg_stat_activity
  WHERE state = 'active'
    AND now() - pg_stat_activity.query_start > interval '5 minutes';
  ```

### Post-Deployment (within 30 minutes)

- [ ] **Verify application can connect**

  ```bash
  # Check health endpoint
  curl https://yourdomain.com/api/health

  # Should return: {"status":"healthy","checks":{"database":"ok"}}
  ```

- [ ] **Monitor connection count**

  ```sql
  -- Run every 5 minutes for first hour
  SELECT
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle
  FROM pg_stat_activity;
  ```

- [ ] **Check for errors in logs**
  - Go to: Supabase Dashboard → Logs
  - Filter: Errors only
  - Look for connection errors, query errors, RLS violations

- [ ] **Test critical user flows**
  - Sign up → Email verification → Login
  - Start lesson → Grade cards
  - Review session
  - View dashboard

---

## 📊 Performance Benchmarks

Target performance metrics for production:

| Metric                 | Target  | Acceptable | Action if Exceeded       |
| ---------------------- | ------- | ---------- | ------------------------ |
| Query response time    | < 50ms  | < 200ms    | Optimize query/add index |
| Connection time        | < 10ms  | < 50ms     | Check network/pooling    |
| Concurrent connections | < 20    | < 50       | Check for leaks          |
| CPU usage              | < 50%   | < 70%      | Optimize queries         |
| Memory usage           | < 60%   | < 80%      | Check for leaks          |
| Disk usage             | < 70%   | < 85%      | Archive old data         |
| Backup time            | < 5 min | < 15 min   | Consider table cleanup   |
| Most queries           | < 10ms  | < 50ms     | Add indexes              |
| Complex queries        | < 100ms | < 500ms    | Optimize query           |

---

## 🔧 Common Issues and Solutions

### Issue: "Too many connections"

**Cause:** Connection pool exhausted

**Solution:**

```typescript
// Ensure connection is closed after use
const { data, error } = await supabase.from('users').select('*')

// Use connection pooling URL (port 6543)
DATABASE_URL =
  'postgresql://...@....pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
```

### Issue: "Row-level security policy violated"

**Cause:** RLS policy too restrictive or missing

**Solution:**

```sql
-- Debug: Temporarily disable RLS to test
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT * FROM users WHERE id = 'user-id';

-- Re-enable and fix policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create correct policy
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

### Issue: Slow queries

**Cause:** Missing indexes or inefficient query

**Solution:**

```sql
-- Find slow queries
SELECT
  mean_exec_time,
  calls,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM cards
WHERE user_id = 'user-id'
  AND next_review < NOW();

-- Add appropriate index
CREATE INDEX idx_cards_user_next_review
  ON cards(user_id, next_review);
```

---

## 📚 Additional Resources

- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Supabase Performance Tuning](https://supabase.com/docs/guides/platform/performance)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

## ✅ Final Sign-Off

Database prepared by: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Checklist completed: \_\_\_\_ / \_\_\_\_ items

Issues found: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Ready for production: ☐ YES ☐ NO

**Status: 🎉 PRODUCTION READY**
