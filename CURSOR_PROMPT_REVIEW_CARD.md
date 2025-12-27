# Cursor Prompt: Review/Practice Card UI/UX Improvements

## Context
I'm working on a Mandarin SRS learning application. The review/practice interface where users type pinyin and select tones has significant UI/UX issues that need to be fixed following Apple's minimalist design principles.

**Current Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Framer Motion (for animations)
- Lucide React (icons)

**Problem Files:**
- `/components/features/tone-selector.tsx` - Tone selection buttons
- `/components/features/pinyin-input.tsx` - Pinyin text input
- `/components/features/review-card.tsx` - Main review card container

---

## Current Problems

### Issue 1: Tone Selector Buttons
**Problems:**
- Text labels (ā, á, ǎ, à, a) appear half inside/outside the buttons
- Too much information crammed in each button (keyboard hint, example, label, name)
- Rainbow colored backgrounds (red, orange, green, blue, gray) - violates minimalist design
- Complex nested structure with absolute positioned elements
- Feels cluttered and unprofessional

**Visual Issues:**
- Keyboard hint badges positioned absolutely overlap borders
- Selected checkmark overlaps button edges
- Multiple text layers create visual chaos
- Colored backgrounds are distracting

### Issue 2: Layout & Spacing
**Problems:**
- Overall layout feels cramped
- Not enough white space between elements
- Input field could be more prominent
- Help text is too verbose

### Issue 3: Design Inconsistency
**Problems:**
- Doesn't follow the Apple-inspired minimal design system
- Uses rainbow colors instead of minimal palette
- Too many visual elements competing for attention

---

## Design Requirements

### Design Philosophy
**Apple-Inspired Minimalism:**
- Clean, professional, timeless
- Minimal color usage (primary blue + neutral grays only)
- Generous white space
- Clear typography hierarchy
- Simple, functional interactions
- No rainbow colors, no visual clutter

### Color Palette (From Design System)
```css
Primary: #3B82F6 (subtle blue)
Success: #22C55E (clean green)
Destructive: #EF4444 (red for errors)
Background: #FFFFFF (light) / #1C1C1E (dark)
Border: #E5E5E7 (light) / #3A3A3C (dark)
Text: #000000 (light) / #FFFFFF (dark)
Text Secondary: #6E6E73
```

---

## Implementation Tasks

### TASK 1: Redesign Tone Selector Component

**File:** `/components/features/tone-selector.tsx`

#### Current Issues to Fix:
1. ❌ Rainbow colored backgrounds (red, orange, green, blue, gray)
2. ❌ Keyboard hint badges overlapping button edges
3. ❌ Too many text labels inside buttons
4. ❌ Complex absolute positioning
5. ❌ Cluttered appearance

#### Required Changes:

**1. Simplify Button Structure**

Remove all colored backgrounds and complex nested elements. Use clean, minimal design:

```tsx
<button
  key={tone}
  onClick={() => onToneSelect(tone)}
  disabled={disabled}
  className={cn(
    // Base styles - clean and minimal
    'flex flex-col items-center justify-center gap-2',
    'min-w-[4.5rem] p-4 rounded-xl',
    'border-2 transition-all duration-200',
    'hover:-translate-y-0.5 active:scale-95',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',

    // Selected state - simple border change
    isSelected && 'border-primary bg-primary/5 shadow-soft-md',

    // Unselected state - neutral
    !isSelected && 'border-border bg-card hover:border-muted-foreground hover:shadow-soft-md',

    // Disabled state
    disabled && 'cursor-not-allowed opacity-50 hover:translate-y-0'
  )}
  aria-label={`Tone ${tone}: ${example}`}
>
  {/* Single tone example character - large and clear */}
  <span className="text-4xl font-bold pinyin-text">
    {example}
  </span>

  {/* Subtle number indicator below */}
  <span className="text-xs font-medium text-muted-foreground">
    {tone}
  </span>
</button>
```

**2. Remove These Elements:**
- ❌ Keyboard hint badges (absolute positioned circles)
- ❌ Checkmark indicators (too cluttered)
- ❌ Tone name labels ("First", "Second", "High Flat", "Rising")
- ❌ All colored backgrounds (bg-red-100, bg-orange-100, etc.)
- ❌ Complex description text

**3. Keep Only Essential Elements:**
- ✅ Large tone example (ā, á, ǎ, à, a) - 4xl size
- ✅ Small number below (1, 2, 3, 4, 5) - xs size
- ✅ Clean border that changes on selection
- ✅ Subtle hover effect (translateY)

**4. Update Layout:**

