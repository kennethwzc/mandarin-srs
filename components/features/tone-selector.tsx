'use client'

import { cn } from '@/lib/utils/cn'

/**
 * Tone Selector Component (Apple-inspired minimal design)
 *
 * Clean, simple tone selection buttons with:
 * - Large tone example character
 * - Subtle number indicator
 * - Minimal color usage (primary blue for selection only)
 * - Generous spacing and clear touch targets
 */

interface ToneSelectorProps {
  selectedTone: number | null
  onToneSelect: (tone: number) => void
  disabled?: boolean
}

const TONES = [
  { tone: 1, example: 'ā' },
  { tone: 2, example: 'á' },
  { tone: 3, example: 'ǎ' },
  { tone: 4, example: 'à' },
  { tone: 5, example: 'a' },
]

export function ToneSelector({ selectedTone, onToneSelect, disabled = false }: ToneSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Section label */}
      <p className="text-center text-sm font-medium text-foreground">Select tone:</p>

      {/* Tone buttons - clean and minimal */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {TONES.map(({ tone, example }) => {
          const isSelected = selectedTone === tone

          return (
            <button
              key={tone}
              onClick={() => onToneSelect(tone)}
              disabled={disabled}
              className={cn(
                // Base styles - clean and minimal
                'flex flex-col items-center justify-center gap-1.5 sm:gap-2',
                'min-w-[3.5rem] rounded-xl border-2 p-3 sm:min-w-[4.5rem] sm:p-4',
                'transition-all duration-200',
                'hover:-translate-y-0.5 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',

                // Selected state - simple border and subtle background
                isSelected && ['border-primary bg-primary/5 shadow-soft-md'],

                // Unselected state - neutral
                !isSelected && [
                  'border-border bg-card',
                  'hover:border-muted-foreground hover:shadow-soft-md',
                ],

                // Disabled state
                disabled && 'cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow-none'
              )}
              aria-label={`Tone ${tone}: ${example}`}
              aria-pressed={isSelected}
            >
              {/* Large tone example character */}
              <span className="pinyin-text text-2xl font-bold sm:text-4xl">{example}</span>

              {/* Small number indicator */}
              <span className="text-xs font-medium text-muted-foreground">{tone}</span>
            </button>
          )
        })}
      </div>

      {/* Simplified help text */}
      <p className="text-center text-xs text-muted-foreground">Applies tone to last syllable</p>
    </div>
  )
}
