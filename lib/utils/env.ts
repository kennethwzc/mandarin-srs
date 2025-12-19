/**
 * Environment Variable Validation with Zod
 *
 * This file validates all environment variables at build time and runtime.
 * It ensures type safety and prevents deployment with missing/invalid variables.
 *
 * Usage:
 * ```ts
 * import { env } from '@/lib/utils/env'
 *
 * // Access validated environment variables
 * const dbUrl = env.DATABASE_URL
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
 * ```
 *
 * Key Features:
 * - Type-safe environment variables
 * - Build-time validation
 * - Clear error messages for missing variables
 * - Separates client and server variables
 * - Optional variables with defaults
 */

import { z } from 'zod'

/**
 * Server-side environment variables schema
 * These are NEVER exposed to the browser
 */
const serverSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database - Optional during build, required at runtime
  DATABASE_URL: z.string().min(1).optional(),

  // Supabase - Optional during build, required at runtime
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Sentry (optional)
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Anthropic AI (optional)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Rate limiting (optional)
  RATE_LIMIT_REQUESTS: z.string().default('100'),
  RATE_LIMIT_WINDOW: z.string().default('60000'),
})

/**
 * Client-side environment variables schema
 * These are exposed to the browser (must have NEXT_PUBLIC_ prefix)
 */
const clientSchema = z.object({
  // Supabase (public keys - safe to expose)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1, 'NEXT_PUBLIC_SUPABASE_URL is required'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Sentry (optional - public DSN)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // PostHog (optional - public key)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // Stripe (optional - publishable key)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Feature flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  NEXT_PUBLIC_ENABLE_STRIPE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  NEXT_PUBLIC_ENABLE_AI_FEATURES: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
})

/**
 * Validate environment variables
 * Runs at build time and server startup
 */
function validateEnv() {
  // Check if we're on the server
  const isServer = typeof window === 'undefined'

  // Allow skipping validation during build (for CI without secrets)
  // Set SKIP_ENV_VALIDATION=1 in CI build step if secrets aren't available
  const skipValidation = process.env.SKIP_ENV_VALIDATION === '1'

  if (skipValidation) {
    // Return mock/default values for build-time type checking
    return {
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_ENABLE_ANALYTICS: false,
      NEXT_PUBLIC_ENABLE_STRIPE: false,
      NEXT_PUBLIC_ENABLE_AI_FEATURES: false,
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      DATABASE_URL: process.env.DATABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      SENTRY_ORG: process.env.SENTRY_ORG,
      SENTRY_PROJECT: process.env.SENTRY_PROJECT,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      RATE_LIMIT_REQUESTS: process.env.RATE_LIMIT_REQUESTS || '100',
      RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '60000',
    }
  }

  try {
    // Always validate client variables
    const clientEnv = clientSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_ENABLE_STRIPE: process.env.NEXT_PUBLIC_ENABLE_STRIPE,
      NEXT_PUBLIC_ENABLE_AI_FEATURES: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES,
    })

    // Only validate server variables on the server
    if (isServer) {
      const serverEnv = serverSchema.parse({
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
        SENTRY_ORG: process.env.SENTRY_ORG,
        SENTRY_PROJECT: process.env.SENTRY_PROJECT,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        RATE_LIMIT_REQUESTS: process.env.RATE_LIMIT_REQUESTS,
        RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
      })

      return { ...clientEnv, ...serverEnv }
    }

    return clientEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(
        `❌ Invalid environment variables:\n\n${missingVars}\n\n` +
          `Please check your .env.local file and ensure all required variables are set.\n` +
          `See .env.example for reference.`
      )
    }
    throw error
  }
}

/**
 * Validated and type-safe environment variables
 * Use this throughout your application
 */
export const env = validateEnv()

/**
 * Type definitions for environment variables
 */
export type Env = ReturnType<typeof validateEnv>

/**
 * Helper to check if a feature is enabled
 */
export const isFeatureEnabled = {
  analytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  stripe: env.NEXT_PUBLIC_ENABLE_STRIPE,
  aiFeatures: env.NEXT_PUBLIC_ENABLE_AI_FEATURES,
  sentry: !!env.NEXT_PUBLIC_SENTRY_DSN,
  posthog: !!env.NEXT_PUBLIC_POSTHOG_KEY && !!env.NEXT_PUBLIC_POSTHOG_HOST,
}

/**
 * Helper to check if we're in production
 * Access NODE_ENV directly since it may not be in client env
 */
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Helper to check if we're in development
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Helper to check if we're in test mode
 */
export const isTest = process.env.NODE_ENV === 'test'
