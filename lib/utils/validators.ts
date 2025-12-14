/**
 * Zod validation schemas
 * This is a placeholder - will be fully implemented in PROMPT 2
 */

import { z } from 'zod'

export const reviewSubmissionSchema = z.object({
  reviewId: z.string().uuid(),
  isCorrect: z.boolean(),
  userAnswer: z.string().min(1),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
})

export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
