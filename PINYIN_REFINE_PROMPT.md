# Cursor Prompt: Refine Pinyin Input Logic

## Overview
Refine the pinyin parsing and validation logic to enforce a strict, predictable format: `[romanization][tone_number][optional_separator]` where each syllable MUST include an explicit tone number (1-5). Spaces between syllables are OPTIONAL for user flexibility - both `ni3hao3` and `ni3 hao3` are valid.

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
- ❌ **Tone numbers optional**: `ni` or `nihao` without tone is accepted as valid (line 608-614 in pinyin-utils.ts)
- ❌ **Space validation broken**: `isValidPinyin()` at line 587 REJECTS any input with spaces using regex `/[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/`
- ❌ **Inconsistent multi-syllable handling**: Database stores `ni3 hao3` with spaces, but validation rejects it
- ❌ **Both formats not supported**: `ni3hao3` works, but `ni3 hao3` is rejected (should accept both)
- ❌ **Missing tone number detection**: No explicit error for missing tone (e.g., `ni hao` or `nihao` without numbers)

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

**Critical Finding**: Database uses space-separated format `ni3 hao3`, but both formats (with and without spaces) should be accepted for user flexibility.

---

## Required Changes: Strict Tone Enforcement with Flexible Spacing

### New Format Specification

**Input Format Rules:**
1. **Each syllable**: `[romanization][tone_number]` where tone_number is 1-5 (REQUIRED - NO EXCEPTIONS)
2. **Separator**: Space between syllables is OPTIONAL (both `ni3hao3` and `ni3 hao3` are valid)
3. **Examples**:
   - ✅ `hao3` → 好 (hǎo) - single syllable with tone
   - ✅ `ni3hao3` → 你好 (nǐhǎo) - no spaces
   - ✅ `ni3 hao3` → 你好 (nǐhǎo) - with spaces
   - ✅ `xie4xie4` → 谢谢 (xièxiè) - no spaces
   - ✅ `xie4 xie4` → 谢谢 (xièxiè) - with spaces
   - ❌ `ni` → INVALID (missing tone number)
   - ❌ `nihao` → INVALID (missing tone numbers)
   - ❌ `ni hao` → INVALID (missing tone numbers)
   - ❌ `ni3hao` → INVALID (second syllable missing tone)
   - ❌ `ni3  hao3` → INVALID (multiple consecutive spaces)

**Critical Rule**: EVERY syllable MUST have a tone number. If user doesn't include tone, the answer is WRONG.

**Tone Numbers:**
- `1` = first tone (flat) → ā
- `2` = second tone (rising) → á
- `3` = third tone (dipping) → ǎ
- `4` = fourth tone (falling) → à
- `5` = neutral/light tone → a (no mark)

**Edge Cases to Handle:**
- Invalid tone numbers (0, 6-9) → Error
- Missing tone number → Error (REQUIRED - no defaults)
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

**Problem**: This regex approach doesn't validate that ALL syllables have tones - it only converts the ones that do.

**Required Changes**:
- Parse input to identify all syllables (handle both `ni3hao3` and `ni3 hao3`)
- Validate that EVERY syllable has a tone number
- Reject if any syllable is missing a tone number
- Preserve spaces in output if present in input
- Reject if multiple consecutive spaces found

**New Logic**:
```typescript
export function numericToToneMarks(pinyin: string): string {
  const trimmed = pinyin.trim()
  if (!trimmed) {
    throw new Error('Empty pinyin input')
  }

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(trimmed)) {
    throw new Error('Multiple consecutive spaces not allowed. Use single space to separate syllables.')
  }

  // Split by spaces (if present)
  const parts = trimmed.split(' ')
  const converted: string[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue

    // Parse syllables from this part (may contain multiple syllables like "ni3hao3")
    // Use regex to extract all [romanization][tone] pairs
    const syllableMatches = part.matchAll(/([a-zü]+)([1-5])/gi)
    const syllables = Array.from(syllableMatches)

    if (syllables.length === 0) {
      throw new Error(
        `Invalid format in "${part}" at position ${i + 1}. ` +
        `Each syllable must have format [romanization][tone_number] (e.g., "ni3", "hao3").`
      )
    }

    // Check if we consumed the entire part
    let reconstructed = ''
    for (const match of syllables) {
      reconstructed += match[0]
    }

    if (reconstructed.toLowerCase() !== part.toLowerCase()) {
      // There are characters left over - missing tone numbers
      throw new Error(
        `Missing tone number in "${part}" at position ${i + 1}. ` +
        `EVERY syllable must end with a tone number (1-5). ` +
        `Input was interpreted as: ${syllables.map(m => m[0]).join('+')} but didn't match original.`
      )
    }

    // Convert each syllable to tone marks
    const convertedPart = syllables.map(match => {
      const romanization = match[1]
      const tone = parseInt(match[2], 10)
      return addToneMark(romanization, tone)
    }).join('')

    converted.push(convertedPart)
  }

  // Join with spaces (preserves original spacing)
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

