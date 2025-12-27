# Cursor Follow-Up Prompt: Fix Space Input Issue in Pinyin Input

## Problem Report

**Issue**: After implementing the pinyin typing logic improvements, space key behavior is broken:
- ❌ Cannot input single space normally
- ❌ Pressing space twice shows ". " (period + space) - unexpected symbol
- ❌ Normal space typing is blocked

**Expected Behavior**:
- ✅ Space should work normally to separate syllables
- ✅ Auto-convert tone numbers when applicable (ni3 + space → nǐ)
- ✅ No symbols should appear (no periods, no extra characters)
- ✅ Multiple consecutive spaces should normalize to single space

---

## Root Cause Analysis

The issue is likely in the `handleKeyDown` function where space key handling is too aggressive:

```typescript
// PROBLEM: This prevents default space behavior
if (e.key === ' ') {
  e.preventDefault()  // ❌ This blocks normal space input!
  handleSpace()
  return
}
```

**What's happening**:
1. Space press is prevented from default behavior
2. `handleSpace()` is called
3. But the logic might not be adding space correctly in all cases
4. The mysterious ". " suggests some auto-correct or special character handling

---

## Solution

### TASK 1: Fix Space Handling in PinyinInput Component

**File**: `/components/features/pinyin-input.tsx`

**Current Problematic Code**:
```typescript
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    // Numbers 1-5: Apply tone
    if (e.key >= '1' && e.key <= '5') {
      e.preventDefault()
      const tone = parseInt(e.key, 10)
      handleToneNumber(tone)
      onToneApply?.(tone)
      return
    }

    // Space: Auto-convert tone numbers (PROBLEM HERE!)
    if (e.key === ' ') {
      e.preventDefault()  // ❌ Too aggressive!
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
```

**Fixed Code**:
```typescript
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

    // Space: Smart handling for tone conversion
    if (e.key === ' ') {
      // Get current cursor position
      const input = e.currentTarget
      const cursorPos = input.selectionStart ?? 0
      const beforeCursor = localValue.slice(0, cursorPos)
      const afterCursor = localValue.slice(cursorPos)

      // Check if last syllable before cursor has tone number
      const syllables = beforeCursor.trim().split(/\s+/)
      const lastSyllable = syllables[syllables.length - 1] || ''

      // If last syllable ends with tone number (1-5), convert it
      if (/[1-5]$/.test(lastSyllable)) {
        e.preventDefault()

        const tone = parseInt(lastSyllable.slice(-1), 10)
        const baseSyllable = lastSyllable.slice(0, -1)

        // Convert to tone mark
        const withTone = addToneMark(baseSyllable, tone)

        // Replace in the text
        const newBeforeCursor = beforeCursor.replace(
          new RegExp(`${lastSyllable}$`),
          withTone
        )

        const newValue = newBeforeCursor + ' ' + afterCursor
        setValue(newValue)

        // Set cursor after the space
        setTimeout(() => {
          input.setSelectionRange(
            newBeforeCursor.length + 1,
            newBeforeCursor.length + 1
          )
        }, 0)

        return
      }

      // Otherwise, allow normal space (don't prevent default!)
      // This allows space to be typed naturally
      // Browser will handle adding the space character
      // Just normalize on blur or submission
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
  [disabled, handleToneNumber, onSubmit, localValue, onToneApply, setValue]
)
```

**Key Changes**:
1. ✅ Only `preventDefault()` if we're actually converting a tone number
2. ✅ If no tone number to convert, let browser handle space normally
3. ✅ Manual space insertion when converting to maintain cursor position
4. ✅ No mysterious symbols or characters

---

### TASK 2: Add Input Normalization on Change

Instead of preventing spaces, normalize them as the user types:

```typescript
const handleInputChange = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toLowerCase()

    // Auto-correct v to ü in specific contexts
    newValue = newValue
      .replace(/nv([1-5]?)/g, 'nü$1')
      .replace(/lv([1-5]?)/g, 'lü$1')

    // Normalize multiple consecutive spaces to single space
    // But do it gently - allow user to type
    newValue = newValue.replace(/  +/g, ' ')  // Only replace 2+ spaces with 1

    // Remove any unexpected characters (like periods, commas, etc.)
    // Keep only: letters, numbers 1-5, spaces, and ü
    newValue = newValue.replace(/[^a-zü\s1-5]/g, '')

    setValue(newValue)
  },
  [setValue]
)
```

**Key Changes**:
1. ✅ Allow single spaces naturally
2. ✅ Normalize multiple spaces (2+) to single space as user types
3. ✅ Remove any unexpected symbols (periods, commas, etc.)
4. ✅ Keep valid pinyin characters only

---

### TASK 3: Update usePinyinInput Hook

**File**: `/lib/hooks/use-pinyin-input.ts`

Remove or simplify the `handleSpace` function since we're handling it differently:

```typescript
/**
 * Handle space key - auto-convert tone numbers
 * Example: "ni3 " → "nǐ "
 *
 * NOTE: This should only be called when we detect a tone number
 * Normal spaces should pass through naturally
 */
const handleSpace = useCallback(() => {
  // This function is now mostly handled in the component's handleKeyDown
  // Keep it simple here or remove it entirely

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
}, [value, setValue])
```

