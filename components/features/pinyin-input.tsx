'use client'

import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { ToneSelector } from './tone-selector'
import { addToneMark } from '@/lib/utils/pinyin-utils'

export interface PinyinInputProps {
  value: string
  onChange: (value: string) => void
  onEnter?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Pinyin input component with tone selector
 * Allows users to type pinyin and add tone marks
 */
export function PinyinInput({
  value,
  onChange,
  onEnter,
  placeholder = 'Type pinyin...',
  disabled = false,
  className,
}: PinyinInputProps) {
  const [selectedTone, setSelectedTone] = useState<number | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  const handleToneSelect = (tone: number) => {
    if (!value) {
      return
    }

    // Find the last syllable in the input
    const syllables = value.split(/\s+/)
    const lastSyllable = syllables[syllables.length - 1] || ''

    if (lastSyllable) {
      const withTone = addToneMark(lastSyllable, tone)
      const newValue = [...syllables.slice(0, -1), withTone].join(' ')
      onChange(newValue)
      setSelectedTone(tone)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter()
    }
    // Allow quick tone selection with number keys 1-5
    if (e.key >= '1' && e.key <= '5') {
      e.preventDefault()
      handleToneSelect(parseInt(e.key, 10))
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="pinyin-input pinyin-text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <ToneSelector
        selectedTone={selectedTone}
        onToneSelect={handleToneSelect}
        disabled={disabled || !value}
      />
    </div>
  )
}
