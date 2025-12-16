/**
 * Sentry Server-Side Configuration
 *
 * This file configures Sentry error tracking for Node.js/server-side code.
 * It captures API errors, database errors, and server-side exceptions.
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

    // Before sending events to Sentry, you can modify or filter them
    beforeSend(event, _hint) {
      // Scrub sensitive data from server errors
      if (event.request?.cookies) {
        delete event.request.cookies
      }

      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
        delete event.request.headers['x-api-key']
      }

      // Scrub database URLs and connection strings
      if (event.extra) {
        Object.keys(event.extra).forEach((key) => {
          const value = event.extra![key]
          if (
            typeof value === 'string' &&
            (value.includes('postgresql://') ||
              value.includes('postgres://') ||
              value.includes('password'))
          ) {
            event.extra![key] = '[REDACTED]'
          }
        })
      }

      return event
    },

    // Ignore specific errors
    ignoreErrors: [
      // Database connection errors (usually temporary)
      'Connection terminated',
      'ECONNREFUSED',
      'ETIMEDOUT',

      // Rate limiting
      'Too many requests',
      'Rate limit exceeded',
    ],

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  })
}
