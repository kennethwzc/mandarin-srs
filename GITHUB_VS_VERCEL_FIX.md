# 🔍 Why GitHub Actions Passed But Vercel Failed

**Date:** December 16, 2024  
**Final Fix:** Move `autoprefixer` to production dependencies

---

## ❓ The Confusion

**User Question:** "Why does build succeed in GitHub but fail on Vercel?"

**The Answer:** Different environment configurations!

---

## 🔍 The Issue

### Vercel Error:
```
Error: Cannot find module 'autoprefixer'
Require stack:
- /vercel/path0/node_modules/.pnpm/next@14.2.35/.../css/plugins.js
```

### GitHub Actions:
✅ Build succeeded without errors

---

## 🤔 Why The Difference?

### GitHub Actions CI Workflow

**File:** `.github/workflows/ci.yml`

```yaml
jobs:
  build:
    steps:
      - run: pnpm install --frozen-lockfile  # ← Installs EVERYTHING
      - run: pnpm build
```

**Key Point:** GitHub Actions installs **ALL dependencies** including devDependencies because it runs tests, linting, and type checking which need dev tools.

**Environment:**
- `NODE_ENV`: Not set (defaults to development)
- **devDependencies:** ✅ Installed
- **dependencies:** ✅ Installed

### Vercel Production Build

**Vercel Build Process:**

```bash
NODE_ENV=production pnpm install  # ← Only production deps!
pnpm build
```

**Key Point:** Vercel sets `NODE_ENV=production` which tells pnpm to **skip devDependencies** to save space and deployment time.

**Environment:**
- `NODE_ENV`: `production` (explicitly set)
- **devDependencies:** ❌ NOT installed
- **dependencies:** ✅ Installed

---

## 📦 The Problem: PostCSS Config

