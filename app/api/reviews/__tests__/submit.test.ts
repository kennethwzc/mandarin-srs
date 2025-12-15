/**
 * API Route Tests: POST /api/reviews/submit
 *
 * Tests review submission endpoint
 */

import { NextRequest } from 'next/server'
import { POST } from '../submit/route'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            },
          },
          error: null,
        })
      ),
    },
  })),
}))

// Mock database operations
jest.mock('@/lib/db/srs-operations', () => ({
  submitReview: jest.fn(() =>
    Promise.resolve({
      success: true,
      nextReviewDate: new Date('2024-01-20'),
      newStage: 'learning',
      newInterval: 1,
    })
  ),
}))

describe('POST /api/reviews/submit', () => {
  it('requires authentication', async () => {
    // Override mock to return no user
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockImplementation(() => ({
      auth: {
        getUser: jest.fn(() =>
          Promise.resolve({
            data: { user: null },
            error: { message: 'Not authenticated' },
          })
        ),
      },
    }))

    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('validates request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({}), // Missing required fields
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('submits review successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({
        userItemId: 1,
        grade: 3,
        responseTimeMs: 1500,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('returns correct response format', async () => {
    const request = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({
        userItemId: 1,
        grade: 3,
        responseTimeMs: 1500,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('data')
  })
})
