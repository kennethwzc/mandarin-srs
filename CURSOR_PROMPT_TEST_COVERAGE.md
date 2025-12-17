# Test Coverage Improvement Plan - Mandarin SRS

## Executive Summary

**Current Status:** Test coverage is failing CI with 22.82% branch coverage (threshold: 23%)

**Goal:** Increase branch coverage to >23% by adding targeted tests for uncovered functions

**Priority:** Focus on high-value business logic and API endpoints that are currently untested

---

## 1. Coverage Analysis

### Current Coverage Metrics
```
Overall Coverage:
- Statements: 23.03%
- Branches:   22.82% ❌ (threshold: 23%)
- Functions:  16.74%
- Lines:      23.18%
```

### What's Well Tested (Keep as Reference)
✅ **lib/utils/srs-algorithm.ts** - 97.46% coverage, 100+ tests
✅ **lib/utils/pinyin-utils.ts** - 65.62% coverage, 50+ tests
✅ **API Routes (3 endpoints):**
- `POST /api/reviews/submit` - 91.3%
- `GET /api/reviews/queue` - 94.11%
- `POST /api/lessons/[id]/start` - 39.58% (needs improvement)

✅ **Components:**
- `components/features/review-card.tsx` - 95.55%
- `components/features/lesson-card.tsx` - 100%
- `components/features/pinyin-input.tsx` - 69.91%
- `components/features/dashboard-stats.tsx` - 78.57%

### Critical Gaps (0% Coverage)

#### **API Routes (14 untested)**
1. `app/api/lessons/route.ts` - List lessons
2. `app/api/lessons/[id]/route.ts` - Get lesson details
3. `app/api/dashboard/stats/route.ts` - Dashboard stats with caching
4. `app/api/dashboard/simple-stats/route.ts` - Simplified stats
5. `app/api/auth/callback/route.ts` - OAuth/email verification callback
6. `app/api/auth/signout/route.ts` - Sign out
7. `app/api/user/profile/route.ts` - User profile CRUD
8. `app/api/user/stats/route.ts` - User statistics
9. `app/api/reviews/upcoming/route.ts` - Upcoming reviews forecast
10. `app/api/health/route.ts` - Health check
11. `app/api/health/profiles/route.ts` - Profile health check
12. `app/api/stripe/webhook/route.ts` - Stripe webhook handler
13. `app/api/test-dashboard/route.ts` - Diagnostic endpoint
14. `app/api/test-utils/refresh-session/route.ts` - Session refresh utility

#### **Database Queries (lib/db/queries.ts - 0% coverage)**
Core functions needing tests:
- `getReviewQueue(userId, limit)` - Critical path query
- `getUpcomingReviewsCount(userId)` - Count reviews in 24h
- `getUserProfile(userId)` - Fetch user profile
- `createUserProfile(userId, email, username?)` - Create profile
- `updateUserProfile(userId, updates)` - Update profile
- `getLessons(filters?)` - List lessons with filters
- `getLessonById(lessonId)` - Get single lesson
- `getLessonItems(lessonId)` - Get lesson content
- `getUserLessonProgress(userId)` - Calculate lesson progress
- `getDashboardStats(userId)` - Complex stats aggregation
- `getDailyStatsRange(userId, startDate, endDate)` - Time range stats
- `getUpcomingReviewsForecast(userId, days)` - Forecast future reviews
- `getCurrentStreak(userId)` - Calculate user streak
- `getAccuracyByItemType(userId)` - Accuracy breakdown

#### **Database Operations (lib/db/srs-operations.ts - 18.18% coverage)**
Partially tested, needs full coverage:
- `submitReview(submission)` - Transaction logic (critical)
- `getReviewQueue(userId, limit)` - Queue fetching
- `createUserItems(userId, lessonId, items)` - Lesson initialization

