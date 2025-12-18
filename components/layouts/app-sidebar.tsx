'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, Settings, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, prefetch: true },
  { name: 'Lessons', href: '/lessons', icon: BookOpen, prefetch: true },
  { name: 'Reviews', href: '/reviews', icon: TrendingUp, prefetch: false }, // Dynamic, don't prefetch
  { name: 'Settings', href: '/settings', icon: Settings, prefetch: false },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    // Hidden on mobile (< md breakpoint), visible on tablet+ with flex layout
    <div className="hidden h-full w-64 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <div className="text-xl font-bold">Mandarin SRS</div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={item.prefetch}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
