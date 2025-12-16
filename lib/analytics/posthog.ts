/**
 * PostHog Analytics Setup (GDPR Compliant)
 *
 * This file configures privacy-friendly analytics with PostHog.
 * It respects user consent and implements data minimization.
 *
 * Key Features:
 * - Cookie consent integration
 * - Do Not Track (DNT) respect
 * - PII sanitization
 * - GDPR compliance
 * - Session recording (optional)
 *
 * Documentation: https://posthog.com/docs
 */

import posthog from 'posthog-js'

/**
 * Initialize PostHog (call this once on app startup)
 */
export function initPostHog() {
  // Only initialize if API key is configured and we're in the browser
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null
  }

  // Check if PostHog is already initialized
  if (posthog.__loaded) {
    return posthog
  }

  // Initialize PostHog
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',

    // Privacy Settings
    respect_dnt: true, // Respect Do Not Track browser setting
    opt_out_capturing_by_default: true, // Wait for explicit consent
    capture_pageview: false, // Manual pageview tracking (after consent)
    capture_pageleave: false, // Manual pageleave tracking

    // Session Recording (disabled by default for privacy)
    disable_session_recording: true, // Enable only after consent

    // Cookie Settings
    persistence: 'localStorage+cookie', // Use both for reliability
    cookie_name: 'ph_analytics', // Custom cookie name
    cross_subdomain_cookie: false, // Don't track across subdomains

    // Data Sanitization
    property_blacklist: [
      // Exclude sensitive properties from all events
      '$password',
      'password',
      'email',
      'phone',
      'credit_card',
      'api_key',
      'token',
      'secret',
    ],

    // Autocapture (disabled for more control)
    autocapture: false, // Manual event tracking only

    // Advanced Options
    loaded: () => {
      // PostHog is loaded, but not capturing yet (waiting for consent)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('📊 PostHog loaded (awaiting consent)')
      }
    },

    // Disable in development (optional)
    ...(process.env.NODE_ENV === 'development' && {
      debug: true,
      opt_out_capturing_by_default: true,
    }),
  })

  return posthog
}

/**
 * Enable analytics after user consent
 */
export function enableAnalytics() {
  if (typeof window === 'undefined' || !posthog.__loaded) {
    return
  }

  // Opt in to capturing
  posthog.opt_in_capturing()

  // Start session recording (if desired)
  // posthog.startSessionRecording()

  // Capture pageview
  posthog.capture('$pageview')

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('✅ Analytics enabled with user consent')
  }
}

/**
 * Disable analytics when user opts out
 */
export function disableAnalytics() {
  if (typeof window === 'undefined' || !posthog.__loaded) {
    return
  }

  // Opt out of capturing
  posthog.opt_out_capturing()

  // Stop session recording
  posthog.stopSessionRecording()

  // Clear stored data
  posthog.reset()

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('🚫 Analytics disabled by user')
  }
}

/**
 * Check if user has given consent
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Check localStorage for consent
  const consent = localStorage.getItem('analytics_consent')
  return consent === 'true'
}

/**
 * Save analytics consent
 */
export function setAnalyticsConsent(hasConsent: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem('analytics_consent', hasConsent.toString())

  if (hasConsent) {
    enableAnalytics()
  } else {
    disableAnalytics()
  }
}

/**
 * Track custom events (only if consent given)
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog.__loaded || !hasAnalyticsConsent()) {
    return
  }

  // Sanitize properties (remove PII)
  const sanitizedProperties = sanitizeEventData(properties)

  posthog.capture(eventName, sanitizedProperties)
}

/**
 * Track page views (only if consent given)
 */
export function trackPageView(url?: string) {
  if (typeof window === 'undefined' || !posthog.__loaded || !hasAnalyticsConsent()) {
    return
  }

  posthog.capture('$pageview', {
    $current_url: url || window.location.href,
  })
}

/**
 * Identify user (only non-PII data)
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog.__loaded || !hasAnalyticsConsent()) {
    return
  }

  // Sanitize user properties (remove PII)
  const sanitizedProperties = sanitizeEventData(properties)

  posthog.identify(userId, sanitizedProperties)
}

/**
 * Remove PII from event data
 */
function sanitizeEventData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) {
    return undefined
  }

  const sanitized = { ...data }

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'email',
    'phone',
    'credit_card',
    'api_key',
    'token',
    'secret',
    'ssn',
    'address',
  ]

  sensitiveFields.forEach((field) => {
    delete sanitized[field]
  })

  return sanitized
}

/**
 * Reset analytics (on logout)
 */
export function resetAnalytics() {
  if (typeof window === 'undefined' || !posthog.__loaded) {
    return
  }

  posthog.reset()
}

/**
 * Get PostHog instance (for advanced usage)
 */
export function getPostHog() {
  if (typeof window === 'undefined' || !posthog.__loaded) {
    return null
  }

  return posthog
}
