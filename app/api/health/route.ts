/**
 * Health Check Endpoint
 *
 * This endpoint is used for:
 * - Uptime monitoring (Vercel, UptimeRobot, etc.)
 * - Load balancer health checks
 * - Deployment verification
 * - System status monitoring
 *
 * Endpoint: GET /api/health
 *
 * Response:
 * - 200 OK: System is healthy
 * - 503 Service Unavailable: System has issues
 */

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic' // Always run dynamically
export const runtime = 'nodejs' // Use Node.js runtime

/**
 * GET /api/health
 * Returns the health status of the application
 */
export async function GET() {
  const startTime = Date.now()

  try {
    // Check 1: Basic server health
    const checks = {
      server: 'ok',
      database: 'checking',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    }

    // Check 2: Database connectivity (with timeout)
    try {
      const supabase = createClient()
      const result = await Promise.race([
        supabase.from('users').select('id').limit(1).single(),
        new Promise<{ error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        ),
      ])

      checks.database = result.error ? 'degraded' : 'ok'
    } catch (dbError) {
      console.error('Health check database error:', dbError)
      checks.database = 'error'
    }

    // Calculate response time
    const responseTime = Date.now() - startTime

    // Determine overall status
    const isHealthy =
      checks.server === 'ok' && (checks.database === 'ok' || checks.database === 'degraded')

    const status = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      responseTimeMs: responseTime,
      version: process.env.npm_package_version || '1.0.0',
    }

    // Return appropriate status code
    if (isHealthy) {
      return NextResponse.json(status, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Type': 'application/json',
        },
      })
    } else {
      return NextResponse.json(status, {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
