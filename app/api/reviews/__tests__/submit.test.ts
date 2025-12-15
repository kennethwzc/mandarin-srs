/**
 * API Route Tests: POST /api/reviews/submit
 *
 * Tests review submission endpoint
 */

import { POST } from '../submit/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db/srs-operations')

import { createClient } from '@/lib/supabase/server'
import { submitReview } from '@/lib/db/srs-operations'

describe('POST /api/reviews/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requires authentication', async () => {
    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({
        itemId: 1,
        itemType: 'character',
        grade: 3,
        responseTimeMs: 1500,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('validates request body', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    // Missing required fields
    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('submits review successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })
    ;(submitReview as jest.Mock).mockResolvedValue({
      id: 1,
      nextReviewDate: new Date(),
      newStage: 'learning',
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({
        itemId: 1,
        itemType: 'character',
        userAnswer: 'nǐ',
        isCorrect: true,
        grade: 3,
        responseTimeMs: 1500,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('validates grade is within valid range', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    // Invalid grade (must be 0-3)
    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({
        itemId: 1,
        itemType: 'character',
        grade: 5, // Invalid
        responseTimeMs: 1500,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('validates item type is valid', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    // Invalid item type
    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({
        itemId: 1,
        itemType: 'invalid', // Must be 'radical', 'character', or 'vocabulary'
        grade: 3,
        responseTimeMs: 1500,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('handles database errors', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })
    ;(submitReview as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({
        itemId: 1,
        itemType: 'character',
        grade: 3,
        responseTimeMs: 1500,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
