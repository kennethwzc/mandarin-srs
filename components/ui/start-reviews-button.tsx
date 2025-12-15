'use client'

import Link from 'next/link'
import { Brain } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface StartReviewsButtonProps {
  reviewsCount: number
}

export function StartReviewsButton({ reviewsCount }: StartReviewsButtonProps) {
  return (
    <Button asChild size="lg">
      <Link href="/reviews">
        <Brain className="mr-2 h-4 w-4" />
        Start Reviews ({reviewsCount})
      </Link>
    </Button>
  )
}
