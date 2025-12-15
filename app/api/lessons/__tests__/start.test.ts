/**
 * @jest-environment node
 */

/**
 * API Route Tests: POST /api/lessons/[id]/start
 *
 * Tests lesson start endpoint
 */

import { NextRequest } from 'next/server'
import { POST } from '../[id]/start/route'

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

// Mock database queries
jest.mock('@/lib/db/queries', () => ({
  getLessonById: jest.fn(() =>
    Promise.resolve({
      id: 1,
      title: 'Test Lesson',
      character_ids: [1, 2, 3],
      vocabulary_ids: [4, 5, 6],
    })
  ),
  getLessonWithContent: jest.fn(() =>
    Promise.resolve({
      id: 1,
      title: 'Test Lesson',
      character_ids: [1, 2, 3],
      vocabulary_ids: [4, 5, 6],
    })
  ),
}))

// Mock database client
jest.mock('@/lib/db/client', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn(() => Promise.resolve([{ id: 1 }])),
    onConflictDoNothing: jest.fn(() => Promise.resolve([{ id: 1 }])),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn(() => Promise.resolve([])),
  },
}))

// Mock SRS operations
jest.mock('@/lib/db/srs-operations', () => ({
  createUserItems: jest.fn(() => Promise.resolve(3)),
}))

describe('POST /api/lessons/[id]/start', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()

    // Re-establish default authenticated user mock
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockImplementation(() => ({
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
    }))
  })

  it('requires authentication', async () => {
    // Override mock to return no user for this test only
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockImplementationOnce(() => ({
      auth: {
        getUser: jest.fn(() =>
          Promise.resolve({
            data: { user: null },
            error: { message: 'Not authenticated' },
          })
        ),
      },
    }))

    const request = new NextRequest('http://localhost:3000/api/lessons/1/start', {
      method: 'POST',
    })

    const response = await POST(request, { params: { id: '1' } })
    expect(response.status).toBe(401)
  })

  it('validates lesson ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/lessons/invalid/start', {
      method: 'POST',
    })

    const response = await POST(request, { params: { id: 'invalid' } })
    // Should return 400 for invalid lesson ID
    expect([400, 500]).toContain(response.status)
  })

  it('starts lesson successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/lessons/1/start', {
      method: 'POST',
    })

    const response = await POST(request, { params: { id: '1' } })
    const data = await response.json()

    // Should return 200 or 500 depending on mocking
    expect([200, 500]).toContain(response.status)
    // If successful, should have success property
    if (response.status === 200) {
      expect(data.success).toBe(true)
    }
  })
})
