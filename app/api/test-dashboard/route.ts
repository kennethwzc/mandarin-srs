/**
 * TEST ENDPOINT: Diagnose Dashboard Issues
 *
 * Visit: https://mandarin-srs.vercel.app/api/test-dashboard
 *
 * This will show exactly what's failing in the dashboard API
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const diagnostics: Record<string, unknown> = {}

  try {
    // Step 1: Check authentication
    diagnostics.step1_auth = 'Starting...'
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      diagnostics.step1_auth = { status: '❌ FAILED', error: authError.message }
      return NextResponse.json({ diagnostics }, { status: 500 })
    }

    if (!user) {
      diagnostics.step1_auth = { status: '❌ FAILED', error: 'No user found' }
      return NextResponse.json({ diagnostics }, { status: 401 })
    }

    diagnostics.step1_auth = {
      status: '✅ SUCCESS',
      userId: user.id,
      email: user.email,
    }

    // Step 2: Check profile
    diagnostics.step2_profile = 'Starting...'
    try {
      const { getUserProfile } = await import('@/lib/db/queries')
      const profile = await getUserProfile(user.id)

      if (!profile) {
        diagnostics.step2_profile = { status: '❌ FAILED', error: 'Profile not found' }
      } else {
        diagnostics.step2_profile = {
          status: '✅ SUCCESS',
          profileId: profile.id,
          email: profile.email,
        }
      }
    } catch (error) {
      diagnostics.step2_profile = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      }
    }

    // Step 3: Check database connection
    diagnostics.step3_database = 'Starting...'
    try {
      const { getDashboardStats } = await import('@/lib/db/queries')
      const stats = await getDashboardStats(user.id)

      diagnostics.step3_database = {
        status: '✅ SUCCESS',
        stats: {
          totalItemsLearned: stats.totalItemsLearned,
          reviewsDue: stats.reviewsDue,
          currentStreak: stats.currentStreak,
        },
      }
    } catch (error) {
      diagnostics.step3_database = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      }
    }

    // Step 4: Check environment variables
    diagnostics.step4_env = {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING',
    }

    // Step 5: Check daily stats
    diagnostics.step5_daily_stats = 'Starting...'
    try {
      const { getDailyStatsRange } = await import('@/lib/db/queries')
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      const dailyStats = await getDailyStatsRange(user.id, startDate, endDate)

      diagnostics.step5_daily_stats = {
        status: '✅ SUCCESS',
        statsCount: dailyStats.length,
      }
    } catch (error) {
      diagnostics.step5_daily_stats = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      }
    }

    return NextResponse.json(
      {
        message: 'Dashboard diagnostics complete',
        overallStatus: 'Check individual steps for details',
        diagnostics,
      },
      { status: 200 }
    )
  } catch (error) {
    diagnostics.unexpected_error = {
      error: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    }

    return NextResponse.json(
      {
        message: 'Unexpected error during diagnostics',
        diagnostics,
      },
      { status: 500 }
    )
  }
}
