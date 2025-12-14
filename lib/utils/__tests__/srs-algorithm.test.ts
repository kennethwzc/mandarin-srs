import { calculateNextReview, getDaysUntilReview, isDueForReview } from '../srs-algorithm'
import {
  SRS_STAGES,
  GRADES,
  INITIAL_EASE_FACTOR,
  GRADUATING_INTERVAL_DAYS,
  EASY_INTERVAL_DAYS,
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
