# Cursor Prompt: Real-Time Tone Number Conversion

## Correct User Expectation

**When user types a tone number (1-5), it should convert to tone mark IMMEDIATELY in real-time!**

### Expected Behavior:

```
Type: "z" → Display: "z"
Type: "a" → Display: "za"
Type: "i" → Display: "zai"
Type: "4" → Display: "zài" ✅ (converts immediately!)
Press: Space → Display: "zài " ✅ (space works!)
Type: "j" → Display: "zài j"
Type: "i" → Display: "zài ji"
Type: "a" → Display: "zài jia"
Type: "n" → Display: "zài jian"
Type: "4" → Display: "zài jiàn" ✅ (converts immediately!)
```

**User NEVER sees "zai4" - they see "zài" as soon as they type "4"!**

---

## Why This Makes Sense

### Visual Feedback (Immediate):
- User types number → Sees tone mark instantly
- No waiting until submit
- Clear feedback of what they typed
- Matches muscle memory

### Learning:
- See tone marks immediately
- Learn association: "4" = "à"
- Visual reinforcement
- Understand what you're typing

### Clean Display:
- Input always shows proper pinyin
- No numbers cluttering the display
- Professional appearance
- Easy to read

---

## Implementation: Real-Time Conversion

### Step 1: Detect Tone Number in Input

```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let newValue = e.target.value.toLowerCase()

  // Auto-correct v to ü
  newValue = newValue.replace(/v/g, 'ü')

  // Real-time tone number conversion
  // When user types "zai4", convert to "zài" immediately
  newValue = convertToneNumbersInRealTime(newValue)

  // Remove invalid characters
  newValue = newValue.replace(/[^a-zü\s]/g, '')

  // Normalize spaces
  newValue = newValue.replace(/  +/g, ' ')

  setValue(newValue)
}
```

### Step 2: Real-Time Conversion Function

```typescript
/**
 * Convert tone numbers to tone marks in real-time as user types
 * Converts "zai4" → "zài" immediately
 */
function convertToneNumbersInRealTime(input: string): string {
  // Match pattern: letters followed by tone number (1-5)
  // Example: "zai4" → captures "zai" and "4"
  const pattern = /([a-zü]+)([1-5])/gi

  return input.replace(pattern, (match, syllable, toneNum) => {
    const tone = parseInt(toneNum, 10)

    try {
      // Convert syllable + tone number to tone mark
      return addToneMark(syllable, tone)
    } catch (error) {
      // If conversion fails (invalid syllable), keep original
      return match
    }
  })
}
```

### Step 3: Handle Backspace (Delete Tone Mark as One Unit)

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (disabled) return

  // Enter to submit
  if (e.key === 'Enter' && value.trim()) {
    e.preventDefault()
    onSubmit?.()
    return
  }

  // Backspace: Delete tone-marked character as one unit
  if (e.key === 'Backspace') {
    const input = e.currentTarget
    const cursorPos = input.selectionStart ?? 0
    const charBeforeCursor = value.charAt(cursorPos - 1)

    // Check if character before cursor is a tone-marked vowel
    if (isToneMarkedVowel(charBeforeCursor)) {
      e.preventDefault()

      // Replace tone-marked vowel with base vowel
      const baseVowel = getBaseVowel(charBeforeCursor)
      const newValue =
        value.substring(0, cursorPos - 1) +
        baseVowel +
        value.substring(cursorPos)

      setValue(newValue)

      // Set cursor position after base vowel
      setTimeout(() => {
        input.setSelectionRange(cursorPos, cursorPos)
      }, 0)

      return
    }
  }

  // Let everything else work naturally (space, typing, etc.)
}

/**
 * Check if character is a tone-marked vowel
 */
function isToneMarkedVowel(char: string): boolean {
  const toneMarkedVowels = ['ā', 'á', 'ǎ', 'à', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì', 'ō', 'ó', 'ǒ', 'ò', 'ū', 'ú', 'ǔ', 'ù', 'ǖ', 'ǘ', 'ǚ', 'ǜ']
  return toneMarkedVowels.includes(char)
}

/**
 * Get base vowel from tone-marked vowel
 * Example: "à" → "a", "ǐ" → "i"
 */
function getBaseVowel(toneMarkedChar: string): string {
  const mapping: Record<string, string> = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü',
  }
  return mapping[toneMarkedChar] || toneMarkedChar
}
```

---

## Complete User Experience

### Typing Flow:

```
Step 1: Type "z"
Input: "z"
Display: z▌

