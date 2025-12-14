import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * OAuth callback handler for Supabase authentication
 * Will be fully implemented after Supabase integration (PROMPT 2)
 */
export async function GET(request: NextRequest) {
  // TODO: Implement Supabase OAuth callback handling
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  // TODO: Exchange code for session
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
