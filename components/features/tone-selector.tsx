'use client'

import { cn } from '@/lib/utils/cn'
import { Check } from 'lucide-react'

/**
 * Enhanced Tone Selector Component
 *
 * Visual improvements:
 * - Larger touch targets
 * - Better visual feedback
 * - Clearer selected state
 * - Tone name labels
 */

interface ToneSelectorProps {
  selectedTone: number | null
  onToneSelect: (tone: number) => void
  disabled?: boolean
  showLabels?: boolean
}

const TONE_INFO = [
  {
    tone: 1,
    label: 'First',
    name: 'High Flat',
    example: 'ā',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    borderColor: 'border-red-500',
    description: '¯ (flat, high pitch)',
  },
  {
    tone: 2,
    label: 'Second',
    name: 'Rising',
    example: 'á',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    borderColor: 'border-orange-500',
    description: '/ (rising)',
  },
  {
    tone: 3,
    label: 'Third',
    name: 'Dip-Rise',
    example: 'ǎ',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-500',
    description: '∨ (dip then rise)',
  },
  {
    tone: 4,
    label: 'Fourth',
    name: 'Falling',
    example: 'à',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    borderColor: 'border-blue-500',
    description: '\\ (falling)',
  },
  {
    tone: 5,
    label: 'Neutral',
    name: 'Light',
    example: 'a',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-500',
    description: '(no tone mark)',
  },
]

export function ToneSelector({
  selectedTone,
  onToneSelect,
  disabled = false,
  showLabels = true,
}: ToneSelectorProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <p className="text-center text-xs text-muted-foreground sm:text-sm">Select tone:</p>

      {/* Responsive grid: wraps naturally on mobile, stays in row on larger screens */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {TONE_INFO.map(({ tone, label, name, example, bgColor, borderColor, description }) => {
          const isSelected = selectedTone === tone

          return (
            <button
              key={tone}
              onClick={() => onToneSelect(tone)}
              disabled={disabled}
              className={cn(
                'tone-button relative',
                'flex flex-col items-center justify-center',
                // Responsive sizing: smaller on mobile
                'min-w-[3.5rem] p-2 sm:min-w-[4rem] sm:p-3 md:min-w-[5rem] md:p-4',
                'rounded-lg border-2',
                'transition-all duration-200',
                'hover:scale-105 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected && cn('scale-105 shadow-lg sm:scale-110', borderColor, bgColor),
                !isSelected && 'border-muted hover:border-muted-foreground',
                disabled && 'cursor-not-allowed opacity-50 hover:scale-100'
              )}
              aria-label={`${label} tone: ${description}`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary sm:-right-2 sm:-top-2 sm:h-6 sm:w-6">
                  <Check className="h-3 w-3 text-primary-foreground sm:h-4 sm:w-4" />
                </div>
              )}

              {/* Example character with tone - responsive size */}
              <span className="pinyin-text mb-0.5 text-2xl font-bold sm:mb-1 sm:text-3xl md:text-4xl">
                {example}
              </span>

              {/* Tone labels - hidden on very small screens */}
              {showLabels && (
                <div className="hidden space-y-0.5 text-center min-[400px]:block">
                  <div className="text-[10px] font-medium sm:text-xs">{label}</div>
                  <div className="hidden text-[9px] text-muted-foreground sm:block sm:text-[10px]">
                    {name}
                  </div>
                </div>
              )}

              {/* Keyboard hint - hidden on mobile */}
              <div
                className={cn(
                  'keyboard-hint absolute -left-1.5 -top-1.5 sm:-left-2 sm:-top-2',
                  'hidden h-4 w-4 rounded-full sm:flex sm:h-5 sm:w-5',
                  'border border-muted bg-background',
                  'items-center justify-center',
                  'text-[9px] font-medium sm:text-[10px]',
                  isSelected && 'border-primary bg-primary text-primary-foreground'
                )}
              >
                {tone}
              </div>
            </button>
          )
        })}
      </div>

      <div className="space-y-0.5 text-center sm:space-y-1">
        <p className="hidden text-xs text-muted-foreground sm:block">
          Click a tone or press the number key (1-5)
        </p>
        <p className="text-[10px] text-muted-foreground sm:hidden">
          Tap a tone or type: ni3 + Space
        </p>
        {showLabels && (
          <p className="hidden text-[10px] text-muted-foreground sm:block">
            You can also type: ni3 → Space → nǐ
          </p>
        )}
      </div>
    </div>
  )
}
