/**
 * Cookie Consent Banner (GDPR Compliant)
 *
 * This component displays a cookie consent banner and manages user preferences.
 * It integrates with PostHog analytics to enable/disable tracking based on consent.
 *
 * Features:
 * - GDPR compliant cookie consent
 * - Saves user preference to localStorage
 * - Enables/disables analytics based on consent
 * - Dismissible after choice is made
 */

'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  disableAnalytics,
  enableAnalytics,
  setAnalyticsConsent,
} from '@/lib/analytics/posthog'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('analytics_consent')

    if (consentGiven === null) {
      // Show banner if no choice has been made
      setShowBanner(true)
    } else if (consentGiven === 'true') {
      // User has consented - enable analytics
      enableAnalytics()
    } else {
      // User has declined - ensure analytics is disabled
      disableAnalytics()
    }
  }, [])

  const handleAccept = () => {
    setAnalyticsConsent(true)
    setShowBanner(false)
  }

  const handleDecline = () => {
    setAnalyticsConsent(false)
    setShowBanner(false)
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <Card className="mx-auto max-w-3xl border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">🍪 Cookie Preferences</CardTitle>
          <CardDescription>
            We use cookies to improve your experience and understand how you use
            our app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Essential cookies:</strong> Required for authentication and
            core functionality (always enabled).
          </p>
          <p>
            <strong>Analytics cookies:</strong> Help us understand how you use
            the app so we can improve it. No personal information is collected.
          </p>
          <p className="text-xs">
            By clicking &quot;Accept&quot;, you consent to analytics cookies.
            You can change your preferences anytime in Settings. See our{' '}
            <a
              href="/privacy"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{' '}
            for more information.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="w-full sm:w-auto"
          >
            Decline Analytics
          </Button>
          <Button onClick={handleAccept} className="w-full sm:w-auto">
            Accept All
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
