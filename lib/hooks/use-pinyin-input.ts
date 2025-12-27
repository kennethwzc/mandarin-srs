/**
 * Smart Pinyin Input Hook
 *
 * Provides intelligent pinyin input handling with:
 * - Cursor-aware tone application
 * - Automatic tone replacement (not addition)
 * - Space-separated syllable support
 * - Tone number auto-conversion
 */

import { useState, useCallback, useRef } from 'react'
import {
  addToneMark,
  removeToneMarks,
  extractToneNumber,
  normalizeSpaces,
  splitSyllables,
  isValidSyllable,
  convertToneNumbers,
} from '@/lib/utils/pinyin-utils'

interface UsePinyinInputOptions {
  initialValue?: string
  onSubmit?: (value: string) => void
}

interface SyllableInfo {
  index: number
  syllable: string
  startPos: number
  endPos: number
}

export function usePinyinInput(options: UsePinyinInputOptions = {}) {
  const { initialValue = '', onSubmit } = options

  const [value, setValue] = useState(initialValue)
  const [cursorPosition, setCursorPosition] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Get syllable info based on cursor position
   * Returns the syllable the cursor is in or near
   * If cursor position is null (no tracking), defaults to last syllable
   */
  const getCurrentSyllable = useCallback((): SyllableInfo | null => {
    if (!value.trim()) {
      return null
    }

    const syllables = splitSyllables(value)
    if (syllables.length === 0) {
      return null
    }

    // Build position map for each syllable
    let currentPos = 0
    const syllablePositions: SyllableInfo[] = []

    // Account for leading spaces
    const leadingSpaces = value.match(/^\s*/)?.[0]?.length ?? 0
    currentPos = leadingSpaces

    for (let i = 0; i < syllables.length; i++) {
      const syllable = syllables[i]
      if (!syllable) {
        continue
      }
      const startPos = currentPos
      const endPos = currentPos + syllable.length

      syllablePositions.push({
        index: i,
        syllable,
        startPos,
        endPos,
      })

      // Move past syllable and any trailing spaces
      currentPos = endPos
      // Skip spaces between syllables
      while (currentPos < value.length && value[currentPos] === ' ') {
        currentPos++
      }
    }

    // If no cursor tracking (null), default to last syllable
    if (cursorPosition === null) {
      return syllablePositions[syllablePositions.length - 1] ?? null
    }

    // Find which syllable the cursor is in
    for (const info of syllablePositions) {
      if (cursorPosition >= info.startPos && cursorPosition <= info.endPos) {
        return info
      }
    }

    // If cursor is beyond all syllables, return last syllable
    return syllablePositions[syllablePositions.length - 1] ?? null
  }, [value, cursorPosition])

  /**
   * Apply tone to current syllable (replaces existing tone)
   */
  const applyTone = useCallback(
    (tone: number, syllableIndex?: number) => {
      if (tone < 1 || tone > 5) {
        return
      }

      const syllables = splitSyllables(value)
      if (syllables.length === 0) {
        return
      }

      // Determine target syllable index
      let targetIndex: number
      if (syllableIndex !== undefined) {
        targetIndex = syllableIndex
      } else {
        const current = getCurrentSyllable()
        targetIndex = current?.index ?? syllables.length - 1
      }

      // Safety check
      if (targetIndex < 0 || targetIndex >= syllables.length) {
        return
      }

      const targetSyllable = syllables[targetIndex]
      if (!targetSyllable) {
        return
      }

      // Extract base syllable (remove tone number if present)
      const { syllable: baseSyllable } = extractToneNumber(targetSyllable)

      // Remove any existing tone marks
      const withoutTone = removeToneMarks(baseSyllable)

      // Validate syllable before applying tone
      if (!isValidSyllable(withoutTone)) {
        return
      }

      // Add new tone
      const withNewTone = addToneMark(withoutTone, tone)

      // Replace in syllables array
      const newSyllables = [...syllables]
      newSyllables[targetIndex] = withNewTone

      // Join with spaces
      const newValue = newSyllables.join(' ')
      setValue(newValue)

      // Restore focus and cursor position
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          // Position cursor at end if no cursor tracking, otherwise restore position
          const newCursorPos =
            cursorPosition !== null ? Math.min(cursorPosition, newValue.length) : newValue.length
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    },
    [value, cursorPosition, getCurrentSyllable]
  )

  /**
   * Handle input change with auto-corrections
   */
  const handleChange = useCallback((newValue: string) => {
    let processed = newValue.toLowerCase()

    // Auto-correct v to ü in specific contexts
    processed = processed
      .replace(/nv([1-5]?)/g, 'nü$1')
      .replace(/lv([1-5]?)/g, 'lü$1')
      .replace(/nue/g, 'nüe')
      .replace(/lue/g, 'lüe')

    setValue(processed)
  }, [])

  /**
   * Handle tone number key press (1-5)
   */
  const handleToneNumber = useCallback(
    (tone: number) => {
      if (tone < 1 || tone > 5) {
        return
      }
      applyTone(tone)
    },
    [applyTone]
  )

  /**
   * Handle space key - auto-convert tone numbers
   * Example: "ni3 " → "nǐ "
   */
  const handleSpace = useCallback(() => {
    const syllables = splitSyllables(value)

    if (syllables.length === 0) {
      setValue(value + ' ')
      return
    }

    const lastSyllable = syllables[syllables.length - 1]
    if (!lastSyllable) {
      setValue(value + ' ')
      return
    }

    // Check if last syllable has tone number
    const { syllable, tone } = extractToneNumber(lastSyllable)

    if (tone !== null && isValidSyllable(syllable)) {
      // Convert number to tone mark
      const withTone = addToneMark(removeToneMarks(syllable), tone)
      const newSyllables = [...syllables.slice(0, -1), withTone]
      setValue(newSyllables.join(' ') + ' ')
    } else {
      // Just add space
      setValue(value + ' ')
    }
  }, [value])

  /**
   * Get final normalized value for submission
   * - Normalizes spaces
   * - Converts any remaining tone numbers to marks
   */
  const getFinalValue = useCallback((): string => {
    let final = normalizeSpaces(value)

    // Convert any remaining tone numbers
    final = convertToneNumbers(final)

    return final
  }, [value])

  /**
   * Submit handler
   */
  const handleSubmit = useCallback(() => {
    const finalValue = getFinalValue()
    onSubmit?.(finalValue)
  }, [getFinalValue, onSubmit])

  /**
   * Track cursor position
   */
  const handleCursorChange = useCallback((position: number) => {
    setCursorPosition(position)
  }, [])

  /**
   * Reset input
   */
  const reset = useCallback(() => {
    setValue(initialValue)
    setCursorPosition(null)
  }, [initialValue])

  /**
   * Set value directly (for external sync)
   */
  const setValueDirect = useCallback((newValue: string) => {
    setValue(newValue)
  }, [])

  return {
    value,
    setValue: handleChange,
    setValueDirect,
    cursorPosition,
    inputRef,

    // Actions
    applyTone,
    handleToneNumber,
    handleSpace,
    handleCursorChange,
    handleSubmit,
    reset,

    // Helpers
    getCurrentSyllable,
    getFinalValue,
    syllables: splitSyllables(value),
  }
}