Step 2: Type "a"
Input: "za"
Display: za▌

Step 3: Type "i"
Input: "zai"
Display: zai▌

Step 4: Type "4" (CONVERSION HAPPENS!)
Input: "zài"
Display: zài▌  ✅ (no "4" visible!)

Step 5: Press Space
Input: "zài "
Display: zài ▌  ✅ (space works!)

Step 6: Type "jian"
Input: "zài jian"
Display: zài jian▌

Step 7: Type "4" (CONVERSION HAPPENS!)
Input: "zài jiàn"
Display: zài jiàn▌  ✅ (converted immediately!)
```

### Backspace Flow:

```
Current: "zài jiàn"

Backspace once: "zài jian" ✅ (removes tone from "jiàn" → "jian")
Backspace: "zài jia"
Backspace: "zài ji"
Backspace: "zài j"
Backspace: "zài " (space removed)
Backspace: "zai" ✅ (removes tone from "zài" → "zai")
Backspace: "za"
Backspace: "z"
Backspace: "" (empty)
```

**Backspace removes tone mark and leaves base letter!**

---

## Visual Layout (What User Sees)

```
┌────────────────────────────────────────────────┐
│                   再见                          │
│                (Vocabulary)                    │
│                                                │
│              Type the pinyin:                  │
│  ┌──────────────────────────────────────────┐ │
│  │          zài jiàn                        │ │ ← Shows tone marks!
│  └──────────────────────────────────────────┘ │
│                                                │
│  Type with numbers: 4 converts to à           │
│  2 syllables detected                          │
│                                                │
│              Select tone:                      │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │  ā  │ │  á  │ │  ǎ  │ │  à  │ │  a  │    │ ← Visual reference
│  │  1  │ │  2  │ │  3  │ │  4  │ │  5  │    │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘    │
│                                                │
│  Click a tone or type 1-5 after syllable      │
│                                                │
│          [Check Answer]                        │
└────────────────────────────────────────────────┘
```

**Input shows: "zài jiàn" (with tone marks)**
**NOT: "zai4 jian4" (with numbers)**

---

## Tone Selector Buttons Purpose

With real-time conversion, tone selector buttons serve as:

1. **Visual Reference**: See what each tone looks like
2. **Alternative Input**: Can click instead of typing numbers
3. **Learning Aid**: Associate numbers with marks (1=ā, 2=á, etc.)
4. **Correction Tool**: Click to change tone if typed wrong

### Using Tone Buttons:

```
Type: "zai"
Click: à button
Result: "zài" ✅ (same as typing "4")

Type: "zài jian"
Click: à button
Result: "zài jiàn" ✅ (applies to last syllable)
```

---

## Edge Cases

### Case 1: Invalid Syllable + Number

```
Type: "xyz4"
Result: "xyz4" (no conversion - invalid syllable)
OR
Result: "xyz" (strip invalid number)
```

**Decision**: Keep as "xyz" (strip the number since it can't be applied)

### Case 2: Typing Multiple Numbers

```
Type: "zai42"
Step 1: "zai4" → "zài" (convert 4)
Step 2: "zài2" → "zái" (replace with tone 2)
Result: "zái" ✅ (most recent tone wins)
```

### Case 3: Backspace on Tone Mark

```
Current: "zài"
Backspace: "zai" ✅ (removes tone, keeps base letters)
```

### Case 4: Space Doesn't Trigger Conversion

```
Type: "zai"
Press: Space
Result: "zai " ✅ (no conversion, just space)

Type: "4"
Result: "zài " ✅ (converts previous syllable!)
```

Wait, this is tricky. Let me reconsider...

**Better approach**: Conversion happens AS you type the number:
- "zai" + type "4" → "zài" (immediately)
- Then typing space → "zài "

---

## Implementation Details

### File: `components/features/pinyin-input.tsx`

**Complete Implementation**:

```typescript
'use client'

import { useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'
import { addToneMark, TONE_MARKS } from '@/lib/utils/pinyin-utils'

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

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  /**
   * Real-time tone conversion as user types
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toLowerCase()

    // 1. Convert v to ü
    newValue = newValue.replace(/v/g, 'ü')

    // 2. Real-time tone number conversion
    // Pattern: letters + tone number → tone mark
    // Example: "zai4" → "zài"
    newValue = newValue.replace(/([a-zü]+)([1-5])/gi, (match, syllable, toneNum) => {
      const tone = parseInt(toneNum, 10)
      try {
        return addToneMark(syllable, tone)
      } catch {
        return syllable // Invalid syllable, just keep base
      }
    })

    // 3. Remove any remaining numbers (0, 6-9)
    newValue = newValue.replace(/[0-9]/g, '')

    // 4. Remove invalid characters (keep only letters, ü, spaces, tone marks)
    newValue = newValue.replace(/[^a-zü\s\u0100-\u017F]/g, '')

    // 5. Normalize multiple spaces
    newValue = newValue.replace(/  +/g, ' ')

    onChange(newValue)
  }

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    // Enter to submit
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      onSubmit?.()
      return
    }

    // Backspace: Remove tone mark, keep base vowel
    if (e.key === 'Backspace') {
      const input = e.currentTarget
      const cursorPos = input.selectionStart ?? 0
      const charBeforeCursor = value.charAt(cursorPos - 1)

      // Check if it's a tone-marked vowel
      const toneMarkedVowels = Object.values(TONE_MARKS).flat()
      if (toneMarkedVowels.includes(charBeforeCursor)) {
        e.preventDefault()

        // Find base vowel
        let baseVowel = charBeforeCursor
        for (const [base, marks] of Object.entries(TONE_MARKS)) {
          if (marks.includes(charBeforeCursor)) {
            baseVowel = base
            break
          }
        }

        // Replace tone mark with base vowel
        const newValue =
          value.substring(0, cursorPos - 1) +
          baseVowel +
          value.substring(cursorPos)

        onChange(newValue)

        // Keep cursor in same position
        setTimeout(() => {
          input.setSelectionRange(cursorPos, cursorPos)
        }, 0)

        return
      }
    }

    // Everything else: let browser handle naturally
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="pinyin-input" className="block text-base font-medium text-center">
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
        placeholder="Type: ni3 hao3 → shows: nǐ hǎo"
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
        maxLength={100}
      />

      <p className="text-xs text-center text-muted-foreground">
        Type 1-5 after syllable to add tone (ni3 → nǐ)
      </p>
    </div>
  )
}
```

---

## Testing Checklist

### Real-Time Conversion:
- [ ] Type "ni3" → Shows "nǐ" immediately
- [ ] Type "hao3" → Shows "hǎo" immediately
- [ ] Type "zai4 jian4" → Shows "zài jiàn"
- [ ] Numbers never visible in input (converted instantly)

### Space Handling:
- [ ] Type "zai4" → "zài", press space → "zài " ✓
- [ ] Can type multiple syllables with spaces
- [ ] Spaces preserved correctly

### Backspace Handling:
- [ ] Backspace on "zài" → "zai" (removes tone, keeps letters)
- [ ] Backspace on "zai" → "za" (normal deletion)
- [ ] No orphaned tone marks

### Tone Buttons Work:
- [ ] Clicking tone button still works
- [ ] Applies to last syllable
- [ ] Can override typed tones

### Edge Cases:
- [ ] Invalid syllable "xyz4" → "xyz" (strips number)
- [ ] Multiple spaces normalized
- [ ] Empty input handled

---

## Success Criteria

Implementation successful when:

1. ✅ Type "zai4" → See "zài" immediately (no "4" visible)
2. ✅ Type "zai4 jian4" → See "zài jiàn" with spaces
3. ✅ Space key works naturally
4. ✅ Backspace removes tone, keeps base letter
5. ✅ No orphaned tone marks
6. ✅ Input always shows clean pinyin with tone marks
7. ✅ Tone selector buttons visible for reference
8. ✅ Both input methods work (typing numbers or clicking buttons)

---

## Summary

**Key Change**: Real-time conversion of tone numbers to tone marks

**User types**: "zai4"
**User sees**: "zài" ✅ (converted immediately!)

**Benefits**:
- Visual feedback instant
- Clean display (no numbers cluttering)
- Learn tone marks as you type
- Professional appearance
- Matches user expectation

**Simple and elegant!** 🎯