#### **Utility Functions (0% coverage)**
- `lib/utils/date.ts` - formatRelativeDate, formatTimeAgo, isPast, getStartOfDay, getEndOfDay
- `lib/utils/helpers.ts` - debounce, sleep, formatNumber, clamp
- `lib/utils/env.ts` - Environment variable helpers
- `lib/utils/validators.ts` - Validation helpers

#### **Hooks (0-25% coverage)**
- `lib/hooks/use-auth.ts` (0%) - Authentication hook
- `lib/hooks/use-review-queue.ts` (0%) - Review queue management
- `lib/hooks/use-toast.ts` (0%) - Toast notifications
- `lib/hooks/use-pinyin-input.ts` (100%) ✅ - Already tested

#### **Stores (0% coverage)**
- `lib/stores/auth-store.ts` - Authentication state
- `lib/stores/review-store.ts` - Review session state
- `lib/stores/ui-store.ts` - UI preferences

---

## 2. Testing Strategy - Priority Tiers

### Tier 1: Quick Wins (High Impact, Low Effort)
**Goal:** Get coverage above 23% threshold quickly

**Target Files:**
1. **lib/utils/helpers.ts** - Simple pure functions
2. **lib/utils/date.ts** - Date formatting functions
3. **lib/db/queries.ts** - Database query functions (mock db)
4. **app/api/auth/signout/route.ts** - Simple endpoint
5. **app/api/lessons/route.ts** - TODO stub endpoint

**Estimated Coverage Gain:** +3-5% branch coverage

**Implementation Time:** 2-3 hours

---

### Tier 2: Core Business Logic (High Impact, Medium Effort)
**Goal:** Test critical business operations

**Target Files:**
1. **lib/db/srs-operations.ts** - Complete submitReview transaction tests
2. **app/api/dashboard/stats/route.ts** - Stats endpoint with caching
3. **app/api/auth/callback/route.ts** - Email verification flow
4. **app/api/user/profile/route.ts** - Profile CRUD operations
5. **lib/hooks/use-auth.ts** - Auth hook testing

**Estimated Coverage Gain:** +8-12% branch coverage

**Implementation Time:** 4-6 hours

---

### Tier 3: Complete Coverage (Medium Impact, High Effort)
**Goal:** Comprehensive test coverage across all modules

**Target Areas:**
1. All remaining API routes
2. Zustand stores
3. Page components (smoke tests)
4. Remaining hooks
5. Stripe webhook handler

**Estimated Coverage Gain:** +15-20% branch coverage

**Implementation Time:** 8-12 hours

---

## 3. Testing Patterns & Examples

### Pattern 1: Testing Pure Utility Functions

**Example: lib/utils/helpers.ts**

```typescript
// lib/utils/__tests__/helpers.test.ts
import { debounce, sleep, formatNumber, clamp } from '../helpers'

describe('helpers', () => {
  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1000000)).toBe('1,000,000')
      expect(formatNumber(42)).toBe('42')
    })

    it('handles zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(-1000)).toBe('-1,000')
    })

    it('handles decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56')
    })
  })

  describe('clamp', () => {
    it('clamps value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('handles edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })
  })

  describe('sleep', () => {
    it('waits for specified milliseconds', async () => {
      const start = Date.now()
      await sleep(100)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(95) // Allow 5ms tolerance
      expect(elapsed).toBeLessThan(150)
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('debounces function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Call multiple times rapidly
      debouncedFn('a')
      debouncedFn('b')
      debouncedFn('c')

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Fast-forward time
      jest.advanceTimersByTime(100)

      // Function should be called once with last argument
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('c')
    })

    it('resets timer on subsequent calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('a')
      jest.advanceTimersByTime(50)
      debouncedFn('b') // Reset timer
      jest.advanceTimersByTime(50)

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(50)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('b')
    })
  })
})
```

---

### Pattern 2: Testing Database Query Functions

**Example: lib/db/queries.ts**

