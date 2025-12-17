/**
 * Health check endpoint for profile creation system
 *
 * Monitors:
 * - Service role key configuration
 * - Users without profiles
 * - Overall system health
 *
 * Usage:
 * - Set up monitoring (Pingdom, UptimeRobot, etc.) to call this endpoint
 * - Alert if status is "warning" or "error"
 * - Run manually to debug profile creation issues
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface HealthCheckResponse {
  status: 'healthy' | 'warning' | 'error'
  timestamp: string
  checks: {
    serviceKey: boolean
    confirmedUsers: number | null
    profilesCount: number | null
    usersWithoutProfiles: number | null
  }
  message: string
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Check 1: Service role key configured
    if (!supabaseUrl || !serviceKey) {
      const response: HealthCheckResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
        checks: {
          serviceKey: false,
          confirmedUsers: null,
          profilesCount: null,
          usersWithoutProfiles: null,
        },
        message: '❌ Service role key or Supabase URL not configured',
      }

      return NextResponse.json(response, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check 2: Count users without profiles
    try {
      // Get all users
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()

      if (usersError) {
        throw new Error(`Failed to list users: ${usersError.message}`)
      }

      const confirmedUsers = usersData?.users.filter((u) => u.email_confirmed_at) || []

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
      }

      const usersWithoutProfiles = confirmedUsers.length - (profiles?.length || 0)

      // Determine health status
      const isHealthy = usersWithoutProfiles === 0
      const status = isHealthy ? 'healthy' : 'warning'

      const response: HealthCheckResponse = {
        status,
        timestamp: new Date().toISOString(),
        checks: {
          serviceKey: true,
          confirmedUsers: confirmedUsers.length,
          profilesCount: profiles?.length || 0,
          usersWithoutProfiles,
        },
        message:
          usersWithoutProfiles > 0
            ? `⚠️ ${usersWithoutProfiles} confirmed user(s) without profiles`
            : '✅ All confirmed users have profiles',
      }

      return NextResponse.json(response, { status: isHealthy ? 200 : 500 })
    } catch (queryError) {
      const response: HealthCheckResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
        checks: {
          serviceKey: true,
          confirmedUsers: null,
          profilesCount: null,
          usersWithoutProfiles: null,
        },
        message: `❌ Database query failed: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`,
      }

      return NextResponse.json(response, { status: 500 })
    }
  } catch (error) {
    const response: HealthCheckResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      checks: {
        serviceKey: false,
        confirmedUsers: null,
        profilesCount: null,
        usersWithoutProfiles: null,
      },
      message: `❌ Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }

    return NextResponse.json(response, { status: 500 })
  }
}

