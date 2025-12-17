/**
 * Tests for database query functions
 * Priority functions: getReviewQueue, getUserProfile, createUserProfile,
 * getUpcomingReviewsCount, getAllLessons
 */

import {
  getReviewQueue,
  getUserProfile,
  createUserProfile,
  getUpcomingReviewsCount,
  getAllLessons,
  getLessonById,
} from '../queries'
import { db } from '../client'

// Mock the database client
jest.mock('../client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    execute: jest.fn(),
  },
}))

describe('Database Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.log for tests
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getReviewQueue', () => {
    it('fetches items due for review', async () => {
      const mockItems = [
        {
          id: 1,
          user_id: 'user-123',
          item_id: 100,
          item_type: 'character',
          next_review_date: new Date('2024-01-01'),
        },
        {
          id: 2,
          user_id: 'user-123',
          item_id: 101,
          item_type: 'vocabulary',
          next_review_date: new Date('2024-01-02'),
        },
      ]

      // Setup mock chain
      const mockLimit = jest.fn().mockResolvedValue(mockItems)
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getReviewQueue('user-123', 50)

      expect(result).toEqual(mockItems)
      expect(db.select).toHaveBeenCalled()
      expect(mockLimit).toHaveBeenCalledWith(50)
    })

    it('uses default limit of 50', async () => {
      const mockLimit = jest.fn().mockResolvedValue([])
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      await getReviewQueue('user-123')

      expect(mockLimit).toHaveBeenCalledWith(50)
    })

    it('returns empty array when no items due', async () => {
      const mockLimit = jest.fn().mockResolvedValue([])
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getReviewQueue('user-123')

      expect(result).toEqual([])
    })
  })

  describe('getUserProfile', () => {
    it('returns user profile when found', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        current_streak: 5,
        longest_streak: 10,
      }

      const mockLimit = jest.fn().mockResolvedValue([mockProfile])
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getUserProfile('user-123')

      expect(result).toEqual(mockProfile)
      expect(db.select).toHaveBeenCalled()
    })

    it('returns null when profile not found', async () => {
      const mockLimit = jest.fn().mockResolvedValue([])
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getUserProfile('user-123')

      expect(result).toBeNull()
    })

    it('returns null when result is undefined', async () => {
      const mockLimit = jest.fn().mockResolvedValue([undefined])
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getUserProfile('user-123')

      expect(result).toBeNull()
    })
  })

  describe('createUserProfile', () => {
    it('creates user profile with all fields', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      }

      const mockReturning = jest.fn().mockResolvedValue([mockProfile])
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning })
      ;(db.insert as jest.Mock).mockReturnValue({ values: mockValues })

      const result = await createUserProfile('user-123', 'test@example.com', 'testuser')

      expect(result).toEqual(mockProfile)
      expect(db.insert).toHaveBeenCalled()
      expect(mockValues).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      })
    })

    it('creates profile without username', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        username: undefined,
      }

      const mockReturning = jest.fn().mockResolvedValue([mockProfile])
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning })
      ;(db.insert as jest.Mock).mockReturnValue({ values: mockValues })

      await createUserProfile('user-123', 'test@example.com')

      expect(mockValues).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        username: undefined,
      })
    })

    it('returns created profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        username: null,
      }

      const mockReturning = jest.fn().mockResolvedValue([mockProfile])
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning })
      ;(db.insert as jest.Mock).mockReturnValue({ values: mockValues })

      const result = await createUserProfile('user-123', 'test@example.com')

      expect(result).toEqual(mockProfile)
    })
  })

  describe('getUpcomingReviewsCount', () => {
    it('returns count of upcoming reviews', async () => {
      const mockResult = [{ count: 15 }]

      const mockWhere = jest.fn().mockResolvedValue(mockResult)
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getUpcomingReviewsCount('user-123')

      expect(result).toBe(15)
      expect(db.select).toHaveBeenCalled()
    })

    it('returns 0 when no upcoming reviews', async () => {
      const mockResult = [{ count: 0 }]

      const mockWhere = jest.fn().mockResolvedValue(mockResult)
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getUpcomingReviewsCount('user-123')

      expect(result).toBe(0)
    })

    it('returns 0 when result is empty', async () => {
      const mockWhere = jest.fn().mockResolvedValue([])
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getUpcomingReviewsCount('user-123')

      expect(result).toBe(0)
    })

    it('handles null count', async () => {
      const mockResult = [{ count: null }]

      const mockWhere = jest.fn().mockResolvedValue(mockResult)
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getUpcomingReviewsCount('user-123')

      expect(result).toBe(0)
    })
  })

  describe('getAllLessons', () => {
    it('returns all published lessons', async () => {
      const mockLessons = [
        { id: 1, title: 'Lesson 1', sort_order: 1, is_published: true },
        { id: 2, title: 'Lesson 2', sort_order: 2, is_published: true },
      ]

      const mockOrderBy = jest.fn().mockResolvedValue(mockLessons)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getAllLessons()

      expect(result).toEqual(mockLessons)
      expect(result).toHaveLength(2)
      expect(db.select).toHaveBeenCalled()
    })

    it('returns empty array when no lessons', async () => {
      const mockOrderBy = jest.fn().mockResolvedValue([])
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getAllLessons()

      expect(result).toEqual([])
    })

    it('logs query execution', async () => {
      const mockOrderBy = jest.fn().mockResolvedValue([])
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      await getAllLessons()

      expect(console.log).toHaveBeenCalledWith('DB QUERY: getAllLessons() started')
      expect(console.log).toHaveBeenCalledWith(
        'DB QUERY: getAllLessons() completed',
        expect.any(Object)
      )
    })

    it('logs and throws error on failure', async () => {
      const mockError = new Error('Database connection failed')
      const mockOrderBy = jest.fn().mockRejectedValue(mockError)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      await expect(getAllLessons()).rejects.toThrow('Database connection failed')
      expect(console.error).toHaveBeenCalledWith(
        'DB QUERY ERROR: getAllLessons() failed',
        mockError
      )
    })
  })

  describe('getLessonById', () => {
    it('returns lesson when found', async () => {
      const mockLesson = {
        id: 1,
        title: 'Test Lesson',
        sort_order: 1,
      }

      const mockLimit = jest.fn().mockResolvedValue([mockLesson])
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getLessonById(1)

      expect(result).toEqual(mockLesson)
    })

    it('returns null when lesson not found', async () => {
      const mockLimit = jest.fn().mockResolvedValue([])
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getLessonById(999)

      expect(result).toBeNull()
    })
  })
})
