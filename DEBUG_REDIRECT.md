# Debugging Authentication Redirect Issue

## Current Status

- Redirect log appears: `[Login] Redirecting to: /dashboard`
- But page stays on `/login` instead of navigating to `/dashboard`

## Enhanced Debugging Added

The login page now includes:

1. **Session verification** with retry logic (up to 5 attempts)
2. **Cookie checking** to verify cookies are set
3. **Detailed logging** at each step
4. **Using `window.location.replace()`** for more forceful redirect

## What to Check

### 1. Browser Console (F12)

After clicking "Sign In", you should see:

```
[Login] Session verified, cookies should be set
[Login] Cookies present: true/false
[Login] All cookies: [cookie string]
[Login] Redirecting to: /dashboard
[Login] Current URL: http://localhost:3000/login
[Login] Session verified: true/false
[Login] Has auth cookies: true/false
```

**Look for:**

- Does it say "Session verified"?
- Does it say "Cookies present: true"?
- Any JavaScript errors?

### 2. Server Console (Terminal running `npm run dev`)

When redirect happens, you should see:

```
[Middleware] Path: /dashboard
[Middleware] Has session: true/false
[Middleware] Cookie count: X
```

**Critical Check:**

- If `[Middleware] Has session: false` → Cookies aren't being sent to server
- If `[Middleware] Has session: true` → Middleware should allow access

### 3. Network Tab (F12 → Network)

After clicking "Sign In":

1. Look for a request to `/dashboard`
2. Check the **Request Headers** → **Cookie** header
3. Do you see Supabase cookies? (should start with `sb-` or `supabase.auth`)

## Possible Issues

### Issue 1: Cookies Not Being Set

**Symptoms:**

- Browser console shows "Cookies present: false"
- Server console shows "Has session: false"

**Solution:**

- Check if Supabase client is properly configured
- Verify environment variables are set
- Check browser console for Supabase errors

### Issue 2: Cookies Not Being Sent

**Symptoms:**

- Browser console shows "Cookies present: true"
- Server console shows "Has session: false"
- Network tab shows no cookies in request headers

**Solution:**

- Cookies might have `SameSite` or `Secure` restrictions
- Check cookie attributes in Application tab → Cookies
- Try clearing browser cookies and trying again

### Issue 3: Middleware Redirecting Back

**Symptoms:**

- Server console shows redirect loop
- Multiple requests to `/dashboard` and `/login`

**Solution:**

- Check middleware logic
- Verify session detection is working

### Issue 4: JavaScript Error Preventing Redirect

**Symptoms:**

- Browser console shows JavaScript error
- Redirect log doesn't appear

**Solution:**

- Fix the JavaScript error
- Check for syntax errors in login page

## Next Steps

1. **Check browser console** - Look for the detailed logs
2. **Check server console** - Look for middleware logs
3. **Check Network tab** - Verify cookies are in request headers
4. **Share the logs** - Copy/paste the console output

## Expected Behavior

When working correctly:

1. User clicks "Sign In"
2. Authentication succeeds
3. Session is verified (browser console shows "Session verified")
4. Cookies are checked (browser console shows "Cookies present: true")
5. Redirect executes: `window.location.replace('/dashboard')`
6. Browser navigates to `/dashboard`
7. Middleware detects session (server console shows "Has session: true")
8. User sees dashboard page

## If Still Not Working

If after checking all the above, the redirect still doesn't work:

1. **Try manual navigation**: In browser console, type:

   ```javascript
   window.location.href = '/dashboard'
   ```

   - If this works → The redirect code has an issue
   - If this doesn't work → Middleware is blocking (check server logs)

2. **Check cookie attributes**: In browser DevTools → Application → Cookies
   - Look for cookies starting with `sb-` or `supabase`
   - Check their attributes (SameSite, Secure, HttpOnly)
   - HttpOnly cookies can't be read via `document.cookie` (this is normal)

3. **Clear everything and retry**:

   ```bash
   # Clear Next.js cache
   rm -rf .next

   # Restart dev server
   npm run dev

   # Clear browser cache and cookies
   # Then try login again
   ```
