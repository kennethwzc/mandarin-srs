# Cursor Follow-Up Prompt: Fix Tone Number + Space Input Issue

## Problem Report

**Issue**: After implementing pinyin improvements, users cannot type tone numbers with spaces:
- ❌ Type "zai4" + space → Auto-converts immediately to "zài "
- ❌ Cannot type "zai4 jian4" (tone number format with spaces)
- ❌ Can only type "zai4jian" (no space before second syllable)

**Expected Behavior**:
- ✅ Should allow typing "zai4 jian4" (tone numbers with spaces)
- ✅ Auto-conversion should be OPTIONAL, not forced
- ✅ Both formats should work: "zai4 jian4" AND "zài jiàn"
- ✅ Conversion should happen on submit, not immediately on space

---

## Root Cause Analysis

The space handler is **too aggressive** with auto-conversion:

```typescript
// PROBLEM: Auto-converts immediately when space is pressed after tone number
if (e.key === ' ') {
  const lastSyllable = getLastSyllable(value)

  if (/[1-5]$/.test(lastSyllable)) {
    e.preventDefault()
    convertToneNumber()  // ❌ Converts TOO EARLY!
    return
  }
}
```

**What's happening**:
1. User types: "zai4"
2. User presses: Space
3. Code sees "zai4" ends with number
4. Code immediately converts: "zai4" → "zài "
5. User types: "jian4"
6. Result: "zài jian4" (can't have consistent format!)

**What should happen**:
1. User types: "zai4"
2. User presses: Space
3. Code adds space: "zai4 "
4. User types: "jian4"
5. Result: "zai4 jian4"
6. On submit: Convert both → "zài jiàn" ✅

---

## User Workflow Analysis

### Workflow 1: Tone Numbers with Spaces (Should Work!)
```
Type: "zai4"         → Display: "zai4"
Press: Space         → Display: "zai4 " ✅ (space added, NOT converted)
Type: "jian4"        → Display: "zai4 jian4" ✅
Click: Check Answer  → Convert to: "zài jiàn" ✅ (convert on submit)
```

### Workflow 2: Convert as You Type (Also Should Work!)
```
Type: "zai"          → Display: "zai"
Press: "4"           → Display: "zài" ✅ (tone button converts immediately)
Press: Space         → Display: "zài " ✅ (normal space)
Type: "jian"         → Display: "zài jian"
Press: "4"           → Display: "zài jiàn" ✅
```

### Workflow 3: Mixed (Should Work Too!)
```
Type: "zai4"         → Display: "zai4"
Press: Space         → Display: "zai4 "
Type: "jian"         → Display: "zai4 jian"
Press: "4"           → Display: "zài jiàn" ✅ (button converts both)
```

All three workflows should be supported!

---

## Solution: Defer Conversion

**Key Principle**: Don't convert on space - convert on **submit** or when **tone button is pressed**.

### Strategy:
1. **Space** = Just add space (no conversion)
2. **Tone button (1-5)** = Convert current syllable immediately
3. **Submit** = Convert any remaining tone numbers
4. **User choice** = Both formats acceptable during typing

---

## Implementation Fix

### TASK 1: Update Space Handling in PinyinInput

**File**: `/components/features/pinyin-input.tsx`

**REMOVE auto-conversion on space**:

```typescript
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    // Numbers 1-5: Apply tone to current syllable (convert immediately)
    if (e.key >= '1' && e.key <= '5') {
      e.preventDefault()
      const tone = parseInt(e.key, 10)
      handleToneNumber(tone)
      onToneApply?.(tone)
      return
    }

    // Space: JUST ADD SPACE - NO AUTO-CONVERSION!
    // Let users type "zai4 jian4" format naturally
    if (e.key === ' ') {
      // Allow natural space input - browser handles it
      // Conversion will happen on submit or when tone button pressed

      // Optional: Prevent double spaces
      const input = e.currentTarget
      const cursorPos = input.selectionStart ?? 0
      const charBeforeCursor = localValue.charAt(cursorPos - 1)

      if (charBeforeCursor === ' ') {
        // Already have space, don't add another
        e.preventDefault()
        return
      }

      // Otherwise, let space through naturally
      return
    }

    // Enter: Submit (conversion happens here)
    if (e.key === 'Enter') {
      if (onSubmit && localValue.trim()) {
        e.preventDefault()
        e.stopPropagation()
        onSubmit()
      }
      return
    }
  },
  [disabled, handleToneNumber, onSubmit, localValue, onToneApply]
)
```

**Key Change**: Space key now just adds space, no conversion!

---

### TASK 2: Update Tone Number Handler (1-5 Keys)

When user presses tone number keys (1-5), convert the **current syllable**:

```typescript
const handleToneNumber = useCallback((tone: number) => {
  if (tone < 1 || tone > 5) return

  // Get input element for cursor position
  const input = inputRef.current
  if (!input) return

  const cursorPos = input.selectionStart ?? localValue.length
  const beforeCursor = localValue.slice(0, cursorPos)
  const afterCursor = localValue.slice(cursorPos)

  // Split into syllables
  const syllables = beforeCursor.trim().split(/\s+/)

  if (syllables.length === 0) return

  // Get the syllable at cursor position (usually last one)
  let targetSyllableIndex = syllables.length - 1
  const targetSyllable = syllables[targetSyllableIndex]!

  // Remove any existing tone number from syllable
  const baseSyllable = targetSyllable.replace(/[1-5]$/, '')

  // Remove any existing tone marks
  const cleanSyllable = removeToneMarks(baseSyllable)

  // Apply new tone
  const withTone = addToneMark(cleanSyllable, tone)

  // Replace in syllables array
  syllables[targetSyllableIndex] = withTone

  // Reconstruct value
  const newBeforeCursor = syllables.join(' ')
  const newValue = newBeforeCursor + afterCursor

  setValue(newValue)

  // Restore cursor position
  setTimeout(() => {
    const newCursorPos = newBeforeCursor.length
    input.setSelectionRange(newCursorPos, newCursorPos)
  }, 0)
}, [localValue, setValue, inputRef])
```

**Key Behavior**:
- Pressing 1-5 converts the **current syllable** immediately
- Removes any tone number if present
- Applies tone mark
- User can continue typing

---

### TASK 3: Convert on Submit (Final Normalization)

**File**: `/lib/hooks/use-pinyin-input.ts`

Update `getFinalValue` to convert all tone numbers:

```typescript
/**
 * Normalize and prepare value for submission
 * Converts all tone numbers to tone marks
 */
const getFinalValue = useCallback((): string => {
  let final = value

  // 1. Trim leading/trailing spaces
  final = final.trim()

  // 2. Normalize multiple spaces to single space
  final = final.replace(/\s+/g, ' ')

  // 3. Split into syllables
  const syllables = final.split(/\s+/).filter(s => s.length > 0)

  // 4. Convert each syllable (handle tone numbers)
  const converted = syllables.map(syllable => {
    // Check if syllable has tone mark already
    const toneFromMark = getToneNumber(syllable)
    if (toneFromMark >= 1 && toneFromMark <= 4) {
      // Already has tone mark, return as-is
      return syllable
    }

    // Check if syllable has tone number at end (e.g., "zai4")
    const match = syllable.match(/^([a-zü]+)([1-5])$/i)
    if (match) {
      const baseSyllable = match[1]!
      const tone = parseInt(match[2]!, 10)

      try {
        // Convert tone number to tone mark
        return addToneMark(baseSyllable, tone)
      } catch (error) {
        console.warn(`Could not convert ${syllable}`, error)
        return syllable
      }
    }

    // No tone number or mark - return as-is
    return syllable
  })

  return converted.join(' ')
}, [value])
```

**Key Behavior**:
- Called when submitting answer
- Converts all "zai4" → "zài" automatically
- User never sees invalid format in final answer
- Supports both input styles

---

### TASK 4: Update Input Normalization

**File**: `/components/features/pinyin-input.tsx`

Update `handleInputChange` to be more permissive:

```typescript
const handleInputChange = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toLowerCase()

    // Auto-correct v to ü in specific contexts
    newValue = newValue
      .replace(/nv([1-5]?)/g, 'nü$1')
      .replace(/lv([1-5]?)/g, 'lü$1')

    // Normalize multiple consecutive spaces to single space
    newValue = newValue.replace(/  +/g, ' ')

    // Remove unexpected characters (keep a-z, ü, spaces, numbers 1-5)
    newValue = newValue.replace(/[^a-zü\s1-5]/g, '')

    setValue(newValue)
  },
  [setValue]
)
```

**Key Change**: Allow tone numbers (1-5) to pass through naturally!

---

## Complete Example Flows

### Example 1: Type with Tone Numbers

```
User Input Sequence:
1. Type: "z"           → Display: "z"
2. Type: "a"           → Display: "za"
3. Type: "i"           → Display: "zai"
4. Type: "4"           → Display: "zai4" ✅
5. Press: Space        → Display: "zai4 " ✅ (no conversion!)
6. Type: "j"           → Display: "zai4 j"
7. Type: "i"           → Display: "zai4 ji"
8. Type: "a"           → Display: "zai4 jia"
9. Type: "n"           → Display: "zai4 jian"
10. Type: "4"          → Display: "zai4 jian4" ✅
11. Click: Check       → Converts to: "zài jiàn" → Submits ✅
```

### Example 2: Convert as You Type

```
User Input Sequence:
1. Type: "zai"         → Display: "zai"
2. Press: "4" (key)    → Display: "zài" ✅ (converted immediately)
3. Press: Space        → Display: "zài " ✅
4. Type: "jian"        → Display: "zài jian"
5. Press: "4" (key)    → Display: "zài jiàn" ✅ (converted)
6. Click: Check        → Submits: "zài jiàn" ✅
```

### Example 3: Use Tone Buttons

```
User Input Sequence:
1. Type: "zai"         → Display: "zai"
2. Click: Tone 4 btn   → Display: "zài" ✅ (converted)
3. Press: Space        → Display: "zài "
4. Type: "jian"        → Display: "zài jian"
5. Click: Tone 4 btn   → Display: "zài jiàn" ✅
6. Click: Check        → Submits: "zài jiàn" ✅
```

### Example 4: Mixed Workflow

```
User Input Sequence:
1. Type: "zai4"        → Display: "zai4"
2. Press: Space        → Display: "zai4 " ✅
3. Type: "jian"        → Display: "zai4 jian"
4. Click: Tone 4 btn   → Display: "zài jiàn" ✅ (both converted!)
5. Click: Check        → Submits: "zài jiàn" ✅
```

All workflows work naturally!

---

## Testing Checklist

### Test Case 1: Tone Numbers with Spaces
```
- [ ] Type "zai4" → shows "zai4"
- [ ] Press Space → shows "zai4 " (NOT "zài ")
- [ ] Type "jian4" → shows "zai4 jian4"
- [ ] Submit → converts to "zài jiàn"
```

### Test Case 2: Multiple Syllables
```
- [ ] Type "ni3 hao3 ma5" → all display with numbers
- [ ] Submit → converts to "nǐ hǎo ma"
```

### Test Case 3: Tone Button Converts
```
- [ ] Type "zai4 jian4" → shows with numbers
- [ ] Click tone button 1 → converts both to "zāi jiān"
```

### Test Case 4: Press Number Key Converts
```
- [ ] Type "zai4 jian4" → shows with numbers
- [ ] Press "1" key → converts last syllable to "zai4 jiān"
- [ ] Press "1" key again (cursor at first) → "zāi jiān"
```

### Test Case 5: Mixed Format
```
- [ ] Type "zài jian4" → mixed format allowed
- [ ] Submit → normalizes to "zài jiàn"
```

### Test Case 6: No Spaces Lost
```
- [ ] Type "zai4" → "zai4"
- [ ] Press Space → "zai4 "
- [ ] Press Space again → "zai4 " (prevents double space)
- [ ] Type "jian4" → "zai4 jian4"
```

---

## Key Behavior Changes

### Before (Problematic):
```
Type: "zai4"
Press: Space
Result: "zài " ❌ (auto-converted, can't type tone numbers with spaces)
```

### After (Fixed):
```
Type: "zai4"
Press: Space
Result: "zai4 " ✅ (space added, no conversion)
```

### Conversion Triggers (After Fix):
1. **Tone button clicked** → Converts current syllable
2. **Number key (1-5) pressed** → Converts current syllable
3. **Submit clicked** → Converts all remaining tone numbers
4. **Space pressed** → Just adds space (NO conversion)

---

## Edge Cases to Handle

### Case 1: Mixed Tone Marks and Numbers
```
Input: "nǐ hao3"
Submit: "nǐ hǎo" ✅ (converts the number, keeps the mark)
```

### Case 2: Invalid Tone Numbers
```
Input: "xyz9"
Submit: "xyz9" ✅ (keeps as-is, invalid syllable)
```

### Case 3: Multiple Spaces
```
Input: "zai4    jian4"
Normalized: "zai4 jian4" ✅ (single space)
Submit: "zài jiàn" ✅
```

### Case 4: No Tone
```
Input: "ni hao"
Submit: "ni hao" ✅ (no tone marks added, user's choice)
```

### Case 5: Partial Tone Numbers
```
Input: "ni3 hao"
Submit: "nǐ hao" ✅ (converts only what has numbers)
```

---

## Benefits of This Approach

1. **Flexible Input** ✅
   - Users can type "zai4 jian4" (tone numbers)
   - Users can type "zài jiàn" (tone marks)
   - Both formats work!

2. **No Forced Conversion** ✅
   - Space doesn't auto-convert
   - User stays in control
   - Less surprising behavior

3. **Multiple Workflows Supported** ✅
   - Type with numbers, convert on submit
   - Convert as you type with buttons
   - Convert with number keys
   - Mix and match

4. **Clean Final Output** ✅
   - Always converts to tone marks on submit
   - Consistent format in database
   - User never submits invalid format

5. **Better UX** ✅
   - Less confusing
   - More predictable
   - Supports user preference

---

## Visual Feedback Enhancement (Optional)

Show user what format they're using:

```tsx
{/* Show format hint */}
<div className="text-xs text-center text-muted-foreground">
  {value.match(/[1-5]/) ? (
    <span>Tone numbers detected - will convert on submit</span>
  ) : (
    <span>Using tone marks</span>
  )}
</div>
```

Or show preview of final output:

```tsx
{/* Preview final format */}
<div className="text-xs text-center text-muted-foreground">
  Preview: <span className="font-medium">{getFinalValue()}</span>
</div>
```

---

## Success Criteria

Fix is successful when:

1. ✅ Can type "zai4 jian4" naturally with spaces
2. ✅ Space doesn't auto-convert tone numbers
3. ✅ Tone buttons (1-5 keys) still convert immediately
4. ✅ Clicking tone selector buttons converts
5. ✅ Submit converts all tone numbers to marks
6. ✅ No spaces are lost or added unexpectedly
7. ✅ Multiple input workflows all work
8. ✅ Final output is always properly formatted

---

## Summary

**Core Change**:
- **Space = Add space only** (no conversion)
- **Number keys (1-5) = Convert current syllable** (immediate)
- **Tone buttons = Convert current syllable** (immediate)
- **Submit = Convert all remaining** (final normalization)

This gives users maximum flexibility while ensuring clean, consistent output!

**User can now type either**:
- `"zai4 jian4"` → converts to `"zài jiàn"` on submit ✅
- `"zài jiàn"` → already has marks ✅
- Mixed format → normalizes on submit ✅

All workflows supported! 🎉
