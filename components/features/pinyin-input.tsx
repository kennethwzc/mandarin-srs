'use client'

import { useEffect, useRef, useCallback } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addToneMark } from '@/lib/utils/pinyin-utils'
import { cn } from '@/lib/utils/cn'
import { logger } from '@/lib/utils/logger'
import { AlertCircle } from 'lucide-react'

/**
 * Enhanced Pinyin Input Component
 *
 * Professional-grade pinyin input with:
 * - Multiple input formats (ni3, nǐ, ni + tone button)
 * - Smart ü/v conversion (nv → nü)
 * - Real-time validation
 * - Autocomplete suggestions
 * - Full keyboard accessibility
 * - Visual feedback states
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
        // Apply tone mark to current input
        const withTone = addToneMark(value, selectedTone)
        onChange(withTone)
        onToneChange(null) // Reset tone selection

        // Re-focus input
        setTimeout(() => {
          inputRef.current?.focus()
        }, 0)
      } catch (error) {
        // Invalid syllable - ignore
        logger.warn('Could not apply tone mark', { error, value, selectedTone })
      }
    }
  }, [selectedTone, value, onChange, onToneChange])

  /**
   * Handle input changes with auto-corrections
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value.toLowerCase()

      // Auto-correct common patterns (this will normalize spaces)
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
      // Don't handle keyboard events when disabled (allows grading shortcuts to work)
      if (disabled) {
        return
      }

      // Numbers 1-5 select tones
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        const tone = parseInt(e.key, 10)
        onToneChange(tone)
        return
      }

      // Enter submits
      if (e.key === 'Enter') {
        if (onSubmit && value.trim()) {
          // Only submit if value is not empty
          e.preventDefault()
          e.stopPropagation() // Prevent event from bubbling to window-level handlers
          onSubmit()
        }
        return
      }

      // Convert 'v' to 'ü' automatically for nv, lv syllables
      if (e.key === 'v' && /[nl]$/.test(value)) {
        e.preventDefault()
        onChange(value + 'ü')
        return
      }

      // Handle tone number input (convert ni3 → nǐ on space/enter)
      if ((e.key === ' ' || e.key === 'Enter') && /[1-5]$/.test(value)) {
        e.preventDefault()
        const tone = parseInt(value.slice(-1), 10)
        const syllable = value.slice(0, -1)

        try {
          const withTone = addToneMark(syllable, tone)
          onChange(withTone)
        } catch (error) {
          // Keep original if invalid
        }

        if (e.key === 'Enter' && onSubmit) {
          e.stopPropagation() // Prevent event from bubbling to window-level handlers
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

      // Auto-correct pasted text
      pastedText = autoCorrectPinyin(pastedText)

      onChange(pastedText)
    },
    [onChange]
  )

  // Determine visual state
  const inputState = disabled ? 'disabled' : 'default'

  return (
    <div className="space-y-2">
      <Label htmlFor="pinyin-input" className="flex items-center gap-2 text-base">
        Type the pinyin:
      </Label>

      {/* Input field with visual states */}
      <div className="relative">
        <Input
          ref={inputRef}
          id="pinyin-input"
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder="Type pinyin here... (e.g., ni3 or nǐ)"
          className={cn(
            'pinyin-input text-center text-2xl transition-colors',
            inputState === 'disabled' && 'cursor-not-allowed opacity-50'
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          maxLength={20}
        />
      </div>

      {/* Help text */}
      <div className="flex items-start gap-1 text-xs text-muted-foreground">
        <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
        <div className="space-y-1">
          <p>Press 1-5 to add tone marks, or type ni3 and press Space</p>
          <p>Use ü or v for ü sound (nü, lü, nv, lv)</p>
        </div>
      </div>
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

  // Normalize multiple spaces to single space (preserve spaces for multi-syllable vocabulary)
  corrected = corrected.replace(/\s+/g, ' ')

  // Handle capitalization (shouldn't happen but just in case)
  corrected = corrected.toLowerCase()

  return corrected
}
