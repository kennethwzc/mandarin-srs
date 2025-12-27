# Cursor Prompt: Improved Pinyin Typing Logic & UX

## Context
I'm working on a Mandarin SRS application where users type pinyin to answer review questions. The current implementation has UX issues that make typing pinyin for multi-character words confusing and non-intuitive.

**Current Tech Stack:**
- Next.js 14 + TypeScript
- Pinyin utilities: `/lib/utils/pinyin-utils.ts`
- Input hook: `/lib/hooks/use-pinyin-input.ts`
- Input component: `/components/features/pinyin-input.tsx`
- Review card: `/components/features/review-card.tsx`

---

## Current Problems

### Issue 1: Multi-Character Word Confusion
**Problem**: When reviewing vocabulary with multiple characters (e.g., "再见" = zàijiàn), users don't know how to input pinyin properly.

**Current behavior**: Unclear if they should:
- Type "zaijian" (no spaces)
- Type "zai jian" (with space)
- Type "zai4jian4" (with tone numbers)
- Type "zai4 jian4" (with space and tone numbers)

**Expected**: Users should type space-separated syllables: `"zai jian"` then add tones.

### Issue 2: Tone Replacement Not Working
**Problem**: When user adds a tone to a syllable that already has a tone, it doesn't replace—it causes confusion.

**Current behavior**:
- User types "ni3" (becomes "nǐ")
- User presses "2" to change their mind
- Nothing happens or unpredictable behavior

**Expected**: Pressing "2" should replace tone: "nǐ" → "ní"

### Issue 3: Multiple Tones on Same Syllable
**Problem**: System doesn't prevent multiple tone marks on same syllable.

**Current behavior**: Could potentially have "nǐ2" or other invalid states

**Expected**: Each syllable can only have ONE tone. New tone replaces old.

### Issue 4: No Cursor Position Awareness
**Problem**: When user has "zai jian" and cursor is in middle, pressing a tone number doesn't know which syllable to apply to.

**Current behavior**: Always applies to last syllable

**Expected**: Apply tone to syllable where cursor is located

### Issue 5: Inconsistent Auto-Conversion
**Problem**: "ni3" → "nǐ" conversion happens at different times, confusing users

**Current behavior**: Converts on space? On blur? Unclear.

**Expected**: Clear, consistent conversion rules

### Issue 6: Space Handling Issues
**Problem**: Multiple spaces, leading/trailing spaces cause issues

**Current behavior**: Not normalized properly

**Expected**: Smart space normalization while preserving syllable boundaries

---

## Design Requirements

### Core Principles

1. **Space = Syllable Separator**
   - Each Chinese character = one syllable
   - Syllables separated by single space
   - Example: "再见" → "zai jian" (2 syllables)

2. **One Tone Per Syllable** (Critical Rule)
   - Each syllable can have 0 or 1 tone
   - New tone REPLACES old tone
   - No syllable can have multiple tones

3. **Smart Cursor Awareness**
   - Track which syllable cursor is in
   - Apply tone operations to current syllable
   - If at end, apply to last syllable

4. **Forgiving Input**
   - Handle typos and mistakes gracefully
   - Normalize spaces automatically
   - Allow multiple input methods

5. **Clear Visual Feedback**
   - Show which syllable is "active"
   - Preview what tone would be applied
   - Instant feedback on changes

---

## Detailed User Behavior Analysis

### Scenario 1: Single Character (e.g., "你" = nǐ)

**User Flow:**
```
1. User types: "ni"         → Display: "ni"
2. User presses "3":        → Display: "nǐ"
3. User changes mind, presses "2": → Display: "ní"  ✅ TONE REPLACED
```

**Alternative Flow:**
```
1. User types: "ni3"        → Display: "ni3"
2. User presses Space:      → Display: "nǐ"  ✅ AUTO-CONVERT
```

**Another Alternative:**
```
1. User types: "ni"         → Display: "ni"
2. User clicks tone button 3: → Display: "nǐ"
3. User clicks tone button 2: → Display: "ní"  ✅ TONE REPLACED
```

### Scenario 2: Multi-Character Word (e.g., "再见" = zàijiàn)