```typescript
// lib/db/__tests__/queries.test.ts
import { getReviewQueue, getUserProfile, createUserProfile } from '../queries'
import { db } from '../client'

// Mock the database client
jest.mock('../client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}))

describe('Database Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getReviewQueue', () => {
    it('fetches items due for review', async () => {
      const mockItems = [
        { id: 1, item_id: 100, next_review_date: new Date('2024-01-01') },
        { id: 2, item_id: 101, next_review_date: new Date('2024-01-02') },
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
      expect(mockFrom).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockOrderBy).toHaveBeenCalled()
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
  })

  describe('getUserProfile', () => {
    it('returns user profile when found', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      }

      const mockLimit = jest.fn().mockResolvedValue([mockProfile])
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getUserProfile('user-123')

      expect(result).toEqual(mockProfile)
    })

    it('returns null when profile not found', async () => {
      const mockLimit = jest.fn().mockResolvedValue([])
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
  })
})
```

---

### Pattern 3: Testing API Routes

**Example: app/api/lessons/route.ts**

```typescript
// app/api/lessons/__tests__/route.test.ts
/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('GET /api/lessons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requires authentication', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/lessons')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('returns empty array when no lessons exist', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    // Mock getLessons to return empty array
    jest.mock('@/lib/db/queries', () => ({
      getLessons: jest.fn().mockResolvedValue([]),
    }))

    const request = new NextRequest('http://localhost:3000/api/lessons')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.lessons).toEqual([])
  })

  it('returns lessons for authenticated user', async () => {
    const mockLessons = [
      { id: 1, title: 'Lesson 1', level: 1 },
      { id: 2, title: 'Lesson 2', level: 2 },
    ]

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    // You'll need to mock getLessons properly
    // This is just an example structure

    const request = new NextRequest('http://localhost:3000/api/lessons')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.lessons).toHaveLength(2)
  })

  it('handles database errors gracefully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    // Mock database error
    jest.mock('@/lib/db/queries', () => ({
      getLessons: jest.fn().mockRejectedValue(new Error('Database error')),
    }))

    const request = new NextRequest('http://localhost:3000/api/lessons')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })
})
```

---

### Pattern 4: Testing React Hooks

**Example: lib/hooks/use-auth.ts**

```typescript
// lib/hooks/__tests__/use-auth.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../use-auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import * as authUtils from '@/lib/supabase/auth'

// Mock dependencies
jest.mock('@/lib/stores/auth-store')
jest.mock('@/lib/supabase/auth')

describe('useAuth', () => {
  const mockInitialize = jest.fn()
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockSession = { access_token: 'token' }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      error: null,
      initialize: mockInitialize,
    })
  })

  it('initializes auth on mount', () => {
    renderHook(() => useAuth())

    expect(mockInitialize).toHaveBeenCalledTimes(1)
  })

  it('returns auth state', () => {
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      session: mockSession,
      isLoading: false,
      error: null,
      initialize: mockInitialize,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('returns not authenticated when no user', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('exposes auth utility functions', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.signUp).toBe(authUtils.signUp)
    expect(result.current.signIn).toBe(authUtils.signIn)
    expect(result.current.signOut).toBe(authUtils.signOut)
    expect(result.current.resetPassword).toBe(authUtils.resetPassword)
    expect(result.current.updatePassword).toBe(authUtils.updatePassword)
    expect(result.current.refreshSession).toBe(authUtils.refreshSession)
  })

  it('handles loading state', () => {
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
      error: null,
      initialize: mockInitialize,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
  })

  it('handles error state', () => {
    const mockError = new Error('Auth error')
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      error: mockError,
      initialize: mockInitialize,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.error).toEqual(mockError)
  })
})
```

---

### Pattern 5: Testing Zustand Stores

**Example: lib/stores/auth-store.ts**

