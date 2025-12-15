'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

export function MarketingNav() {
  return (
    <nav className="flex h-16 items-center justify-between border-b bg-background px-6">
      <Link href="/" className="text-xl font-bold">
        Mandarin SRS
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
          About
        </Link>
        <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
          Pricing
        </Link>
        <Button asChild variant="ghost">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Get Started</Link>
        </Button>
      </div>
    </nav>
  )
}
