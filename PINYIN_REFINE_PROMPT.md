# Cursor Prompt: Refine Pinyin Input Logic

## Overview
Refine the pinyin parsing and validation logic to enforce a strict, predictable format: `[romanization][tone_number][separator]` where each syllable must include an explicit tone number (1-5) and syllables are separated by spaces.

## Current Implementation Analysis

### Core Files
1. **`/home/user/mandarin-srs/lib/utils/pinyin-utils.ts`** (753 lines)
   - Main pinyin utility functions
   - Line 146-151: `numericToToneMarks()` - converts numeric format to tone marks
   - Line 578-615: `isValidPinyin()` - validates pinyin input
   - Line 623-645: `normalizePinyin()` - normalizes various formats
   - Line 154-571: `VALID_SYLLABLES` Set - 408 valid Mandarin syllables

2. **`/home/user/mandarin-srs/components/features/pinyin-input.tsx`** (367 lines)
   - React component for pinyin input
   - Line 115-126: `handleChange()` - input change handler with auto-corrections
   - Line 131-207: `handleKeyDown()` - keyboard shortcuts (1-5 for tones, Space/Enter for conversion)
   - Line 346-366: `autoCorrectPinyin()` - auto-corrections for v→ü, spaces, etc.

3. **`/home/user/mandarin-srs/lib/hooks/use-pinyin-input.ts`** (64 lines)
   - Hook for pinyin input state management
   - Line 18-35: `handleToneSelect()` - applies tone to last syllable in multi-syllable input

### Current Behavior

**What Currently Works:**
- ✅ Converts `ni3` → `nǐ` (single syllable with tone number)
- ✅ Converts `ni3hao3` → `nǐhǎo` (multi-syllable WITHOUT spaces)
- ✅ Keyboard shortcuts: typing `ni` then pressing `3` adds tone mark
- ✅ Space key converts numeric to tone marks (line 188-204 in pinyin-input.tsx)
- ✅ Tone mark placement follows correct rules (a/e priority, ou→o, last vowel)
- ✅ Validates against 408 valid Mandarin syllables
- ✅ Auto-converts v↔ü for nv/lv syllables

**Current Issues/Gaps:**
- ❌ **No space requirement**: `ni3hao3` is accepted (should require `ni3 hao3`)
- ❌ **Tone numbers optional**: `ni` without tone is accepted as valid (line 608-614 in pinyin-utils.ts)
- ❌ **Space validation broken**: `isValidPinyin()` at line 587 REJECTS any input with spaces using regex `/[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/`
- ❌ **Inconsistent multi-syllable handling**: Database stores `ni3 hao3` with spaces, but validation rejects it
- ❌ **No separator enforcement**: Format `ni3hao3` vs `ni3 hao3` both work in different contexts
- ❌ **Missing tone number detection**: No explicit error for missing tone (e.g., `ni hao` without numbers)

### Test Coverage

**`/home/user/mandarin-srs/lib/utils/__tests__/pinyin-utils.test.ts`** (313 lines)
- Line 178-181: Tests `numericToToneMarks()` with `ni3hao3` (NO space)
- Line 224-228: Tests that `isValidPinyin('ni hao')` returns FALSE (spaces rejected)
- Line 258-261: Tests multi-syllable comparison `nǐhǎo` vs `nihao` (no spaces)
- Line 303-306: Tests exact comparison with spaces `'ni hao' === 'ni hao'`

**Observation**: Tests are inconsistent - some expect spaces to work, others expect rejection.

### Database Schema

**`/home/user/mandarin-srs/lib/db/schema.ts`** (line 179-182)
```typescript
word: text('word').notNull().unique(), // 你好
pinyin: text('pinyin').notNull(), // nǐ hǎo (with tone marks, WITH SPACE)
pinyin_numeric: text('pinyin_numeric').notNull(), // ni3 hao3 (WITH SPACE)
```

**`/home/user/mandarin-srs/data/hsk-vocabulary.json`** (line 519-523)
```json
{
  "word": "你好",
  "pinyin": "nǐ hǎo",
  "pinyin_numeric": "ni3 hao3"  ← SPACE-SEPARATED FORMAT
}
```

