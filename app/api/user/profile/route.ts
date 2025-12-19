/**
 * User Profile API Route
 *
 * Handles fetching and updating user profile data.
 * NOTE: Currently a stub - profile operations are handled via Supabase directly.
 *
 * Dependencies: supabase, db/queries
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/db/queries'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/user/profile
 * Returns the current user's profile
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(user.id)

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        currentStreak: profile.current_streak,
        longestStreak: profile.longest_streak,
        createdAt: profile.created_at,
      },
    })
  } catch (error) {
    logger.error('Error fetching profile', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

/**
 * PATCH /api/user/profile
 * Updates the current user's profile
 *
 * TODO (Q1 2025): Implement profile update with Zod validation
 * - Allow updating username
 * - Allow updating timezone preference
 * - Allow updating notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await request.json()

    // NOTE: Profile updates are currently handled via Supabase dashboard
    // Full implementation pending product requirements for user-editable fields
    return NextResponse.json({
      success: true,
      message: 'Profile update not yet implemented',
    })
  } catch (error) {
    logger.error('Error updating profile', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      {
        error:
          'Failed to update profile. Please try again or contact support if the issue persists.',
      },
      { status: 500 }
    )
  }
}
