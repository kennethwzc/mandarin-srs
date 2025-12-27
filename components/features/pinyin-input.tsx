'use client'

import { useRef, useEffect } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'
import { addToneMark, TONE_MARKS } from '@/lib/utils/pinyin-utils'

/**
 * Pinyin Input Component with Real-Time Tone Conversion
 *
 * When user types "zai4", it immediately shows "zài" - no waiting!
 *
 * Features:
 * - Real-time conversion: ni3 → nǐ (instantly)
 * - Smart backspace: zài → zai (removes tone, keeps letter)
 * - Space works naturally
 * - v → ü auto-conversion
 */

interface PinyinInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onSubmit?: () => void
  autoFocus?: boolean
}

/**
 * Get base vowel from a tone-marked vowel
 * Example: "à" → "a", "ǐ" → "i"
 */
function getBaseVowel(toneMarkedChar: string): string | null {
  for (const [baseVowel, marks] of Object.entries(TONE_MARKS)) {
    if ((marks as readonly string[]).includes(toneMarkedChar)) {
      return baseVowel
    }
  }
  return null
}

/**
 * Check if a character is a tone-marked vowel
 */
function isToneMarkedVowel(char: string): boolean {
  return getBaseVowel(char) !== null
}

/**
 * Get all tone-marked vowels as a flat array
 */
function getAllToneMarkedVowels(): string[] {
  return Object.values(TONE_MARKS).flat()
}

export function PinyinInput({
  value,
  onChange,
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
   * Handle input changes with real-time tone conversion
   * When user types "zai4", immediately shows "zài"
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toLowerCase()

    // 1. Convert v to ü (standard pinyin)
    newValue = newValue.replace(/v/g, 'ü')

    // 2. Real-time tone number conversion
    // Pattern: letters + tone number → tone mark
    // Example: "zai4" → "zài" (immediately!)
    newValue = newValue.replace(
      /([a-zü]+)([1-5])/gi,
      (_match, syllable: string, toneNum: string) => {
        const tone = parseInt(toneNum, 10)
        try {
          return addToneMark(syllable, tone)
        } catch {
          // Invalid syllable, just keep base letters (strip the number)
          return syllable
        }
      }
    )

    // 3. Remove any remaining numbers (0, 6-9) and other invalid chars
    // Keep: a-z, ü, spaces, and all tone-marked vowels
    const toneVowels = getAllToneMarkedVowels().join('')
    const validCharsRegex = new RegExp(`[^a-zü\\s${toneVowels}]`, 'g')
    newValue = newValue.replace(validCharsRegex, '')

    // 4. Normalize multiple spaces to single space
    newValue = newValue.replace(/  +/g, ' ')

    onChange(newValue)
  }

  /**
   * Handle keyboard shortcuts
   * Special handling for backspace on tone-marked vowels
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return
    }

    // Enter to submit
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      onSubmit?.()
      return
    }

    // Backspace: Remove tone mark but keep base vowel
    // Example: "zài" + backspace → "zai" (not "zà")
    if (e.key === 'Backspace') {
      const input = e.currentTarget
      const cursorPos = input.selectionStart ?? 0

      // Only handle if there's something to delete
      if (cursorPos > 0) {
        const charBeforeCursor = value.charAt(cursorPos - 1)

        // Check if it's a tone-marked vowel
        if (isToneMarkedVowel(charBeforeCursor)) {
          e.preventDefault()

          // Get the base vowel
          const baseVowel = getBaseVowel(charBeforeCursor) || ''

          // Replace tone-marked vowel with base vowel
          const newValue =
            value.substring(0, cursorPos - 1) + baseVowel + value.substring(cursorPos)

          onChange(newValue)

          // Keep cursor in same position
          setTimeout(() => {
            input.setSelectionRange(cursorPos, cursorPos)
          }, 0)

          return
        }
      }
    }

    // Everything else: let browser handle naturally (space, regular backspace, etc.)
  }

  /**
   * Handle paste - apply same conversions
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    let pastedText = e.clipboardData.getData('text').toLowerCase()

    // Apply same conversions as handleChange
    pastedText = pastedText.replace(/v/g, 'ü')
    pastedText = pastedText.replace(
      /([a-zü]+)([1-5])/gi,
      (_match, syllable: string, toneNum: string) => {
        const tone = parseInt(toneNum, 10)
        try {
          return addToneMark(syllable, tone)
        } catch {
          return syllable
        }
      }
    )

    const toneVowels = getAllToneMarkedVowels().join('')
    const validCharsRegex = new RegExp(`[^a-zü\\s${toneVowels}]`, 'g')
    pastedText = pastedText.replace(validCharsRegex, '')
    pastedText = pastedText.replace(/\s+/g, ' ')

    // Insert at cursor position
    const input = inputRef.current
    if (input) {
      const start = input.selectionStart ?? 0
      const end = input.selectionEnd ?? 0
      const newValue = value.slice(0, start) + pastedText + value.slice(end)
      onChange(newValue)

      // Set cursor after pasted text
      setTimeout(() => {
        const newCursorPos = start + pastedText.length
        input.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    } else {
      onChange(value + pastedText)
    }
  }

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
        onPaste={handlePaste}
        disabled={disabled}
        placeholder="Type: ni3 hao3 → shows: nǐ hǎo"
        className={cn(
          'h-auto px-6 py-4 text-center text-2xl sm:text-3xl',
          'rounded-xl border-2 border-border bg-background',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          'transition-all duration-200',
          'placeholder:text-base placeholder:text-muted-foreground/40',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-form-type="other"
        data-lpignore="true"
        maxLength={100}
      />

      <div className="space-y-1 text-center">
        <p className="text-xs text-muted-foreground">
          Type 1-5 after syllable to add tone (ni3 → nǐ)
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
