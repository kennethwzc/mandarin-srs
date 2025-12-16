import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the Supabase auth cookie - check both cookie existence AND value
  const authCookie = request.cookies.get('sb-kunqvklwntfaovoxghxl-auth-token')

  // CRITICAL FIX: Check that cookie has a valid value, not just that it exists
  const hasValidSession = !!(
    authCookie &&
    authCookie.value &&
    authCookie.value.length > 10 // Auth tokens are always long
  )

  // Enhanced logging for debugging
  console.log('[Middleware] ========================================')
  console.log('[Middleware] Path:', pathname)
  console.log('[Middleware] Cookie exists:', !!authCookie)
  console.log('[Middleware] Cookie value length:', authCookie?.value?.length || 0)
  console.log('[Middleware] Has valid session:', hasValidSession)
  console.log('[Middleware] ========================================')

  // Define public routes that don't require authentication
  const publicPaths = [
    '/login',
    '/signup',
    '/auth',
    '/',
    '/privacy',
    '/terms',
    '/about',
    '/pricing',
    '/api/health',
  ]
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  // SCENARIO 1: Authenticated user trying to access login page
  // Action: Redirect to dashboard (prevents authenticated users from seeing login)
  if (hasValidSession && pathname === '/login') {
    console.log('[Middleware] ✅ Authenticated user on login, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // SCENARIO 2: Unauthenticated user trying to access protected route
  // Action: Redirect to login with return path
  if (!hasValidSession && !isPublicPath) {
    console.log('[Middleware] ❌ No valid session on protected route, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // SCENARIO 3: Valid request, allow it through
  console.log('[Middleware] ✅ Allowing access to:', pathname)
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
