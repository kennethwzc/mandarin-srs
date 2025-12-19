/**
 * Mobile Navigation Drawer Component
 *
 * Slide-out navigation drawer for mobile devices using Vaul.
 * Provides access to all app navigation when sidebar is hidden.
 *
 * Features:
 * - Slide from left animation
 * - Overlay backdrop
 * - Touch-friendly navigation links (48px+ touch targets)
 * - Active state indication
 * - Keyboard accessible
 */

'use client'

import { usePathname } from 'next/navigation'
import { BookOpen, Home, Settings, TrendingUp, X } from 'lucide-react'
import { Drawer } from 'vaul'

import { Button } from '@/components/ui/button'
import { PrefetchLink } from '@/components/ui/prefetch-link'
import { cn } from '@/lib/utils/cn'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    prefetchDataKey: 'dashboard:prefetch',
    prefetchDataFetcher: async () => {
      const response = await fetch('/api/dashboard/stats', { credentials: 'include' })
      if (!response.ok) {
        throw new Error('Failed to prefetch dashboard')
      }
      return response.json()
    },
  },
  {
    name: 'Lessons',
    href: '/lessons',
    icon: BookOpen,
    prefetchDataKey: 'lessons:prefetch',
    prefetchDataFetcher: async () => {
      const response = await fetch('/api/lessons', { credentials: 'include' })
      if (!response.ok) {
        throw new Error('Failed to prefetch lessons')
      }
      return response.json()
    },
  },
  {
    name: 'Reviews',
    href: '/reviews',
    icon: TrendingUp,
    // Don't prefetch reviews - it's dynamic
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    // Don't prefetch settings
  },
]

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="left">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] flex-col bg-background outline-none"
          aria-label="Navigation menu"
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Drawer.Title className="text-xl font-bold">Mandarin SRS</Drawer.Title>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close menu"
              className="h-12 w-12"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4" role="navigation">
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <PrefetchLink
                  key={item.name}
                  href={item.href}
                  prefetchDataKey={item.prefetchDataKey}
                  prefetchDataFetcher={item.prefetchDataFetcher}
                  prefetchDelay={150}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors',
                    'min-h-[48px]', // WCAG AA touch target
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </PrefetchLink>
              )
            })}
          </nav>

          {/* Footer - Version info */}
          <div className="border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">Mandarin SRS v1.0</p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
