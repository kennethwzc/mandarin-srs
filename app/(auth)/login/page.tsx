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
import { toast } from 'sonner'

function LoginForm() {
  const searchParams = useSearchParams()
  const { signIn, isLoading: authLoading } = useAuth()

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

      // Use window.location for a hard redirect to ensure session is picked up by middleware
      // This ensures cookies are set and middleware can detect the session
      const redirectTo = searchParams.get('redirectTo') || '/dashboard'
      window.location.href = redirectTo
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