```tsx
<div className="space-y-4">
  {/* Clean section label */}
  <p className="text-sm font-medium text-center">Select tone:</p>

  {/* Button grid - responsive */}
  <div className="flex justify-center gap-3">
    {TONE_INFO.map(({ tone, example }) => (
      // Simplified button (see above)
    ))}
  </div>

  {/* Simplified help text */}
  <p className="text-xs text-center text-muted-foreground">
    Press 1-5 or click
  </p>
</div>
```

**5. Update TONE_INFO Constant:**

Simplify to only essential data:

```tsx
const TONE_INFO = [
  { tone: 1, example: 'ā' },
  { tone: 2, example: 'á' },
  { tone: 3, example: 'ǎ' },
  { tone: 4, example: 'à' },
  { tone: 5, example: 'a' },
]
```

Remove all the visual noise:
- ❌ bgColor
- ❌ borderColor
- ❌ label ("First", "Second", etc.)
- ❌ name ("High Flat", "Rising", etc.)
- ❌ description

---

### TASK 2: Improve Pinyin Input Component

**File:** `/components/features/pinyin-input.tsx`

#### Current Issues:
- Input could be more prominent
- Help text is verbose and cluttered
- Label could be clearer

#### Required Changes:

**1. Simplify Label:**

```tsx
<Label htmlFor="pinyin-input" className="text-base font-medium">
  Type the pinyin:
</Label>
```

**2. Make Input More Prominent:**

```tsx
<Input
  ref={inputRef}
  id="pinyin-input"
  type="text"
  value={value}
  onChange={handleChange}
  onKeyDown={handleKeyDown}
  onPaste={handlePaste}
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
  maxLength={20}
/>
```

**3. Simplify Help Text:**

Remove the AlertCircle icon and verbose instructions:

```tsx
<p className="text-xs text-center text-muted-foreground">
  Type pinyin with numbers (ni3) or use tone buttons
</p>
```

---

### TASK 3: Improve Review Card Layout

**File:** `/components/features/review-card.tsx`

#### Current Issues:
- Spacing could be more generous
- Card styling could be cleaner

#### Required Changes:

**1. Update Card Container:**

```tsx
<Card
  className={cn(
    'mx-auto w-full max-w-2xl',
    'border-2 shadow-soft-lg rounded-2xl',
    'transition-all duration-300',

    // Clean feedback states - no heavy shadows or colored backgrounds
    isAnswerSubmitted && isCorrect && 'border-success/50 bg-success/5',
    isAnswerSubmitted && isCorrect === false && 'border-destructive/50 bg-destructive/5'
  )}
>
```

**2. Increase Spacing:**

```tsx
<CardContent className="p-8 md:p-12 space-y-8">
  {/* Character Display */}
  <CharacterDisplay
    character={character}
    meaning={meaning}
    itemType={itemType}
    showMeaning={!isAnswerSubmitted}
    feedbackState={!isAnswerSubmitted ? null : isCorrect ? 'correct' : 'incorrect'}
  />

  {/* Pinyin Input Section */}
  {!isAnswerSubmitted ? (
    <div className="space-y-6">
      <PinyinInput
        value={userInput}
        onChange={setUserInput}
        selectedTone={selectedTone}
        onToneChange={setSelectedTone}
        disabled={isAnswerSubmitted}
        onSubmit={handleSubmitAnswer}
        autoFocus
      />

      <ToneSelector
        selectedTone={selectedTone}
        onToneSelect={setSelectedTone}
        disabled={isAnswerSubmitted}
      />

      {/* Check Answer Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleSubmitAnswer}
          disabled={!userInput.trim()}
          className={cn(
            'px-8 py-3 rounded-xl font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 hover:shadow-soft-md',
            'active:scale-95 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-w-[200px]'
          )}
        >
          Check Answer
        </button>
      </div>
    </div>
  ) : (
    /* Feedback section */
    <div className="space-y-6">
      <PinyinFeedback
        isCorrect={isCorrect}
        userAnswer={userInput}
        correctAnswer={correctPinyin}
        show={isAnswerSubmitted}
      />

      {/* Next Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleContinue}
          className={cn(
            'px-12 py-3 rounded-xl font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 hover:shadow-soft-md',
            'active:scale-95 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'min-w-[200px]'
          )}
        >
          Next
        </button>
      </div>
    </div>
  )}

  {/* Skip button (optional) */}
  {onSkip && !isAnswerSubmitted && (
    <div className="text-center pt-4">
      <button
        onClick={onSkip}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip
      </button>
    </div>
  )}
</CardContent>
```

**3. Remove Framer Motion Complexity:**

Simplify or remove excessive animations:

```tsx
// Remove motion.div wrapper or keep it very simple
<div className="w-full">
  <Card className={...}>
    {/* content */}
  </Card>
</div>
```

---

### TASK 4: Update Tailwind Configuration

**File:** `tailwind.config.ts`

Ensure these shadow utilities exist:

