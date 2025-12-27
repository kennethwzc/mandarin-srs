'use client'

import { useRef, useEffect } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'

/**
 * Pinyin Input Component (KISS - Keep It Simple, Stupid)
 *
 * This is a NORMAL text input with minimal magic:
 * - Space works naturally
 * - Backspace works naturally
 * - Typing works naturally
 * - No auto-conversion during typing
 * - Conversion happens on SUBMIT only
 *
 * Accepts both formats:
 * - "ni3 hao3" (tone numbers)
 * - "nǐ hǎo" (tone marks)
 */

interface PinyinInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onSubmit?: () => void
  autoFocus?: boolean
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
   * SIMPLIFIED: Just handle basic input
   * No space interception, no number key interception, no magic
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toLowerCase()

    // Only basic normalization:
    // 1. Convert v to ü (standard pinyin convention)
    newValue = newValue.replace(/v/g, 'ü')

    // 2. Remove invalid characters
    // Keep: a-z, ü, tone-marked vowels, spaces, numbers 1-5
    newValue = newValue.replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s1-5]/g, '')

    // 3. Normalize multiple spaces to single (gently)
    newValue = newValue.replace(/  +/g, ' ')

    onChange(newValue)
  }

  /**
   * SIMPLIFIED: Only handle Enter for submit
   * NO space interception, NO number key interception
   * Let the browser handle everything else naturally
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return
    }

    // ONLY handle Enter for submit
    if (e.key === 'Enter' && onSubmit && value.trim()) {
      e.preventDefault()
      onSubmit()
      return
    }

    // Everything else: let browser handle naturally
    // Space → adds space (browser default)
    // Backspace → deletes character (browser default)
    // Numbers → types numbers (browser default)
  }

  /**
   * Handle paste - just basic cleanup
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    let pastedText = e.clipboardData.getData('text').toLowerCase()

    // Same normalization as handleChange
    pastedText = pastedText.replace(/v/g, 'ü')
    pastedText = pastedText.replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s1-5]/g, '')
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
        placeholder="Type pinyin (e.g., ni3 hao3 or nǐ hǎo)"
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
          Type with numbers (ni3 hao3) or use tone buttons below
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
