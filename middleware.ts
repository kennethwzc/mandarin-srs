import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

// Auth cache: Reduces redundant getUser() calls within 30-second window
// This significantly improves performance for rapid successive requests
const authCache = new Map<
  string,
  { user: User | null; error: Error | null; expires: number; confirmed: boolean }
>()

// Cache TTL: 30 seconds (balance between performance and freshness)
const AUTH_CACHE_TTL_MS = 30000

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {
          // Middleware cannot set cookies, ignore
        },
        remove() {
          // Middleware cannot remove cookies, ignore
        },
      },
    }
  )

  // Extract session token for cache key
  const sessionToken = request.cookies.get('sb-access-token')?.value || 'anonymous'
  const cacheKey = `auth:${sessionToken}`

  // Check cache first
  const cached = authCache.get(cacheKey)
  let user: User | null = null
  let userError: Error | null = null

  if (cached && cached.expires > Date.now()) {
    // Cache hit - use cached auth result
    user = cached.user
    userError = cached.error
  } else {
    // Cache miss - fetch from Supabase
    const result = await supabase.auth.getUser()
    user = result.data.user
    userError = result.error

    // Store in cache
    authCache.set(cacheKey, {
      user,
      error: userError,
      expires: Date.now() + AUTH_CACHE_TTL_MS,
      confirmed: !!user?.email_confirmed_at,
    })

    // Cleanup old cache entries (prevent memory leak)
    if (authCache.size > 1000) {
      const now = Date.now()
      for (const [key, value] of authCache.entries()) {
        if (value.expires < now) {
          authCache.delete(key)
        }
      }
    }
  }

  const hasValidSession = !!user && !userError
  const isEmailConfirmed = !!user?.email_confirmed_at
  const isFullyAuthenticated = hasValidSession && isEmailConfirmed

  // Only log in development mode to reduce production overhead
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    console.log('[Middleware] Path:', pathname, '| Auth:', isFullyAuthenticated ? '✅' : '❌')
  }

  // Define public routes that don't require authentication
  const publicPaths = [
    '/login',
    '/signup',
    '/auth',
    '/confirm-email',
    '/email-verified', // Allow users to see verification success page
    '/',
    '/privacy',
    '/terms',
    '/about',
    '/pricing',
    '/api/health',
    '/api/test-utils', // Test utility endpoints for E2E tests
    '/api/lessons', // Static lesson data (cached)
    '/api/reviews/upcoming', // Upcoming reviews (can be cached)
  ]
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  // SCENARIO 1: Fully authenticated user trying to access login page
  // Action: Redirect to dashboard (prevents authenticated users from seeing login)
  if (isFullyAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // SCENARIO 2: User has session but email not confirmed
  // Action: Redirect to confirmation page (except if already there)
  if (hasValidSession && !isEmailConfirmed && !isPublicPath && pathname !== '/confirm-email') {
    return NextResponse.redirect(new URL('/confirm-email', request.url))
  }

  // SCENARIO 3: Unauthenticated user trying to access protected route
  // Action: Redirect to login with return path
  if (!isFullyAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // SCENARIO 4: Valid request, allow it through
  return NextResponse.next()
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