```typescript
extend: {
  boxShadow: {
    'soft': '0 1px 3px rgba(0, 0, 0, 0.06)',
    'soft-md': '0 2px 8px rgba(0, 0, 0, 0.08)',
    'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
  },
}
```

---

## Complete Component Examples

### Example 1: Simplified Tone Selector

```tsx
'use client'

import { cn } from '@/lib/utils/cn'

interface ToneSelectorProps {
  selectedTone: number | null
  onToneSelect: (tone: number) => void
  disabled?: boolean
}

const TONES = [
  { tone: 1, example: 'ā' },
  { tone: 2, example: 'á' },
  { tone: 3, example: 'ǎ' },
  { tone: 4, example: 'à' },
  { tone: 5, example: 'a' },
]

export function ToneSelector({
  selectedTone,
  onToneSelect,
  disabled = false,
}: ToneSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Section label */}
      <p className="text-sm font-medium text-center text-foreground">
        Select tone:
      </p>

      {/* Tone buttons - clean and minimal */}
      <div className="flex justify-center gap-3">
        {TONES.map(({ tone, example }) => {
          const isSelected = selectedTone === tone

          return (
            <button
              key={tone}
              onClick={() => onToneSelect(tone)}
              disabled={disabled}
              className={cn(
                // Base styles
                'flex flex-col items-center justify-center gap-2',
                'min-w-[4.5rem] p-4 rounded-xl border-2',
                'transition-all duration-200',
                'hover:-translate-y-0.5 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',

                // Selected state
                isSelected && [
                  'border-primary bg-primary/5 shadow-soft-md',
                ],

                // Unselected state
                !isSelected && [
                  'border-border bg-card',
                  'hover:border-muted-foreground hover:shadow-soft-md',
                ],

                // Disabled
                disabled && 'cursor-not-allowed opacity-50 hover:translate-y-0'
              )}
              aria-label={`Tone ${tone}: ${example}`}
              aria-pressed={isSelected}
            >
              {/* Large tone example */}
              <span className="text-4xl font-bold pinyin-text">
                {example}
              </span>

              {/* Small number */}
              <span className="text-xs font-medium text-muted-foreground">
                {tone}
              </span>
            </button>
          )
        })}
      </div>

      {/* Help text */}
      <p className="text-xs text-center text-muted-foreground">
        Press 1-5 or click a tone
      </p>
    </div>
  )
}
```

### Example 2: Clean Pinyin Input

```tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addToneMark } from '@/lib/utils/pinyin-utils'
import { cn } from '@/lib/utils/cn'

interface PinyinInputProps {
  value: string
  onChange: (value: string) => void
  selectedTone: number | null
  onToneChange: (tone: number | null) => void
  disabled?: boolean
  onSubmit?: () => void
  autoFocus?: boolean
}

export function PinyinInput({
  value,
  onChange,
  selectedTone,
  onToneChange,
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

  // Apply tone mark when tone is selected
  useEffect(() => {
    if (selectedTone !== null && value) {
      try {
        const withTone = addToneMark(value, selectedTone)
        onChange(withTone)
        onToneChange(null)

        setTimeout(() => {
          inputRef.current?.focus()
        }, 0)
      } catch (error) {
        // Invalid syllable - ignore
      }
    }
  }, [selectedTone, value, onChange, onToneChange])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value.toLowerCase()

      // Auto-correct v to ü
      newValue = newValue
        .replace(/nv([1-5]?)/g, 'nü$1')
        .replace(/lv([1-5]?)/g, 'lü$1')

      onChange(newValue)
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return

      // Numbers 1-5 select tones
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        onToneChange(parseInt(e.key, 10))
        return
      }

      // Enter submits
      if (e.key === 'Enter' && onSubmit && value.trim()) {
        e.preventDefault()
        e.stopPropagation()
        onSubmit()
        return
      }

      // Handle tone number input (ni3 + space → nǐ)
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
          e.stopPropagation()
          onSubmit()
        }
        return
      }
    },
    [disabled, value, onChange, onToneChange, onSubmit]
  )

  return (
    <div className="space-y-3">
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
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
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
        maxLength={20}
      />

      <p className="text-xs text-center text-muted-foreground">
        Type pinyin with numbers (ni3) or use tone buttons
      </p>
    </div>
  )
}
```

---

## Before & After Comparison

### Before (Current Issues):
- ❌ Rainbow colored tone buttons (red, orange, green, blue, gray)
- ❌ Text half inside/outside buttons
- ❌ Cluttered with keyboard hints, labels, and descriptions
- ❌ Complex absolute positioning
- ❌ Too much visual noise
- ❌ Feels unprofessional and cluttered