**Correct User Flow:**
```
1. User types: "zai"        → Display: "zai"
2. User presses "4":        → Display: "zài"
3. User types " " (space):  → Display: "zài "
4. User types "jian":       → Display: "zài jian"
5. User presses "4":        → Display: "zài jiàn"  ✅ COMPLETE
```

**Alternative with Number Input:**
```
1. User types: "zai4"       → Display: "zai4"
2. User presses Space:      → Display: "zài "  ✅ AUTO-CONVERT
3. User types "jian4"       → Display: "zài jian4"
4. User presses Space:      → Display: "zài jiàn"  ✅ AUTO-CONVERT
```

**Mixed Input Method:**
```
1. User types: "zai"        → Display: "zai"
2. User clicks tone 4 button: → Display: "zài"
3. User types " jian":      → Display: "zài jian"
4. User presses "4":        → Display: "zài jiàn"  ✅ WORKS
```

### Scenario 3: Tone Replacement (Critical)

**User realizes wrong tone:**
```
1. Current state: "nǐ hǎo"  (with cursor after "nǐ")
2. User presses Backspace:  → "nǐ hao"  ✅ REMOVES TONE FROM SECOND SYLLABLE
3. OR: User selects "nǐ", presses "2": → "ní hǎo"  ✅ TONE REPLACED
```

**Direct replacement:**
```
1. Current state: "zài jiàn"
2. User clicks on "zài", presses "1": → "zāi jiàn"  ✅ TONE REPLACED
```

### Scenario 4: Cursor in Middle

**User edits middle syllable:**
```
1. Current state: "zai hao ma"  (cursor after "hao")
2. User presses "3":        → "zai hǎo ma"  ✅ APPLIES TO CURSOR POSITION
```

**User edits first syllable:**
```
1. Current state: "zai hao"  (cursor after "zai")
2. User presses "4":        → "zài hao"  ✅ APPLIES TO CURSOR POSITION
```

### Scenario 5: Edge Cases

**Empty input + tone:**
```
Input: ""
User presses "3" → No change  ✅ IGNORE
```

**Invalid syllable + tone:**
```
Input: "xyz"
User presses "3" → Display: "xyz"  ✅ IGNORE (invalid syllable)
OR: Show error hint "Invalid pinyin"
```

**Multiple consecutive spaces:**
```
Input: "ni    hao"  → Auto-normalize to "ni hao"  ✅ SINGLE SPACE
```

**Leading/trailing spaces:**
```
Input: "  ni hao  " → Preserve while typing, trim on submit  ✅ FORGIVING
```

**Syllable already has tone + new tone:**
```
Input: "nǐ"
User presses "2" → "ní"  ✅ REPLACE, NOT ADD
User clicks tone 4 button → "nì"  ✅ REPLACE
```

**Number after tone mark:**
```
Input: "nǐ"
User types "2" → "ní"  ✅ REPLACE TONE
NOT: "nǐ2" (invalid)
```

**Mixed tones and numbers:**
```
Input: "nǐ3"  → Normalize to "nǐ"  ✅ REMOVE REDUNDANT NUMBER
```

---

## Implementation Tasks

### TASK 1: Enhance Pinyin Utility Functions

**File**: `/lib/utils/pinyin-utils.ts`

Add new utility functions:

