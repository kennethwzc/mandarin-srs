/**
 * @jest-environment node
 */

/**
 * API Route Tests: GET /api/reviews/queue
 *
 * Tests review queue API endpoint
 */

import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db/srs-operations')
jest.mock('@/lib/cache/server', () => ({
  withCache: jest.fn((key, fn) => fn()), // Always call the underlying function (bypass cache)
  deleteCached: jest.fn(),
  getCached: jest.fn().mockResolvedValue(null),
  setCached: jest.fn(),
}))

import { GET } from '../queue/route'
import { createClient } from '@/lib/supabase/server'
import { getReviewQueue } from '@/lib/db/srs-operations'

describe('GET /api/reviews/queue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requires authentication', async () => {
    // Mock unauthenticated user
    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/queue')
    const response = await GET(request)

    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBeTruthy()
  })

  it('returns review queue for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockQueue = [
      {
        id: 1,
        item_id: 1,
        item_type: 'character',
        character: '你',
        pinyin: 'nǐ',
        meaning: 'you',
      },
      {
        id: 2,
        item_id: 2,
        item_type: 'character',
        character: '好',
        pinyin: 'hǎo',
        meaning: 'good',
      },
    ]

    // Mock authenticated user
    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    // Mock review queue
    ;(getReviewQueue as jest.Mock).mockResolvedValue(mockQueue)

    const request = new NextRequest('http://localhost:3000/api/reviews/queue')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.queue).toHaveLength(2)
    expect(data.data.queue[0].character).toBe('你')
  })

  it('handles database errors gracefully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    // Mock database error
    ;(getReviewQueue as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/reviews/queue')
    const response = await GET(request)

    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.error).toBeTruthy()
  })

  it('returns empty queue when no reviews due', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    // Mock empty queue
    ;(getReviewQueue as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/reviews/queue')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.queue).toHaveLength(0)
  })
})
