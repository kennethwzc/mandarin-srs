/**
 * Sign out API route
 * Server-side signout endpoint
 */

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()

  // Sign out user
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