**Problem**: Regex rejects spaces, and doesn't enforce that every syllable has a tone.

**Required Changes**:
- Add space to allowed characters
- Parse syllables (handle both `ni3hao3` and `ni3 hao3` formats)
- REQUIRE that every syllable has either a numeric tone (1-5) OR already has tone marks
- Reject syllables without tones
- Validate against VALID_SYLLABLES dictionary

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

  // Split by spaces (if present)
  const parts = trimmed.split(' ')

  for (const part of parts) {
    if (!part) continue

    // Check if this part has tone marks already
    const hasToneMarks = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(part)

    if (hasToneMarks) {
      // Already has tone marks - validate the base syllable(s)
      // This is complex, so just accept tone-marked input as valid
      // The comparison functions will handle validation
      const normalized = removeToneMarks(part)
      if (!normalized || !/^[a-zü]+$/.test(normalized)) {
        return false
      }
      continue
    }

    // Part has numeric tones - extract and validate each syllable
    const syllableMatches = part.matchAll(/([a-zü]+)([1-5])/gi)
    const syllables = Array.from(syllableMatches)

    if (syllables.length === 0) {
      // No syllables with tones found - INVALID (tone required)
      return false
    }

    // Check if we consumed the entire part (no characters left without tones)
    let reconstructed = ''
    for (const match of syllables) {
      reconstructed += match[0]
    }

    if (reconstructed.toLowerCase() !== part.toLowerCase()) {
      // There are leftover characters - some syllables missing tones
      return false
    }

    // Validate each syllable against dictionary
    for (const match of syllables) {
      const romanization = match[1]
      if (!VALID_SYLLABLES.has(romanization.toLowerCase())) {
        return false
      }
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

**Problem**: Only handles single syllable (checks if last char is tone number). Doesn't handle both spacing formats.

**Required Changes**:
- Use updated `numericToToneMarks()` to handle multi-syllable inputs
- Handle both `ni3hao3` and `ni3 hao3` formats
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
      return numericToToneMarks(normalized)  // Now handles both formats
    } catch (error) {
      // Re-throw validation errors instead of silently returning
      throw new Error(`Invalid pinyin format: ${(error as Error).message}`)
    }
  }

  // If no numeric tones, check if it already has tone marks
  if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(normalized)) {
    return normalized  // Already has tone marks
  }

  // No tones at all - this is an error
  throw new Error('Missing tone numbers. Each syllable must have a tone (1-5).')
}
```

### Task 4: Update `autoCorrectPinyin()` in PinyinInput Component
**File**: `/home/user/mandarin-srs/components/features/pinyin-input.tsx` (line 346-366)

**Current Code** (line 359):
```typescript
// Normalize multiple spaces to single space (preserve spaces for multi-syllable vocabulary)
corrected = corrected.replace(/\s+/g, ' ')
```

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
  // Users can type with or without spaces, but must use single spaces only

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

**Required Changes**:
- When user presses Space after a complete syllable (e.g., `hao3`):
  1. Convert that syllable to tone mark: `hao3` → `hǎo`
  2. Add a space after it: `hǎo `
  3. User can continue typing next syllable: `hǎo ni3`
- Support incremental multi-syllable typing workflow
- When user presses Enter, convert all remaining numeric syllables
- Support both with-space and without-space formats

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
      // Invalid format, submit as-is (validation will catch it as wrong)
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
 * Format: [romanization][tone_number] for each syllable (spaces optional)
 * CRITICAL: Every syllable MUST have a tone number
 *
 * @param input - Raw pinyin input (e.g., "ni3hao3" or "ni3 hao3")
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

  // Split by spaces (if present)
  const parts = trimmed.toLowerCase().split(' ')
  const parsed: ParsedPinyinSyllable[] = []

  for (let partIndex = 0; partIndex < parts.length; partIndex++) {
    const part = parts[partIndex]
    if (!part) continue

    // Extract all [romanization][tone] pairs from this part
    const syllableMatches = part.matchAll(/([a-zü]+)([1-5])/g)
    const syllables = Array.from(syllableMatches)

    if (syllables.length === 0) {
      throw new Error(
        `Missing tone numbers in "${part}" at position ${partIndex + 1}. ` +
        `EVERY syllable must end with a tone number (1-5).`
      )
    }

    // Check if we consumed the entire part (no leftover characters)
    let reconstructed = ''
    for (const match of syllables) {
      reconstructed += match[0]
    }

    if (reconstructed !== part) {
      // There are characters left over - some syllables missing tones
      throw new Error(
        `Incomplete tone marking in "${part}" at position ${partIndex + 1}. ` +
        `Found syllables: ${syllables.map(m => m[0]).join(', ')}. ` +
        `All syllables must have tone numbers (1-5).`
      )
    }

    // Validate and convert each syllable
    for (let i = 0; i < syllables.length; i++) {
      const match = syllables[i]
      const romanization = match[1]
      const toneStr = match[2]
      const tone = parseInt(toneStr, 10)

      // Validate against dictionary
      if (!VALID_SYLLABLES.has(romanization)) {
        throw new Error(
          `Invalid pinyin syllable: "${romanization}" (from "${part}"). ` +
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

  it('should handle multiple syllables WITHOUT spaces', () => {
    expect(numericToToneMarks('ni3hao3')).toBe('nǐhǎo')  // No space preserved
    expect(numericToToneMarks('xie4xie4')).toBe('xièxiè')
    expect(numericToToneMarks('zhong1guo2')).toBe('zhōngguó')
  })

  it('should handle multiple syllables WITH spaces', () => {
    expect(numericToToneMarks('ni3 hao3')).toBe('nǐ hǎo')  // Space preserved
    expect(numericToToneMarks('xie4 xie4')).toBe('xiè xiè')
    expect(numericToToneMarks('zhong1 guo2')).toBe('zhōng guó')
  })

  it('should reject syllables without tone numbers', () => {
    expect(() => numericToToneMarks('ni')).toThrow('Missing tone number')
    expect(() => numericToToneMarks('nihao')).toThrow('Missing tone number')
    expect(() => numericToToneMarks('ni hao')).toThrow('Missing tone number')
    expect(() => numericToToneMarks('ni3hao')).toThrow('Missing tone number') // Second syllable missing tone
  })

  it('should reject multiple consecutive spaces', () => {
    expect(() => numericToToneMarks('ni3  hao3')).toThrow('Multiple consecutive spaces')
  })

  it('should reject invalid tone numbers', () => {
    expect(() => numericToToneMarks('ni0')).toThrow()
    expect(() => numericToToneMarks('ni6')).toThrow()
  })
}
```