### After (Improved Design):
- ✅ Clean, minimal tone buttons with neutral colors
- ✅ Only essential information (tone example + number)
- ✅ Proper text alignment and spacing
- ✅ Simple, flat structure
- ✅ Generous white space
- ✅ Professional, Apple-inspired aesthetic
- ✅ Clear visual hierarchy
- ✅ Better focus on the learning task

---

## Step-by-Step Implementation

### Step 1: Update Tone Selector (Priority: High)
1. Open `/components/features/tone-selector.tsx`
2. Simplify TONE_INFO to only tone number and example
3. Completely rewrite button structure (remove all complexity)
4. Remove colored backgrounds
5. Remove keyboard hint badges
6. Remove checkmark indicators
7. Remove multiple text labels
8. Keep only: large tone example + small number
9. Update styling to minimal, clean design
10. Test in light and dark modes

### Step 2: Improve Pinyin Input (Priority: High)
1. Open `/components/features/pinyin-input.tsx`
2. Make input larger and more prominent (text-3xl, py-4)
3. Simplify help text
4. Update border and focus styles
5. Test keyboard interactions

### Step 3: Refine Review Card (Priority: Medium)
1. Open `/components/features/review-card.tsx`
2. Increase spacing (p-8 md:p-12, space-y-8)
3. Simplify card border and shadow
4. Clean up feedback states (subtle backgrounds only)
5. Simplify or remove excessive animations
6. Update button styles to match design system

### Step 4: Test Everything (Priority: High)
1. Test tone selection with mouse/touch
2. Test keyboard shortcuts (1-5 keys)
3. Test pinyin input with tone markers
4. Test in light mode
5. Test in dark mode
6. Test on mobile, tablet, desktop
7. Test accessibility (keyboard navigation, screen readers)

---

## Testing Checklist

### Visual Testing
- [ ] Tone buttons look clean and minimal
- [ ] No text overflow or misalignment
- [ ] All text properly contained within buttons
- [ ] Generous spacing between elements
- [ ] No rainbow colors (only primary blue + neutrals)
- [ ] Clean shadows (subtle, not heavy)
- [ ] Works in light mode
- [ ] Works in dark mode

### Interaction Testing
- [ ] Tone buttons respond to clicks
- [ ] Tone buttons respond to 1-5 keyboard keys
- [ ] Selected state is clear
- [ ] Hover states are subtle and smooth
- [ ] Input accepts pinyin correctly
- [ ] Input handles tone numbers (ni3 → nǐ)
- [ ] Submit button works
- [ ] Next button works

### Responsive Testing
- [ ] Mobile (375px): Buttons readable, proper size
- [ ] Tablet (768px): Good spacing
- [ ] Desktop (1024px+): Generous layout
- [ ] Touch targets minimum 44x44px on mobile

### Accessibility Testing
- [ ] Keyboard navigation works (tab order)
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Screen reader friendly
- [ ] Color contrast meets WCAG AA

---

## Expected Result

After implementing these changes, the review/practice interface should be:

1. **Clean & Minimal**
   - No rainbow colors
   - Only essential information visible
   - Generous white space
   - Professional appearance

2. **User-Friendly**
   - Clear what to do (type pinyin, select tone)
   - Large, easy-to-hit tone buttons
   - Prominent input field
   - Simple help text

3. **Accessible**
   - Keyboard shortcuts work
   - Screen reader friendly
   - High contrast
   - Clear focus indicators

4. **Performant**
   - Smooth interactions
   - Fast response
   - No layout jank

5. **Consistent**
   - Matches design system
   - Same visual language as rest of app
   - Predictable behavior

The interface should feel like an Apple product: simple, elegant, and focused on the task at hand (learning Mandarin).

---

## Common Mistakes to Avoid

### ❌ Don't Do:
- Use colored backgrounds for tone buttons
- Add multiple text labels inside buttons
- Use absolute positioning for overlapping elements
- Add unnecessary visual effects
- Cram too much information into small spaces
- Use tiny text that's hard to read
- Forget about dark mode
- Ignore touch target sizes on mobile

### ✅ Do:
- Use minimal color palette (primary + neutrals)
- Keep button content simple (example + number)
- Use clean borders and spacing
- Add generous white space
- Make interactive elements large and clear
- Test in both light and dark modes
- Ensure 44x44px minimum touch targets
- Follow the design system

---

## Success Criteria

Implementation is successful when:

- ✅ No visual misalignment (all text properly contained)
- ✅ Clean, professional appearance
- ✅ Follows Apple-inspired minimalist design
- ✅ No rainbow colors (only primary blue + neutrals)
- ✅ Generous spacing throughout
- ✅ Large, clear interactive elements
- ✅ Excellent accessibility (keyboard, screen reader)
- ✅ Works perfectly on all devices
- ✅ Smooth, purposeful interactions
- ✅ User can focus on learning, not fighting the UI

The interface should disappear into the background, letting users focus on learning Mandarin characters and tones.
