# CRITICAL: Authentication Flow Issues

## Bug Summary
Multiple authentication flow issues are preventing proper user experience:
1. After signup, users are redirected to dashboard and see "Please sign in to view your dashboard"
2. Unauthenticated users can access protected pages and see error messages instead of being redirected
3. No sign out functionality exists in the application

---

## Issue 1: Wrong Redirect After Signup + Premature Session

### Current Behavior
1. User clicks "Get Started" on homepage → goes to `/signup`
2. User fills email/password and clicks "Create Account"
3. User gets redirected to `/dashboard` (not `/login` as intended)
4. Dashboard shows: **"Please sign in to view your dashboard"**
5. User is confused - they just created an account but can't access anything

### Root Cause Analysis

**Problem 1: Supabase Creates Session Before Email Confirmation**

**File**: `lib/supabase/auth.ts:26-50`
```typescript
export async function signUp(
  email: string,
  password: string,
  metadata?: { username?: string; timezone?: string }
) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/api/auth/callback`,
    },
  })
  // ← After this, Supabase SETS A SESSION COOKIE even though email isn't confirmed!
```

When `signUp()` completes, Supabase:
- Creates the auth user
- **Sets session cookies** (even though email not confirmed)
- Returns user data

**Problem 2: Middleware Detects Cookie and Allows Access**

**File**: `middleware.ts:7-15`
```typescript
const authCookie = request.cookies.get('sb-kunqvklwntfaovoxghxl-auth-token')