```typescript
/**
 * Split pinyin string into syllables
 * Handles both space-separated and continuous input
 *
 * @example
 * splitSyllables("ni hao") → ["ni", "hao"]
 * splitSyllables("nǐ hǎo") → ["nǐ", "hǎo"]
 */
export function splitSyllables(pinyin: string): string[] {
  // Split by spaces and filter empty
  return pinyin.trim().split(/\s+/).filter(s => s.length > 0)
}

/**
 * Check if a syllable has a tone mark
 *
 * @example
 * hasToneMark("nǐ") → true
 * hasToneMark("ni") → false
 * hasToneMark("ni3") → false (number doesn't count)
 */
export function hasToneMark(syllable: string): boolean {
  const toneNumber = getToneNumber(syllable)
  return toneNumber >= 1 && toneNumber <= 4 // 5 is neutral/no tone
}

/**
 * Replace tone on a syllable that already has one
 *
 * @example
 * replaceTone("nǐ", 2) → "ní"
 * replaceTone("ni", 3) → "nǐ"
 * replaceTone("hǎo", 4) → "hào"
 */
export function replaceTone(syllable: string, newTone: number): string {
  // Remove existing tone mark
  const withoutTone = removeToneMarks(syllable)

  // Add new tone
  return addToneMark(withoutTone, newTone)
}

/**
 * Check if a syllable has a tone number (like "ni3")
 *
 * @example
 * hasToneNumber("ni3") → true
 * hasToneNumber("nǐ") → false
 * hasToneNumber("ni") → false
 */
export function hasToneNumber(syllable: string): boolean {
  return /[1-5]$/.test(syllable)
}

/**
 * Get the tone number from end of syllable (e.g., "ni3" → 3)
 *
 * @example
 * extractToneNumber("ni3") → { syllable: "ni", tone: 3 }
 * extractToneNumber("hao4") → { syllable: "hao", tone: 4 }
 * extractToneNumber("ni") → { syllable: "ni", tone: null }
 */
export function extractToneNumber(syllable: string): {
  syllable: string;
  tone: number | null
} {
  const match = syllable.match(/^([a-zü]+)([1-5])$/i)

  if (match) {
    return {
      syllable: match[1]!,
      tone: parseInt(match[2]!, 10)
    }
  }

  return { syllable, tone: null }
}

/**
 * Normalize spaces in pinyin input
 * - Trim leading/trailing spaces
 * - Replace multiple spaces with single space
 * - Preserve syllable boundaries
 *
 * @example
 * normalizeSpaces("  ni   hao  ") → "ni hao"
 * normalizeSpaces("ni    hao    ma") → "ni hao ma"
 */
export function normalizeSpaces(pinyin: string): string {
  return pinyin
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Validate if a string is valid pinyin syllable
 * (Basic validation - can be enhanced)
 *
 * @example
 * isValidSyllable("ni") → true
 * isValidSyllable("nǐ") → true
 * isValidSyllable("xyz") → false
 */
export function isValidSyllable(syllable: string): boolean {
  // Remove tone marks and numbers for validation
  const normalized = removeToneMarks(syllable).replace(/[1-5]$/, '')

  // Basic check: must contain at least one vowel
  const hasVowel = /[aeiouü]/.test(normalized.toLowerCase())

  // Must be reasonable length (1-6 chars typical for pinyin)
  const reasonableLength = normalized.length >= 1 && normalized.length <= 6

  // Must only contain valid pinyin characters
  const validChars = /^[a-zü]+$/i.test(normalized)

  return hasVowel && reasonableLength && validChars
}
```

---

### TASK 2: Create Smart Pinyin Input Hook

**File**: `/lib/hooks/use-pinyin-input.ts`

Completely rewrite to handle all scenarios:

```typescript
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  addToneMark,
  replaceTone,
  hasToneMark,
  hasToneNumber,
  extractToneNumber,
  normalizeSpaces,
  splitSyllables,
  removeToneMarks,
  isValidSyllable
} from '@/lib/utils/pinyin-utils'

interface UsePinyinInputOptions {
  initialValue?: string
  onSubmit?: (value: string) => void
}

export function usePinyinInput(options: UsePinyinInputOptions = {}) {
  const { initialValue = '', onSubmit } = options

  const [value, setValue] = useState(initialValue)
  const [cursorPosition, setCursorPosition] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Get current syllable based on cursor position
   * Returns the syllable index and the syllable text
   */
  const getCurrentSyllable = useCallback((): {
    index: number
    syllable: string
    startPos: number
    endPos: number
  } | null => {
    if (!value || cursorPosition === null) {
      const syllables = splitSyllables(value)
      if (syllables.length === 0) return null

      // Default to last syllable
      return {
        index: syllables.length - 1,
        syllable: syllables[syllables.length - 1]!,
        startPos: value.lastIndexOf(syllables[syllables.length - 1]!),
        endPos: value.length
      }
    }

    const syllables = splitSyllables(value)
    let currentPos = 0

    for (let i = 0; i < syllables.length; i++) {
      const syllable = syllables[i]!
      const syllableStart = currentPos
      const syllableEnd = currentPos + syllable.length

      // Check if cursor is within this syllable
      if (cursorPosition >= syllableStart && cursorPosition <= syllableEnd) {
        return {
          index: i,
          syllable,
          startPos: syllableStart,
          endPos: syllableEnd
        }
      }

      // Move past syllable and space
      currentPos = syllableEnd + 1 // +1 for space
    }

    // Cursor is at end or beyond - use last syllable
    if (syllables.length > 0) {
      const lastSyllable = syllables[syllables.length - 1]!
      return {
        index: syllables.length - 1,
        syllable: lastSyllable,
        startPos: value.lastIndexOf(lastSyllable),
        endPos: value.length
      }
    }

    return null
  }, [value, cursorPosition])

  /**
   * Apply tone to current syllable (or specified syllable)
   * ALWAYS replaces existing tone if present
   */
  const applyTone = useCallback((tone: number, syllableIndex?: number) => {
    const syllables = splitSyllables(value)

    if (syllables.length === 0) {
      return // No syllables to apply tone to
    }

    // Determine which syllable to apply tone to
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

    const targetSyllable = syllables[targetIndex]!

    // Extract base syllable (remove tone number if present)
    const { syllable: baseSyllable } = extractToneNumber(targetSyllable)

    // Validate syllable before applying tone
    if (!isValidSyllable(baseSyllable)) {
      console.warn(`Invalid syllable: ${baseSyllable}`)
      return
    }

    // Remove existing tone mark, then add new tone
    const withoutTone = removeToneMarks(baseSyllable)
    const withNewTone = addToneMark(withoutTone, tone)

    // Replace in syllables array
    const newSyllables = [...syllables]
    newSyllables[targetIndex] = withNewTone

    // Join with spaces and update
    const newValue = newSyllables.join(' ')
    setValue(newValue)

    // Restore cursor position
    if (inputRef.current) {
      const newCursorPos = cursorPosition !== null
        ? cursorPosition
        : newValue.length

      setTimeout(() => {
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }, [value, cursorPosition, getCurrentSyllable])

  /**
   * Handle input change with smart normalization
   */
  const handleChange = useCallback((newValue: string) => {
    // Normalize spaces (but allow typing multiple spaces temporarily)
    let processed = newValue.toLowerCase()

    // Auto-correct v to ü in specific contexts
    processed = processed
      .replace(/nv([1-5]?)/g, 'nü$1')
      .replace(/lv([1-5]?)/g, 'lü$1')

    setValue(processed)
  }, [])

  /**
   * Handle tone number key press (1-5)
   * Should replace existing tone if present
   */
  const handleToneNumber = useCallback((tone: number) => {
    if (tone < 1 || tone > 5) return

    applyTone(tone)
  }, [applyTone])

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

    const lastSyllable = syllables[syllables.length - 1]!

    // Check if last syllable has tone number
    const { syllable, tone } = extractToneNumber(lastSyllable)

    if (tone !== null) {
      // Convert number to tone mark
      const withTone = addToneMark(syllable, tone)
      const newSyllables = [...syllables.slice(0, -1), withTone]
      setValue(newSyllables.join(' ') + ' ')
    } else {
      // Just add space
      setValue(value + ' ')
    }
  }, [value])

  /**
   * Normalize and prepare value for submission
   */
  const getFinalValue = useCallback((): string => {
    let final = value

    // Normalize spaces
    final = normalizeSpaces(final)

    // Auto-convert any remaining tone numbers
    const syllables = splitSyllables(final)
    const converted = syllables.map(syll => {
      const { syllable, tone } = extractToneNumber(syll)
      if (tone !== null) {
        return addToneMark(syllable, tone)
      }
      return syll
    })

    return converted.join(' ')
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

  return {
    value,
    setValue: handleChange,
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
```

---

### TASK 3: Update PinyinInput Component

**File**: `/components/features/pinyin-input.tsx`

Update to use new hook and handle all keyboard events:

