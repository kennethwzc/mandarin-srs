/**
 * Next.js Middleware for Authentication
 *
 * Handles auth checks and redirects for protected routes.
 * Uses Supabase SSR for server-side session validation.
 *
 * Design decisions:
 * - No caching: Auth state must be fresh to prevent stale session bugs
 * - Fail-safe: When in doubt, redirect to login (better UX than showing errors)
 * - Simple: Less code = fewer bugs
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Public routes that don't require authentication
 * Keep this list minimal - only truly public pages
 */
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/auth',
  '/confirm-email',
  '/email-verified',
  '/',
  '/privacy',
  '/terms',
  '/about',
  '/pricing',
  '/api/health',
  '/api/test-utils',
] as const

/**
 * Check if a pathname is a public route
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))
}

/**
 * Check if a pathname is a static asset (should skip middleware entirely)
 * This is a backup - the matcher config should already exclude these
 */
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Has file extension
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets (backup check)
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  // Create Supabase client for middleware
  // Note: This client cannot set cookies (middleware limitation)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {
          // Middleware cannot set cookies - handled by server actions/API routes
        },
        remove() {
          // Middleware cannot remove cookies - handled by server actions/API routes
        },
      },
    }
  )

  // Get current user - always fetch fresh (no caching)
  // This ensures we never have stale auth state
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Determine auth state
  const hasValidSession = !!user && !authError
  const isEmailConfirmed = !!user?.email_confirmed_at
  const isFullyAuthenticated = hasValidSession && isEmailConfirmed
  const isPublic = isPublicPath(pathname)

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[Middleware]',
      pathname,
      '| User:',
      user?.email ?? 'none',
      '| Auth:',
      isFullyAuthenticated ? '✅' : '❌'
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ROUTING LOGIC
  // Order matters: check most specific conditions first
  // ─────────────────────────────────────────────────────────────────────────────

  // CASE 1: Authenticated user on login page → Redirect to dashboard
  // Prevents seeing login form when already logged in
  if (isFullyAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // CASE 2: User has session but email not confirmed → Redirect to confirm page
  // Except if they're on public paths or already on confirm page
  if (hasValidSession && !isEmailConfirmed && !isPublic && pathname !== '/confirm-email') {
    return NextResponse.redirect(new URL('/confirm-email', request.url))
  }

  // CASE 3: Public path → Allow through (no auth required)
  if (isPublic) {
    return NextResponse.next()
  }

  // CASE 4: Protected path without authentication → Redirect to login
  // This is the fail-safe: any unhandled case redirects to login
  if (!isFullyAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the original destination for redirect after login
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // CASE 5: Authenticated user on protected path → Allow through
  return NextResponse.next()
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE MATCHER CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public files with extensions (images, fonts, etc.)
     * - sw.js (service worker)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
