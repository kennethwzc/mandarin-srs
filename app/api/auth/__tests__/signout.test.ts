/**
 * @jest-environment node
 */

/**
 * Tests for sign out API route
 */

import { POST } from '../signout/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('POST /api/auth/signout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully signs out user', async () => {
    const mockSupabase = {
      auth: {
        signOut: jest.fn().mockResolvedValue({
          error: null,
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const response = await POST()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('handles sign out errors', async () => {
    const mockError = { message: 'Sign out failed' }
    const mockSupabase = {
      auth: {
        signOut: jest.fn().mockResolvedValue({
          error: mockError,
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const response = await POST()

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Sign out failed')
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('creates Supabase client', async () => {
    const mockSupabase = {
      auth: {
        signOut: jest.fn().mockResolvedValue({
          error: null,
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    await POST()

    expect(createClient).toHaveBeenCalledTimes(1)
  })

  it('returns JSON response', async () => {
    const mockSupabase = {
      auth: {
        signOut: jest.fn().mockResolvedValue({
          error: null,
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const response = await POST()

    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
