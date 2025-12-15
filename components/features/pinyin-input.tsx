'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { addToneMark, isValidPinyin, getPinyinSuggestions } from '@/lib/utils/pinyin-utils'
import { cn } from '@/lib/utils/cn'
import { Check, X, AlertCircle } from 'lucide-react'

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
  correctAnswer?: string // For validation
  disabled?: boolean
  onSubmit?: () => void
  autoFocus?: boolean
  showSuggestions?: boolean
}

export function PinyinInput({
  value,
  onChange,
  selectedTone,
  onToneChange,
  disabled = false,
  onSubmit,
  autoFocus = false,
  showSuggestions = true,
}: PinyinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle')

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
        console.warn('Could not apply tone mark:', error)
      }
    }
  }, [selectedTone, value, onChange, onToneChange])

  /**
   * Validate input and show suggestions
   */
  useEffect(() => {
    if (!value || !isFocused) {
      setSuggestions([])
      setValidationState('idle')
      return
    }

    // Debounce validation
    const timeout = setTimeout(() => {
      // Check if valid pinyin
      if (isValidPinyin(value)) {
        setValidationState('valid')
        setSuggestions([])
      } else {
        setValidationState('invalid')

        // Get suggestions for invalid input
        if (showSuggestions) {
          const suggests = getPinyinSuggestions(value)
          setSuggestions(suggests.slice(0, 5))
        }
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [value, isFocused, showSuggestions])

  /**
   * Handle input changes with auto-corrections
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value.toLowerCase().trim()

      // Auto-correct common patterns
      newValue = autoCorrectPinyin(newValue)

      onChange(newValue)
      setSelectedSuggestionIndex(-1)
    },
    [onChange]
  )

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Numbers 1-5 select tones
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        const tone = parseInt(e.key, 10)
        onToneChange(tone)
        return
      }

      // Enter submits
      if (e.key === 'Enter') {
        if (selectedSuggestionIndex >= 0 && suggestions.length > 0) {
          // Apply selected suggestion
          e.preventDefault()
          const selectedSuggestion = suggestions[selectedSuggestionIndex]
          if (selectedSuggestion) {
            onChange(selectedSuggestion)
            setSuggestions([])
            setSelectedSuggestionIndex(-1)
          }
        } else if (onSubmit) {
          e.preventDefault()
          onSubmit()
        }
        return
      }

      // Arrow keys navigate suggestions
      if (suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setSuggestions([])
          setSelectedSuggestionIndex(-1)
        }
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
          onSubmit()
        }
        return
      }
    },
    [value, suggestions, selectedSuggestionIndex, onChange, onToneChange, onSubmit]
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

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onChange(suggestion)
      setSuggestions([])
      setSelectedSuggestionIndex(-1)
      inputRef.current?.focus()
    },
    [onChange]
  )

  // Determine visual state
  const inputState = disabled
    ? 'disabled'
    : validationState === 'valid'
      ? 'valid'
      : validationState === 'invalid'
        ? 'invalid'
        : 'default'

  return (
    <div className="space-y-2">
      <Label htmlFor="pinyin-input" className="flex items-center gap-2 text-base">
        Type the pinyin:
        {/* Validation indicator */}
        {!disabled &&
          value &&
          (validationState === 'valid' ? (
            <Badge
              variant="outline"
              className="border-green-300 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
            >
              <Check className="mr-1 h-3 w-3" />
              Valid
            </Badge>
          ) : validationState === 'invalid' ? (
            <Badge
              variant="outline"
              className="border-red-300 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
            >
              <X className="mr-1 h-3 w-3" />
              Invalid
            </Badge>
          ) : null)}
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow suggestion clicks
            setTimeout(() => setIsFocused(false), 200)
          }}
          disabled={disabled}
          placeholder="Type pinyin here... (e.g., ni3 or nǐ)"
          className={cn(
            'pinyin-input text-center text-2xl transition-colors',
            inputState === 'valid' &&
              'border-green-500 focus:border-green-500 focus:ring-green-500',
            inputState === 'invalid' && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            inputState === 'disabled' && 'cursor-not-allowed opacity-50'
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          maxLength={20}
        />

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && isFocused && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-background shadow-lg">
            <div className="border-b p-2 text-xs text-muted-foreground">Did you mean:</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full px-4 py-2 text-left transition-colors hover:bg-muted',
                  'flex items-center justify-between',
                  index === selectedSuggestionIndex && 'bg-muted'
                )}
              >
                <span className="font-mono text-lg">{suggestion}</span>
                {index === selectedSuggestionIndex && (
                  <Badge variant="outline" className="text-xs">
                    Press Enter
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
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

  // Remove extra spaces
  corrected = corrected.replace(/\s+/g, '')

  // Handle capitalization (shouldn't happen but just in case)
  corrected = corrected.toLowerCase()

  return corrected
}
