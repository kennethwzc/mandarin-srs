/**
 * Type definitions for PinyinInput component
 *
 * Dependencies: none
 */

/**
 * Props for PinyinInput component
 */
export interface PinyinInputProps {
  /** Current input value */
  value: string
  /** Callback when value changes */
  onChange: (value: string) => void
  /** Currently selected tone number (1-5) or null */
  selectedTone: number | null
  /** Callback when tone selection changes */
  onToneChange: (tone: number | null) => void
  /** Correct answer for validation (optional) */
  correctAnswer?: string
  /** Whether input is disabled */
  disabled?: boolean
  /** Callback when user submits (Enter key) */
  onSubmit?: () => void
  /** Whether to auto-focus on mount */
  autoFocus?: boolean
  /** Whether to show suggestions for invalid input */
  showSuggestions?: boolean
}

/**
 * Validation state for pinyin input
 */
export type PinyinValidationState = 'idle' | 'valid' | 'invalid'
