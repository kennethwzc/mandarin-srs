import { cn } from '@/lib/utils/cn'

export interface CharacterDisplayProps {
  character: string
  size?: 'default' | 'sm'
  className?: string
}

/**
 * Large character display component for review cards
 */
export function CharacterDisplay({
  character,
  size = 'default',
  className,
}: CharacterDisplayProps) {
  return (
    <div
      className={cn(
        'character-display chinese-display flex items-center justify-center',
        size === 'sm' && 'text-character-sm',
        className
      )}
    >
      {character}
    </div>
  )
}
