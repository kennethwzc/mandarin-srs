'use client'

import { useEffect, useRef } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addToneMark } from '@/lib/utils/pinyin-utils'
import { cn } from '@/lib/utils/cn'

/**
 * Pinyin Input Component
 *
 * Text input for typing pinyin with real-time tone mark application.
 * When user selects a tone, it automatically adds the tone mark to the vowel.
 *
 * Features:
 * - Real-time tone mark application
 * - Keyboard shortcuts (1-5 for tones)
 * - Support for 'v' → 'ü' conversion
 * - Clear visual feedback
 */

interface PinyinInputProps {
  value: string
  onChange: (value: string) => void
  selectedTone: number | null
  onToneChange: (tone: number | null) => void
  disabled?: boolean
  onSubmit?: () => void
  autoFocus?: boolean
}

export function PinyinInput({
  value,
  onChange,
  selectedTone,
  onToneChange,
  disabled = false,
  onSubmit,
  autoFocus = false,
}: PinyinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  /**
   * Apply tone mark when tone is selected
   */
  useEffect(() => {
    if (selectedTone !== null && value) {
      try {
        // Find the last syllable in the input
        const syllables = value.split(/\s+/)
        const lastSyllable = syllables[syllables.length - 1] || ''

        if (lastSyllable) {
          // Apply tone mark to the last syllable
          const withTone = addToneMark(lastSyllable, selectedTone)
          const newValue = [...syllables.slice(0, -1), withTone].join(' ')
          onChange(newValue)
          onToneChange(null) // Reset tone selection
        }
      } catch (error) {
        // Invalid syllable - ignore
        console.warn('Could not apply tone mark:', error)
      }
    }
  }, [selectedTone, value, onChange, onToneChange])

  /**
   * Handle keyboard shortcuts for tone selection
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Numbers 1-5 select tones
    if (e.key >= '1' && e.key <= '5') {
      e.preventDefault()
      const tone = parseInt(e.key, 10)
      onToneChange(tone)
      return
    }

    // Enter submits
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault()
      onSubmit()
      return
    }

    // Convert 'v' to 'ü' automatically
    if (e.key === 'v') {
      e.preventDefault()
      onChange(value + 'ü')
      return
    }
  }

  /**
   * Handle input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="pinyin-input" className="text-base">
        Type the pinyin:
      </Label>
      <Input
        ref={inputRef}
        id="pinyin-input"
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type pinyin here..."
        className={cn(
          'pinyin-input',
          'text-center text-2xl',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      <p className="text-center text-xs text-muted-foreground">
        Press 1-5 to add tone marks, or click buttons below
      </p>
    </div>
  )
}