**Critical Finding**: Database and seed data ALREADY use space-separated format `ni3 hao3`, but validation logic doesn't support it.

---

## Required Changes: Strict Format Enforcement

### New Format Specification

**Input Format Rules:**
1. **Each syllable**: `[romanization][tone_number]` where tone_number is 1-5 (REQUIRED)
2. **Separator**: Single space between syllables (REQUIRED for multi-syllable words)
3. **Examples**:
   - ✅ `hao3` → 好 (hǎo)
   - ✅ `xie4 xie4` → 谢谢 (xièxiè)
   - ✅ `ni3 hao3` → 你好 (nǐhǎo)
   - ❌ `ni3hao3` → INVALID (missing space separator)
   - ❌ `ni hao` → INVALID (missing tone numbers)
   - ❌ `ni3  hao3` → INVALID (multiple consecutive spaces)

**Tone Numbers:**
- `1` = first tone (flat) → ā
- `2` = second tone (rising) → á
- `3` = third tone (dipping) → ǎ
- `4` = fourth tone (falling) → à
- `5` = neutral/light tone → a (no mark)

**Edge Cases to Handle:**
- Invalid tone numbers (0, 6-9) → Error
- Missing tone number → Error (not default to tone 5)
- Multiple consecutive spaces → Error (not auto-normalize)
- Capitalization → Normalize to lowercase before processing
- Empty input → Error

---

## Implementation Tasks

### Task 1: Update `numericToToneMarks()` Function
**File**: `/home/user/mandarin-srs/lib/utils/pinyin-utils.ts` (line 146-151)

**Current Code**:
```typescript
export function numericToToneMarks(pinyin: string): string {
  // Match syllables with tone numbers (e.g., "ni3", "hao3")
  return pinyin.replace(/([a-zü]+)([1-5])/gi, (_match, syllable: string, tone: string) => {
    return addToneMark(syllable, parseInt(tone, 10))
  })
}
```

**Required Changes**:
- Add space handling: Split by spaces, process each syllable separately
- Validate that each syllable has format `[romanization][tone_number]`
- Preserve spaces in output: `ni3 hao3` → `nǐ hǎo` (with space)
- Reject if syllable missing tone number
- Reject if multiple consecutive spaces found

**New Logic**:
```typescript
export function numericToToneMarks(pinyin: string): string {
  // Trim input and check for empty
  const trimmed = pinyin.trim()
  if (!trimmed) {
    throw new Error('Empty pinyin input')
  }

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(trimmed)) {
    throw new Error('Multiple consecutive spaces not allowed')
  }

  // Split by single space
  const syllables = trimmed.split(' ')

  // Process each syllable
  const converted = syllables.map((syllable, index) => {
    // Each syllable must match: [romanization][tone_number]
    const match = syllable.match(/^([a-zü]+)([1-5])$/i)

    if (!match) {
      throw new Error(
        `Invalid syllable format: "${syllable}" at position ${index + 1}. ` +
        `Expected format: [romanization][tone_number] (e.g., "ni3", "hao3")`
      )
    }

    const [, romanization, toneStr] = match
    const tone = parseInt(toneStr, 10)

    return addToneMark(romanization, tone)
  })

  // Join with spaces
  return converted.join(' ')
}
```

### Task 2: Update `isValidPinyin()` Function
**File**: `/home/user/mandarin-srs/lib/utils/pinyin-utils.ts` (line 578-615)

**Current Code** (line 587):
```typescript
// Only allow: letters (a-z), ü, tone marks, and digits 1-5
const hasInvalidChars = /[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/.test(trimmed)
if (hasInvalidChars) {
  return false
}
```

**Problem**: Regex rejects spaces, making `ni3 hao3` invalid.

**Required Changes**:
- Add space to allowed characters: `/[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5 ]/`
- Split by space and validate each syllable separately
- Each syllable must:
  1. Match format `[romanization][tone_number]` OR already have tone marks
  2. Be a valid syllable from VALID_SYLLABLES set
- Reject multiple consecutive spaces
- Reject syllables without tone numbers (unless already has tone marks)