2. **Update `isValidPinyin()` tests** (line 224-228):
```typescript
describe('isValidPinyin', () => {
  it('should accept syllables with tone numbers (no spaces)', () => {
    expect(isValidPinyin('ni3')).toBe(true)
    expect(isValidPinyin('ni3hao3')).toBe(true)  // No spaces - VALID
    expect(isValidPinyin('xie4xie4')).toBe(true)
    expect(isValidPinyin('zhong1guo2')).toBe(true)
  })

  it('should accept syllables with tone numbers (with spaces)', () => {
    expect(isValidPinyin('ni3 hao3')).toBe(true)  // With spaces - VALID
    expect(isValidPinyin('xie4 xie4')).toBe(true)
    expect(isValidPinyin('zhong1 guo2')).toBe(true)
  })

  it('should accept syllables with tone marks', () => {
    expect(isValidPinyin('nǐhǎo')).toBe(true)  // No spaces
    expect(isValidPinyin('nǐ hǎo')).toBe(true)  // With spaces
    expect(isValidPinyin('nǐ')).toBe(true)
  })

  it('should REJECT syllables without tone numbers or marks', () => {
    expect(isValidPinyin('ni')).toBe(false)       // No tone - INVALID
    expect(isValidPinyin('nihao')).toBe(false)    // No tones - INVALID
    expect(isValidPinyin('ni hao')).toBe(false)   // No tones - INVALID
    expect(isValidPinyin('ni3hao')).toBe(false)   // Second syllable missing tone - INVALID
  })

  it('should reject multiple consecutive spaces', () => {
    expect(isValidPinyin('ni3  hao3')).toBe(false)  // Double space
    expect(isValidPinyin('ni3   hao3')).toBe(false) // Triple space
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

  it('should parse multi-syllable input WITHOUT spaces', () => {
    const result = parsePinyinInput('ni3hao3')
    expect(result).toEqual([
      { romanization: 'ni', tone: 3, withToneMark: 'nǐ' },
      { romanization: 'hao', tone: 3, withToneMark: 'hǎo' }
    ])
  })

  it('should parse multi-syllable input WITH spaces', () => {
    const result = parsePinyinInput('ni3 hao3')
    expect(result).toEqual([
      { romanization: 'ni', tone: 3, withToneMark: 'nǐ' },
      { romanization: 'hao', tone: 3, withToneMark: 'hǎo' }
    ])
  })

  it('should provide detailed error for missing tone', () => {
    expect(() => parsePinyinInput('ni')).toThrow('Missing tone number')
    expect(() => parsePinyinInput('nihao')).toThrow('Missing tone number')
    expect(() => parsePinyinInput('ni hao')).toThrow('Missing tone number')
    expect(() => parsePinyinInput('ni3hao')).toThrow('Incomplete tone marking')
  })

  it('should provide detailed error for invalid tone', () => {
    expect(() => parsePinyinInput('ni6')).toThrow()
    expect(() => parsePinyinInput('ni0')).toThrow()
  })

  it('should provide detailed error for multiple spaces', () => {
    expect(() => parsePinyinInput('ni3  hao3')).toThrow('Multiple consecutive spaces')
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

it('should accept input without spaces', () => {
  const { getByRole } = render(<PinyinInput {...defaultProps} />)
  const input = getByRole('textbox')

  // Type "ni3hao3" (no spaces)
  fireEvent.change(input, { target: { value: 'ni3hao3' } })

  // Should show as valid
  expect(getByText('Valid')).toBeInTheDocument()
})

it('should show validation error for missing tone', () => {
  const { getByRole, getByText } = render(<PinyinInput {...defaultProps} />)
  const input = getByRole('textbox')

  // Test various formats without tones
  fireEvent.change(input, { target: { value: 'ni' } })
  expect(getByText('Invalid')).toBeInTheDocument()

  fireEvent.change(input, { target: { value: 'nihao' } })
  expect(getByText('Invalid')).toBeInTheDocument()

  fireEvent.change(input, { target: { value: 'ni hao' } })
  expect(getByText('Invalid')).toBeInTheDocument()

  fireEvent.change(input, { target: { value: 'ni3hao' } })  // Second syllable missing tone
  expect(getByText('Invalid')).toBeInTheDocument()
})
```

