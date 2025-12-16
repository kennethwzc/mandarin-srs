# 🚀 DEPLOY NOW - Click-by-Click Instructions

**I can't deploy for you directly (need your Vercel account), but follow these exact steps:**

---

## 🎯 Easiest Way - Via Browser (5 Minutes)

### 1. Open This URL:

```
https://vercel.com/new
```

### 2. Sign Up/Login

- Click **"Continue with GitHub"**
- Login with your GitHub credentials
- Authorize Vercel

### 3. Import Your Repository

You'll see a page titled "Import Git Repository"

**Find your repo:**

- Type: `mandarin-srs` in the search box
- Or scroll and find: `kennethwzc/mandarin-srs`
- Click **"Import"** button next to it

### 4. Configure Project (DO NOT DEPLOY YET!)

You'll see "Configure Project" screen:

**Project Settings (already correct):**

- ✅ Framework Preset: Next.js
- ✅ Root Directory: ./
- ✅ Build Command: pnpm build
- ✅ Output Directory: .next
- ✅ Install Command: pnpm install

**Scroll down to "Environment Variables" section**

### 5. Add Environment Variables (MOST IMPORTANT STEP!)

Click **"Environment Variables"** to expand.

**Add these 6 variables ONE BY ONE:**

#### Variable 1 - Database URL

```
Name: DATABASE_URL
Value: postgresql://postgres.mkcdbzxcqekzjnawllbu:L2q7_g_oVuWMVWz6@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

- Check all 3 boxes: ☑️ Production ☑️ Preview ☑️ Development
- Click "Add"

#### Variable 2 - Supabase URL

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://mkcdbzxcqekzjnawllbu.supabase.co
```

- Check all 3 boxes: ☑️ Production ☑️ Preview ☑️ Development
- Click "Add"

#### Variable 3 - Supabase Anon Key

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rY2RienhjeWVremp5YXdsemJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyMDgzOTAsImV4cCI6MjA0OTc4NDM5MH0.rUl5XWBw5DHiYtH0kNHKgUvITJj7vMCx9pqTOdSbvTc
```

- Check all 3 boxes: ☑️ Production ☑️ Preview ☑️ Development
- Click "Add"

#### Variable 4 - Supabase Service Role Key (SECRET!)

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rY2RienhjeWVremp5YXdsemJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDIwODM5MCwiZXhwIjoyMDQ5Nzg0MzkwfQ.DmUMLY2bjGkMbGbZi99cZPxUc-fN8aGGIiW6lw7S9oA
```

- Check all 3 boxes: ☑️ Production ☑️ Preview ☑️ Development
- Click "Add"

#### Variable 5 - Node Environment

```
Name: NODE_ENV
Value: production
```

- Check all 3 boxes: ☑️ Production ☑️ Preview ☑️ Development
- Click "Add"

#### Variable 6 - App URL (use your Vercel project name)

```
Name: NEXT_PUBLIC_APP_URL
Value: https://mandarin-srs.vercel.app
```

**Note:** Change `mandarin-srs` to whatever project name you choose!

- Check all 3 boxes: ☑️ Production ☑️ Preview ☑️ Development
- Click "Add"

### 6. Deploy!

After adding all 6 variables:

- Scroll down to the bottom
- Click the big blue **"Deploy"** button
- ☕ Wait 3-5 minutes

### 7. Success! 🎉

You'll see:

- ✅ Build logs scrolling
- ✅ "Building..." progress
- ✅ "Deployment Complete" with confetti 🎊
- Your live URL: `https://[your-project].vercel.app`

**Click the URL to visit your live app!**

---

## 📋 After Deployment Checklist

### Immediate (Next 5 Minutes):

1. **Visit your app URL**
   - Click the deployment URL Vercel shows you
   - Homepage should load

2. **Test health endpoint:**

   ```
   https://[your-project].vercel.app/api/health
   ```

   Should return: `{"status":"healthy",...}`

3. **Update Supabase Redirects**
   - Go to: https://app.supabase.com/project/mkcdbzxcqekzjnawllbu/auth/url-configuration
   - Add redirect URL: `https://[your-project].vercel.app/auth/callback`
   - Add site URL: `https://[your-project].vercel.app`
   - Click "Save"

4. **Test signup/login:**
   - Go to your app
   - Click "Sign Up"
   - Create a test account
   - Check email for verification
   - Login

5. **Check for errors:**
   - Open browser DevTools (F12)
   - Look for any red errors in Console
   - If you see errors, check Vercel logs

---

## 🆘 If Deployment Fails

### Error: "Invalid environment variables"

**Fix:** Go back to Step 5, make sure ALL 6 variables are added

### Error: "Build failed"

**Fix:** Check build logs in Vercel dashboard for specific error

### Error: "Database connection failed"

**Fix:**

1. Check DATABASE_URL is correct
2. Verify Supabase project isn't paused
3. Go to: https://app.supabase.com/project/mkcdbzxcqekzjnawllbu

### Login doesn't work

**Fix:** Update Supabase redirect URLs (see "After Deployment Checklist" #3)

---

## 🔄 Future Deployments (Automatic!)

After this first deployment, every time you:

```bash
git push origin main
```

Vercel will **automatically**:

1. Detect the push
2. Run tests via GitHub Actions
3. Build the app
4. Deploy to production
5. Email you the result

**No manual steps needed!** 🎉

---

## 📞 Need Help?

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Deployment Logs:** Click on your project → "Deployments" → Latest
- **Environment Variables:** Project Settings → Environment Variables

---

## ✅ Quick Summary

1. Go to: https://vercel.com/new
2. Login with GitHub
3. Import `kennethwzc/mandarin-srs`
4. Add 6 environment variables
5. Click "Deploy"
6. Wait 3-5 minutes
7. ✅ DONE!

**Your app will be live at:** `https://[your-project].vercel.app`

---

**Good luck! You got this!** 🚀