**New Logic**:
```typescript
export function isValidPinyin(input: string): boolean {
  if (!input || !input.trim()) {
    return false
  }

  const trimmed = input.trim().toLowerCase()

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(trimmed)) {
    return false
  }

  // Updated regex: allow spaces
  const hasInvalidChars = /[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5 ]/.test(trimmed)
  if (hasInvalidChars) {
    return false
  }

  // Split by space (supports multi-syllable words)
  const syllables = trimmed.split(' ')

  for (const syllable of syllables) {
    // Each syllable must either:
    // 1. Have numeric format: [romanization][tone_number] (1-5)
    // 2. Already have tone marks applied

    const hasNumericTone = /^[a-zü]+[1-5]$/.test(syllable)
    const hasToneMark = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(syllable)

    // STRICT: Must have EITHER numeric tone OR tone mark (not neither)
    if (!hasNumericTone && !hasToneMark) {
      return false  // Missing tone number
    }

    // Validate base syllable (without tone)
    const normalized = removeToneMarks(syllable).replace(/[1-5]/g, '')

    if (!normalized) {
      return false
    }

    // Must be valid syllable from dictionary
    if (!VALID_SYLLABLES.has(normalized)) {
      return false
    }
  }

  return true
}
```

### Task 3: Update `normalizePinyin()` Function
**File**: `/home/user/mandarin-srs/lib/utils/pinyin-utils.ts` (line 623-645)

**Current Code** (line 633-641):
```typescript
// Convert numeric tones to tone marks
if (/[1-5]$/.test(normalized)) {  // Only checks LAST character
  const tone = parseInt(normalized.slice(-1), 10)
  const syllable = normalized.slice(0, -1)

  try {
    return addToneMark(syllable, tone)
  } catch (error) {
    return normalized
  }
}
```

**Problem**: Only handles single syllable (checks if last char is tone number).