```typescript
'use client'

import { useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'
import { usePinyinInput } from '@/lib/hooks/use-pinyin-input'

interface PinyinInputProps {
  value: string
  onChange: (value: string) => void
  onToneApply?: (tone: number) => void
  disabled?: boolean
  onSubmit?: () => void
  autoFocus?: boolean
  className?: string
}

export function PinyinInput({
  value,
  onChange,
  onToneApply,
  disabled = false,
  onSubmit,
  autoFocus = false,
  className,
}: PinyinInputProps) {
  const {
    value: localValue,
    setValue,
    inputRef,
    handleToneNumber,
    handleSpace,
    handleCursorChange,
    getFinalValue,
    syllables,
  } = usePinyinInput({
    initialValue: value,
    onSubmit: () => onSubmit?.(),
  })

  // Sync with external value
  useEffect(() => {
    if (value !== localValue) {
      setValue(value)
    }
  }, [value]) // Intentionally not including localValue/setValue

  // Sync changes to parent
  useEffect(() => {
    onChange(localValue)
  }, [localValue, onChange])

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return

      // Numbers 1-5: Apply tone to current syllable
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        const tone = parseInt(e.key, 10)
        handleToneNumber(tone)
        onToneApply?.(tone)
        return
      }

      // Space: Auto-convert tone numbers (ni3 → nǐ)
      if (e.key === ' ') {
        e.preventDefault()
        handleSpace()
        return
      }

      // Enter: Submit
      if (e.key === 'Enter') {
        if (onSubmit && localValue.trim()) {
          e.preventDefault()
          e.stopPropagation()
          onSubmit()
        }
        return
      }
    },
    [disabled, handleToneNumber, handleSpace, onSubmit, localValue, onToneApply]
  )

  /**
   * Track cursor position for syllable detection
   */
  const handleSelect = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement
      handleCursorChange(target.selectionStart ?? 0)
    },
    [handleCursorChange]
  )

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
    },
    [setValue]
  )

  return (
    <div className={cn('space-y-3', className)}>
      <Label
        htmlFor="pinyin-input"
        className="block text-base font-medium text-center"
      >
        Type the pinyin:
      </Label>

      <Input
        ref={inputRef}
        id="pinyin-input"
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onClick={handleSelect}
        disabled={disabled}
        placeholder="e.g., ni3 or nǐ"
        className={cn(
          'text-center text-3xl py-4 px-6',
          'bg-background border-2 border-border rounded-xl',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          'transition-all duration-200',
          'placeholder:text-muted-foreground/40',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        maxLength={50} // Allow longer for multi-syllable words
      />

      {/* Help text with syllable count */}
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Type pinyin with numbers (ni3) or use tone buttons
        </p>
        {syllables.length > 0 && (
          <p className="text-xs text-muted-foreground/70">
            {syllables.length} syllable{syllables.length > 1 ? 's' : ''} detected
          </p>
        )}
      </div>
    </div>
  )
}
```

---

### TASK 4: Update ToneSelector Component

**File**: `/components/features/tone-selector.tsx`

Update to work with new tone application logic:

```typescript
// In ToneSelector component, update the button onClick:

<button
  onClick={() => {
    onToneSelect(tone)
    // The parent (ReviewCard) will handle applying tone via the hook
  }}
  // ... rest of button props
>
```

Make sure tone selector properly communicates with the input component.

---

### TASK 5: Update ReviewCard Component

**File**: `/components/features/review-card.tsx`

Integrate the new hook properly:

```typescript
// Update to use the enhanced pinyin input logic

const {
  value: userInput,
  setValue: setUserInput,
  applyTone,
  getFinalValue,
  reset: resetInput,
} = usePinyinInput({
  onSubmit: handleSubmitAnswer,
})

// When tone is selected from tone selector:
const handleToneSelect = useCallback((tone: number) => {
  applyTone(tone)
}, [applyTone])

// When submitting answer:
const handleSubmitAnswer = useCallback(() => {
  const finalInput = getFinalValue() // Gets normalized, converted pinyin

  const answeredCorrectly = comparePinyinExact(finalInput, correctPinyin)

  setIsCorrect(answeredCorrectly)
  setIsAnswerSubmitted(true)
}, [getFinalValue, correctPinyin])

// Reset when character changes:
useEffect(() => {
  resetInput()
  // ... other resets
}, [character])
```

---

## User Experience Flow Examples

### Example 1: Single Character