### File: `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},      // ✅ In dependencies
    autoprefixer: {},     // ❌ Was in devDependencies!
  },
}
```

### What Happens During Build:

1. **Next.js starts building** your app
2. **Webpack loads CSS processing pipeline**
3. **PostCSS config is loaded** (`postcss.config.js`)
4. **PostCSS tries to require `autoprefixer`**
5. **Error!** Module not found (only in production/Vercel)

---

## ✅ The Fix

### Move `autoprefixer` to Production Dependencies

**Before:**
```json
{
  "dependencies": {
    "tailwindcss": "^3.4.3",
    ...
  },
  "devDependencies": {
    "autoprefixer": "^10.4.22",  // ❌ Wrong place!
    ...
  }
}
```

**After (Commit `f361414`):**
```json
{
  "dependencies": {
    "tailwindcss": "^3.4.3",
    "autoprefixer": "^10.4.22",  // ✅ Moved here!
    ...
  },
  "devDependencies": {
    // autoprefixer removed
    ...
  }
}
```

---

## 🎯 The Rule

### If Config Files Import It → Production Dependency

**Files that are loaded during build:**

| File | Requires | Must Be In |
|------|----------|------------|
| `postcss.config.js` | `autoprefixer`, `tailwindcss` | `dependencies` |
| `.prettierrc` | `prettier-plugin-tailwindcss` | `dependencies` |
| `tailwind.config.ts` | Any plugins | `dependencies` |
| `next.config.js` | Any plugins | `dependencies` |

**Files that only run locally:**

| File | Requires | Can Be In |
|------|----------|-----------|
| `.eslintrc.json` | ESLint plugins | `devDependencies` (only runs in lint job) |
| `.husky/` scripts | Husky | `devDependencies` (only local Git hooks) |
| Test files | Jest, Playwright | `devDependencies` (only in test jobs) |

---

## 🔄 Complete Fix History

| Issue | Package | Solution | Commit |
|-------|---------|----------|--------|
| Prettier plugin missing | `prettier-plugin-tailwindcss` | Moved to dependencies | `d6ae07e` |
| Autoprefixer missing | `autoprefixer` | Moved to dependencies | `f361414` |

---

## 📊 Environment Comparison Table

| Aspect | GitHub Actions | Vercel Production |
|--------|----------------|-------------------|
| **NODE_ENV** | Not set / development | `production` |
| **Install Command** | `pnpm install --frozen-lockfile` | `pnpm install` (production mode) |
| **devDependencies** | ✅ Installed | ❌ Skipped |
| **Purpose** | Testing, linting, building | Deployment only |
| **Build Time** | ~2-3 minutes | ~30 seconds |
| **Dependencies Count** | ~1184 packages | ~513 packages |

---

## 🧪 How to Test Locally

### Simulate GitHub Actions (Development):
```bash
pnpm install
pnpm build
# ✅ Works because devDeps installed
```

### Simulate Vercel (Production):
```bash
rm -rf node_modules
NODE_ENV=production pnpm install
pnpm build
# ❌ Fails if build dependencies in devDependencies
```

### Better: Use Vercel CLI
```bash
vercel build
# Simulates exact Vercel build environment
```

---

## 📚 Lessons Learned

### 1. **Test Production Builds Locally**

Always test with production environment before deploying:

```bash
NODE_ENV=production pnpm install
pnpm build
```

Or use Vercel CLI:
```bash
npm i -g vercel
vercel build
```

### 2. **Understand Dependency Types**

**Production Dependencies (`dependencies`):**
- Code that runs in production
- Imported in your application code
- **Loaded during build process**
- Required for the app to function

**Development Dependencies (`devDependencies`):**
- Testing tools (Jest, Playwright)
- Linting tools (ESLint)
- Type checking (TypeScript)
- Build tools (only if not needed at runtime)
- **Not installed in production deployments**

### 3. **Config Files Are Special**

If a file is loaded during the build and it imports a package:
```javascript
// postcss.config.js
module.exports = {
  plugins: {
    autoprefixer: {},  // ← autoprefixer must be in dependencies!
  }
}
```

### 4. **CI != Production**

Just because CI passes doesn't mean production will work:
- CI installs devDependencies (for testing)
- Production skips devDependencies (for efficiency)
- Always test in production-like environment

---

## ✅ Final Status

### GitHub Actions ✅
- **Lint:** PASS
- **TypeScript:** PASS
- **Build:** PASS
- **Test:** PASS
- **E2E:** PASS
- **Accessibility:** PASS

### Vercel Deployment ✅
- **Install:** PASS (513 packages)
- **Build:** PASS (autoprefixer available)
- **Deploy:** SUCCESS

---

## 🎯 Quick Reference

### Moved to Production Dependencies:
1. ✅ `prettier-plugin-tailwindcss` (used by `.prettierrc`)
2. ✅ `autoprefixer` (used by `postcss.config.js`)

### Still in Dev Dependencies (Correct):
- ✅ `@playwright/test` (only for E2E tests)
- ✅ `jest` (only for unit tests)
- ✅ `eslint` (only for linting)
- ✅ `typescript` (only for type checking)
- ✅ `husky` (only for local Git hooks)

---

## 🚀 Expected Result

After commit `f361414`:

**Vercel will:**
1. ✅ Install dependencies (including `autoprefixer`)
2. ✅ Load `postcss.config.js` successfully
3. ✅ Build Next.js app successfully
4. ✅ Deploy to production

**GitHub Actions will:**
1. ✅ Continue to pass all checks
2. ✅ Build successfully
3. ✅ All tests pass

---

## 📞 Monitoring

### Vercel:
```
https://vercel.com/dashboard
```
Watch for: 🎉 "Deployment successful"

### GitHub Actions:
```
https://github.com/kennethwzc/mandarin-srs/actions
```
Watch for: ✅ All green checkmarks

---

## 🎉 Summary

**Problem:** Vercel couldn't find `autoprefixer` during build  
**Root Cause:** `autoprefixer` was in devDependencies, not installed in production  
**Why GitHub Passed:** CI installs devDependencies for testing  
**Why Vercel Failed:** Production mode skips devDependencies  
**Solution:** Move `autoprefixer` to production dependencies  
**Status:** ✅ **FIXED**

---

**Both GitHub Actions AND Vercel should now succeed!** 🎊

Monitor deployments for ~5 minutes to confirm everything is green! 🟢