const hasValidSession = !!(
  authCookie &&
  authCookie.value &&
  authCookie.value.length > 10
)
```

The middleware sees the cookie exists and thinks the user is authenticated, so when they try to go to `/login`, the middleware redirects them to `/dashboard` (line 43-46).

**Problem 3: Dashboard Isn't Really Protected**

**File**: `app/(app)/dashboard/page.tsx:71-77`
```typescript
if (!user) {
  return (
    <div className="py-12 text-center">
      <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
    </div>
  )
}
```

The dashboard page renders even for unauthenticated users, just shows a message. This is wrong - unauthenticated users should never see this page.

### Expected Behavior
1. User creates account
2. Toast shows: "Account created! Please check your email to confirm your account."
3. User is redirected to **confirmation pending page** (not login or dashboard)
4. User confirms email via link
5. User manually goes to login page
6. User logs in
7. User sees dashboard with data

---

## Issue 2: No Sign Out Functionality

### Current Behavior
- No visible sign out button anywhere in the app
- Users cannot log out once logged in
- Have to manually clear cookies to sign out

### Where Sign Out Should Be

**File**: `app/(app)/settings/page.tsx`
- Settings page exists but has no sign out button
- Only shows Profile and Preferences cards

**File**: `components/layouts/app-header.tsx:18-21`
- User button in header does nothing
- Should open dropdown menu with sign out option

**File**: `lib/hooks/use-auth.ts:53`
- `signOut` function already exists and is available
- Just needs to be wired up to UI

---

## SOLUTION 1: Fix Signup Redirect Flow

### Step 1: Create Email Confirmation Pending Page

**Create new file**: `app/(auth)/confirm-email/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [isResending, setIsResending] = useState(false)

  async function handleResendEmail() {
    if (!email) {
      toast.error('Email address not found')
      return
    }

    setIsResending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        toast.error('Failed to resend email', {
          description: error.message,
        })
      } else {
        toast.success('Confirmation email sent!', {
          description: 'Please check your inbox.',
        })
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to{' '}
            {email ? <strong>{email}</strong> : 'your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Click the link in the email to confirm your account</p>
                <p className="text-muted-foreground">
                  The link will expire in 24 hours. Check your spam folder if you don&apos;t see
                  it.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive an email?{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-primary"
              onClick={handleResendEmail}
              disabled={isResending || !email}
            >
              {isResending ? 'Sending...' : 'Resend confirmation email'}
            </Button>
          </div>

          <div className="pt-4 text-center">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 2: Update Signup Page to Redirect to Confirmation Page

**File**: `app/(auth)/signup/page.tsx`

**Change lines 56-62** from:
```typescript
toast.success('Account created!', {
  description: 'Please check your email to confirm your account.',
})

// Redirect to login
router.push('/login')
```

**To**:
```typescript
toast.success('Account created!', {
  description: 'Please check your email to confirm your account.',
})

// Redirect to email confirmation page
router.push(`/confirm-email?email=${encodeURIComponent(email)}`)
```

### Step 3: Update Middleware to Check Email Confirmation

**File**: `middleware.ts`

**Add email confirmation check** after line 15:

```typescript
const hasValidSession = !!(
  authCookie &&
  authCookie.value &&
  authCookie.value.length > 10 // Auth tokens are always long
)

// ✅ NEW: For authenticated users, verify email is confirmed
let isEmailConfirmed = false
if (hasValidSession) {
  try {
    // Parse the auth cookie to check email confirmation status
    // Note: This is a lightweight check without database query
    const cookieValue = authCookie.value
    const decoded = JSON.parse(atob(cookieValue.split('.')[1]))
    isEmailConfirmed = !!decoded.email_confirmed_at
  } catch (e) {
    console.error('[Middleware] Failed to parse auth cookie:', e)
  }
}

const isFullyAuthenticated = hasValidSession && isEmailConfirmed
```

**Update line 43** from:
```typescript
if (hasValidSession && pathname === '/login') {
```

**To**:
```typescript
if (isFullyAuthenticated && pathname === '/login') {
```

**Update line 50** from:
```typescript
if (!hasValidSession && !isPublicPath) {
```

**To**:
```typescript
if (!isFullyAuthenticated && !isPublicPath) {
```

**Add new scenario** after line 55:
```typescript
// SCENARIO 2.5: User has session but email not confirmed
// Action: Redirect to confirmation page
if (hasValidSession && !isEmailConfirmed && !isPublicPath && pathname !== '/confirm-email') {
  console.log('[Middleware] ⚠️  Session exists but email not confirmed, redirecting to confirm-email')
  const confirmUrl = new URL('/confirm-email', request.url)
  return NextResponse.redirect(confirmUrl)
}
```

### Step 4: Add Confirm Email to Public Paths

**File**: `middleware.ts:26-36`

Add `/confirm-email` to public paths:
```typescript
const publicPaths = [
  '/login',
  '/signup',
  '/auth',
  '/confirm-email',  // ✅ NEW
  '/',
  '/privacy',
  '/terms',
  '/about',
  '/pricing',
  '/api/health',
]
```

---

## SOLUTION 2: Add Sign Out Functionality

### Option A: Add Sign Out Button to Settings Page (RECOMMENDED)

**File**: `app/(app)/settings/page.tsx`

**Replace entire content** with:
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { SettingsLinkCard } from '@/components/ui/settings-link-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { signOut } = useAuth()

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SettingsLinkCard
          title="Profile"
          description="Update your profile information"
          href="/settings/profile"
          buttonText="Edit Profile"
        />

        <SettingsLinkCard
          title="Preferences"
          description="Customize your learning experience"
          href="/settings/preferences"
          buttonText="Edit Preferences"
        />
      </div>

      {/* ✅ NEW: Sign Out Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Option B: Add User Menu Dropdown to Header (ALTERNATIVE)

**File**: `components/layouts/app-header.tsx`

**Replace entire content** with:
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Bell, User, Settings, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

export function AppHeader() {
  const router = useRouter()
  const { signOut, user } = useAuth()

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out successfully')
      // signOut() already redirects to home page
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Learn Mandarin</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* ✅ NEW: User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">My Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'Loading...'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

**Note**: This requires the shadcn/ui DropdownMenu component. Check if it exists:
```bash
ls components/ui/dropdown-menu.tsx
```

If it doesn't exist, install it:
```bash
npx shadcn@latest add dropdown-menu
```

---

## SOLUTION 3: Improve Dashboard Protection

### Make Dashboard Redirect Instead of Showing Message

**File**: `app/(app)/dashboard/page.tsx`

**Change lines 71-77** from:
```typescript
if (!user) {
  return (
    <div className="py-12 text-center">
      <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
    </div>
  )
}
```

**To**:
```typescript
if (!user) {
  // This should never happen due to middleware, but just in case
  redirect('/login')
}
```

**Add import** at top:
```typescript
import { redirect } from 'next/navigation'
```

---

## Testing Checklist

### Test 1: Signup Flow
- [ ] Go to homepage and click "Get Started"
- [ ] Fill out signup form with new email/password
- [ ] Click "Create Account"
- [ ] **Verify**: Redirected to `/confirm-email` page (not dashboard)
- [ ] **Verify**: See message "Check your email"
- [ ] **Verify**: Attempting to access `/dashboard` redirects back to `/confirm-email`
- [ ] Check email and click confirmation link
- [ ] **Verify**: Redirected to `/login` (or dashboard if auto-logged in)
- [ ] Log in with credentials
- [ ] **Verify**: Dashboard loads with data

### Test 2: Sign Out from Settings
- [ ] Log in to the app
- [ ] Navigate to Settings page
- [ ] See "Sign Out" section at bottom
- [ ] Click "Sign Out" button
- [ ] **Verify**: Redirected to homepage
- [ ] **Verify**: Cannot access `/dashboard` without logging in again

### Test 3: Sign Out from Header (if Option B implemented)
- [ ] Log in to the app
- [ ] Click user icon in header
- [ ] See dropdown menu with "Sign Out"
- [ ] Click "Sign Out"
- [ ] **Verify**: Redirected to homepage
- [ ] **Verify**: Session is cleared

### Test 4: Resend Confirmation Email
- [ ] Create account but don't confirm email
- [ ] On confirmation page, click "Resend confirmation email"
- [ ] **Verify**: New email is sent
- [ ] **Verify**: Toast shows success message

### Test 5: Protected Routes
- [ ] While logged out, try to access `/dashboard`
- [ ] **Verify**: Redirected to `/login` (not shown blank dashboard)
- [ ] While logged out, try to access `/lessons`
- [ ] **Verify**: Redirected to `/login`

---

## Files to Create/Modify

### New Files
1. **`app/(auth)/confirm-email/page.tsx`** (NEW)
   - Email confirmation pending page

### Files to Modify
1. **`app/(auth)/signup/page.tsx`**
   - Change redirect from `/login` to `/confirm-email?email=...`
   - Line 62

2. **`middleware.ts`**
   - Add email confirmation check
   - Add `/confirm-email` to public paths
   - Update authentication logic
   - Lines 15-56

3. **`app/(app)/settings/page.tsx`**
   - Add sign out button
   - Convert to client component
   - Add sign out handler

4. **`components/layouts/app-header.tsx`** (OPTIONAL)
   - Add user menu dropdown with sign out
   - Requires dropdown-menu component

5. **`app/(app)/dashboard/page.tsx`**
   - Change error message to redirect
   - Lines 71-77

---

## Additional Notes

### Why Email Confirmation Check is Important

Supabase's `signUp()` creates a session immediately, even before email is confirmed. This is a security issue because:
- Unconfirmed users can access protected routes
- Bots can create accounts and spam the system
- You can't differentiate between confirmed and unconfirmed users

The middleware fix ensures only users with confirmed emails can access protected routes.

### Alternative: Disable Auto-Signin on Signup

In Supabase Dashboard → Authentication → Settings:
- Set "Enable email confirmations" to ON
- Set "Confirm email" to "Require email confirmation"
- This prevents session creation until email is confirmed

But the middleware check is still good as a safety net.

---

## Summary

**Issue 1: Signup Redirect**
- Root cause: Supabase creates session before email confirmation
- Fix: Create `/confirm-email` page and update middleware to check email confirmation

**Issue 2: No Sign Out**
- Root cause: Sign out button not implemented in UI
- Fix: Add sign out button to settings page (and optionally to header dropdown)

**Issue 3: Dashboard Shows Message Instead of Redirecting**
- Root cause: Dashboard renders for unauthenticated users
- Fix: Use `redirect()` instead of showing message

**Priority**:
1. Fix signup redirect (high priority - prevents user confusion)
2. Add sign out functionality (high priority - users can't log out)
3. Improve dashboard protection (medium priority - middleware already handles most cases)
