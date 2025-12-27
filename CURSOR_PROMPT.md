# Cursor Prompt: Lessons Page UI/UX Improvements

## Context
I'm working on a Mandarin SRS (Spaced Repetition System) learning application built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui. I need to improve the lessons page UI/UX to make it clean, professional, and user-friendly following Apple's minimalist design principles.

**Current Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix UI + Tailwind)
- Framer Motion (for animations)
- Lucide React (icons)
- class-variance-authority (component variants)

**Current Files:**
- `/app/(app)/lessons/page.tsx` - Main lessons page (Server Component)
- `/components/features/lesson-card.tsx` - Lesson card component (Client Component)
- `/app/globals.css` - Global styles
- `/tailwind.config.ts` - Tailwind configuration

---

## Objective
Transform the lessons page into a clean, professional, Apple-inspired interface with:
1. Minimalist card design with subtle shadows
2. Clean typography hierarchy
3. Generous white space
4. Simple progress indicators
5. Professional color palette
6. Subtle, purposeful animations
7. Enhanced accessibility

---

## Design Requirements

### Visual Style
- **Design Philosophy**: Apple-inspired minimalism - every element serves a purpose
- **No**: Flashy gradients, rainbow colors, gamification badges, confetti effects
- **Yes**: Clean shadows, subtle hover states, simple progress bars, professional typography

### Color Palette
```css
Primary: #007AFF (subtle blue)
Success: #34C759 (Apple green)
Background: #FFFFFF (light) / #1C1C1E (dark)
Surface: #F5F5F7 (light) / #2C2C2E (dark)
Border: #E5E5E7 (light) / #3A3A3C (dark)
Text Primary: #000000 (light) / #FFFFFF (dark)
Text Secondary: #6E6E73 (both modes)
```

### Typography
- **Titles**: 18px, font-weight 600
- **Descriptions**: 14px, regular, line-height 1.6
- **Stats**: 13px, medium for numbers
- **Level badges**: 12px, neutral gray

### Spacing
- Card padding: 24px (mobile) → 32px (desktop)
- Grid gap: 20px (mobile) → 24px (tablet) → 32px (desktop)
- Section spacing: 48px between major sections

---

## Implementation Tasks

### PHASE 1: Refine Lesson Card Component

**File**: `components/features/lesson-card.tsx`

**Current Issues:**
- Need cleaner shadow implementation
- Typography hierarchy needs improvement
- Progress visualization could be simpler
- Hover states need refinement

**Required Changes:**

1. **Update Card Styling with CVA:**
```typescript
const cardVariants = cva(
  "block rounded-xl bg-card border transition-all duration-200",
  {
    variants: {
      status: {
        locked: "opacity-50 cursor-not-allowed border-border",
        unlocked: "hover:shadow-soft-lg hover:-translate-y-0.5 border-border",
        completed: "border-l-2 border-l-success border-border",
      },
    },
  }
);
```

2. **Clean Component Structure:**
- Remove any gradient backgrounds
- Use simple checkmark icon for completed state (top-right, 16px)
- Use lock icon for locked state (top-right, 16px)
- Level badge: small, understated, neutral gray text
- Stats format: "X characters · Y vocabulary" with bullet separator

3. **Simple Progress Bar:**
- Only show for in-progress lessons (0 < progress < 100%)
- Height: 2px (0.5 in Tailwind)
- Single color: primary brand color
- Bottom of card content
- Smooth animation on load

4. **Typography Hierarchy:**
```typescript
// Level badge
className="text-xs font-medium text-muted-foreground"

// Title
className="text-lg font-semibold mb-2 line-clamp-2"

// Description
className="text-sm text-muted-foreground mb-4 line-clamp-2"

// Stats
className="text-xs text-muted-foreground"
```

5. **Component Props & Logic:**
```typescript
interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    level: number;
    characterCount: number;
    vocabularyCount: number;
    totalItems: number;
  };
  progress?: {
    completed: boolean;
    itemsLearned: number;
  };
  isLocked: boolean;
}
```

**Expected Output:**
A clean, minimal card component with:
- Subtle shadow on hover (`0 4px 16px rgba(0, 0, 0, 0.12)`)
- Simple checkmark or lock icon in top-right
- Clean typography with proper hierarchy
- Thin progress bar for in-progress lessons
- No gradients, no complex animations

---

### PHASE 2: Update Tailwind Configuration

**File**: `tailwind.config.ts`

**Add Custom Shadows:**
```javascript
extend: {
  boxShadow: {
    'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
    'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
  },
}
```

**Ensure Proper Dark Mode Support:**
- Verify all color tokens work in dark mode
- Test shadow visibility in both modes

---

### PHASE 3: Improve Page Layout & Spacing

**File**: `app/(app)/lessons/page.tsx`

**Current Issues:**
- Grid spacing might need adjustment
- Page padding needs refinement
- Info alert could be cleaner