---

## Migration Considerations

### Database Compatibility
**Good News**: Database uses space-separated format, but both will work!
- `pinyin_numeric` field: `ni3 hao3` (space-separated) ✅
- `pinyin` field: `nǐ hǎo` (tone marks with space) ✅
- User can type either `ni3hao3` or `ni3 hao3` - both valid ✅
- Comparison functions will normalize for matching

### User Experience Impact
**Breaking Changes**:
1. ❌ Missing tone numbers now cause validation errors (REQUIRED - no exceptions)
2. ❌ Multiple spaces no longer auto-normalized - validation will reject

**Improved Experience**:
1. ✅ Flexible spacing: type `ni3hao3` or `ni3 hao3` - both work!
2. ✅ Incremental typing: `hao3 <space>` auto-converts to `hǎo ` and prepares for next syllable
3. ✅ Clear error messages: "Missing tone number" tells exactly what's wrong
4. ✅ Forces tone awareness: learners must think about tones
5. ✅ Consistent validation across all formats

### Backward Compatibility
**Existing Data**: No issues - database has correct format
**User Input**:
- Users who typed `ni3hao3` before: ✅ Still works
- Users who want to type `ni3 hao3`: ✅ Now works too
- Users who typed `nihao` without tones: ❌ Will get validation error (this is intentional - they MUST include tones)

---

## Success Criteria

### Validation Tests
- ✅ `hao3` → Valid (single syllable with tone)
- ✅ `ni3hao3` → Valid (no spaces, all tones present)
- ✅ `ni3 hao3` → Valid (with spaces, all tones present)
- ✅ `xie4xie4` → Valid (no spaces)
- ✅ `xie4 xie4` → Valid (with spaces)
- ❌ `ni` → Invalid (missing tone)
- ❌ `nihao` → Invalid (missing tones)
- ❌ `ni hao` → Invalid (missing tones)
- ❌ `ni3hao` → Invalid (second syllable missing tone)
- ❌ `ni3  hao3` → Invalid (multiple spaces)
- ❌ `ni0` → Invalid (invalid tone 0)
- ❌ `ni6` → Invalid (invalid tone 6)

### Conversion Tests
- `hao3` → `hǎo`
- `ni3hao3` → `nǐhǎo` (no space preserved)
- `ni3 hao3` → `nǐ hǎo` (space preserved)
- `xie4 xie4` → `xiè xiè` (space preserved)

