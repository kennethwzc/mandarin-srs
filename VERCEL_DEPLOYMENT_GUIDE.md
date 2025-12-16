# 🚀 Vercel Deployment Guide - Mandarin SRS

**Quick Start Guide to Deploy Your App on Vercel**

---

## ✅ Prerequisites Checklist

Before deploying, make sure you have:

- [x] GitHub repository with your code pushed
- [x] Supabase project set up with database
- [ ] Vercel account (free or paid)
- [ ] Domain name (optional, Vercel provides free subdomain)

---

## 📋 Step-by-Step Deployment

### Step 1: Create Vercel Account & Link GitHub

1. **Go to Vercel:** https://vercel.com/signup
2. **Sign up with GitHub** (recommended for auto-deployments)
3. **Authorize Vercel** to access your GitHub repositories

### Step 2: Import Your Project

1. **Click "Add New Project"** on Vercel dashboard
2. **Import your GitHub repository:**
   - Search for: `kennethwzc/mandarin-srs`
   - Click "Import"

3. **Configure Project Settings:**
   
   ```
   Framework Preset: Next.js (auto-detected)
   Root Directory: ./
   Build Command: pnpm build (auto-detected)
   Output Directory: .next (auto-detected)
   Install Command: pnpm install (auto-detected)
   ```

4. **DON'T DEPLOY YET!** Click "Configure Project" first

### Step 3: Set Up Environment Variables (CRITICAL!)

Click **"Environment Variables"** section before deploying.

#### Required Variables (MUST SET):

Copy these from your Supabase dashboard:

```bash
# === SUPABASE (REQUIRED) ===
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === DATABASE (REQUIRED) ===
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1

# === APP CONFIG (REQUIRED) ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Where to find these:**

1. **Supabase Dashboard:** https://app.supabase.com/project/[your-project]/settings/api
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` → service_role key (⚠️ SECRET!)

2. **Database URL:** Settings → Database → Connection String (Transaction mode)

#### Optional Variables (Recommended for Production):

```bash
# === SENTRY ERROR TRACKING (Optional) ===
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
SENTRY_AUTH_TOKEN=[your-token]
SENTRY_ORG=your-organization
SENTRY_PROJECT=your-project

# === POSTHOG ANALYTICS (Optional) ===
NEXT_PUBLIC_POSTHOG_KEY=phc_[your-key]
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# === FEATURE FLAGS ===
NEXT_PUBLIC_ENABLE_STRIPE=false
NEXT_PUBLIC_ENABLE_AI_FEATURES=false
```

**Important Notes:**
- Set **ALL** variables to apply to: **Production, Preview, and Development**
- Check the box for all three environments
- Keep `SUPABASE_SERVICE_ROLE_KEY` **SECRET** - never expose it!

### Step 4: Configure Supabase Auth Redirects

Before deploying, update Supabase auth settings:

1. **Go to Supabase Dashboard:** https://app.supabase.com/project/[your-project]/auth/url-configuration

