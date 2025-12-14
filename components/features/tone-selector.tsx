'use client'

import { cn } from '@/lib/utils/cn'

/**
 * Tone Selector Component
 *
 * Visual buttons for selecting Mandarin tones.
 * Each button shows example character with that tone.
 *
 * Tones:
 * 1. First tone (flat) - ā
 * 2. Second tone (rising) - á
 * 3. Third tone (dip) - ǎ
 * 4. Fourth tone (falling) - à
 * 5. Neutral tone - a
 */

interface ToneSelectorProps {
  selectedTone: number | null
  onToneSelect: (tone: number) => void
  disabled?: boolean
}

const TONE_INFO = [
  { tone: 1, label: 'First', example: 'ā', description: 'Flat/High' },
  { tone: 2, label: 'Second', example: 'á', description: 'Rising' },
  { tone: 3, label: 'Third', example: 'ǎ', description: 'Dip' },
  { tone: 4, label: 'Fourth', example: 'à', description: 'Falling' },
  { tone: 5, label: 'Neutral', example: 'a', description: 'No mark' },
]

export function ToneSelector({ selectedTone, onToneSelect, disabled = false }: ToneSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-muted-foreground">Select tone:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {TONE_INFO.map(({ tone, label, example, description }) => (
          <button
            key={tone}
            onClick={() => onToneSelect(tone)}
            disabled={disabled}
            className={cn(
              'tone-button',
              'relative flex flex-col items-center justify-center',
              'min-w-[4rem] p-3',
              'rounded-lg border-2',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              selectedTone === tone && 'scale-110 border-primary bg-primary/10',
              disabled && 'cursor-not-allowed opacity-50 hover:scale-100',
              // Default border color
              selectedTone !== tone && 'border-border'
            )}
            aria-label={`${label} tone: ${description}`}
          >
            {/* Example character with tone */}
            <span className={cn('pinyin-text text-3xl font-bold')}>{example}</span>

            {/* Tone number */}
            <span className="mt-1 text-xs text-muted-foreground">{tone}</span>

            {/* Keyboard hint */}
            <span
              className={cn(
                'keyboard-hint absolute -right-2 -top-2',
                'h-5 w-5 rounded-full',
                'border border-border bg-muted',
                'flex items-center justify-center text-xs',
                'font-mono'
              )}
            >
              {tone}
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Click a button or press the number key
      </p>
    </div>
  )
}
