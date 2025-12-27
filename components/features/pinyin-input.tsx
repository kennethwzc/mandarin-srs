'use client'

import { useEffect, useRef, useCallback } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addToneMark } from '@/lib/utils/pinyin-utils'
import { cn } from '@/lib/utils/cn'

/**
 * Pinyin Input Component (Apple-inspired minimal design)
 *
 * Clean, prominent pinyin input with:
 * - Large, centered text
 * - Multiple input formats (ni3, nǐ, ni + tone button)
 * - Smart ü/v conversion (nv → nü)
 * - Full keyboard accessibility
 * - Minimal help text
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
        const withTone = addToneMark(value, selectedTone)
        onChange(withTone)
        onToneChange(null)

        setTimeout(() => {
          inputRef.current?.focus()
        }, 0)
      } catch {
        // Invalid syllable - ignore
      }
    }
  }, [selectedTone, value, onChange, onToneChange])

  /**
   * Handle input changes with auto-corrections
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value.toLowerCase()

      // Auto-correct common patterns
      newValue = autoCorrectPinyin(newValue)

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

      // Numbers 1-5 select tones
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        onToneChange(parseInt(e.key, 10))
        return
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

      // Handle tone number input (ni3 + space → nǐ)
      if ((e.key === ' ' || e.key === 'Enter') && /[1-5]$/.test(value)) {
        e.preventDefault()
        const tone = parseInt(value.slice(-1), 10)
        const syllable = value.slice(0, -1)

        try {
          const withTone = addToneMark(syllable, tone)
          onChange(withTone)
        } catch {
          // Keep original if invalid
        }

        if (e.key === 'Enter' && onSubmit) {
          e.stopPropagation()
          onSubmit()
        }
        return
      }
    },
    [disabled, value, onChange, onToneChange, onSubmit]
  )

  /**
   * Handle paste with auto-format
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()

      let pastedText = e.clipboardData.getData('text').toLowerCase().trim()
      pastedText = autoCorrectPinyin(pastedText)

      onChange(pastedText)
    },
    [onChange]
  )

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
        spellCheck="false"
        maxLength={20}
      />

      <p className="text-center text-xs text-muted-foreground">
        Type pinyin with numbers (ni3) or use tone buttons
      </p>
    </div>
  )
}

/**
 * Auto-correct common pinyin patterns
 */
function autoCorrectPinyin(input: string): string {
  let corrected = input

  // Convert v to ü in specific contexts
  corrected = corrected
    .replace(/nv([1-5]?)/g, 'nü$1')
    .replace(/lv([1-5]?)/g, 'lü$1')
    .replace(/nue/g, 'nüe')
    .replace(/lue/g, 'lüe')

  // Convert u: to ü (alternative notation)
  corrected = corrected.replace(/u:/g, 'ü')

  // Normalize multiple spaces to single space
  corrected = corrected.replace(/\s+/g, ' ')

  // Handle capitalization
  corrected = corrected.toLowerCase()

  return corrected
}
