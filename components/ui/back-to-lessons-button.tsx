'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function BackToLessonsButton() {
  return (
    <Link
      href="/lessons"
      className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="mr-1 h-4 w-4" />
      Back to Lessons
    </Link>
  )
}
