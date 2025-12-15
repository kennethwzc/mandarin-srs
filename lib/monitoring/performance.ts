/**
 * Performance Monitoring
 *
 * Tracks Core Web Vitals and custom metrics
 */

/* eslint-disable no-console */

export function reportWebVitals(metric: {
  id: string
  name: string
  value: number
  label: string
}) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric)
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Example: Send to Google Analytics
    const win = window as typeof window & { gtag?: (...args: unknown[]) => void }
    if (win.gtag) {
      win.gtag('event', metric.name, {
        value: Math.round(metric.value),
        event_label: metric.id,
        non_interaction: true,
      })
    }

    // Or send to custom analytics endpoint
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
      keepalive: true,
    }).catch(() => {
      // Silently fail
    })
  }
}

/**
 * Custom performance marks
 */
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name)
  }
}

export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name)[0]

    if (measure && process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${measure.duration.toFixed(2)}ms`)
    }

    return measure
  }

  return undefined
}

/**
 * Track API call performance
 */
export async function trackAPICall<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - start

    if (process.env.NODE_ENV === 'development') {
      console.log(`API: ${name} - ${duration.toFixed(2)}ms`)
    }

    // Send to analytics if slow
    if (duration > 1000) {
      console.warn(`Slow API call: ${name} - ${duration.toFixed(2)}ms`)
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`API Error: ${name} - ${duration.toFixed(2)}ms`, error)
    throw error
  }
}
