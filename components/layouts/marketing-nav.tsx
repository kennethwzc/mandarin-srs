/**
 * Marketing Navigation Component
 *
 * Navigation bar for marketing/public pages (landing, about, pricing, etc.)
 * Responsive with hamburger menu on mobile.
 *
 * Features:
 * - Sticky positioning for visibility while scrolling
 * - Desktop: horizontal navigation links
 * - Mobile: collapsible hamburger menu
 * - Touch-friendly targets (48px minimum)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold transition-colors hover:text-primary md:text-xl"
        >
          Mandarin SRS
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/about"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            About
          </Link>
          <Link
            href="/pricing"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Pricing
          </Link>
          <Button asChild variant="ghost">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-marketing-nav"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu - Dropdown style */}
      <div
        id="mobile-marketing-nav"
        className={cn(
          'overflow-hidden border-t bg-background transition-all duration-200 ease-in-out md:hidden',
          mobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex flex-col space-y-1 px-4 py-4">
          <Link
            href="/about"
            className="rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pricing
          </Link>
          <div className="my-2 border-t" />
          <Button asChild variant="ghost" className="h-12 w-full justify-start">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              Sign In
            </Link>
          </Button>
          <Button asChild className="h-12 w-full">
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
