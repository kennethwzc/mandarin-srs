/**
 * Verification Success Component
 * Displays a success toast when user completes email verification
 * Automatically cleans up URL parameter after showing notification
 */

'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function VerificationSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const verified = searchParams.get('verified')

    if (verified === 'true') {
      toast.success('Email verified successfully!', {
        description: 'Your account is now fully activated. Welcome!',
        duration: 5000,
      })

      // Clean up URL by removing the verified parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('verified')
      router.replace(newUrl.pathname + newUrl.search)
    }
  }, [searchParams, router])

  return null
}
