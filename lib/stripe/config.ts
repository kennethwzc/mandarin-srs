/**
 * Stripe Configuration (Optional)
 *
 * This file configures Stripe for payment processing.
 * Only use this if you plan to add paid features.
 *
 * Documentation: https://stripe.com/docs/api
 */

import Stripe from 'stripe'

import { isFeatureEnabled } from '@/lib/utils/env'

/**
 * Initialize Stripe client (server-side only)
 * Note: This file should only be imported from server-side code
 */
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

export const stripe =
  isFeatureEnabled.stripe && STRIPE_SECRET_KEY
    ? new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: '2025-12-15.clover',
        typescript: true,
        appInfo: {
          name: 'Mandarin SRS',
          version: '1.0.0',
        },
      })
    : null

/**
 * Subscription plans configuration
 * Customize these based on your pricing
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Basic learning features',
    price: 0,
    interval: null,
    features: [
      'HSK 1-2 vocabulary',
      'Basic SRS algorithm',
      'Progress tracking',
      'Community support',
    ],
    limits: {
      lessonsPerDay: 5,
      reviewsPerDay: 50,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced learning features',
    price: 9.99,
    interval: 'month' as const,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: [
      'All HSK levels (1-6)',
      'Advanced SRS algorithm',
      'Unlimited reviews',
      'AI-generated mnemonics',
      'Priority support',
    ],
    limits: {
      lessonsPerDay: null, // Unlimited
      reviewsPerDay: null, // Unlimited
    },
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    description: 'One-time payment, lifetime access',
    price: 99.99,
    interval: 'one_time' as const,
    stripePriceId: process.env.STRIPE_LIFETIME_PRICE_ID || '',
    features: [
      'Everything in Pro',
      'Lifetime updates',
      'Early access to new features',
      'Exclusive community',
    ],
    limits: {
      lessonsPerDay: null,
      reviewsPerDay: null,
    },
  },
} as const

/**
 * Get plan by ID
 */
export function getPlanById(planId: string) {
  return SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] || null
}

/**
 * Get plan by Stripe price ID
 */
export function getPlanByPriceId(priceId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(
    (plan) => 'stripePriceId' in plan && plan.stripePriceId === priceId
  )
}

/**
 * Check if user can access a feature based on their plan
 */
export function canAccessFeature(
  userPlan: keyof typeof SUBSCRIPTION_PLANS,
  feature: string
): boolean {
  const plan = SUBSCRIPTION_PLANS[userPlan]
  if (!plan) {
    return false
  }

  // Free plan has limited access
  if (userPlan === 'free') {
    return ['basic-lessons', 'progress-tracking', 'reviews'].includes(feature)
  }

  // Pro and Lifetime have full access
  return true
}

/**
 * Check if user has exceeded their plan limits
 */
export function checkPlanLimits(
  userPlan: keyof typeof SUBSCRIPTION_PLANS,
  usage: { lessonsToday: number; reviewsToday: number }
): { canStartLesson: boolean; canReview: boolean; messages: string[] } {
  const plan = SUBSCRIPTION_PLANS[userPlan]
  const messages: string[] = []

  const canStartLesson =
    plan.limits.lessonsPerDay === null || usage.lessonsToday < plan.limits.lessonsPerDay

  const canReview =
    plan.limits.reviewsPerDay === null || usage.reviewsToday < plan.limits.reviewsPerDay

  if (!canStartLesson) {
    messages.push(
      `Daily lesson limit reached (${plan.limits.lessonsPerDay}). Upgrade to Pro for unlimited lessons!`
    )
  }

  if (!canReview) {
    messages.push(
      `Daily review limit reached (${plan.limits.reviewsPerDay}). Upgrade to Pro for unlimited reviews!`
    )
  }

  return { canStartLesson, canReview, messages }
}

/**
 * Format price for display
 */
export function formatPrice(price: number, interval?: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)

  if (!interval) {
    return formatted
  }
  if (interval === 'month') {
    return `${formatted}/month`
  }
  if (interval === 'year') {
    return `${formatted}/year`
  }
  if (interval === 'one_time') {
    return formatted
  }

  return formatted
}
