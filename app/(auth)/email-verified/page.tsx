/**
 * Email Verification Success Page
 *
 * Shown after user clicks email verification link and email is confirmed.
 * Provides clear feedback that verification was successful.
 * Auto-redirects to login after 5 seconds.
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function EmailVerifiedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  const hasError = searchParams.get('error') === 'profile_setup_incomplete'

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Auto-redirect after 5 seconds
    const redirectTimer = setTimeout(() => {
      const loginUrl = hasError
        ? '/login?error=profile_setup_incomplete'
        : '/login?verified=true'
      router.push(loginUrl)
    }, 5000)

    return () => {
      clearInterval(countdownInterval)
      clearTimeout(redirectTimer)
    }
  }, [router, hasError])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {hasError ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Email Verified - Setup Incomplete</CardTitle>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Email Verified Successfully!</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {hasError ? (
            <>
              <p className="text-center text-muted-foreground">
                Your email has been successfully verified, but we encountered an issue setting up
                your profile.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Please try signing in. If the issue persists, contact support at{' '}
                <a
                  href="mailto:support@mandarinsrs.com"
                  className="text-primary hover:underline"
                >
                  support@mandarinsrs.com
                </a>
              </p>
            </>
          ) : (
            <>
              <p className="text-center text-muted-foreground">
                Your email has been successfully verified! You can now sign in to your account and
                start learning Mandarin with pinyin input.
              </p>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-center text-sm font-medium text-green-800">
                  ✓ Email confirmed
                  <br />✓ Account activated
                  <br />✓ Ready to start learning
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <div className="text-center text-sm text-muted-foreground">
              Redirecting to sign in page in {countdown} second{countdown !== 1 ? 's' : ''}...
            </div>
            <Button onClick={() => router.push('/login')} className="w-full">
              Sign In Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmailVerifiedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Verifying Email...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">Loading...</div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <EmailVerifiedContent />
    </Suspense>
  )
}

