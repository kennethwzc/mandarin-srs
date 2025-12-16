/**
 * Analytics Provider
 *
 * Initializes PostHog analytics on the client side.
 * Must be placed in a Client Component.
 */

'use client'

import { useEffect } from 'react'

import { initPostHog } from '@/lib/analytics/posthog'
import { isFeatureEnabled } from '@/lib/utils/env'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize if analytics feature is enabled
    if (isFeatureEnabled.analytics && isFeatureEnabled.posthog) {
      initPostHog()
    }
  }, [])

  return <>{children}</>
}