**Required Changes**:
- Use updated `numericToToneMarks()` to handle multi-syllable inputs
- Handle space-separated format
- Preserve error throwing for invalid formats (don't silently return original)

**New Logic**:
```typescript
export function normalizePinyin(input: string): string {
  let normalized = input.toLowerCase().trim()

  // Convert v to ü
  normalized = normalized.replace(/nv([1-5]?)/g, 'nü$1').replace(/lv([1-5]?)/g, 'lü$1')

  // Convert u: to ü
  normalized = normalized.replace(/u:/g, 'ü')

  // If contains numeric tones, convert to tone marks
  if (/[1-5]/.test(normalized)) {
    try {
      return numericToToneMarks(normalized)  // Now handles multi-syllable with spaces
    } catch (error) {
      // Re-throw validation errors instead of silently returning
      throw new Error(`Invalid pinyin format: ${(error as Error).message}`)
    }
  }

  return normalized
}
```

### Task 4: Update `autoCorrectPinyin()` in PinyinInput Component
**File**: `/home/user/mandarin-srs/components/features/pinyin-input.tsx` (line 346-366)

**Current Code** (line 359):
```typescript
// Normalize multiple spaces to single space (preserve spaces for multi-syllable vocabulary)
corrected = corrected.replace(/\s+/g, ' ')
```

**Problem**: Auto-normalizes multiple spaces, but new spec should reject them as errors.

**Required Changes**:
- **Remove** auto-normalization of multiple spaces
- Let validation catch and reject multiple spaces
- Keep v→ü conversion
- Keep u:→ü conversion
- Keep lowercase conversion

**New Logic**:
```typescript
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

  // REMOVED: Auto-normalization of multiple spaces
  // Users must type correctly: single space between syllables

  // Handle capitalization
  corrected = corrected.toLowerCase()

  return corrected
}
```

### Task 5: Update Keyboard Handler for Space Key
**File**: `/home/user/mandarin-srs/components/features/pinyin-input.tsx` (line 188-204)

**Current Code**:
```typescript
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
```

**Problem**: Only converts the ENTIRE input when it ends with a tone number. Doesn't handle multi-syllable incremental input like `hao3 <space>` where user is typing next syllable.

**Required Changes**:
- When user presses Space after a complete syllable (e.g., `hao3`):
  1. Convert that syllable to tone mark: `hao3` → `hǎo`
  2. Add a space after it: `hǎo `
  3. User can continue typing next syllable: `hǎo ni3`
- Support incremental multi-syllable typing workflow
- When user presses Enter, convert all remaining numeric syllables

**New Logic**:
```typescript
// Handle space key: convert current syllable and prepare for next
if (e.key === ' ') {
  // Check if last "word" (after last space) ends with tone number
  const parts = value.split(' ')
  const lastPart = parts[parts.length - 1] || ''

  if (/^[a-zü]+[1-5]$/.test(lastPart)) {
    e.preventDefault()

    const tone = parseInt(lastPart.slice(-1), 10)
    const syllable = lastPart.slice(0, -1)

    try {
      const withTone = addToneMark(syllable, tone)
      const newValue = [...parts.slice(0, -1), withTone].join(' ')
      onChange(newValue + ' ')  // Add space after converted syllable
    } catch (error) {
      // Invalid syllable, don't convert, but still allow space
    }

    return
  }
  // If not ending with tone number, allow space normally
}

// Handle Enter key: convert all numeric syllables and submit
if (e.key === 'Enter') {
  if (selectedSuggestionIndex >= 0 && suggestions.length > 0) {
    // Apply selected suggestion (existing logic)
    // ...
  } else if (value.trim()) {
    // Convert any remaining numeric syllables before submit
    try {
      const normalized = numericToToneMarks(value)
      onChange(normalized)

      if (onSubmit) {
        setTimeout(() => onSubmit(), 0)  // Defer to allow state update
      }
    } catch (error) {
      // Invalid format, submit as-is (validation will catch)
      if (onSubmit) {
        onSubmit()
      }
    }
  }
  return
}
```

### Task 6: Add New Parsing Function (Optional Enhancement)
**File**: `/home/user/mandarin-srs/lib/utils/pinyin-utils.ts`

**New Function**: `parsePinyinInput()` - Explicit parser for strict format validation

```typescript
/**
 * Parse pinyin input with strict format validation
 * Format: [romanization][tone_number][space] for each syllable
 *
 * @param input - Raw pinyin input (e.g., "ni3 hao3")
 * @returns Parsed syllables array
 * @throws Error with detailed message if format invalid
 */
export interface ParsedPinyinSyllable {
  romanization: string  // "ni"
  tone: number          // 3
  withToneMark: string  // "nǐ"
}

export function parsePinyinInput(input: string): ParsedPinyinSyllable[] {
  const trimmed = input.trim()

  if (!trimmed) {
    throw new Error('Empty input')
  }

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(trimmed)) {
    throw new Error('Multiple consecutive spaces not allowed. Use single space to separate syllables.')
  }

  // Check for invalid characters
  if (/[^a-zü1-5 ]/.test(trimmed.toLowerCase())) {
    throw new Error('Invalid characters. Only a-z, ü, digits 1-5, and single spaces allowed.')
  }

  const syllables = trimmed.toLowerCase().split(' ')
  const parsed: ParsedPinyinSyllable[] = []

  for (let i = 0; i < syllables.length; i++) {
    const syllable = syllables[i]

    if (!syllable) {
      throw new Error(`Empty syllable at position ${i + 1}`)
    }

    // Must match: [romanization][tone_number]
    const match = syllable.match(/^([a-zü]+)([1-5])$/)

    if (!match) {
      // Determine specific error
      if (!/[1-5]$/.test(syllable)) {
        throw new Error(
          `Missing tone number for syllable "${syllable}" at position ${i + 1}. ` +
          `Each syllable must end with a tone number (1-5).`
        )
      }
      if (/[0689]/.test(syllable)) {
        throw new Error(
          `Invalid tone number in "${syllable}" at position ${i + 1}. ` +
          `Valid tones: 1 (flat), 2 (rising), 3 (dipping), 4 (falling), 5 (neutral).`
        )
      }
      throw new Error(
        `Invalid syllable format: "${syllable}" at position ${i + 1}. ` +
        `Expected: [romanization][tone_number] (e.g., "ni3", "hao3")`
      )
    }

    const [, romanization, toneStr] = match
    const tone = parseInt(toneStr, 10)

    // Validate against dictionary
    if (!VALID_SYLLABLES.has(romanization)) {
      throw new Error(
        `Invalid pinyin syllable: "${romanization}" at position ${i + 1}. ` +
        `Not found in Mandarin syllable dictionary.`
      )
    }

    // Convert to tone mark
    const withToneMark = addToneMark(romanization, tone)

    parsed.push({
      romanization,
      tone,
      withToneMark,
    })
  }

  return parsed
}
```

### Task 7: Update Test Suite
**File**: `/home/user/mandarin-srs/lib/utils/__tests__/pinyin-utils.test.ts`

**Required Changes**:

1. **Update `numericToToneMarks()` tests** (line 178-181):
```typescript
describe('numericToToneMarks', () => {
  it('should convert single syllable with tone number', () => {
    expect(numericToToneMarks('ni3')).toBe('nǐ')
    expect(numericToToneMarks('hao3')).toBe('hǎo')
  })

  it('should handle multiple syllables with spaces', () => {
    expect(numericToToneMarks('ni3 hao3')).toBe('nǐ hǎo')  // WITH SPACE
    expect(numericToToneMarks('xie4 xie4')).toBe('xièxiè')  // Note: should this preserve space?
    expect(numericToToneMarks('zhong1 guo2')).toBe('zhōng guó')
  })

  it('should reject syllables without tone numbers', () => {
    expect(() => numericToToneMarks('ni hao')).toThrow('Invalid syllable format')
  })

  it('should reject multiple consecutive spaces', () => {
    expect(() => numericToToneMarks('ni3  hao3')).toThrow('Multiple consecutive spaces')
  })

  it('should reject format without spaces between syllables', () => {
    expect(() => numericToToneMarks('ni3hao3')).toThrow('Invalid syllable format')
  })

  it('should reject invalid tone numbers', () => {
    expect(() => numericToToneMarks('ni0')).toThrow('Invalid syllable format')
    expect(() => numericToToneMarks('ni6')).toThrow('Invalid syllable format')
  })
}
```

2. **Update `isValidPinyin()` tests** (line 224-228):
```typescript
describe('isValidPinyin', () => {
  it('should accept space-separated syllables with tone numbers', () => {
    expect(isValidPinyin('ni3 hao3')).toBe(true)  // NOW VALID
    expect(isValidPinyin('xie4 xie4')).toBe(true)
    expect(isValidPinyin('zhong1 guo2')).toBe(true)
  })

  it('should accept single syllable with tone number', () => {
    expect(isValidPinyin('ni3')).toBe(true)
    expect(isValidPinyin('hao3')).toBe(true)
  })

  it('should accept syllables with tone marks', () => {
    expect(isValidPinyin('nǐ hǎo')).toBe(true)
    expect(isValidPinyin('nǐ')).toBe(true)
  })

  it('should reject syllables without tone numbers or marks', () => {
    expect(isValidPinyin('ni hao')).toBe(false)  // No tones
    expect(isValidPinyin('ni')).toBe(false)      // No tone
  })

  it('should reject multiple consecutive spaces', () => {
    expect(isValidPinyin('ni3  hao3')).toBe(false)  // Double space
    expect(isValidPinyin('ni3   hao3')).toBe(false) // Triple space
  })

  it('should reject format without spaces', () => {
    expect(isValidPinyin('ni3hao3')).toBe(false)  // Missing space separator
  })
}
```

3. **Add tests for new `parsePinyinInput()` function**:
```typescript
describe('parsePinyinInput', () => {
  it('should parse single syllable', () => {
    const result = parsePinyinInput('hao3')
    expect(result).toEqual([
      { romanization: 'hao', tone: 3, withToneMark: 'hǎo' }
    ])
  })

  it('should parse multi-syllable input', () => {
    const result = parsePinyinInput('ni3 hao3')
    expect(result).toEqual([
      { romanization: 'ni', tone: 3, withToneMark: 'nǐ' },
      { romanization: 'hao', tone: 3, withToneMark: 'hǎo' }
    ])
  })

  it('should provide detailed error for missing tone', () => {
    expect(() => parsePinyinInput('ni hao')).toThrow('Missing tone number')
  })

  it('should provide detailed error for invalid tone', () => {
    expect(() => parsePinyinInput('ni6')).toThrow('Invalid tone number')
  })

  it('should provide detailed error for multiple spaces', () => {
    expect(() => parsePinyinInput('ni3  hao3')).toThrow('Multiple consecutive spaces')
  })

  it('should provide position information in errors', () => {
    expect(() => parsePinyinInput('ni3 hao zhong1')).toThrow('position 2')
  })
}
```

### Task 8: Update Component Tests
**File**: `/home/user/mandarin-srs/components/features/__tests__/pinyin-input.test.tsx`

Add tests for new space-handling behavior:
```typescript
it('should convert syllable to tone mark on space', () => {
  const { getByRole } = render(<PinyinInput {...defaultProps} />)
  const input = getByRole('textbox')

  // Type "hao3" then press space
  fireEvent.change(input, { target: { value: 'hao3' } })
  fireEvent.keyDown(input, { key: ' ' })

  expect(onChange).toHaveBeenCalledWith('hǎo ')  // Converted with trailing space
})

it('should support incremental multi-syllable input', () => {
  const { getByRole } = render(<PinyinInput {...defaultProps} />)
  const input = getByRole('textbox')

  // Type "ni3" then space
  fireEvent.change(input, { target: { value: 'ni3' } })
  fireEvent.keyDown(input, { key: ' ' })
  expect(onChange).toHaveBeenCalledWith('nǐ ')

  // Continue typing "hao3"
  fireEvent.change(input, { target: { value: 'nǐ hao3' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(onChange).toHaveBeenCalledWith('nǐ hǎo')
})

it('should show validation error for missing tone', () => {
  const { getByRole, getByText } = render(<PinyinInput {...defaultProps} />)
  const input = getByRole('textbox')

  fireEvent.change(input, { target: { value: 'ni hao' } })  // No tones

  // Should show "Invalid" badge
  expect(getByText('Invalid')).toBeInTheDocument()
})
```

---

## Migration Considerations

### Database Compatibility
**Good News**: Database already uses correct format!
- `pinyin_numeric` field: `ni3 hao3` (space-separated) ✅
- `pinyin` field: `nǐ hǎo` (tone marks with space) ✅
- No schema changes needed

### User Experience Impact
**Breaking Changes**:
1. Users can no longer type `ni3hao3` (without space) - must use `ni3 hao3`
2. Missing tone numbers now cause validation errors instead of being optional
3. Multiple spaces no longer auto-normalized - validation will reject

**Improved Experience**:
1. ✅ Incremental typing: `hao3 <space>` auto-converts to `hǎo ` and prepares for next syllable
2. ✅ Clear error messages indicating exactly what's wrong and where
3. ✅ Consistent format across input, storage, and validation
4. ✅ Matches real pinyin input method behavior (explicit tone marking)

### Backward Compatibility
**Existing Data**: No issues - database already has correct format
**User Input**: Users typing old format will get clear validation errors with guidance

---

## Success Criteria

### Validation Tests
- ✅ `hao3` → Valid (single syllable)
- ✅ `ni3 hao3` → Valid (multi-syllable with spaces)
- ✅ `xie4 xie4` → Valid (repeated syllable)
- ❌ `ni3hao3` → Invalid (missing space separator)
- ❌ `ni hao` → Invalid (missing tone numbers)
- ❌ `ni3  hao3` → Invalid (multiple spaces)
- ❌ `ni0` → Invalid (invalid tone 0)
- ❌ `ni6` → Invalid (invalid tone 6)

### Conversion Tests
- `hao3` → `hǎo`
- `ni3 hao3` → `nǐ hǎo` (preserves space)
- `xie4 xie4` → `xièxiè` (preserves space)

### Interactive Workflow
1. User types `hao3` → Shows as valid
2. User presses Space → Converts to `hǎo ` (with trailing space)
3. User types `ni3` → Shows `hǎo ni3` as valid
4. User presses Enter → Converts to `hǎo nǐ` and submits

### Error Messages
- Missing tone: "Missing tone number for syllable 'ni' at position 1. Each syllable must end with a tone number (1-5)."
- Invalid tone: "Invalid tone number in 'ni6' at position 1. Valid tones: 1 (flat), 2 (rising), 3 (dipping), 4 (falling), 5 (neutral)."
- Multiple spaces: "Multiple consecutive spaces not allowed. Use single space to separate syllables."
- Missing space: "Invalid syllable format: 'ni3hao3' at position 1. Expected: [romanization][tone_number] (e.g., 'ni3', 'hao3')"

---

## Implementation Order

1. **Start with core utilities** (`pinyin-utils.ts`):
   - Update `numericToToneMarks()`
   - Update `isValidPinyin()`
   - Update `normalizePinyin()`
   - Add new `parsePinyinInput()`

2. **Update tests** (`pinyin-utils.test.ts`):
   - Fix existing tests to expect new behavior
   - Add new test cases for strict format

3. **Update React component** (`pinyin-input.tsx`):
   - Update `autoCorrectPinyin()`
   - Update space key handler in `handleKeyDown()`
   - Update Enter key handler

4. **Update component tests** (`pinyin-input.test.tsx`):
   - Add space conversion tests
   - Add multi-syllable incremental input tests

5. **Update hook if needed** (`use-pinyin-input.ts`):
   - Verify `handleToneSelect()` works with new format

6. **Integration testing**:
   - Test full review flow with new input format
   - Verify database compatibility
   - Check validation feedback displays correctly

---

## Notes for Cursor

### Context Window Optimization
- Most changes are in `/home/user/mandarin-srs/lib/utils/pinyin-utils.ts` (753 lines)
- Component changes in `/home/user/mandarin-srs/components/features/pinyin-input.tsx` (367 lines)
- Focus on functions mentioned by line numbers above
- Tests are comprehensive - update them to match new behavior

### Edge Cases to Remember
1. **ü handling**: `nv3` should auto-convert to `nü3` before validation
2. **Capitalization**: Always normalize to lowercase (case-insensitive)
3. **Trailing spaces**: User typing flow adds trailing space after conversion
4. **Empty input**: Return appropriate error, not silent failure
5. **Database format**: Already correct - no migration needed

### User Guidance
When validation fails, provide helpful error messages that:
- Identify the exact position (syllable number) with the error
- Explain what was wrong
- Show the expected format with examples
- Suggest valid tone numbers (1-5)

---

## Questions to Consider

1. **Space preservation in output**: Should `ni3 hao3` → `nǐ hǎo` (with space) or `nǐhǎo` (no space)?
   - **Recommendation**: Preserve space (matches database format)

2. **Neutral tone (5)**: Should tone 5 be required explicitly or optional?
   - **Current spec**: Required (user must type `de5` for 的)
   - **Alternative**: Could default missing tone to 5 (but less explicit)
   - **Recommendation**: Keep explicit requirement

3. **Case handling**: Should `NI3` be accepted?
   - **Current**: Auto-converts to lowercase ✅
   - **Recommendation**: Keep auto-conversion

4. **Paste behavior**: What if user pastes `ni3hao3` (no space)?
   - **Current**: `autoCorrectPinyin()` doesn't add spaces
   - **Recommendation**: Validation should reject and show error

5. **Mixed formats**: Should `ni3 hǎo` (mixed numeric and tone marks) be valid?
   - **Current**: Likely not handled consistently
   - **Recommendation**: Accept it - normalize to all tone marks

---

## Additional Context

### Real-world Pinyin Input Methods
This format matches how professional pinyin input methods work:
- **Sogou Pinyin**: Requires explicit tone marking
- **Google Pinyin**: Each syllable typed separately
- **Numbered pinyin**: Standard in linguistics and textbooks

### Educational Value
Requiring explicit tone numbers:
- ✅ Forces learners to think about tones
- ✅ Prevents "lazy" input without tone consideration
- ✅ Matches academic/professional standards
- ✅ Makes errors immediately visible

### Performance
No performance concerns - all operations are O(n) where n = number of syllables, typically 1-5.
