'use client'

import { useCallback, useEffect, useRef } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addToneMark } from '@/lib/utils/pinyin-utils'
import { cn } from '@/lib/utils/cn'

/**
 * Pinyin Input Component
 *
 * Clean, prominent pinyin input with:
 * - Large, centered text
 * - Multiple input formats (ni3, nǐ, ni + tone button)
 * - Smart ü/v conversion (nv → nü)
 * - Keyboard shortcuts for tones (1-5)
 * - Space auto-converts tone numbers (ni3 + space → nǐ)
 */

interface PinyinInputProps {
  value: string
  onChange: (value: string) => void
  selectedTone: number | null
  onToneChange: (tone: number | null) => void
  disabled?: boolean
  onSubmit?: () => void
  autoFocus?: boolean
  onCursorChange?: (position: number) => void
}

export function PinyinInput({
  value,
  onChange,
  selectedTone,
  onToneChange,
  disabled = false,
  onSubmit,
  autoFocus = false,
  onCursorChange,
}: PinyinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Apply tone mark when tone is selected from ToneSelector
  useEffect(() => {
    if (selectedTone !== null) {
      onToneChange(selectedTone)
    }
  }, [selectedTone, onToneChange])

  /**
   * Handle input changes with auto-corrections and normalization
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value.toLowerCase()

      // Auto-correct v to ü in specific contexts
      newValue = newValue
        .replace(/nv([1-5]?)/g, 'nü$1')
        .replace(/lv([1-5]?)/g, 'lü$1')
        .replace(/nue/g, 'nüe')
        .replace(/lue/g, 'lüe')

      // Remove any unexpected characters (periods, commas, etc.)
      // Keep only: letters, tone-marked vowels, numbers 1-5, spaces, and ü
      newValue = newValue.replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s1-5]/g, '')

      // Normalize multiple consecutive spaces to single space
      newValue = newValue.replace(/  +/g, ' ')

      onChange(newValue)
    },
    [onChange]
  )

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) {
        return
      }

      // Numbers 1-5 select tones (apply to current syllable)
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        onToneChange(parseInt(e.key, 10))
        return
      }

      // Space: Smart handling for tone number conversion
      if (e.key === ' ') {
        const input = e.currentTarget
        const cursorPos = input.selectionStart ?? value.length
        const beforeCursor = value.slice(0, cursorPos)

        // Check if text before cursor ends with tone number (1-5)
        const match = beforeCursor.match(/([a-zü]+)([1-5])$/)

        if (match && match[1] && match[2]) {
          // Found a syllable with tone number - convert it
          e.preventDefault()

          const baseSyllable = match[1]
          const tone = parseInt(match[2], 10)

          try {
            const withTone = addToneMark(baseSyllable, tone)
            const afterCursor = value.slice(cursorPos)

            // Replace the syllable+number with toned syllable + space
            const newBeforeCursor = beforeCursor.slice(0, -match[0].length) + withTone
            const newValue = newBeforeCursor + ' ' + afterCursor.trimStart()

            onChange(newValue)

            // Set cursor after the space
            setTimeout(() => {
              const newCursorPos = newBeforeCursor.length + 1
              input.setSelectionRange(newCursorPos, newCursorPos)
            }, 0)
          } catch {
            // If conversion fails, just add space normally
            onChange(value.slice(0, cursorPos) + ' ' + value.slice(cursorPos))
          }
          return
        }

        // No tone number to convert - allow normal space (don't preventDefault)
        // Browser will handle adding the space character naturally
      }

      // Enter submits
      if (e.key === 'Enter' && onSubmit && value.trim()) {
        e.preventDefault()
        e.stopPropagation()
        onSubmit()
        return
      }

      // Convert 'v' to 'ü' automatically for nv, lv syllables
      if (e.key === 'v' && /[nl]$/.test(value)) {
        e.preventDefault()
        onChange(value + 'ü')
        return
      }
    },
    [disabled, value, onChange, onToneChange, onSubmit]
  )

  /**
   * Track cursor position for syllable detection
   */
  const handleSelect = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement
      onCursorChange?.(target.selectionStart ?? 0)
    },
    [onCursorChange]
  )

  /**
   * Handle paste with auto-format
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()

      let pastedText = e.clipboardData.getData('text').toLowerCase().trim()

      // Auto-correct pasted text
      pastedText = pastedText
        .replace(/nv([1-5]?)/g, 'nü$1')
        .replace(/lv([1-5]?)/g, 'lü$1')
        .replace(/nue/g, 'nüe')
        .replace(/lue/g, 'lüe')

      // Remove unexpected characters
      pastedText = pastedText.replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s1-5]/g, '')

      // Normalize spaces
      pastedText = pastedText.replace(/\s+/g, ' ')

      onChange(pastedText)
    },
    [onChange]
  )

  // Count syllables for display
  const syllables = value
    .trim()
    .split(/\s+/)
    .filter((s) => s.length > 0)
  const syllableCount = syllables.length

  return (
    <div className="space-y-3">
      <Label htmlFor="pinyin-input" className="block text-center text-base font-medium">
        Type the pinyin:
      </Label>

      <Input
        ref={inputRef}
        id="pinyin-input"
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onClick={handleSelect}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder="e.g., ni3 or nǐ"
        className={cn(
          'h-auto px-6 py-4 text-center text-2xl sm:text-3xl',
          'rounded-xl border-2 border-border bg-background',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          'transition-all duration-200',
          'placeholder:text-muted-foreground/40',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-form-type="other"
        data-lpignore="true"
        maxLength={50}
      />

      <div className="space-y-1 text-center">
        <p className="text-xs text-muted-foreground">
          Type pinyin with numbers (ni3) or use tone buttons
        </p>
        {syllableCount > 0 && (
          <p className="text-xs text-muted-foreground/70">
            {syllableCount} syllable{syllableCount > 1 ? 's' : ''} detected
          </p>
        )}
      </div>
    </div>
  )
}
