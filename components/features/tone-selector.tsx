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
    <div className="space-y-3">
      <p className="text-center text-sm text-muted-foreground">Select tone:</p>

      <div className="flex flex-wrap justify-center gap-2">
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
                'min-w-[5rem] p-4',
                'rounded-lg border-2',
                'transition-all duration-200',
                'hover:scale-105 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected && cn('scale-110 shadow-lg', borderColor, bgColor),
                !isSelected && 'border-muted hover:border-muted-foreground',
                disabled && 'cursor-not-allowed opacity-50 hover:scale-100'
              )}
              aria-label={`${label} tone: ${description}`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}

              {/* Example character with tone */}
              <span className="pinyin-text mb-1 text-4xl font-bold">{example}</span>

              {/* Tone labels */}
              {showLabels && (
                <div className="space-y-0.5 text-center">
                  <div className="text-xs font-medium">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{name}</div>
                </div>
              )}

              {/* Keyboard hint */}
              <div
                className={cn(
                  'keyboard-hint absolute -left-2 -top-2',
                  'h-5 w-5 rounded-full',
                  'border border-muted bg-background',
                  'flex items-center justify-center',
                  'text-[10px] font-medium',
                  isSelected && 'border-primary bg-primary text-primary-foreground'
                )}
              >
                {tone}
              </div>
            </button>
          )
        })}
      </div>

      <div className="space-y-1 text-center">
        <p className="text-xs text-muted-foreground">Click a tone or press the number key (1-5)</p>
        {showLabels && (
          <p className="text-[10px] text-muted-foreground">You can also type: ni3 → Space → nǐ</p>
        )}
      </div>
    </div>
  )
}