### Interactive Workflow
1. User types `hao3` → Shows as valid
2. User presses Space → Converts to `hǎo ` (with trailing space)
3. User types `ni3` → Shows `hǎo ni3` as valid
4. User presses Enter → Converts to `hǎo nǐ` and submits

**Alternative workflow (no spaces)**:
1. User types `ni3hao3` → Shows as valid
2. User presses Enter → Converts to `nǐhǎo` and submits

### Error Messages
- Missing tone: "Missing tone numbers in 'nihao' at position 1. EVERY syllable must end with a tone number (1-5)."
- Incomplete tones: "Incomplete tone marking in 'ni3hao' at position 1. All syllables must have tone numbers (1-5)."
- Invalid tone: "Invalid tone number (from validation)."
- Multiple spaces: "Multiple consecutive spaces not allowed. Use single space to separate syllables."

---

## Implementation Order

1. **Start with core utilities** (`pinyin-utils.ts`):
   - Update `numericToToneMarks()` - handle both spacing formats
   - Update `isValidPinyin()` - accept both formats, enforce tones
   - Update `normalizePinyin()` - handle both formats
   - Add new `parsePinyinInput()` - explicit parser

2. **Update tests** (`pinyin-utils.test.ts`):
   - Fix existing tests to expect new behavior
   - Add test cases for both spacing formats
   - Add tests enforcing tone requirement

3. **Update React component** (`pinyin-input.tsx`):
   - Update `autoCorrectPinyin()` - remove space normalization
   - Update space key handler in `handleKeyDown()`
   - Update Enter key handler

4. **Update component tests** (`pinyin-input.test.tsx`):
   - Add space conversion tests
   - Add no-space format tests
   - Add missing tone validation tests

5. **Update hook if needed** (`use-pinyin-input.ts`):
   - Verify `handleToneSelect()` works with both formats

6. **Integration testing**:
   - Test full review flow with both formats
   - Verify database compatibility
   - Check validation feedback displays correctly
   - Confirm missing tones are rejected

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
5. **Both spacing formats**: `ni3hao3` and `ni3 hao3` both valid
6. **Tone requirement**: EVERY syllable must have tone - no exceptions

### Critical Implementation Detail: Syllable Parsing

The key challenge is parsing input that may not have spaces. For example:
- `ni3hao3` needs to be parsed as `ni3` + `hao3`
- `zhong1guo2ren2` needs to be parsed as `zhong1` + `guo2` + `ren2`

**Strategy**: Use regex `([a-zü]+)([1-5])` to match all [romanization][tone] pairs. Then verify that these pairs completely consume the input string (no leftover characters = all syllables have tones).

### User Guidance
When validation fails, provide helpful error messages that:
- Identify the exact position with the error
- Clearly state "EVERY syllable must have a tone number"
- Show the expected format with examples
- Suggest valid tone numbers (1-5)

---

## Questions to Consider

1. **Space preservation in output**: Should `ni3 hao3` → `nǐ hǎo` (with space) and `ni3hao3` → `nǐhǎo` (no space)?
   - **Answer**: YES - preserve the user's spacing choice

2. **Neutral tone (5)**: Should tone 5 be required explicitly?
   - **Answer**: YES - user must type `de5` for 的, never just `de`

3. **Case handling**: Should `NI3` be accepted?
   - **Answer**: YES - auto-convert to lowercase

4. **Comparison**: How to compare `nǐhǎo` vs `nǐ hǎo`?
   - **Answer**: `comparePinyinFlexible()` should strip spaces before comparing

5. **Database storage**: Should we store both formats?
   - **Answer**: Keep current format (with spaces), but accept both on input

---

## Additional Context

### Real-world Pinyin Input Methods
This format matches how professional pinyin input methods work:
- **Sogou Pinyin**: Users can type continuously without spaces
- **Google Pinyin**: Supports both continuous and spaced input
- **Numbered pinyin**: Standard in linguistics - tones always required

### Educational Value
Requiring explicit tone numbers:
- ✅ Forces learners to think about EVERY tone
- ✅ Prevents "lazy" input without tone consideration
- ✅ Matches academic/professional standards
- ✅ Makes errors immediately visible
- ✅ No ambiguity - answer is right or wrong

Allowing flexible spacing:
- ✅ Faster typing (no need to press space)
- ✅ More natural for some users
- ✅ Matches how native speakers think (continuous speech)
- ✅ But still supports spaced input for those who prefer it

### Performance
No performance concerns - regex matching is O(n) where n = input length, typically 5-20 characters.
