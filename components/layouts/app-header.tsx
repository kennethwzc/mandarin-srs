/**
 * App Header Component
 *
 * Main header for authenticated app pages.
 * Includes mobile menu trigger and user actions.
 *
 * Mobile responsiveness:
 * - Shows hamburger menu on mobile/tablet (lg:hidden)
 * - Touch-friendly icon buttons (48px touch targets)
 * - Responsive padding and text sizing
 */

'use client'

import { useState } from 'react'
import { Bell, Menu, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MobileNav } from './mobile-nav'

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile menu trigger - visible on mobile/tablet (< lg) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-semibold md:text-lg">Learn Mandarin</h2>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-12 w-12" aria-label="View notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12" aria-label="Open user menu">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </>
  )
}
