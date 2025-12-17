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
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        // Redirect to login with error message
        const errorUrl = new URL('/login', request.url)
        errorUrl.searchParams.set('error', 'invalid_code')
        return NextResponse.redirect(errorUrl)
      }

      // Verify email was actually confirmed by Supabase
      if (data.user && !data.user.email_confirmed_at) {
        console.error('❌ Email confirmation failed - email_confirmed_at not set', {
          userId: data.user.id,
          email: data.user.email,
        })
        const errorUrl = new URL('/login', request.url)
        errorUrl.searchParams.set('error', 'verification_failed')
        errorUrl.searchParams.set(
          'message',
          'Email verification incomplete. Please try again or contact support.'
        )
        return NextResponse.redirect(errorUrl)
      }

      console.log('✅ Email verified successfully:', {
        userId: data.user?.id,
        email: data.user?.email,
        confirmedAt: data.user?.email_confirmed_at,
      })

      // Check if profile exists, create if not
      if (data.user) {
        const { getUserProfile, createUserProfile } = await import('@/lib/db/queries')

        try {
          const existingProfile = await getUserProfile(data.user.id)

          if (!existingProfile) {
            console.log('Profile not found for user, creating...', data.user.id)

            await createUserProfile(
              data.user.id,
              data.user.email || '',
              data.user.user_metadata?.username
            )
            console.log('Profile created successfully for user:', data.user.id)
          }
        } catch (profileError) {
          // Enhanced error logging
          console.error('❌ CRITICAL: Failed to create profile:', {
            userId: data.user.id,
            email: data.user.email,
            error: profileError instanceof Error ? profileError.message : profileError,
            stack: profileError instanceof Error ? profileError.stack : undefined,
          })

          // Redirect to email-verified page with error parameter
          // This shows user that email verification succeeded but profile setup failed
          const verifiedUrl = new URL('/email-verified', request.url)
          verifiedUrl.searchParams.set('error', 'profile_setup_incomplete')
          return NextResponse.redirect(verifiedUrl)
        }
      }

      // Success - redirect to email verification success page
      // This provides clear feedback that verification was successful
      const successUrl = new URL('/email-verified', request.url)
      return NextResponse.redirect(successUrl)
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
