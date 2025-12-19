'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, RefreshCw, Home, LogIn, WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Error categories for better UX
 */
type ErrorCategory = 'auth' | 'network' | 'transient' | 'unknown'

/**
 * Error messages patterns for categorization
 */
const AUTH_PATTERNS = [
  'unauthorized',
  'unauthenticated',
  'not authenticated',
  'session expired',
  'invalid token',
  'jwt expired',
  'auth',
  'login required',
]

const NETWORK_PATTERNS = [
  'network',
  'fetch failed',
  'connection',
  'econnreset',
  'etimedout',
  'econnrefused',
  'socket',
  'offline',
]

const TRANSIENT_PATTERNS = [
  'aborted',
  'abort',
  'cancelled',
  'canceled',
  'timeout',
  'temporarily',
  'try again',
]

/**
 * Categorize an error for appropriate UI handling
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase()
  const name = error.name.toLowerCase()
  const combined = `${name} ${message}`

  if (AUTH_PATTERNS.some((pattern) => combined.includes(pattern))) {
    return 'auth'
  }

  if (NETWORK_PATTERNS.some((pattern) => combined.includes(pattern))) {
    return 'network'
  }

  if (TRANSIENT_PATTERNS.some((pattern) => combined.includes(pattern))) {
    return 'transient'
  }

  return 'unknown'
}

/**
 * Get error display info based on category
 */
function getErrorInfo(category: ErrorCategory) {
  switch (category) {
    case 'auth':
      return {
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again to continue.',
        icon: LogIn,
        primaryAction: 'login',
        showRetry: false,
      }
    case 'network':
      return {
        title: 'Connection Issue',
        description: 'Unable to connect to the server. Please check your internet connection.',
        icon: WifiOff,
        primaryAction: 'retry',
        showRetry: true,
      }
    case 'transient':
      return {
        title: 'Temporary Issue',
        description: 'Something went wrong, but it might be temporary. Please try again.',
        icon: RefreshCw,
        primaryAction: 'retry',
        showRetry: true,
      }
    case 'unknown':
    default:
      return {
        title: 'Something Went Wrong',
        description: 'An unexpected error occurred. Please try again or go back to the dashboard.',
        icon: AlertCircle,
        primaryAction: 'retry',
        showRetry: true,
      }
  }
}

/**
 * App-level error boundary with smart error categorization
 *
 * Provides appropriate UI and actions based on error type:
 * - Auth errors: Redirect to login
 * - Network errors: Retry with connection message
 * - Transient errors: Simple retry
 * - Unknown errors: Retry with dashboard fallback
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  // Categorize the error once
  const category = useMemo(() => categorizeError(error), [error])
  const errorInfo = useMemo(() => getErrorInfo(category), [category])

  // Log error in development (respecting logger pattern but in client context)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[AppError]', { category, message: error.message, digest: error.digest })
    }
  }, [error, category])

  // Auto-redirect to login for auth errors after a short delay
  useEffect(() => {
    if (category === 'auth') {
      const timer = setTimeout(() => {
        router.push('/login?redirectTo=/dashboard')
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [category, router])

  const handleRetry = () => {
    reset()
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const handleLogin = () => {
    router.push('/login?redirectTo=/dashboard')
  }

  const Icon = errorInfo.icon

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-muted p-3">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold">{errorInfo.title}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{errorInfo.description}</p>

        {category === 'auth' && (
          <p className="mb-4 text-xs text-muted-foreground">
            Redirecting to login in a few seconds...
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {errorInfo.primaryAction === 'login' ? (
            <Button onClick={handleLogin} className="gap-2">
              <LogIn className="h-4 w-4" />
              Log In
            </Button>
          ) : (
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}

          <Button variant="outline" onClick={handleGoHome} className="gap-2">
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Debug Info (dev only)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(
                {
                  category,
                  name: error.name,
                  message: error.message,
                  digest: error.digest,
                },
                null,
                2
              )}
            </pre>
          </details>
        )}
      </Card>
    </div>
  )
}
