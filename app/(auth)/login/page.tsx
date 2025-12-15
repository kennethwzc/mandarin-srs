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
    if (error === 'invalid_code') {
      toast.error('Invalid verification code', {
        description: 'Please try signing in again.',
      })
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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

      // Wait for cookies to be set and session to be available
      // The Supabase client sets cookies via setAll, but we need to ensure
      // they're propagated before redirecting so middleware can detect the session
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Verify session exists and cookies are set before redirecting
      const supabase = createClient()
      let verifySession = null
      let attempts = 0
      const maxAttempts = 3

      // Retry getting session with exponential backoff
      while (!verifySession && attempts < maxAttempts) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Error getting session:', sessionError)
        }

        if (session) {
          verifySession = session
          break
        }

        attempts++
        if (attempts < maxAttempts) {
          const waitTime = 300 * attempts // 300ms, 600ms, 900ms
          console.log(
            `Session not found, retrying in ${waitTime}ms (attempt ${attempts}/${maxAttempts})...`
          )
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
      }

      if (!verifySession) {
        console.error('Session not found after all retries')
        console.log('Current cookies:', document.cookie)
        toast.error('Session not available. Please try logging in again.')
        setIsLoading(false)
        return
      }

      // Verify cookies are actually set
      const cookies = document.cookie
      const hasAuthCookies = cookies.includes('sb-') || cookies.includes('supabase.auth')

      if (!hasAuthCookies) {
        console.warn('Auth cookies not found in document.cookie')
        console.log('All cookies:', cookies)
      }

      // Use window.location.replace for a hard redirect
      // This forces a full page reload so middleware can detect the session
      console.log('Redirecting to:', finalRedirect)
      console.log('Session verified, cookies present:', hasAuthCookies)

      // Force redirect - this will trigger middleware which should see the session
      window.location.replace(finalRedirect)
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