```
User reviewing: 你 (you)
Correct answer: nǐ

Flow:
1. User types: "n"          → Display: "n"
2. User types: "i"          → Display: "ni"
3. User presses: "3"        → Display: "nǐ"  ✅
4. User clicks: Check Answer → Correct!

Alternative:
1. User types: "ni3"        → Display: "ni3"
2. User presses: Space      → Display: "nǐ "  ✅ (space auto-converts)
3. User clicks: Check Answer → Correct!
```

### Example 2: Two Characters

```
User reviewing: 再见 (goodbye)
Correct answer: zàijiàn (or "zài jiàn" with space)

Flow:
1. User types: "zai"        → Display: "zai" (1 syllable detected)
2. User presses: "4"        → Display: "zài"  ✅
3. User types: " "          → Display: "zài "
4. User types: "jian"       → Display: "zài jian" (2 syllables detected)
5. User presses: "4"        → Display: "zài jiàn"  ✅
6. User clicks: Check Answer → Correct!

Alternative (with numbers):
1. User types: "zai4"       → Display: "zai4"
2. User presses: Space      → Display: "zài "  ✅
3. User types: "jian4"      → Display: "zài jian4"
4. User presses: Space      → Display: "zài jiàn"  ✅
5. User clicks: Check Answer → Correct!
```

### Example 3: Tone Correction

```
User reviewing: 好 (good)
Correct answer: hǎo

Flow:
1. User types: "hao"        → Display: "hao"
2. User presses: "4"        → Display: "hào"  (wrong tone!)
3. User realizes mistake
4. User presses: "3"        → Display: "hǎo"  ✅ TONE REPLACED!
5. User clicks: Check Answer → Correct!
```

### Example 4: Multi-Syllable with Cursor

```
User reviewing: 你好吗 (how are you)
Correct answer: nǐ hǎo ma

Flow:
1. User types: "ni hao ma"  → Display: "ni hao ma" (3 syllables)
2. User clicks after "ni"   → Cursor: "ni| hao ma"
3. User presses: "3"        → Display: "nǐ hao ma"  ✅ (applied to first syllable)
4. User clicks after "hao"  → Cursor: "nǐ hao| ma"
5. User presses: "3"        → Display: "nǐ hǎo ma"  ✅ (applied to second syllable)
6. User clicks: Check Answer → Correct! (ma has neutral tone)
```

---

## Testing Checklist

### Unit Tests (Jest)

Create tests in `/lib/hooks/__tests__/use-pinyin-input.test.tsx`:

```typescript
describe('usePinyinInput', () => {
  test('applies tone to current syllable', () => {
    // Test tone application
  })

  test('replaces existing tone', () => {
    // Test tone replacement: nǐ + tone 2 → ní
  })

  test('handles multi-syllable input', () => {
    // Test: "zai jian" with tones
  })

  test('auto-converts tone numbers on space', () => {
    // Test: "ni3 " → "nǐ "
  })

  test('normalizes spaces', () => {
    // Test: "ni    hao" → "ni hao"
  })

  test('handles cursor position correctly', () => {
    // Test syllable detection based on cursor
  })

  test('validates syllables before applying tone', () => {
    // Test: "xyz" + tone 3 → no change (invalid)
  })
})
```

### Integration Tests

Test in actual component:

```typescript
describe('PinyinInput Integration', () => {
  test('complete user flow for single character', () => {
    // Simulate: type "ni", press "3", check result
  })

  test('complete user flow for multi-character', () => {
    // Simulate: "zai4 jian4" → "zài jiàn"
  })

  test('tone replacement works', () => {
    // Simulate: "ni3", press "2", check result is "ní"
  })
})
```

### Manual Testing Scenarios

- [ ] Type single syllable + tone number
- [ ] Type single syllable + tone button
- [ ] Type multi-syllable with spaces + tones
- [ ] Type with tone numbers, auto-convert with space
- [ ] Replace tone by pressing different number
- [ ] Replace tone by clicking different button
- [ ] Edit middle syllable in multi-syllable word
- [ ] Add tone to syllable without tone
- [ ] Add tone to syllable with existing tone (should replace)
- [ ] Type with multiple spaces (should normalize)
- [ ] Type invalid syllable + tone (should handle gracefully)
- [ ] Submit with tone numbers still present (should auto-convert)

---

## Edge Cases to Handle

1. **Empty input + tone**:
   - Input: `""`
   - User presses: `3`
   - Result: No change ✅

