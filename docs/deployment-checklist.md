# Production Deployment Checklist

Complete checklist for deploying Mandarin SRS to production safely and securely.

## 📋 Pre-Deployment Checklist

### 1. Code Quality & Testing

- [ ] All tests passing locally (`pnpm test`)
- [ ] E2E tests passing (`pnpm test:e2e`)
- [ ] No TypeScript errors (`pnpm build`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Code reviewed and approved
- [ ] CHANGELOG.md updated with new version

### 2. Environment Configuration

- [ ] `.env.example` is up to date with all required variables
- [ ] Production environment variables set in Vercel dashboard:
  - [ ] `DATABASE_URL` (Supabase connection string with pooling)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (SECRET!)
  - [ ] `NEXT_PUBLIC_APP_URL` (your production domain)
  - [ ] `NEXT_PUBLIC_SENTRY_DSN` (optional)
  - [ ] `SENTRY_AUTH_TOKEN` (optional)
  - [ ] `NEXT_PUBLIC_POSTHOG_KEY` (optional)
  - [ ] `NEXT_PUBLIC_POSTHOG_HOST` (optional)
  - [ ] `STRIPE_SECRET_KEY` (optional, if using payments)
  - [ ] `STRIPE_WEBHOOK_SECRET` (optional)
  - [ ] `ANTHROPIC_API_KEY` (optional, for AI features)

### 3. Database Setup (Supabase)

- [ ] Supabase project created and upgraded to Pro plan
- [ ] Database schema deployed (`pnpm db:push`)
- [ ] Row Level Security (RLS) policies enabled on all tables
- [ ] Database indexes created for performance
- [ ] Connection pooling enabled (Transaction mode)
- [ ] Database backup schedule configured
- [ ] Sample data/lessons imported (if needed)
- [ ] Test user account created for QA

### 4. Security

- [ ] All API keys and secrets stored in Vercel environment variables
- [ ] No secrets committed to git repository
- [ ] CORS properly configured
- [ ] Rate limiting implemented on API routes
- [ ] CSP (Content Security Policy) configured in `next.config.js`
- [ ] HTTPS enforced (handled by Vercel by default)
- [ ] Authentication flows tested (login, signup, reset password)
- [ ] Email verification working

### 5. Third-Party Services

#### Sentry (Error Tracking) - Optional

- [ ] Sentry project created
- [ ] Sentry DSN added to environment variables
- [ ] Sentry auth token generated and added
- [ ] Source maps configured for error stack traces
- [ ] Error filtering configured to exclude noise

#### PostHog (Analytics) - Optional

- [ ] PostHog project created
- [ ] PostHog API key added to environment variables
- [ ] Cookie consent banner implemented
- [ ] GDPR compliance verified
- [ ] Events tested in development

#### Stripe (Payments) - Optional

- [ ] Stripe account created
- [ ] Stripe keys (live mode) added to environment variables
- [ ] Webhook endpoint registered: `https://yourdomain.com/api/stripe/webhook`
- [ ] Webhook signing secret added to environment variables
- [ ] Test payment flow completed
- [ ] Subscription plans configured

### 6. Performance Optimization

- [ ] Images optimized (using Next.js Image component)
- [ ] Fonts optimized (using `next/font`)
- [ ] Bundle size analyzed (`pnpm build && pnpm analyze`)
- [ ] Lighthouse score checked (aim for 90+ on all metrics)
- [ ] Core Web Vitals optimized (LCP, FID, CLS)
- [ ] API routes optimized for speed
- [ ] Database queries optimized (no N+1 queries)

### 7. Legal & Compliance

- [ ] Privacy Policy page created and accessible
- [ ] Terms of Service page created and accessible
- [ ] Cookie consent banner implemented
- [ ] GDPR compliance verified (for EU users)
- [ ] Email opt-out mechanism working

### 8. Monitoring & Alerts

- [ ] Uptime monitoring configured (UptimeRobot, Vercel, etc.)
- [ ] Health check endpoint working: `/api/health`
- [ ] Error alerts configured in Sentry
- [ ] Performance monitoring enabled
- [ ] Database monitoring enabled in Supabase dashboard
- [ ] Alert channels configured (email, Slack, etc.)

---

## 🚀 Deployment Process

### Step 1: Final Pre-Deployment Checks

```bash
# Run all tests
pnpm test
pnpm test:e2e

# Check for TypeScript errors
pnpm build

# Check for linting errors
pnpm lint

# Verify environment variables are set
# Check Vercel dashboard: Settings → Environment Variables
```

### Step 2: Deploy to Vercel

**Option A: GitHub Integration (Recommended)**

1. Push to `main` branch:

   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. Vercel will automatically deploy
3. Monitor deployment in Vercel dashboard

**Option B: Manual Deployment via CLI**

```bash
# Install Vercel CLI (if not already installed)
pnpm add -g vercel

# Deploy to production
vercel --prod

# Follow prompts to link project
```

### Step 3: Post-Deployment Verification

Within 5 minutes of deployment:

- [ ] Site loads correctly at production URL
- [ ] Health check endpoint responds: `curl https://yourdomain.com/api/health`
- [ ] Authentication works (login, signup, logout)
- [ ] Database connectivity confirmed (check health endpoint)
- [ ] Sentry receiving events (check Sentry dashboard)
- [ ] PostHog receiving events (check PostHog dashboard)
- [ ] No console errors in browser
- [ ] All critical user flows tested:
  - [ ] Sign up → Email verification → Login
  - [ ] Browse lessons → Start learning → Grade cards
  - [ ] Review session flow
  - [ ] Dashboard displays correctly

### Step 4: Monitoring

First 24 hours after deployment:

- [ ] Monitor error rates in Sentry
- [ ] Check performance metrics in Vercel
- [ ] Monitor database performance in Supabase
- [ ] Check uptime status
- [ ] Review user feedback/support tickets

### Step 5: Rollback Plan (If Needed)

If critical issues are found:

1. **Immediate rollback:**

   ```bash
   # Via Vercel dashboard: Deployments → Previous deployment → Promote to Production
   # Or via CLI:
   vercel rollback
   ```

2. **Fix issues locally:**

   ```bash
   # Create hotfix branch
   git checkout -b hotfix/critical-issue

   # Fix the issue
   # ... make changes ...

   # Test thoroughly
   pnpm test && pnpm test:e2e

   # Merge and deploy
   git checkout main
   git merge hotfix/critical-issue
   git push origin main
   ```

---

## 🎯 Go-Live Checklist

Final checklist before announcing to users:

- [ ] All deployment steps completed successfully
- [ ] All post-deployment checks passed
- [ ] Critical user flows tested by QA
- [ ] Error monitoring working
- [ ] Performance metrics acceptable
- [ ] Legal pages accessible
- [ ] Support channels ready (email, docs, etc.)
- [ ] Marketing materials prepared (if applicable)
- [ ] Team notified of go-live
- [ ] Incident response plan documented

---

## 📊 Success Metrics

Track these metrics post-deployment:

### Technical Metrics

- **Uptime:** Target 99.9% (< 45 minutes downtime/month)
- **Response Time:** P95 < 200ms for API routes
- **Error Rate:** < 0.1% of requests
- **Lighthouse Score:** > 90 on all metrics
- **Core Web Vitals:**
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1

### Business Metrics

- User signup rate
- User retention (Day 1, Day 7, Day 30)
- Lesson completion rate
- Review session completion rate
- User engagement (daily active users)

---

## 🆘 Incident Response

If something goes wrong:

1. **Assess severity:**
   - Critical: Site down, data loss, security breach → Rollback immediately
   - High: Major feature broken, performance degraded → Fix within 1 hour
   - Medium: Minor bug, UI issue → Fix within 24 hours
   - Low: Cosmetic issue, feature request → Schedule for next release

2. **Communicate:**
   - Post status update (Twitter, status page, etc.)
   - Notify affected users (if applicable)
   - Keep team informed

3. **Fix and verify:**
   - Implement fix
   - Test thoroughly
   - Deploy hotfix
   - Verify resolution

4. **Post-mortem:**
   - Document what happened
   - Identify root cause
   - Implement preventive measures
   - Update runbooks/documentation

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform/going-into-prod)
- [Sentry Best Practices](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [PostHog GDPR Guide](https://posthog.com/docs/privacy/gdpr-compliance)

---

## ✅ Sign-Off

Deployment completed by: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date/Time: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Deployment URL: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Git commit: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Verified by: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Issues found: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**Status: 🎉 READY FOR PRODUCTION**
