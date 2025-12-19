/**
 * Auth Callback Route
 *
 * Handles OAuth redirects and email confirmations from Supabase Auth.
 * Exchanges authorization codes for sessions and creates user profiles.
 *
 * Dependencies: supabase, db/queries
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
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
        logger.error('Error exchanging code for session', {
          error: exchangeError.message,
        })
        // Redirect to login with error message
        const errorUrl = new URL('/login', request.url)
        errorUrl.searchParams.set('error', 'invalid_code')
        return NextResponse.redirect(errorUrl)
      }

      // Verify email was actually confirmed by Supabase
      if (data.user && !data.user.email_confirmed_at) {
        logger.error('Email confirmation failed - email_confirmed_at not set', {
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

      logger.info('Email verified successfully', {
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
            logger.info('Profile not found for user, creating...', { userId: data.user.id })

            await createUserProfile(
              data.user.id,
              data.user.email || '',
              data.user.user_metadata?.username
            )
            logger.info('Profile created successfully for user', { userId: data.user.id })
          }
        } catch (profileError) {
          logger.error('Failed to create profile', {
            userId: data.user.id,
            email: data.user.email,
            error: profileError instanceof Error ? profileError.message : String(profileError),
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
      logger.error('Unexpected error in callback', {
        error: err instanceof Error ? err.message : String(err),
      })
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
