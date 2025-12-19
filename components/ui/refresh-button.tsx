'use client'

import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ButtonProps } from '@/components/ui/button'

interface RefreshButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * Optional custom action. Defaults to window.location.reload()
   */
  onRefresh?: () => void
}

/**
 * Refresh Button Component
 *
 * Client component wrapper for refresh functionality.
 * Used in Server Components where onClick handlers cannot be passed directly.
 */
export function RefreshButton({ onRefresh, children, ...props }: RefreshButtonProps) {
  const handleClick = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      window.location.reload()
    }
  }

  return (
    <Button onClick={handleClick} {...props}>
      <RefreshCw className="mr-2 h-4 w-4" />
      {children || 'Refresh'}
    </Button>
  )
}
