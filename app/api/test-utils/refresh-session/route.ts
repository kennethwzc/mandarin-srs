/**
 * Test utility endpoint for refreshing user sessions
 * This endpoint is only available in non-production environments
 * and is used by E2E tests to force JWT claim updates after Admin API changes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production' && process.env.CI !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = await createClient()

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No active session found', details: sessionError?.message },
        { status: 401 }
      )
    }

    // Force refresh the session to get updated JWT with latest claims
    const { data, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      return NextResponse.json(
        { error: 'Session refresh failed', details: refreshError.message },
        { status: 500 }
      )
    }

    // Return success with session info
    return NextResponse.json({
      success: true,
      session: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          email_confirmed_at: data.user?.email_confirmed_at,
        },
        access_token_updated: !!data.session?.access_token,
      },
    })
  } catch (error) {
    console.error('[Test Utils] Session refresh error:', error)
    return NextResponse.json(
      {
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
