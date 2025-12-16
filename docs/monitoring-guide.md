# Production Monitoring Guide

Complete guide for monitoring your Mandarin SRS application in production.

## 📊 Monitoring Strategy

### Monitoring Layers

1. **Application Monitoring** - Track errors, performance, and user behavior
2. **Infrastructure Monitoring** - Monitor servers, databases, and services
3. **Business Monitoring** - Track key metrics and user engagement
4. **Security Monitoring** - Detect threats and anomalies

---

## 🔍 Application Monitoring

### Sentry (Error Tracking)

**Purpose:** Catch and fix errors before users report them

**Setup:**

1. Create a Sentry account: https://sentry.io
2. Create a new Next.js project
3. Get your DSN from: Settings → Projects → [Your Project] → Client Keys (DSN)
4. Add to Vercel environment variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
   SENTRY_AUTH_TOKEN=[token]
   SENTRY_ORG=your-organization
   SENTRY_PROJECT=your-project
   ```

**Key Metrics to Monitor:**

- **Error Rate:** Should be < 0.1% of requests
- **Error Frequency:** Track most common errors
- **Affected Users:** How many users are impacted
- **Error Trends:** Are errors increasing or decreasing

**Alerts to Configure:**

1. **Critical Error Alert:**
   - Trigger: Any error affecting > 10 users in 5 minutes
   - Notify: Email + Slack (immediate)

2. **Error Spike Alert:**
   - Trigger: Error rate > 1% for 10 minutes
   - Notify: Email + Slack (immediate)

3. **New Error Alert:**
   - Trigger: First occurrence of a new error
   - Notify: Email (within 1 hour)

**Dashboard Widgets:**

- Error frequency over time
- Top 10 errors by occurrence
- Top 10 errors by user impact
- Error distribution by browser/OS
- Error resolution time

### PostHog (Analytics)

**Purpose:** Understand user behavior and product usage

**Setup:**

1. Create a PostHog account: https://app.posthog.com
2. Create a new project
3. Get your API key from: Project Settings
4. Add to Vercel environment variables:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_[key]
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

**Key Events to Track:**

```typescript
// User lifecycle
trackEvent('user_signed_up')
trackEvent('user_verified_email')
trackEvent('user_logged_in')
trackEvent('user_logged_out')

// Learning activity
trackEvent('lesson_started', { lessonId, lessonTitle })
trackEvent('lesson_completed', { lessonId, duration })
trackEvent('review_started', { cardCount })
trackEvent('review_completed', { cardCount, accuracy })

// Engagement
trackEvent('card_graded', { grade, cardType })
trackEvent('streak_achieved', { days })
trackEvent('milestone_reached', { milestone })
```

**Key Metrics to Track:**

- **Daily Active Users (DAU)**
- **Weekly Active Users (WAU)**
- **Monthly Active Users (MAU)**
- **Retention Rate (Day 1, 7, 30)**
- **Lesson Completion Rate**
- **Review Session Completion Rate**
- **Average Session Duration**
- **Churn Rate**

**Dashboards to Create:**

1. **User Engagement Dashboard:**
   - DAU/WAU/MAU trends
   - Session duration distribution
   - Most used features
   - User journey funnel

2. **Learning Metrics Dashboard:**
   - Lessons started vs completed
   - Average cards per review session
   - Grade distribution (Again, Hard, Good, Easy)
   - Retention curve (SRS algorithm effectiveness)

3. **Conversion Dashboard:**
   - Signup → Email verification rate
   - Email verification → First lesson rate
   - First lesson → Second lesson rate
   - User activation rate

---

## 🏗️ Infrastructure Monitoring

### Vercel (Hosting)

**Purpose:** Monitor deployments, performance, and uptime

**Built-in Monitoring:**

- **Deployments:** Track build times and failures
- **Analytics:** Page views, top pages, geographic distribution
- **Real User Monitoring (RUM):** Core Web Vitals from real users
- **Logs:** View production logs (limited on free tier)

**Key Metrics:**

- **Build Time:** Should be < 3 minutes
- **Deployment Success Rate:** Should be 100%
- **Page Load Time:** P95 < 2 seconds
- **Lighthouse Score:** > 90 on all metrics
- **Core Web Vitals:**
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1

**Vercel Analytics Dashboard:** https://vercel.com/dashboard/analytics

### Supabase (Database)

**Purpose:** Monitor database performance and health

**Key Metrics to Monitor:**

1. **Database Performance:**
   - Query execution time
   - Slow queries (> 1 second)
   - Connection count
   - Database size
   - Table sizes

2. **Database Health:**
   - CPU usage (should be < 70%)
   - Memory usage (should be < 80%)
   - Disk usage (should be < 80%)
   - Connection pool saturation

3. **Database Activity:**
   - Queries per second
   - Active connections
   - Idle connections
   - Failed queries

**Supabase Dashboard:** https://app.supabase.com/project/[project]/database

**Alerts to Configure:**

1. **High CPU Alert:**
   - Trigger: CPU > 80% for 10 minutes
   - Action: Optimize queries or upgrade plan

2. **High Memory Alert:**
   - Trigger: Memory > 90% for 10 minutes
   - Action: Check for memory leaks or upgrade plan

3. **Slow Query Alert:**
   - Trigger: Query > 5 seconds
   - Action: Optimize query or add indexes

4. **Connection Pool Alert:**
   - Trigger: Connections > 80% of pool size
   - Action: Investigate connection leaks or increase pool size

**Daily Database Checks:**

```bash
# Connect to database
psql $DATABASE_URL

# Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check slow queries (requires pg_stat_statements extension)
SELECT
  mean_exec_time,
  calls,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check active connections
