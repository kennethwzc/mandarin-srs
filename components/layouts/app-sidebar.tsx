'use client'

import { usePathname } from 'next/navigation'
import { BookOpen, Home, Settings, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import { PrefetchLink } from '@/components/ui/prefetch-link'

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
    // Don't prefetch reviews - it's dynamic and user-specific
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    // Don't prefetch settings - minimal data needed
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    // Hidden on mobile/tablet (< lg breakpoint), visible on desktop with flex layout
    // This gives more content space on medium screens (768-1024px)
    <div className="hidden h-full w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-16 items-center border-b px-6">
        <div className="text-xl font-bold">Mandarin SRS</div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <PrefetchLink
              key={item.name}
              href={item.href}
              prefetchDataKey={item.prefetchDataKey}
              prefetchDataFetcher={item.prefetchDataFetcher}
              prefetchDelay={150}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </PrefetchLink>
          )
        })}
      </nav>
    </div>
  )
}
