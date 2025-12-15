'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function LessonsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('LESSONS ERROR BOUNDARY:', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription>
          <div className="space-y-4">
            <p>The lessons page encountered an error.</p>
            <details className="rounded bg-destructive/10 p-3 text-xs">
              <summary className="mb-2 cursor-pointer font-semibold">Error Details</summary>
              <div className="space-y-2">
                <div>
                  <strong>Message:</strong>
                  <pre className="mt-1 overflow-auto">{error.message}</pre>
                </div>
                {error.digest && (
                  <div>
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 overflow-auto text-[10px]">{error.stack}</pre>
                </div>
              </div>
            </details>

            <div className="flex gap-2">
              <Button onClick={reset}>Try Again</Button>
              <Button variant="outline" onClick={() => window.location.assign('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
