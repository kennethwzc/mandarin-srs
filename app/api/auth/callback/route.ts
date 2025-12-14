/**
 * Auth callback route
 * Handles OAuth redirects and email confirmations
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      // Redirect to login with error message
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'invalid_code')
      return NextResponse.redirect(errorUrl)
    }
  }

  // Redirect to next URL or dashboard
  return NextResponse.redirect(new URL(next, request.url))
}