```typescript
// lib/stores/__tests__/auth-store.test.ts
import { useAuthStore } from '../auth-store'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

jest.mock('@/lib/supabase/client')

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      error: null,
    })
    jest.clearAllMocks()
  })

  describe('initialize', () => {
    it('sets loading state while initializing', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve({ data: { session: null }, error: null }), 100))
          ),
          onAuthStateChange: jest.fn().mockReturnValue({
            data: { subscription: { unsubscribe: jest.fn() } },
          }),
        },
      }
      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const { initialize } = useAuthStore.getState()
      const initPromise = initialize()

      // Check loading state
      expect(useAuthStore.getState().isLoading).toBe(true)

      await initPromise

      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('sets user and session when authenticated', async () => {
      const mockUser: Partial<User> = { id: 'user-123', email: 'test@example.com' }
      const mockSession: Partial<Session> = { access_token: 'token', user: mockUser as User }

      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
          onAuthStateChange: jest.fn().mockReturnValue({
            data: { subscription: { unsubscribe: jest.fn() } },
          }),
        },
      }
      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const { initialize } = useAuthStore.getState()
      await initialize()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.session).toEqual(mockSession)
      expect(state.error).toBeNull()
    })

    it('handles auth errors', async () => {
      const mockError = new Error('Auth failed')

      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: mockError,
          }),
          onAuthStateChange: jest.fn().mockReturnValue({
            data: { subscription: { unsubscribe: jest.fn() } },
          }),
        },
      }
      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const { initialize } = useAuthStore.getState()
      await initialize()

      const state = useAuthStore.getState()
      expect(state.error).toEqual(mockError)
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
    })
  })

  describe('auth state changes', () => {
    it('updates state on SIGNED_IN event', async () => {
      const mockUser: Partial<User> = { id: 'user-123', email: 'test@example.com' }
      const mockSession: Partial<Session> = { access_token: 'token', user: mockUser as User }

      let authCallback: (event: string, session: Session | null) => void

      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
          onAuthStateChange: jest.fn().mockImplementation((callback) => {
            authCallback = callback
            return { data: { subscription: { unsubscribe: jest.fn() } } }
          }),
        },
      }
      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const { initialize } = useAuthStore.getState()
      await initialize()

      // Trigger SIGNED_IN event
      authCallback!('SIGNED_IN', mockSession as Session)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.session).toEqual(mockSession)
    })

    it('clears state on SIGNED_OUT event', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: 'user-123', email: 'test@example.com' } as User,
        session: { access_token: 'token' } as Session,
      })

      let authCallback: (event: string, session: Session | null) => void

      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
          onAuthStateChange: jest.fn().mockImplementation((callback) => {
            authCallback = callback
            return { data: { subscription: { unsubscribe: jest.fn() } } }
          }),
        },
      }
      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const { initialize } = useAuthStore.getState()
      await initialize()

      // Trigger SIGNED_OUT event
      authCallback!('SIGNED_OUT', null)

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
    })
  })
})
```

---

## 4. Specific Test Requirements by File

### Priority 1: Quick Wins

#### lib/utils/date.ts
**Functions to test:**
- `formatRelativeDate(date)` - Test with today, tomorrow, yesterday, past dates, future dates
- `formatTimeAgo(date)` - Test with minutes, hours, days ago
- `isPast(date)` - Test with past and future dates
- `getStartOfDay(date)` - Verify time is set to 00:00:00.000
- `getEndOfDay(date)` - Verify time is set to 23:59:59.999

**Test cases needed:** ~15 tests
**Coverage impact:** +1.5%

#### lib/utils/helpers.ts
**Functions to test:**
- `debounce(func, wait)` - Test debounce timing, multiple calls, timer reset
- `sleep(ms)` - Test async delay
- `formatNumber(num)` - Test with various numbers (small, large, negative, decimals)
- `clamp(value, min, max)` - Test within range, below min, above max, edge cases

**Test cases needed:** ~12 tests
**Coverage impact:** +1.2%

#### lib/db/queries.ts (High Priority Functions)
Focus on these 5 functions first:
1. `getReviewQueue(userId, limit)` - Mock db.select chain
2. `getUserProfile(userId)` - Test found and not found cases
3. `createUserProfile(userId, email, username?)` - Test with/without username
4. `getUpcomingReviewsCount(userId)` - Test count calculation
5. `getLessons(filters?)` - Test with various filters

