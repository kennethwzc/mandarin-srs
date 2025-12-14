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
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase
  if (error) {
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl)
  }

  // Handle email verification code
  if (code) {
    const supabase = await createClient()

    try {
      // Exchange code for session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        // Redirect to login with error message
        const errorUrl = new URL('/login', request.url)
        errorUrl.searchParams.set('error', 'invalid_code')
        return NextResponse.redirect(errorUrl)
      }

      // Success - redirect to dashboard
      return NextResponse.redirect(new URL(next, request.url))
    } catch (err) {
      console.error('Unexpected error in callback:', err)
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'callback_error')
      return NextResponse.redirect(errorUrl)
    }
  }

  // No code provided - redirect to login
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('error', 'no_code')
  return NextResponse.redirect(loginUrl)
}