SELECT count(*) FROM pg_stat_activity;
```

### UptimeRobot (Uptime Monitoring)

**Purpose:** Get alerted immediately if your site goes down

**Setup:**

1. Create UptimeRobot account: https://uptimerobot.com
2. Add HTTP(S) monitor for your health endpoint:
   - URL: `https://yourdomain.com/api/health`
   - Interval: 5 minutes
   - Alert contacts: Your email + SMS (optional)

**Monitors to Create:**

1. **Main Site Monitor:**
   - URL: `https://yourdomain.com`
   - Type: HTTPS
   - Keyword: Check for specific text on homepage

2. **Health Endpoint Monitor:**
   - URL: `https://yourdomain.com/api/health`
   - Type: HTTPS
   - Expected response: 200 OK

3. **API Endpoint Monitor:**
   - URL: `https://yourdomain.com/api/lessons`
   - Type: HTTPS
   - Expected response: 200 OK

**Alert Configuration:**

- **Downtime Alert:** Send immediately if site is down
- **Performance Alert:** Alert if response time > 5 seconds
- **Recovery Alert:** Notify when site comes back online

---

## 📈 Business Monitoring

### Key Performance Indicators (KPIs)

**User Acquisition:**

- New signups per day
- Signup conversion rate (visitors → signups)
- Signup sources (organic, referral, etc.)

**User Activation:**

- Email verification rate
- First lesson completion rate
- Time to first review session

**User Engagement:**

- Daily active users (DAU)
- Average session duration
- Lessons completed per user per week
- Review sessions per user per week

**User Retention:**

- Day 1 retention: % of users who return the next day
- Day 7 retention: % of users who return after 7 days
- Day 30 retention: % of users who return after 30 days
- Monthly churn rate

**Learning Effectiveness:**

- Average card retention rate
- Grade distribution (Again, Hard, Good, Easy)
- Streak lengths
- Lessons completed per user

**Revenue (if applicable):**

- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate

### Weekly Health Report

Create a dashboard that shows:

```
📊 Weekly Health Report (Week of [Date])

👥 Users
- Total users: X (+Y% from last week)
- New signups: X
- Active users (DAU): X
- Retention (Day 7): X%

📚 Learning Activity
- Lessons completed: X
- Review sessions: X
- Cards reviewed: X
- Average accuracy: X%

⚠️ Issues
- Total errors: X (-Y% from last week)
- Critical errors: X
- Average response time: Xms
- Uptime: 99.X%

🎯 Goals
✅ Achieved: [List achievements]
🔄 In Progress: [List ongoing]
❌ Missed: [List misses]
```

---

## 🔒 Security Monitoring

### Security Checks

**Daily:**

- [ ] Check Sentry for security-related errors
- [ ] Review failed login attempts
- [ ] Check for unusual API usage patterns

**Weekly:**

- [ ] Review Supabase audit logs
- [ ] Check for exposed API keys (GitHub, GitGuardian)
- [ ] Review rate limiting logs
- [ ] Check for SQL injection attempts

**Monthly:**

- [ ] Update dependencies (`pnpm update`)
- [ ] Run security audit (`pnpm audit`)
- [ ] Review and rotate API keys
- [ ] Verify SSL/TLS certificates
- [ ] Review user permissions

### Security Alerts

**Critical (Immediate Response):**

- Database breach attempt
- Successful unauthorized access
- API key exposure
- DDoS attack

**High (Within 1 hour):**

- Multiple failed login attempts from same IP
- Unusual traffic spikes
- Suspicious database queries
- Rate limit violations

**Medium (Within 24 hours):**

- Outdated dependency with security vulnerability
- Weak password attempts
- CORS errors from unusual origins

---

## 📱 Alert Channels

### Recommended Setup

1. **Critical Alerts:** Email + SMS + Slack
2. **High Alerts:** Email + Slack
3. **Medium Alerts:** Email only
4. **Low Alerts:** Dashboard notification

### Alert Fatigue Prevention

- **Set appropriate thresholds** - Don't alert on every minor issue
- **Group related alerts** - Avoid duplicate notifications
- **Use escalation policies** - Alert team members in sequence
- **Regular alert reviews** - Disable noisy alerts
- **Auto-resolution** - Clear alerts when issues resolve

---

## 🛠️ Monitoring Tools Summary

| Tool        | Purpose            | Cost      | Setup Time |
| ----------- | ------------------ | --------- | ---------- |
| Sentry      | Error tracking     | Free tier | 15 min     |
| PostHog     | Analytics          | Free tier | 30 min     |
| Vercel      | Hosting monitoring | Included  | 0 min      |
| Supabase    | Database           | Included  | 0 min      |
| UptimeRobot | Uptime monitoring  | Free tier | 10 min     |
| Total       | -                  | $0-20/mo  | ~1 hour    |

---

## 🎯 Next Steps

1. **Set up basic monitoring:**
   - Configure Sentry error tracking
   - Set up uptime monitoring
   - Enable Vercel Analytics

2. **Configure alerts:**
   - Critical errors → Immediate notification
   - Downtime → Immediate notification
   - Performance degradation → Email

3. **Create dashboards:**
   - Weekly health report
   - User engagement metrics
   - Error trends

4. **Establish routines:**
   - Daily: Check error logs
   - Weekly: Review metrics and trends
   - Monthly: Security audit and dependency updates

5. **Document incident response:**
   - Define severity levels
   - Create runbooks for common issues
   - Establish communication protocols

---

## 📚 Additional Resources

- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [PostHog Product Analytics](https://posthog.com/docs/product-analytics)
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
- [Site Reliability Engineering (Google)](https://sre.google/books/)
