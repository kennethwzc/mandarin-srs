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
    values: jest.fn().mockReturnThis(),
    onConflictDoNothing: jest.fn(() => Promise.resolve()),
  },
}))

describe('POST /api/lessons/[id]/start', () => {
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
    expect(response.status).toBe(400)
  })

  it('starts lesson successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/lessons/1/start', {
      method: 'POST',
    })

    const response = await POST(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