2. **Add Redirect URLs:**
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/*
   http://localhost:3000/auth/callback (for local dev)
   ```

3. **Set Site URL:**
   ```
   https://your-app.vercel.app
   ```

4. **Save changes**

### Step 5: Deploy! 🚀

1. **Click "Deploy"** button on Vercel
2. **Wait 2-5 minutes** for build to complete
3. **Watch the logs** for any errors

**Expected output:**
```
✓ Building...
✓ Linting...
✓ Type checking...
✓ Compiling...
✓ Deployment complete!
```

### Step 6: Post-Deployment Verification

Once deployed, **immediately test these:**

#### 1. Health Check
```bash
curl https://your-app.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-16T...",
  "database": "connected",
  "environment": "production"
}
```

#### 2. Test Critical Flows

Visit your app and test:

- [ ] Homepage loads
- [ ] Sign up form works
- [ ] Email verification email arrives
- [ ] Login works after verification
- [ ] Dashboard displays correctly
- [ ] Can browse lessons
- [ ] Can start a lesson
- [ ] Can complete reviews
- [ ] Cookie banner appears (GDPR)
- [ ] No console errors in browser DevTools

#### 3. Monitor First Hour

Check these dashboards:

- **Vercel:** https://vercel.com/[your-org]/[your-app] → Analytics
- **Supabase:** https://app.supabase.com/project/[your-project] → Database → Logs
- **Sentry** (if configured): Check for errors
- **Browser Console:** Open DevTools, check for errors

---

## 🔄 Automatic Deployments

After initial setup, Vercel will **automatically deploy** when you:

1. **Push to `main` branch** → Production deployment
2. **Create a pull request** → Preview deployment
3. **Push to any branch** → Development preview

**To deploy manually:**
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

**Vercel will:**
1. Detect the push
2. Run tests (via GitHub Actions)
3. Build the app
4. Deploy automatically (if tests pass)
5. Send you a notification

---

## 🛠️ Common Issues & Solutions

### ❌ Build Fails: "Invalid environment variables"

**Solution:** Check that ALL required env vars are set in Vercel:
1. Go to: Vercel Dashboard → Settings → Environment Variables
2. Verify `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, etc. are set
3. Click "Redeploy" after adding variables

### ❌ Database Connection Error

**Problem:** `DATABASE_URL` is wrong or database is paused

**Solutions:**
1. Check Supabase project is **not paused** (free tier pauses after 1 week inactivity)
2. Verify connection string uses **port 5432** (or 6543 for pooling)
3. Ensure database is in **same region** as Vercel deployment
4. Test connection: Run health check endpoint

### ❌ Authentication Doesn't Work

**Problem:** Redirect URLs not configured

**Solution:**
1. Go to Supabase → Authentication → URL Configuration
2. Add your Vercel URL: `https://your-app.vercel.app/auth/callback`
3. Save and redeploy

### ❌ "This site can't be reached"

**Problem:** Deployment failed or still building

**Solutions:**
1. Check Vercel dashboard for deployment status
2. View logs: Vercel Dashboard → Deployments → [Latest] → View Logs
3. If build failed, check the error logs and fix the issue
4. Redeploy after fixing

### ❌ Slow Performance

**Solutions:**
1. Enable **Supabase Connection Pooling** (Settings → Database → Connection Pooling)
2. Use **Edge Functions** for frequently accessed data
3. Check **Vercel Analytics** for slow pages
4. Optimize **database queries** (add indexes)
5. Enable **caching** for static content

---

## 📊 Monitoring Your Production App

### Daily Checks

- [ ] **Uptime:** Vercel Dashboard → Analytics
- [ ] **Errors:** Sentry Dashboard (if configured)
- [ ] **Database Health:** Supabase Dashboard → Database

### Weekly Checks

- [ ] **Performance:** Vercel Analytics → Speed Insights
- [ ] **User Analytics:** PostHog Dashboard (if configured)
- [ ] **Database Size:** Supabase → Database → Database Size
- [ ] **Logs:** Check for recurring errors

### Monthly Tasks

- [ ] **Update dependencies:** `pnpm update` + redeploy
- [ ] **Security audit:** `pnpm audit`
- [ ] **Review error trends** in Sentry
- [ ] **Optimize slow queries** based on logs
- [ ] **Backup database** (Supabase does this automatically on Pro plan)

---

## 🎯 Production Readiness Checklist

Before announcing to users:

### Security
- [ ] All secrets stored in Vercel environment variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is SECRET (not in git, not in client)
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] CORS configured properly
- [ ] Rate limiting enabled

### Performance
- [ ] Lighthouse score > 90
- [ ] Response time < 200ms for API routes
- [ ] Images optimized (using Next.js Image component)
- [ ] Database queries optimized

### Legal & Compliance
- [ ] Privacy Policy accessible at `/privacy`
- [ ] Terms of Service accessible at `/terms`
- [ ] Cookie consent banner working
- [ ] GDPR compliant (for EU users)

### Monitoring
- [ ] Health check endpoint working (`/api/health`)
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (PostHog)
- [ ] Uptime monitoring configured (UptimeRobot, Better Uptime, etc.)

### Testing
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Manual QA completed
- [ ] Tested on mobile devices
- [ ] Tested on different browsers

---

## 🚨 Rollback Plan

If something goes wrong after deployment:

### Option 1: Instant Rollback via Vercel Dashboard

1. Go to: Vercel Dashboard → Deployments
2. Find the **last working deployment**
3. Click the **"..."** menu → **"Promote to Production"**
4. Previous version is now live again! ✅

### Option 2: Rollback via Git

```bash
# Find the last working commit
git log --oneline

# Revert to that commit
git revert [bad-commit-hash]

# Push to trigger new deployment
git push origin main
```

---

## 🎓 Next Steps After Deployment

### Immediate (First 24 Hours)

1. **Monitor errors closely** in Sentry/Vercel logs
2. **Test all critical flows** manually
3. **Check database performance** in Supabase
4. **Verify uptime** (should be 99.9%+)

### Week 1

1. **Set up uptime monitoring:** https://uptimerobot.com (free tier is fine)
2. **Configure alerts** for downtime/errors
3. **Review user feedback** and fix urgent issues
4. **Optimize performance** based on metrics

### Ongoing

1. **Keep dependencies updated** (security patches)
2. **Monitor and fix errors** as they arise
3. **Optimize based on user behavior** (PostHog analytics)
4. **Regular backups** (Supabase Pro does this automatically)

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Dashboard:** https://app.supabase.com
- **Your Production Docs:**
  - `docs/deployment-checklist.md`
  - `docs/PRODUCTION_SETUP_COMPLETE.md`
  - `docs/monitoring-guide.md`

---

## 💡 Pro Tips

### Custom Domain

1. Buy domain from Namecheap, Google Domains, etc.
2. Go to Vercel → Settings → Domains
3. Add your domain: `yourdomain.com`
4. Follow Vercel's DNS setup instructions
5. Wait 24-48 hours for DNS propagation

### Environment-Specific Configs

**Preview Deployments (PRs):**
- Use a separate Supabase project for staging
- Set environment variables specifically for "Preview"
- Test risky changes in preview before merging to main

**Development:**
- Use `.env.local` for local development
- Never commit this file to git
- Keep separate test data from production

### Performance Optimization

**Enable caching:**
```typescript
// app/api/some-route/route.ts
export const revalidate = 60 // Cache for 60 seconds
```

**Use Vercel Edge Functions** for ultra-fast responses:
```typescript
export const runtime = 'edge'
```

**Database connection pooling:**
```
DATABASE_URL=...?pgbouncer=true&connection_limit=1
```

---

## 🎉 You're Ready to Deploy!

**Quick Command to Deploy:**

```bash
# Make sure all changes are committed
git status

# Push to main branch
git push origin main

# Vercel will automatically deploy!
# Check status: https://vercel.com/[your-org]/[your-app]
```

**Expected Timeline:**
- Build time: 2-5 minutes
- DNS propagation (custom domain): 24-48 hours
- First real users: Whenever you're ready! 🚀

---

## 📞 Need Help?

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **GitHub Issues:** https://github.com/kennethwzc/mandarin-srs/issues
- **Documentation:** Check the `docs/` folder for detailed guides

---

**Good luck with your launch! 🎉**

Remember: Start small, monitor closely, and iterate based on user feedback.
