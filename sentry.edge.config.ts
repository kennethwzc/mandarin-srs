/**
 * Sentry Edge Runtime Configuration
 *
 * This file configures Sentry error tracking for Edge Runtime (middleware).
 * It captures errors in Next.js middleware and edge functions.
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
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Before sending events to Sentry, you can modify or filter them
    beforeSend(event, _hint) {
      // Scrub sensitive data from middleware
      if (event.request?.cookies) {
        delete event.request.cookies
      }

      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }

      return event
    },

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  })
}
