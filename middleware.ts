import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  // Get authenticated user from Supabase (this includes ALL user fields)
  // CRITICAL FIX: Use getUser() instead of parsing JWT
  // Supabase JWTs don't include email_confirmed_at by default - we must get it from user object
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

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