---

### TASK 4: Final Normalization on Submit

Normalize spaces and convert any remaining tone numbers on final submission:

```typescript
/**
 * Normalize and prepare value for submission
 */
const getFinalValue = useCallback((): string => {
  let final = value

  // 1. Trim leading/trailing spaces
  final = final.trim()

  // 2. Normalize multiple spaces to single space
  final = final.replace(/\s+/g, ' ')

  // 3. Remove any invalid characters that slipped through
  final = final.replace(/[^a-zü\s]/g, '')

  // 4. Auto-convert any remaining tone numbers
  const syllables = final.split(/\s+/).filter(s => s.length > 0)
  const converted = syllables.map(syll => {
    const { syllable, tone } = extractToneNumber(syll)
    if (tone !== null && isValidSyllable(syllable)) {
      try {
        return addToneMark(syllable, tone)
      } catch {
        return syll // Return original if conversion fails
      }
    }
    return syll
  })

  return converted.join(' ')
}, [value])
```

---

## Testing After Fix

### Test Case 1: Normal Space Input
```
1. Type: "ni"
2. Press: Space
3. Expected: "ni " ✅
4. Type: "hao"
5. Expected: "ni hao" ✅
```

### Test Case 2: Auto-Convert with Space
```
1. Type: "ni3"
2. Press: Space
3. Expected: "nǐ " ✅ (converted!)
4. Type: "hao4"
5. Press: Space
6. Expected: "nǐ hǎo " ✅ (both converted!)
```

### Test Case 3: Multiple Spaces
```
1. Type: "ni"
2. Press: Space Space Space
3. Expected: "ni " ✅ (normalized to single space)
```

### Test Case 4: No Symbols
```
1. Type: "ni"
2. Press: Space
3. Expected: "ni " (not "ni. " or "ni . ") ✅
```

### Test Case 5: Mixed Input
```
1. Type: "ni3"
2. Press: Space
3. Expected: "nǐ "
4. Type: " " (extra space)
5. Expected: "nǐ " (still single space)
6. Type: "hao"
7. Expected: "nǐ hao" ✅
```

---

## Quick Fix Summary

**Changes Needed**:

1. **PinyinInput Component** - Update `handleKeyDown`:
   - Only `preventDefault()` when actually converting tone numbers
   - Allow normal space input otherwise
   - Manual space insertion only when converting

2. **Input Change Handler** - Add normalization:
   - Replace 2+ consecutive spaces with single space
   - Remove unexpected symbols (periods, commas, etc.)
   - Keep valid pinyin characters only

3. **Final Submission** - Normalize on submit:
   - Trim spaces
   - Convert remaining tone numbers
   - Clean up any issues

---

## Implementation Steps

1. **Open** `/components/features/pinyin-input.tsx`
2. **Update** `handleKeyDown` function with new space logic
3. **Update** `handleInputChange` to normalize multiple spaces
4. **Test** all scenarios above
5. **Verify** no ". " or other symbols appear
6. **Verify** space works naturally

---

## Root Cause of ". " Symbol

The mysterious ". " is likely from:
- ❌ Browser auto-correct (iOS/macOS especially)
- ❌ Input method editor (IME) interference
- ❌ Some auto-complete or suggestion feature

**Fix**: Add these attributes to the Input component:

```typescript
<Input
  // ... other props
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck="false"
  data-form-type="other"  // Prevent autofill
  data-lpignore="true"    // Prevent LastPass interference
/>
```

---

## Expected Behavior After Fix

### Normal Typing:
```
User types: "n" → "n"
User types: "i" → "ni"
User presses: Space → "ni "
User types: "h" → "ni h"
User types: "a" → "ni ha"
User types: "o" → "ni hao"
```

### With Tone Numbers:
```
User types: "ni3" → "ni3"
User presses: Space → "nǐ " ✅ (auto-converted)
User types: "hao4" → "nǐ hao4"
User presses: Space → "nǐ hǎo " ✅ (auto-converted)
```

### Multiple Spaces (normalized):
```
User types: "ni    hao" → "ni hao" ✅ (normalized)
User types: "ni  " → "ni " ✅ (normalized)
```

### No Symbols:
```
User types: "ni" → "ni"
User presses: Space → "ni " (NOT "ni. " or "ni . ") ✅
```

---

## Success Criteria

Fix is successful when:
- ✅ Space key works normally
- ✅ Can type "ni hao" naturally with spaces
- ✅ Auto-converts "ni3 " → "nǐ " when tone number present
- ✅ No ". " or other unexpected symbols appear
- ✅ Multiple spaces normalize to single space
- ✅ All previous pinyin logic still works (tone replacement, etc.)

---

## Additional Debugging

If issue persists after fix, check:

1. **Browser DevTools Console**: Look for errors
2. **Input Event Logging**: Add temporary logging:
   ```typescript
   const handleKeyDown = (e) => {
     console.log('Key pressed:', e.key, 'Value before:', localValue)
     // ... rest of logic
   }
   ```
3. **Input Method**: Disable any IME or keyboard extensions
4. **Browser**: Test in incognito mode to rule out extensions

---

This targeted fix should resolve the space input issue while maintaining all the good pinyin typing logic improvements!
