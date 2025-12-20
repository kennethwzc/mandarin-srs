import {
  calculateNextReview,
  getDaysUntilReview,
  isDueForReview,
  calculateGradeFromTime,
} from '../srs-algorithm'
import {
  SRS_STAGES,
  GRADES,
  INITIAL_EASE_FACTOR,
  GRADUATING_INTERVAL_DAYS,
  EASY_INTERVAL_DAYS,
  TIME_THRESHOLDS,
} from '../srs-constants'

/**
 * SRS Algorithm Test Suite
 *
 * Tests cover:
 * - All stage transitions
 * - All grade possibilities
 * - Edge cases
 * - Determinism
 * - Timezone handling
 */

describe('SRS Algorithm', () => {
  const timezone = 'America/New_York'
  const baseDate = new Date('2024-01-01T12:00:00Z')

  describe('NEW stage', () => {
    it('should move to LEARNING on first review (GOOD)', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.NEW,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.LEARNING)
      expect(result.newStep).toBe(0)
      expect(result.newEaseFactor).toBe(INITIAL_EASE_FACTOR)
    })

    it('should skip to REVIEW on EASY', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.NEW,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.EASY,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result.newInterval).toBe(EASY_INTERVAL_DAYS)
    })

    it('should start LEARNING on AGAIN', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.NEW,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.AGAIN,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.LEARNING)
      expect(result.newStep).toBe(0)
    })

    it('should start LEARNING on HARD', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.NEW,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.HARD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.LEARNING)
      expect(result.newStep).toBe(0)
    })
  })

  describe('LEARNING stage', () => {
    it('should advance through learning steps', () => {
      // First review: step 0 → step 1
      const result1 = calculateNextReview({
        currentStage: SRS_STAGES.LEARNING,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result1.newStage).toBe(SRS_STAGES.LEARNING)
      expect(result1.newStep).toBe(1)

      // Second review: step 1 → graduate
      const result2 = calculateNextReview({
        currentStage: SRS_STAGES.LEARNING,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 1,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result2.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result2.newInterval).toBe(GRADUATING_INTERVAL_DAYS)
    })

    it('should reset to step 0 on AGAIN', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.LEARNING,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 1, // Was at step 1
        grade: GRADES.AGAIN,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.LEARNING)
      expect(result.newStep).toBe(0)
    })

    it('should graduate immediately on EASY', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.LEARNING,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.EASY,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result.newInterval).toBe(EASY_INTERVAL_DAYS)
    })

    it('should advance on HARD', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.LEARNING,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.HARD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.LEARNING)
      expect(result.newStep).toBe(1)
    })

    it('should generate valid next review dates', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.LEARNING,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.nextReviewDate).toBeInstanceOf(Date)
      expect(result.nextReviewDate.getTime()).toBeGreaterThan(baseDate.getTime())
    })
  })

  describe('REVIEW stage', () => {
    it('should increase interval on GOOD', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 1,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result.newInterval).toBeGreaterThan(1)
    })

    it('should increase interval more on EASY', () => {
      const goodResult = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      })

      const easyResult = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.EASY,
        timezone,
        reviewedAt: baseDate,
      })

      expect(easyResult.newInterval).toBeGreaterThan(goodResult.newInterval)
    })

    it('should move to RELEARNING on AGAIN', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.AGAIN,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.RELEARNING)
      expect(result.newStep).toBe(0)
    })

    it('should respect max interval', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 365, // Already at max
        currentEaseFactor: 3000, // High ease
        currentStep: 0,
        grade: GRADES.EASY,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newInterval).toBeLessThanOrEqual(365)
    })

    it('should adjust ease factor based on grade', () => {
      const againResult = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.AGAIN,
        timezone,
        reviewedAt: baseDate,
      })

      const easyResult = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.EASY,
        timezone,
        reviewedAt: baseDate,
      })

      expect(againResult.newEaseFactor).toBeLessThan(2500)
      expect(easyResult.newEaseFactor).toBeGreaterThan(2500)
    })

    it('should increase interval modestly on HARD', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.HARD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result.newInterval).toBeGreaterThan(10)
      expect(result.newInterval).toBeLessThan(15) // Should be around 12
    })

    it('should ensure intervals always increase by at least 1 day', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 1,
        currentEaseFactor: 1300, // Minimum ease factor
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newInterval).toBeGreaterThanOrEqual(2)
    })
  })

  describe('RELEARNING stage', () => {
    it('should progress through relearning steps', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.RELEARNING,
        currentInterval: 10, // Previous interval before lapsing
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      })

      // Should graduate back to REVIEW with reduced interval
      expect(result.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result.newInterval).toBeLessThan(10)
      expect(result.newInterval).toBeGreaterThanOrEqual(1)
    })

    it('should reset on AGAIN', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.RELEARNING,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.AGAIN,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.RELEARNING)
      expect(result.newStep).toBe(0)
    })

    it('should graduate early on EASY', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.RELEARNING,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.EASY,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result.newInterval).toBeLessThan(10)
    })

    it('should graduate on HARD', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.RELEARNING,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.HARD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result.newInterval).toBeLessThan(10)
    })
  })

  describe('Helpers', () => {
    it('getDaysUntilReview should calculate correctly', () => {
      const futureDate = new Date('2024-01-05T12:00:00Z')
      const days = getDaysUntilReview(futureDate, baseDate)

      expect(days).toBe(4)
    })

    it('getDaysUntilReview should return negative for overdue', () => {
      const pastDate = new Date('2023-12-28T12:00:00Z')
      const days = getDaysUntilReview(pastDate, baseDate)

      expect(days).toBeLessThan(0)
    })

    it('isDueForReview should return true when due', () => {
      const pastDate = new Date('2023-12-31T12:00:00Z')
      expect(isDueForReview(pastDate, baseDate)).toBe(true)
    })

    it('isDueForReview should return false when not due', () => {
      const futureDate = new Date('2024-01-05T12:00:00Z')
      expect(isDueForReview(futureDate, baseDate)).toBe(false)
    })

    it('isDueForReview should return true for current time', () => {
      expect(isDueForReview(baseDate, baseDate)).toBe(true)
    })
  })

  describe('Determinism', () => {
    it('should produce consistent stages for same inputs', () => {
      const input = {
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      }

      const result1 = calculateNextReview(input)
      const result2 = calculateNextReview(input)

      // Note: Due to fuzz factor, intervals might differ slightly
      // Test other properties for determinism
      expect(result1.newStage).toBe(result2.newStage)
      expect(result1.newEaseFactor).toBe(result2.newEaseFactor)
      expect(result1.newStep).toBe(result2.newStep)
    })

    it('should produce similar intervals for same inputs (within fuzz range)', () => {
      const input = {
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 100,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      }

      const results = Array.from({ length: 10 }, () => calculateNextReview(input))
      const intervals = results.map((r) => r.newInterval)

      // All intervals should be within reasonable range of the calculated base interval
      // Base calculation: 100 * 2.5 = 250
      const baseInterval = Math.floor(100 * (2500 / 1000))
      const fuzzRange = Math.floor(baseInterval * 0.05)

      for (const interval of intervals) {
        expect(interval).toBeGreaterThanOrEqual(baseInterval - fuzzRange)
        expect(interval).toBeLessThanOrEqual(baseInterval + fuzzRange)
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle very short intervals', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 1,
        currentEaseFactor: 1300, // Minimum ease
        currentStep: 0,
        grade: GRADES.HARD,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newInterval).toBeGreaterThanOrEqual(1)
    })

    it('should handle very long intervals', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 300,
        currentEaseFactor: 3000, // Maximum ease
        currentStep: 0,
        grade: GRADES.EASY,
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newInterval).toBeLessThanOrEqual(365)
    })

    it('should handle minimum ease factor boundary', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 1300, // Already at minimum
        currentStep: 0,
        grade: GRADES.AGAIN, // Try to reduce further
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newEaseFactor).toBeGreaterThanOrEqual(1300)
    })

    it('should handle maximum ease factor boundary', () => {
      const result = calculateNextReview({
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 3000, // Already at maximum
        currentStep: 0,
        grade: GRADES.EASY, // Try to increase further
        timezone,
        reviewedAt: baseDate,
      })

      expect(result.newEaseFactor).toBeLessThanOrEqual(3000)
    })

    it('should throw error for invalid stage', () => {
      expect(() => {
        calculateNextReview({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentStage: 'invalid' as any,
          currentInterval: 0,
          currentEaseFactor: 2500,
          currentStep: 0,
          grade: GRADES.GOOD,
          timezone,
          reviewedAt: baseDate,
        })
      }).toThrow('Invalid SRS stage')
    })
  })

  describe('Timezone handling', () => {
    it('should handle different timezones', () => {
      const resultUTC = calculateNextReview({
        currentStage: SRS_STAGES.NEW,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.EASY,
        timezone: 'UTC',
        reviewedAt: baseDate,
      })

      const resultNY = calculateNextReview({
        currentStage: SRS_STAGES.NEW,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.EASY,
        timezone: 'America/New_York',
        reviewedAt: baseDate,
      })

      // Both should have same interval, but different absolute times
      expect(resultUTC.newInterval).toBe(resultNY.newInterval)
      expect(resultUTC.newStage).toBe(resultNY.newStage)
    })
  })

  describe('calculateGradeFromTime', () => {
    describe('incorrect answers', () => {
      it('should return AGAIN for incorrect answers regardless of time', () => {
        // Even with fast response time, wrong answer = AGAIN
        expect(calculateGradeFromTime(1000, 1, false)).toBe(GRADES.AGAIN)
        expect(calculateGradeFromTime(100, 1, false)).toBe(GRADES.AGAIN)
        expect(calculateGradeFromTime(30000, 1, false)).toBe(GRADES.AGAIN)
      })

      it('should return AGAIN for skipped answers (0ms)', () => {
        expect(calculateGradeFromTime(0, 1, false)).toBe(GRADES.AGAIN)
      })
    })

    describe('EASY grade (0-5 sec/char)', () => {
      it('should return EASY for very fast single character response', () => {
        // 2 seconds for 1 character = 2 sec/char < 5 = EASY
        expect(calculateGradeFromTime(2000, 1, true)).toBe(GRADES.EASY)
      })

      it('should return EASY for fast multi-character response', () => {
        // 8 seconds for 2 characters = 4 sec/char < 5 = EASY
        expect(calculateGradeFromTime(8000, 2, true)).toBe(GRADES.EASY)
      })

      it('should return EASY for sub-second response', () => {
        // 500ms for 1 character = 0.5 sec/char = EASY
        expect(calculateGradeFromTime(500, 1, true)).toBe(GRADES.EASY)
      })

      it('should return EASY at just under threshold', () => {
        // 4.9 seconds for 1 character = 4.9 sec/char < 5 = EASY
        expect(calculateGradeFromTime(4900, 1, true)).toBe(GRADES.EASY)
      })
    })

    describe('GOOD grade (5-10 sec/char)', () => {
      it('should return GOOD at exactly 5 sec/char', () => {
        // 5 seconds for 1 character = 5 sec/char = GOOD
        expect(calculateGradeFromTime(5000, 1, true)).toBe(GRADES.GOOD)
      })

      it('should return GOOD for medium response time', () => {
        // 7 seconds for 1 character = 7 sec/char = GOOD
        expect(calculateGradeFromTime(7000, 1, true)).toBe(GRADES.GOOD)
      })

      it('should return GOOD for multi-character at good pace', () => {
        // 14 seconds for 2 characters = 7 sec/char = GOOD
        expect(calculateGradeFromTime(14000, 2, true)).toBe(GRADES.GOOD)
      })

      it('should return GOOD at exactly 10 sec/char', () => {
        // 10 seconds for 1 character = 10 sec/char = GOOD (boundary)
        expect(calculateGradeFromTime(10000, 1, true)).toBe(GRADES.GOOD)
      })
    })

    describe('HARD grade (> 10 sec/char)', () => {
      it('should return HARD for slow response', () => {
        // 12 seconds for 1 character = 12 sec/char > 10 = HARD
        expect(calculateGradeFromTime(12000, 1, true)).toBe(GRADES.HARD)
      })

      it('should return HARD just above threshold', () => {
        // 10.1 seconds for 1 character = 10.1 sec/char > 10 = HARD
        expect(calculateGradeFromTime(10100, 1, true)).toBe(GRADES.HARD)
      })

      it('should return HARD for very slow response', () => {
        // 30 seconds for 1 character = 30 sec/char = HARD
        expect(calculateGradeFromTime(30000, 1, true)).toBe(GRADES.HARD)
      })

      it('should return HARD for slow multi-character response', () => {
        // 24 seconds for 2 characters = 12 sec/char > 10 = HARD
        expect(calculateGradeFromTime(24000, 2, true)).toBe(GRADES.HARD)
      })
    })

    describe('edge cases', () => {
      it('should handle 0ms response time as EASY', () => {
        // 0ms for correct answer = 0 sec/char < 5 = EASY
        expect(calculateGradeFromTime(0, 1, true)).toBe(GRADES.EASY)
      })

      it('should handle very long response times', () => {
        // 5 minutes for 1 character = 300 sec/char = HARD
        expect(calculateGradeFromTime(300000, 1, true)).toBe(GRADES.HARD)
      })

      it('should handle 0 character count gracefully (treat as 1)', () => {
        // Edge case: 0 characters should not cause division by zero
        expect(calculateGradeFromTime(3000, 0, true)).toBe(GRADES.EASY) // 3 sec/1 = EASY
        expect(calculateGradeFromTime(7000, 0, true)).toBe(GRADES.GOOD) // 7 sec/1 = GOOD
        expect(calculateGradeFromTime(12000, 0, true)).toBe(GRADES.HARD) // 12 sec/1 = HARD
      })

      it('should handle negative character count gracefully (treat as 1)', () => {
        // Edge case: negative should be treated as 1
        expect(calculateGradeFromTime(3000, -1, true)).toBe(GRADES.EASY)
      })

      it('should scale correctly with character count', () => {
        // Same total time, different character counts
        // 20 seconds:
        // - 1 char: 20 sec/char = HARD
        // - 2 chars: 10 sec/char = GOOD
        // - 4 chars: 5 sec/char = GOOD
        // - 8 chars: 2.5 sec/char = EASY
        expect(calculateGradeFromTime(20000, 1, true)).toBe(GRADES.HARD)
        expect(calculateGradeFromTime(20000, 2, true)).toBe(GRADES.GOOD)
        expect(calculateGradeFromTime(20000, 4, true)).toBe(GRADES.GOOD)
        expect(calculateGradeFromTime(20000, 8, true)).toBe(GRADES.EASY)
      })
    })

    describe('threshold constants', () => {
      it('should use correct threshold values', () => {
        // Verify thresholds match expected values
        expect(TIME_THRESHOLDS.EASY_MAX).toBe(5)
        expect(TIME_THRESHOLDS.GOOD_MAX).toBe(10)
      })
    })
  })

  describe('Complete learning flow', () => {
    it('should follow typical progression: NEW -> LEARNING -> REVIEW', () => {
      type CurrentState = {
        currentStage: 'new' | 'learning' | 'review' | 'relearning'
        currentInterval: number
        currentEaseFactor: number
        currentStep: number
        grade: 0 | 1 | 2 | 3
        timezone: string
        reviewedAt: Date
      }

      let currentState: CurrentState = {
        currentStage: SRS_STAGES.NEW,
        currentInterval: 0,
        currentEaseFactor: INITIAL_EASE_FACTOR,
        currentStep: 0,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      }

      // Step 1: NEW -> LEARNING (step 0)
      let result = calculateNextReview(currentState)
      expect(result.newStage).toBe(SRS_STAGES.LEARNING)
      expect(result.newStep).toBe(0)

      // Step 2: LEARNING step 0 -> step 1
      currentState = {
        currentStage: result.newStage,
        currentInterval: result.newInterval,
        currentEaseFactor: result.newEaseFactor,
        currentStep: result.newStep,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      }
      result = calculateNextReview(currentState)
      expect(result.newStage).toBe(SRS_STAGES.LEARNING)
      expect(result.newStep).toBe(1)

      // Step 3: LEARNING step 1 -> REVIEW
      currentState = {
        currentStage: result.newStage,
        currentInterval: result.newInterval,
        currentEaseFactor: result.newEaseFactor,
        currentStep: result.newStep,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      }
      result = calculateNextReview(currentState)
      expect(result.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result.newInterval).toBe(GRADUATING_INTERVAL_DAYS)
    })

    it('should handle lapse and recovery: REVIEW -> RELEARNING -> REVIEW', () => {
      type CurrentState = {
        currentStage: 'new' | 'learning' | 'review' | 'relearning'
        currentInterval: number
        currentEaseFactor: number
        currentStep: number
        grade: 0 | 1 | 2 | 3
        timezone: string
        reviewedAt: Date
      }

      // Start in REVIEW stage
      let currentState: CurrentState = {
        currentStage: SRS_STAGES.REVIEW,
        currentInterval: 10,
        currentEaseFactor: 2500,
        currentStep: 0,
        grade: GRADES.AGAIN,
        timezone,
        reviewedAt: baseDate,
      }

      // Step 1: REVIEW -> RELEARNING (lapse)
      let result = calculateNextReview(currentState)
      expect(result.newStage).toBe(SRS_STAGES.RELEARNING)
      expect(result.newStep).toBe(0)

      // Step 2: RELEARNING -> REVIEW (recovery)
      currentState = {
        currentStage: result.newStage,
        currentInterval: 10, // Previous interval
        currentEaseFactor: result.newEaseFactor,
        currentStep: result.newStep,
        grade: GRADES.GOOD,
        timezone,
        reviewedAt: baseDate,
      }
      result = calculateNextReview(currentState)
      expect(result.newStage).toBe(SRS_STAGES.REVIEW)
      expect(result.newInterval).toBeLessThan(10) // Reduced interval after lapse
    })
  })
})
