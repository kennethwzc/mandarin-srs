'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [isResending, setIsResending] = useState(false)

  async function handleResendEmail() {
    if (!email) {
      toast.error('Email address not found')
      return
    }

    setIsResending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        toast.error('Failed to resend email', {
          description: error.message,
        })
      } else {
        toast.success('Confirmation email sent!', {
          description: 'Please check your inbox.',
        })
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to {email ? <strong>{email}</strong> : 'your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Click the link in the email to confirm your account</p>
                <p className="text-muted-foreground">
                  The link will expire in 24 hours. Check your spam folder if you don&apos;t see it.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive an email?{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-primary"
              onClick={handleResendEmail}
              disabled={isResending || !email}
            >
              {isResending ? 'Sending...' : 'Resend confirmation email'}
            </Button>
          </div>

          <div className="pt-4 text-center">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 animate-pulse text-primary" />
              </div>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>Please wait</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  )
}