**Required Changes:**

1. **Update Grid Layout:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
  {lessons.map((lesson) => (
    <LessonCard key={lesson.id} {...lesson} />
  ))}
</div>
```

2. **Page Header Refinement:**
```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold mb-2">Lessons</h1>
  <p className="text-muted-foreground">
    Learn new characters and vocabulary through structured lessons
  </p>
</div>
```

3. **Clean Info Alert:**
- Keep the existing "How Lessons Work" alert
- Ensure it uses minimal styling
- Remove any unnecessary colors or borders

4. **Container Padding:**
```tsx
<div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
  {/* Content */}
</div>
```

---

### PHASE 4: Add Section Grouping (Optional Enhancement)

**Create New File**: `components/features/lessons/lesson-section.tsx`

**Purpose**: Group lessons by HSK level with clean headers

```tsx
interface LessonSectionProps {
  level: number;
  completedCount: number;
  totalCount: number;
  children: React.ReactNode;
}

export function LessonSection({
  level,
  completedCount,
  totalCount,
  children
}: LessonSectionProps) {
  return (
    <section className="mb-12">
      {/* Simple header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">
          HSK {level}
        </h2>
        <p className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} completed
        </p>
      </div>

      {/* Grid of lessons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
        {children}
      </div>
    </section>
  );
}
```

**Update**: `app/(app)/lessons/page.tsx` to use sections if desired

---

### PHASE 5: Accessibility Enhancements

**Files**: All lesson-related components

**Required Changes:**

1. **Proper ARIA Labels:**
```tsx
<article
  role="article"
  aria-label={`${lesson.title}. Level ${lesson.level}. ${
    progress?.completed ? 'Completed' : isLocked ? 'Locked' : 'Available'
  }. ${lesson.characterCount} characters, ${lesson.vocabularyCount} vocabulary.`}
>
```

2. **Focus Indicators:**
Ensure all interactive elements have visible focus states:
```css
focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
```

3. **Screen Reader Support:**
- Add `aria-label` to icons
- Use `role="status"` for progress indicators
- Ensure logical tab order

4. **Reduced Motion:**
Add to global CSS:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### PHASE 6: Performance Optimizations

**File**: `components/features/lesson-card.tsx`

**Required Changes:**

1. **Memoization:**
```tsx
import { memo } from 'react';

export const LessonCard = memo(function LessonCard({
  lesson,
  progress,
  isLocked
}: LessonCardProps) {
  // Component code
});
```

2. **CSS Content Visibility:**
Add to card wrapper:
```tsx
style={{ contentVisibility: 'auto' }}
```

3. **Optimize Animations:**
- Use only `transform` and `opacity` for GPU acceleration
- Keep transitions under 200ms
- Use `will-change` sparingly

---

## Step-by-Step Implementation Guide

### Step 1: Update Lesson Card (Priority: High)
1. Open `components/features/lesson-card.tsx`
2. Replace the component with clean, minimal implementation
3. Remove any gradient backgrounds, complex animations
4. Implement simple progress bar (2px height)
5. Add clean checkmark/lock icons
6. Update typography with proper hierarchy
7. Test in light and dark modes

### Step 2: Update Tailwind Config (Priority: High)
1. Open `tailwind.config.ts`
2. Add custom shadow utilities (`soft`, `soft-lg`)
3. Verify color palette is minimal and professional
4. Test changes across the application

### Step 3: Refine Page Layout (Priority: High)
1. Open `app/(app)/lessons/page.tsx`
2. Update grid spacing for better breathing room
3. Refine page header typography
4. Ensure proper container padding
5. Test responsive behavior

### Step 4: Add Accessibility (Priority: High)
1. Add proper ARIA labels to all interactive elements
2. Implement focus indicators
3. Add reduced motion support in global CSS
4. Test with keyboard navigation
5. Test with screen reader (if available)

### Step 5: Add Section Grouping (Priority: Medium)
1. Create `components/features/lessons/lesson-section.tsx`
2. Implement clean section headers
3. Update lessons page to group by level
4. Test layout and spacing

### Step 6: Performance Audit (Priority: Medium)
1. Add React.memo to lesson card
2. Implement content-visibility CSS
3. Run Lighthouse audit
4. Optimize based on results

---

## Testing Checklist

### Visual Testing
- [ ] Cards look clean and minimal in light mode
- [ ] Cards look clean and minimal in dark mode
- [ ] Shadows are subtle and professional
- [ ] Typography hierarchy is clear
- [ ] Spacing feels generous and comfortable
- [ ] Progress bars are simple and clean
- [ ] Hover states are subtle (translateY(-2px))
- [ ] Locked state is clearly distinguishable
- [ ] Completed state has clean checkmark

### Responsive Testing
- [ ] Mobile (375px): Single column, cards look good
- [ ] Tablet (768px): Two columns, proper spacing
- [ ] Desktop (1024px+): Three columns, generous gaps
- [ ] All breakpoints have proper padding

### Accessibility Testing
- [ ] Tab navigation works logically
- [ ] Focus indicators are visible
- [ ] Screen reader announces card states properly
- [ ] Reduced motion is respected
- [ ] Color contrast meets WCAG AA (preferably AAA)
- [ ] All interactive elements are keyboard accessible

### Performance Testing
- [ ] Lighthouse Performance: 95+
- [ ] Lighthouse Accessibility: 100
- [ ] First Contentful Paint: <1.2s
- [ ] Time to Interactive: <2.5s
- [ ] Animations run at 60fps

---

## Expected Result

A clean, professional lessons page with:
- ✅ Minimal, Apple-inspired card design
- ✅ Subtle shadows and smooth hover effects
- ✅ Clean typography hierarchy
- ✅ Simple 2px progress bars
- ✅ Generous white space
- ✅ Professional color palette
- ✅ Excellent accessibility
- ✅ High performance scores

The interface should feel timeless, professional, and trustworthy—like an Apple product.

---

## Code Examples Reference

### Complete Lesson Card Example
```tsx
'use client';

import { cva } from 'class-variance-authority';
import { Check, Lock } from 'lucide-react';
import Link from 'next/link';

const cardVariants = cva(
  "block rounded-xl bg-card border p-6 md:p-8 transition-all duration-200",
  {
    variants: {
      status: {
        locked: "opacity-50 cursor-not-allowed border-border",
        unlocked: "hover:shadow-soft-lg hover:-translate-y-0.5 border-border",
        completed: "border-l-2 border-l-success border-border",
      },
    },
  }
);

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    level: number;
    characterCount: number;
    vocabularyCount: number;
    totalItems: number;
  };
  progress?: {
    completed: boolean;
    itemsLearned: number;
  };
  isLocked: boolean;
}

export function LessonCard({ lesson, progress, isLocked }: LessonCardProps) {
  const Wrapper = isLocked ? 'div' : Link;
  const wrapperProps = isLocked ? {} : { href: `/lessons/${lesson.id}` };

  const status = isLocked ? 'locked' : progress?.completed ? 'completed' : 'unlocked';
  const completionPercent = progress?.itemsLearned
    ? Math.round((progress.itemsLearned / lesson.totalItems) * 100)
    : 0;

  return (
    <Wrapper
      {...wrapperProps}
      className={cardVariants({ status })}
      aria-label={`${lesson.title}. Level ${lesson.level}. ${
        progress?.completed ? 'Completed' : isLocked ? 'Locked' : 'Available'
      }. ${lesson.characterCount} characters, ${lesson.vocabularyCount} vocabulary.`}
      style={{ contentVisibility: 'auto' }}
    >
      {/* Header with level and status icon */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium text-muted-foreground">
          Level {lesson.level}
        </div>
        {progress?.completed && (
          <Check className="w-4 h-4 text-success" aria-label="Completed" />
        )}
        {isLocked && (
          <Lock className="w-4 h-4 text-muted-foreground" aria-label="Locked" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
        {lesson.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {lesson.description}
      </p>

      {/* Stats */}
      <div className="text-xs text-muted-foreground mb-4">
        {lesson.characterCount} characters · {lesson.vocabularyCount} vocabulary
      </div>

      {/* Simple Progress Bar - Only for in-progress lessons */}
      {!isLocked && completionPercent > 0 && completionPercent < 100 && (
        <div
          className="h-0.5 bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${completionPercent}% complete`}
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      )}
    </Wrapper>
  );
}
```

---

## Additional Notes

### Don't Do:
- ❌ Add gradient backgrounds or borders
- ❌ Use rainbow colors for level coding
- ❌ Add confetti or celebration animations
- ❌ Create circular progress rings
- ❌ Add gamification badges
- ❌ Use ripple effects or flashy animations
- ❌ Over-complicate the component structure

### Do:
- ✅ Keep shadows subtle and clean
- ✅ Use minimal color palette
- ✅ Add generous white space
- ✅ Implement smooth, purposeful animations (200ms max)
- ✅ Focus on typography for hierarchy
- ✅ Make it accessible from the start
- ✅ Test in both light and dark modes
- ✅ Keep components simple and maintainable

### Design References:
- Apple.com/education - Clean card design
- Linear.app - Professional, minimal interface
- Things 3 - Minimal task design
- iOS Settings app - Simple progress indicators

---

## Success Criteria

The implementation is successful when:
1. ✅ Lighthouse scores: 95+ performance, 100 accessibility
2. ✅ Visual design looks clean and professional
3. ✅ User feedback includes: "clean", "professional", "clear"
4. ✅ No accessibility violations
5. ✅ Animations run smoothly at 60fps
6. ✅ Design works perfectly in light and dark modes
7. ✅ Responsive across all device sizes
8. ✅ Code is maintainable and well-structured