**Test cases needed:** ~20 tests
**Coverage impact:** +2.5%

#### app/api/auth/signout/route.ts
**Test cases:**
- Successful sign out
- Error handling
- Response format

**Test cases needed:** ~3 tests
**Coverage impact:** +0.5%

---

### Priority 2: Core Business Logic

#### lib/db/srs-operations.ts
**Current coverage:** 18.18%
**Functions to test:**
- `submitReview(submission)` - Full transaction flow
  - Test successful review submission
  - Test SRS calculation integration
  - Test review_history record creation
  - Test daily_stats update
  - Test transaction rollback on error
  - Test edge cases (first review, milestone reviews)

**Test cases needed:** ~15 tests
**Coverage impact:** +3%

#### app/api/dashboard/stats/route.ts
**Complex endpoint with caching**
**Test cases:**
- Authentication check
- Profile creation safety net
- Stats aggregation
- Caching behavior (withCache wrapper)
- Error handling
- Response format

**Test cases needed:** ~8 tests
**Coverage impact:** +2%

#### app/api/auth/callback/route.ts
**Critical authentication flow**
**Test cases:**
- Handle OAuth code exchange
- Handle email verification code
- Handle Supabase errors
- Profile creation after verification
- Email confirmation check
- Redirect behavior
- Error parameter handling

**Test cases needed:** ~10 tests
**Coverage impact:** +2.5%

#### app/api/user/profile/route.ts
**Test cases:**
- GET: Fetch user profile (found/not found)
- GET: Authentication required
- PATCH: Update profile fields
- PATCH: Validation errors
- PATCH: Authentication required
- Error handling

**Test cases needed:** ~8 tests
**Coverage impact:** +1.5%

#### lib/hooks/use-auth.ts
**Test cases:**
- Initialization on mount
- Auth state exposure
- Auth functions exposure
- Loading state handling
- Error state handling
- isAuthenticated derived state

**Test cases needed:** ~6 tests
**Coverage impact:** +1%

---

### Priority 3: Comprehensive Coverage

#### app/api/reviews/upcoming/route.ts
**Test cases:**
- Fetch upcoming reviews forecast
- Authentication check
- Empty forecast
- Multiple days forecast
- Error handling

**Test cases needed:** ~5 tests

#### app/api/stripe/webhook/route.ts
**Complex webhook handler**
**Test cases:**
- Signature verification
- checkout.session.completed event
- customer.subscription.updated event
- customer.subscription.deleted event
- Invalid signature
- Unknown event type
- Error handling

**Test cases needed:** ~10 tests

#### lib/stores/review-store.ts
**Test cases:**
- Initial state
- State updates
- Action functions

**Test cases needed:** ~5 tests

#### lib/stores/ui-store.ts
**Test cases:**
- Initial state
- Theme preferences
- UI state management

**Test cases needed:** ~5 tests

---

## 5. Testing Infrastructure

### Existing Setup (Reference)

**Jest Configuration** (jest.config.js):
```javascript
{
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
  ],
  coverageThresholds: {
    global: {
      branches: 23,
      functions: 16,
      lines: 23,
      statements: 23,
    }
  }
}
```

**Global Mocks** (jest.setup.js):
```javascript
// Already mocked globally:
- next/navigation (useRouter, usePathname, useSearchParams, useParams)
- next/link
- @/lib/supabase/client
- @/lib/supabase/server
- fetch API
```

### Adding New Tests

**File Naming:**
- Place tests in `__tests__` directory next to source
- Name: `[source-file-name].test.ts` or `.test.tsx` for React

**Environment Directive:**
- API routes need: `/** @jest-environment node */`
- Components use default jsdom environment

