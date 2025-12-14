'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export interface ToneSelectorProps {
  selectedTone: number | null
  onToneSelect: (tone: number) => void
  disabled?: boolean
}

/**
 * Tone selector component for pinyin input
 * Shows buttons for tones 1-5 (neutral)
 */
export function ToneSelector({ selectedTone, onToneSelect, disabled = false }: ToneSelectorProps) {
  const tones = [
    { number: 1, label: 'ā', name: 'First tone (flat)' },
    { number: 2, label: 'á', name: 'Second tone (rising)' },
    { number: 3, label: 'ǎ', name: 'Third tone (dip)' },
    { number: 4, label: 'à', name: 'Fourth tone (falling)' },
    { number: 5, label: 'a', name: 'Neutral tone' },
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Tone:</span>
      <div className="flex gap-1">
        {tones.map((tone) => (
          <Button
            key={tone.number}
            type="button"
            variant={selectedTone === tone.number ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToneSelect(tone.number)}
            disabled={disabled}
            className={cn('tone-button', selectedTone === tone.number && 'active')}
            aria-label={tone.name}
            title={tone.name}
          >
            {tone.label}
          </Button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">(Press 1-5)</span>
    </div>
  )
}
