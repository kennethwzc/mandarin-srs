# 🚀 Deploy to Vercel - TL;DR Quick Start

**Get your app live in 15 minutes!**

---

## ⚡ Super Quick Deployment (5 Steps)

### 1️⃣ Create Vercel Account (2 minutes)

```
1. Go to: https://vercel.com/signup
2. Sign up with GitHub
3. Authorize Vercel to access your repositories
```

### 2️⃣ Import Project (1 minute)

```
1. Click "Add New Project" in Vercel
2. Search for: kennethwzc/mandarin-srs
3. Click "Import"
4. DON'T deploy yet - click "Configure Project" first
```

### 3️⃣ Set Environment Variables (5 minutes)

**Copy these from your Supabase dashboard:**

Go to: https://app.supabase.com/project/[your-project]/settings/api

```bash
# Paste these in Vercel → Environment Variables section:
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (copy from Supabase)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (copy from Supabase - keep SECRET!)
DATABASE_URL=postgresql://postgres:... (from Supabase Settings → Database)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important:** Check all boxes (Production, Preview, Development) for each variable!

### 4️⃣ Configure Supabase Redirects (2 minutes)

Go to: https://app.supabase.com/project/[your-project]/auth/url-configuration

```
Add these redirect URLs:
✓ https://your-app-name.vercel.app/auth/callback
✓ https://your-app-name.vercel.app/*

Site URL:
✓ https://your-app-name.vercel.app
```

### 5️⃣ Deploy! (5 minutes)

```
1. Click "Deploy" button in Vercel
2. Wait 3-5 minutes for build
3. ✅ DONE!
```

---

## ✅ Quick Verification (1 minute)

After deployment completes:

```bash
# 1. Check health endpoint
curl https://your-app.vercel.app/api/health

# 2. Visit your app
# Open: https://your-app.vercel.app

# 3. Test signup/login
# Create an account and verify it works
```

---

## 🎯 What to Expect

**Build Time:** 2-5 minutes  
**URL:** `https://your-project-name.vercel.app`  
**Custom Domain:** Optional (can add later in Settings → Domains)

**After deployment:**

- Every push to `main` → Auto-deploys to production
- Every PR → Creates preview deployment
- Vercel emails you deployment status

---

## 🆘 Common Issues (Quick Fixes)

### ❌ Build fails: "Invalid environment variables"

**Fix:** Go back to Step 3, make sure ALL variables are set

### ❌ Login doesn't work

**Fix:** Go back to Step 4, add redirect URLs in Supabase

### ❌ Database error

**Fix:** Check Supabase project isn't paused (Settings → General)

---

## 🔄 Auto-Deployments After First Deploy

From now on, just:

```bash
git add .
git commit -m "feat: your change"
git push origin main

# Vercel automatically deploys! 🎉
```

**Monitor at:** https://vercel.com/dashboard

---

## 📚 Need More Details?

- **Complete Guide:** See `VERCEL_DEPLOYMENT_GUIDE.md`
- **Production Checklist:** See `docs/deployment-checklist.md`
- **Setup Docs:** See `docs/PRODUCTION_SETUP_COMPLETE.md`

---

## 🎉 Ready? Let's Go!

**Start here:** https://vercel.com/new

**Total time:** ~15 minutes from start to live! 🚀

---

**That's it!** Your app will be live on a global CDN with automatic HTTPS, DDoS protection, and edge caching.

**Welcome to production!** 🎊