**Mock Strategy:**
```typescript
// Per-test mocks (preferred for clarity):
jest.mock('@/lib/db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    // etc.
  }
}))

// Runtime mocks for specific behaviors:
;(mockFunction as jest.Mock).mockReturnValue(value)
;(mockFunction as jest.Mock).mockResolvedValue(asyncValue)
;(mockFunction as jest.Mock).mockRejectedValue(error)
```

---

## 6. Implementation Checklist

### Phase 1: Quick Wins (Day 1)
- [ ] Create `lib/utils/__tests__/helpers.test.ts`
  - [ ] Test debounce (4 tests)
  - [ ] Test sleep (1 test)
  - [ ] Test formatNumber (4 tests)
  - [ ] Test clamp (3 tests)

- [ ] Create `lib/utils/__tests__/date.test.ts`
  - [ ] Test formatRelativeDate (5 tests)
  - [ ] Test formatTimeAgo (3 tests)
  - [ ] Test isPast (2 tests)
  - [ ] Test getStartOfDay (2 tests)
  - [ ] Test getEndOfDay (2 tests)

- [ ] Create `lib/db/__tests__/queries.test.ts`
  - [ ] Test getReviewQueue (3 tests)
  - [ ] Test getUserProfile (2 tests)
  - [ ] Test createUserProfile (2 tests)
  - [ ] Test getUpcomingReviewsCount (2 tests)
  - [ ] Test getLessons (3 tests)

- [ ] Create `app/api/auth/__tests__/signout.test.ts`
  - [ ] Test successful signout (1 test)
  - [ ] Test error handling (1 test)
  - [ ] Test response format (1 test)

**Expected result:** Coverage increases to ~25% (above threshold)

---

### Phase 2: Core Logic (Day 2-3)
- [ ] Expand `lib/db/__tests__/srs-operations.test.ts`
  - [ ] Test submitReview transaction flow (5 tests)
  - [ ] Test error scenarios (3 tests)
  - [ ] Test edge cases (3 tests)

- [ ] Create `app/api/dashboard/__tests__/stats.test.ts`
  - [ ] Test authentication (2 tests)
  - [ ] Test stats aggregation (3 tests)
  - [ ] Test caching behavior (2 tests)
  - [ ] Test error handling (1 test)

- [ ] Create `app/api/auth/__tests__/callback.test.ts`
  - [ ] Test OAuth flow (3 tests)
  - [ ] Test email verification (3 tests)
  - [ ] Test error cases (4 tests)

- [ ] Create `app/api/user/__tests__/profile.test.ts`
  - [ ] Test GET endpoint (4 tests)
  - [ ] Test PATCH endpoint (4 tests)

- [ ] Create `lib/hooks/__tests__/use-auth.test.tsx`
  - [ ] Test hook initialization (2 tests)
  - [ ] Test state management (4 tests)

**Expected result:** Coverage increases to ~33%

---

### Phase 3: Comprehensive (Day 4-5)
- [ ] Create tests for remaining API routes
  - [ ] `app/api/lessons/route.test.ts` (5 tests)
  - [ ] `app/api/lessons/[id]/route.test.ts` (5 tests)
  - [ ] `app/api/reviews/upcoming/route.test.ts` (5 tests)
  - [ ] `app/api/user/stats/route.test.ts` (4 tests)
  - [ ] `app/api/stripe/webhook.test.ts` (10 tests)

- [ ] Create store tests
  - [ ] `lib/stores/__tests__/auth-store.test.ts` (8 tests)
  - [ ] `lib/stores/__tests__/review-store.test.ts` (5 tests)
  - [ ] `lib/stores/__tests__/ui-store.test.ts` (5 tests)

- [ ] Create remaining hook tests
  - [ ] `lib/hooks/__tests__/use-review-queue.test.tsx` (5 tests)

**Expected result:** Coverage increases to ~40%+

---

## 7. Testing Best Practices

