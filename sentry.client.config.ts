/**
 * Sentry Client-Side Configuration
 *
 * This file configures Sentry error tracking for the browser/client-side.
 * It captures JavaScript errors, unhandled promises, and user interactions.
 *
 * Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    // Data Source Name - identifies your Sentry project
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment (production, staging, development)
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring: Sample rate for transactions (0.0 to 1.0)
    // 0.1 = 10% of transactions are sent to Sentry
    // Adjust based on traffic volume to control costs
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Note: Integrations like BrowserTracing and Replay are automatically configured
    // by @sentry/nextjs. To customize, see: https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/

    // Before sending events to Sentry, you can modify or filter them
    beforeSend(event, _hint) {
      // Filter out specific errors
      if (event.exception) {
        const error = _hint.originalException

        // Ignore network errors (user offline, etc.)
        if (
          error instanceof Error &&
          (error.message.includes('Failed to fetch') ||
            error.message.includes('Network request failed'))
        ) {
          return null
        }

        // Ignore extension errors (not our code)
        if (
          event.exception.values?.[0]?.stacktrace?.frames?.some(
            (frame) =>
              frame.filename?.includes('extension://') ||
              frame.filename?.includes('chrome-extension://')
          )
        ) {
          return null
        }
      }

      // Scrub sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies
      }

      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }

      return event
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Network request failed',

      // ResizeObserver (harmless)
      'ResizeObserver loop limit exceeded',

      // Cancelled requests
      'cancelled',
      'AbortError',
    ],

    // Deny URLs (don't report errors from these sources)
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
    ],

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  })
}
