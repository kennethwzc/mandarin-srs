/**
 * Environment variable validation
 *
 * Validates that all required environment variables are set.
 * Throws error if any are missing.
 */

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }

  return value
}

export const env = {
  // Supabase (public)
  supabaseUrl: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),

  // Supabase (private - server only)
  supabaseServiceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),

  // Database
  databaseUrl: getEnvVar('DATABASE_URL'),

  // App
  appUrl: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),

  // Node environment
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const

/**
 * Validate all environment variables on startup
 * Call this in root layout or middleware
 */
export function validateEnv() {
  try {
    // Accessing env object will trigger validation
    // These assignments ensure all required env vars are checked
    void {
      supabaseUrl: env.supabaseUrl,
      supabaseAnonKey: env.supabaseAnonKey,
      databaseUrl: env.databaseUrl,
    }

    if (typeof window === 'undefined') {
      // Server-side only validation
      void {
        serviceRoleKey: env.supabaseServiceRoleKey,
      }
    }

    // All environment variables validated successfully
    return true
  } catch (error) {
    // Re-throw error with context
    throw new Error(
      `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