### DO:
✅ Follow existing test patterns in codebase
✅ Test behavior, not implementation details
✅ Use descriptive test names that explain what's being tested
✅ Group related tests in describe blocks
✅ Mock external dependencies (database, API calls, auth)
✅ Test error cases and edge cases
✅ Clear mocks between tests with `beforeEach(() => jest.clearAllMocks())`
✅ Use `jest.fn()` for function mocks
✅ Use `mockResolvedValue` for async success
✅ Use `mockRejectedValue` for async errors

### DON'T:
❌ Test implementation details (internal state, private functions)
❌ Skip error case testing
❌ Leave tests dependent on execution order
❌ Mock too much (over-mocking obscures real issues)
❌ Write tests that test the mock instead of the code
❌ Ignore TypeScript errors in tests
❌ Use `any` type unnecessarily
❌ Skip authentication tests for protected routes

---

## 8. Running Tests

### Commands
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests in CI mode
pnpm test:ci
```

### Checking Coverage
```bash
# Generate coverage report
pnpm test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Debugging Tests
```typescript
// Add console.log in tests
console.log('Debug:', variable)

// Use .only to run single test
it.only('should test something', () => {
  // ...
})

// Skip tests temporarily
it.skip('should test something', () => {
  // ...
})
```

---

## 9. Success Metrics

### Minimum Goal (Phase 1)
- Branch coverage: ≥23% (currently 22.82%)
- CI build: ✅ Passing

### Target Goal (Phase 2)
- Branch coverage: ≥30%
- Function coverage: ≥25%
- Key business logic: 100% coverage

### Stretch Goal (Phase 3)
- Branch coverage: ≥40%
- Function coverage: ≥35%
- All API routes tested
- All hooks tested
- All stores tested

---

## 10. Reference Files

### Test Examples to Reference
1. `lib/utils/__tests__/srs-algorithm.test.ts` - Pure function testing
2. `lib/utils/__tests__/pinyin-utils.test.ts` - String utilities
3. `app/api/reviews/__tests__/queue.test.ts` - API route testing
4. `components/features/__tests__/review-card.test.tsx` - Component testing
5. `lib/hooks/__tests__/use-pinyin-input.test.tsx` - Hook testing

### Key Source Files
1. `lib/db/queries.ts` - Database queries (0% coverage)
2. `lib/db/srs-operations.ts` - SRS operations (18% coverage)
3. `app/api/dashboard/stats/route.ts` - Dashboard API (0% coverage)
4. `app/api/auth/callback/route.ts` - Auth callback (0% coverage)
5. `lib/hooks/use-auth.ts` - Auth hook (0% coverage)

---

## 11. Common Patterns Quick Reference

### Mock Database Query
```typescript
const mockLimit = jest.fn().mockResolvedValue([mockData])
const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })
```

### Mock Supabase Auth
```typescript
const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    }),
  },
}
;(createClient as jest.Mock).mockReturnValue(mockSupabase)
```

### Mock NextRequest
```typescript
const request = new NextRequest('http://localhost:3000/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ data: 'value' }),
})
```

### Test Async Function
```typescript
it('handles async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

### Test Error Handling
```typescript
it('handles errors', async () => {
  mockFunction.mockRejectedValue(new Error('Failed'))
  await expect(functionUnderTest()).rejects.toThrow('Failed')
})
```

---

## Summary

**Start Here:** Phase 1 (Quick Wins) will get coverage above threshold in 2-3 hours

**Priority Order:**
1. lib/utils/helpers.ts + date.ts (pure functions, easy wins)
2. lib/db/queries.ts (critical path, high impact)
3. lib/db/srs-operations.ts (complete coverage)
4. API routes (dashboard, auth, profile)
5. Hooks and stores

**Key Success Factor:** Follow existing test patterns, mock dependencies properly, test behavior not implementation

**Expected Timeline:**
- Phase 1: 2-3 hours → 25% coverage
- Phase 2: 4-6 hours → 33% coverage
- Phase 3: 8-12 hours → 40%+ coverage

Good luck! The codebase has excellent testing infrastructure already in place. Just follow the patterns and you'll quickly improve coverage.