2. **Only spaces + tone**:
   - Input: `"   "`
   - User presses: `3`
   - Result: No change ✅

3. **Invalid syllable + tone**:
   - Input: `"xyz"`
   - User presses: `3`
   - Result: No change (or show warning) ✅

4. **Mixed tone marks and numbers**:
   - Input: `"nǐ3"`
   - Result: Normalize to `"nǐ"` ✅

5. **Multiple tones in input**:
   - Input: `"nǐ2"`
   - Result: Replace to `"ní"` ✅

6. **Very long input**:
   - Input: `"ni hao wo shi zhong guo ren"` (7 syllables)
   - Should handle gracefully ✅

7. **Paste with tone numbers**:
   - Paste: `"ni3 hao3 ma"`
   - Result: Auto-convert to `"nǐ hǎo ma"` ✅

8. **Rapid tone changes**:
   - User presses: `1`, `2`, `3`, `4` quickly
   - Result: Only final tone (`4`) applied ✅

---

## Visual Feedback Improvements

### Syllable Highlighting (Optional Enhancement)

Show which syllable is active:

```tsx
<div className="flex justify-center gap-2 mb-2">
  {syllables.map((syll, idx) => (
    <div
      key={idx}
      className={cn(
        'px-2 py-1 rounded text-lg',
        idx === currentSyllableIndex && 'bg-primary/10 ring-2 ring-primary/30'
      )}
    >
      {syll}
    </div>
  ))}
</div>
```

### Tone Preview (Optional Enhancement)

Show what tone would be applied:

```tsx
{selectedTone !== null && currentSyllable && (
  <p className="text-xs text-muted-foreground text-center">
    Preview: {addToneMark(removeToneMarks(currentSyllable), selectedTone)}
  </p>
)}
```

---

## Success Criteria

Implementation is successful when:

1. ✅ **Multi-character words work perfectly**
   - Users can type space-separated syllables
   - Each syllable gets its own tone
   - Spaces are preserved correctly

2. ✅ **Tone replacement works**
   - Pressing new tone replaces old tone
   - No syllable can have multiple tones
   - Works with both keyboard and buttons

3. ✅ **Cursor awareness works**
   - Tone applied to correct syllable based on cursor
   - Can edit any syllable in the middle

4. ✅ **Auto-conversion works**
   - "ni3" + space → "nǐ"
   - Consistent and predictable

5. ✅ **Input is forgiving**
   - Handles typos gracefully
   - Normalizes spaces
   - Validates syllables

6. ✅ **Clear feedback**
   - User always knows what's happening
   - Syllable count displayed
   - No confusing states

7. ✅ **All edge cases handled**
   - Empty input
   - Invalid syllables
   - Mixed input
   - Long multi-syllable words

---

## Migration Notes

This is a **significant refactor** of the pinyin input logic. To migrate safely:

1. **Create new hook alongside old one** (don't replace immediately)
2. **Test new hook thoroughly** with unit tests
3. **Create feature flag** to switch between old and new
4. **Test in staging** with real users
5. **Monitor for issues** after deployment
6. **Remove old code** once stable

---

## Performance Considerations

- **Debounce cursor position tracking** (if performance issues)
- **Memoize syllable splitting** (if input is long)
- **Use ref for cursor position** instead of state (if re-renders are issue)
- **Optimize auto-conversion** (only on specific events, not every change)

---

## Documentation Updates

After implementation, update:

1. **User help text** in the input component
2. **Tutorial/onboarding** to explain multi-character input
3. **FAQ** with common pinyin typing questions
4. **Keyboard shortcuts** documentation

---

## Final Notes

This implementation creates an **intuitive, user-friendly pinyin input system** that:

- Handles single and multi-character words seamlessly
- Enforces one tone per syllable
- Allows easy tone correction
- Works with multiple input methods (keyboard numbers, tone buttons)
- Provides clear feedback
- Handles all edge cases gracefully

The result is a **professional-grade input system** that feels natural and helps users focus on learning, not fighting the UI.

Users should be able to:
- Type naturally with spaces between syllables
- Add tones with either numbers or buttons
- Correct mistakes easily
- Never encounter confusing or invalid states

**This is a complex but critical improvement that significantly enhances the learning experience.**
