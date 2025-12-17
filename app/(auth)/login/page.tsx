'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function LoginForm() {
  const searchParams = useSearchParams()
  const { signIn, isLoading: authLoading } = useAuth()
  const { initialize } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Check for error query param
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (error === 'invalid_code') {
      toast.error('Invalid verification code', {
        description: 'Please try signing in again.',
      })
    }

    if (error === 'verification_failed') {
      toast.error('Email verification failed', {
        description: message || 'Please try clicking the link again.',
      })
    }

    if (error === 'profile_creation_failed') {
      toast.error('Account setup failed', {
        description: message || 'Unable to set up your account. Please contact support.',
      })
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation() // Prevent any event bubbling that might interfere
    setIsLoading(true)

    try {
      const { error, session } = await signIn(email, password)

      if (error) {
        toast.error('Login failed', {
          description: error,
        })
        setIsLoading(false)
        return
      }

      if (!session) {
        toast.error('Login failed', {
          description: 'No session created. Please try again.',
        })
        setIsLoading(false)
        return
      }

      toast.success('Logged in successfully')

      // Get redirect destination and decode it (handles URL-encoded paths like %2Fdashboard)
      const redirectToParam = searchParams.get('redirectTo')
      const redirectTo = redirectToParam ? decodeURIComponent(redirectToParam) : '/dashboard'

      // Ensure redirectTo is a valid path (starts with /)
      const finalRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard'

      // Refresh auth store to sync session state
      await initialize()

      // Verify session and cookies are set before redirecting
      const supabase = createClient()
      let sessionVerified = false
      let attempts = 0
      const maxAttempts = 5

      while (!sessionVerified && attempts < maxAttempts) {
        const {
          data: { session: verifySession },
        } = await supabase.auth.getSession()

        if (verifySession) {
          sessionVerified = true
          console.log('[Login] Session verified, cookies should be set')
          break
        }

        attempts++
        if (attempts < maxAttempts) {
          const waitTime = 200 * attempts // 200ms, 400ms, 600ms, 800ms, 1000ms
          console.log(
            `[Login] Session not verified yet, waiting ${waitTime}ms (attempt ${attempts}/${maxAttempts})...`
          )
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
      }

      // Check cookies are actually set
      const cookies = document.cookie
      const hasAuthCookies = cookies.includes('sb-') || cookies.includes('supabase.auth.token')
      console.log('[Login] Cookies present:', hasAuthCookies)
      console.log('[Login] All cookies:', cookies)

      if (!sessionVerified) {
        console.error('[Login] Session not verified after all attempts')
        toast.error('Session verification failed. Please try again.')
        setIsLoading(false)
        return
      }

      console.log('[Login] Session and cookies verified')
      console.log('[Login] Redirecting to:', finalRedirect)

      // Build full URL
      const fullRedirectUrl = new URL(finalRedirect, window.location.origin).href

      // CRITICAL: Execute redirect and return immediately
      // window.location.href should navigate, but we return to ensure
      // no code executes after this point
      window.location.href = fullRedirectUrl

      // Return immediately - redirect should have happened
      // If code after this executes, the redirect was blocked
      return
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const isDisabled = isLoading || authLoading

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to continue learning pinyin</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/reset-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isDisabled}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isDisabled}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Sign in to continue learning pinyin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">Loading...</div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
