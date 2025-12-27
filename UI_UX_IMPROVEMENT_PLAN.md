# Lessons Page UI/UX Improvement Plan

## Executive Summary
This plan outlines comprehensive UI/UX improvements for the Mandarin SRS lessons page to create a more modern, user-friendly, and engaging learning experience.

---

## 1. Visual Design Improvements

### 1.1 Card Design Enhancement
**Current State:** Flat cards with minimal visual hierarchy
**Proposed Changes:**

#### Enhanced Card Styling
- **Depth & Elevation**
  - Add subtle shadows with multiple layers for depth
  - Implement hover state with elevated shadow (lift effect)
  - Use border gradient effects for completed lessons

- **Card States Redesign**
  - **Unlocked/Active**:
    - Vibrant gradient borders (subtle, brand-colored)
    - Smooth scale transform on hover (1.02x)
    - Background blur effect (glassmorphism)
    - Animated gradient background

  - **Completed**:
    - Success gradient (green-400 to emerald-500)
    - Animated confetti or sparkle effect on first completion
    - Subtle glow effect around border
    - More prominent completion badge with animation

  - **Locked**:
    - Frosted glass effect with blur
    - Reduced opacity with clearer visual distinction
    - Animated lock icon (subtle pulse)
    - "Coming soon" or progress bar showing unlock requirements

#### Typography & Hierarchy
- **Lesson Title**: Increase font weight (semibold → bold)
- **Level Badge**: Add gradient background, increase size
- **Description**: Improve line height and contrast
- **Stats**: Use icons with color coding (characters = blue, vocabulary = purple)

### 1.2 Color System Enhancement
**Current State:** Minimal color usage
**Proposed Changes:**

```css
/* Level-based Color Coding */
Level 1: gradient(blue-500 → cyan-400)
Level 2: gradient(purple-500 → violet-400)
Level 3: gradient(amber-500 → orange-400)
Level 4: gradient(rose-500 → pink-400)
Level 5: gradient(emerald-500 → teal-400)
Level 6: gradient(indigo-500 → blue-400)
```

- Apply subtle gradient overlays to card backgrounds based on level
- Use color-coded level badges
- Maintain WCAG AA contrast ratios for accessibility

### 1.3 Layout Improvements
**Current State:** Basic grid layout
**Proposed Changes:**

- **Responsive Grid Enhancement**
  ```
  Mobile: 1 column (full width cards)
  Tablet: 2 columns with comfortable spacing
  Desktop: 3 columns (current)
  Large Desktop (>1536px): 4 columns for better space utilization
  ```

- **Spacing System**
  - Increase gap between cards (4 → 6)
  - Add section spacing for visual breathing room
  - Implement consistent padding scale (4, 6, 8, 12)

---

## 2. User Experience Enhancements

### 2.1 Progress Visualization
**Current State:** Simple text-based statistics
**Proposed Changes:**

#### Card-Level Progress
- **Circular Progress Ring**: Show lesson completion percentage
  - Position: Top-right corner (replacing simple completed badge)
  - Animation: Animated stroke on load and update
  - States: 0% (not started), 1-99% (in progress), 100% (completed)

- **Mini Progress Bar**
  - Bottom of card showing character/vocabulary mastery
  - Dual-bar system (characters vs vocabulary)
  - Color-coded by SRS level (new, learning, review, guru)

- **Visual Stats**
  - Replace text counts with icon + number badges
  - Add mini pie chart or icon fill for quick visual scanning
  - Tooltip on hover showing detailed breakdown

#### Page-Level Progress
- **Hero Section Enhancement**
  - Add overall completion percentage with large circular progress
  - Show total characters/vocabulary learned
  - Display streak counter or study consistency indicator
  - Quick stats: lessons completed, items mastered, time invested

- **Progress Timeline**
  - Visual path showing lesson progression
  - Connected nodes for sequential lessons
  - Checkpoints for level completion
  - "You are here" indicator

### 2.2 Interactive Elements & Micro-interactions

#### Hover States
```javascript
// Enhanced hover effects
- Card lift: translateY(-4px) + shadow elevation
- Icon animations: subtle bounce or rotate
- Stats highlight: color shift and scale
- Background: gradient shift or animated mesh
- Border: animated gradient rotation
```

#### Click/Tap Feedback
- Ripple effect on card press (Material Design)
- Haptic feedback on mobile (if supported)
- Smooth transition to lesson detail page
- Loading state with skeleton transition

#### Loading States
- Skeleton screens with gradient animation
- Progressive image loading for lesson thumbnails
- Stagger animation for card entry (cascade effect)
- Smooth fade-in when data loads

### 2.3 Information Architecture

#### Lesson Grouping
- **Group by Level**: Add level section headers
  ```
  📚 HSK 1 - Beginner
  ├── Greetings
  ├── Numbers 1-5
  └── ...

  📚 HSK 2 - Elementary
  ├── ...
  ```

- **Collapsible Sections**: Allow hiding completed levels
- **Filter & Sort Controls**
  - Filter: All / Not Started / In Progress / Completed
  - Sort: Default / Name / Progress / Difficulty
  - Search: Find lessons by keyword

#### Smart Recommendations
- **"Recommended for You"** section at top
  - Show next unlocked lesson prominently
  - Suggest review if many items due
  - Highlight lessons matching user's learning pace

- **Learning Path Visualization**
  - Show prerequisite connections
  - Display recommended learning order
  - Indicate parallel vs sequential lessons

### 2.4 Gamification Elements

#### Achievement System
- **Badges on Cards**
  - "Quick Learner" - completed in one session
  - "Perfect Score" - 100% accuracy in practice
  - "Streak Master" - studied X days in a row

- **Unlock Animations**
  - Animated "unlock" sequence when prerequisites complete
  - Celebration modal or confetti on milestone achievements
  - Sound effects (toggleable in settings)

#### Progress Motivation
- **Completion Percentage**: Large, prominent display
- **Next Milestone**: "2 more lessons to complete HSK 1!"
- **Estimated Time**: "~30 minutes to complete this lesson"
- **Difficulty Indicator**: Visual stars or level indicator

---

## 3. Accessibility Improvements

### 3.1 Keyboard Navigation
- **Tab Order**: Logical flow through cards
- **Focus Indicators**: Enhanced focus rings with color and animation
- **Keyboard Shortcuts**
  - Arrow keys: Navigate between cards
  - Enter: Open lesson
  - Ctrl+F: Quick search
  - Escape: Clear filters

### 3.2 Screen Reader Support
```html
<!-- Enhanced ARIA labels -->
<article
  role="article"
  aria-label="Lesson: HSK 1 - Greetings. Level 1. Completed. 3 characters, 5 vocabulary, 8 total items."
  aria-describedby="lesson-description-1">

  <!-- Progress announced -->
  <div
    role="status"
    aria-live="polite"
    aria-label="Lesson progress: 100% completed">
  </div>
</article>
```

### 3.3 Visual Accessibility
- **High Contrast Mode**: Support Windows high contrast
- **Reduced Motion**: Respect `prefers-reduced-motion`
- **Font Scaling**: Test at 200% zoom level
- **Color Blindness**: Don't rely solely on color for status
  - Use icons + color
  - Use patterns in gradients
  - Test with color blindness simulators

---

## 4. Mobile-First Enhancements

### 4.1 Mobile Optimizations
**Touch Targets**
- Minimum 44x44px touch targets
- Increase card padding on mobile
- Larger tap areas for interactive elements

**Responsive Typography**
- Fluid typography scale using clamp()
- Adjust line heights for mobile readability
- Reduce text in card stats on small screens

**Mobile Gestures**
- Swipe to navigate between cards (carousel mode)
- Pull to refresh lesson data
- Long-press for quick actions menu

### 4.2 Progressive Enhancement
- **Core Experience**: Works without JavaScript
- **Enhanced Experience**: Animations and interactivity
- **Offline Support**: Cache lesson data with service worker
- **App-like Feel**: Install prompt for PWA

---

## 5. Performance Optimizations

### 5.1 Rendering Performance
**Current**: All cards render simultaneously
**Proposed**:
- **Virtual Scrolling**: For users with many lessons (50+)
- **Intersection Observer**: Lazy load card content
- **Stagger Animation**: Reduce jank on initial render
- **Image Optimization**: Use Next.js Image component for thumbnails

### 5.2 Animation Performance
- Use `transform` and `opacity` only (GPU-accelerated)
- Add `will-change` hints sparingly
- Use CSS animations over JavaScript where possible
- Implement `content-visibility: auto` for offscreen cards

---

## 6. Modern Design Patterns

### 6.1 Glassmorphism
Apply to cards and modals:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}
```

### 6.2 Neumorphism (Subtle)
For completed lesson badges:
```css
.neuro-badge {
  background: linear-gradient(145deg, #e6f7e6, #c3e6c3);
  box-shadow: 5px 5px 10px #a8d5a8, -5px -5px 10px #ffffff;
}
```

### 6.3 Animated Gradients
```css
.gradient-border {
  background: linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82);
  background-size: 300% 300%;
  animation: gradient-shift 15s ease infinite;
}
```

### 6.4 Mesh Gradients
For hero section background:
- Animated mesh gradient with multiple color stops
- Subtle movement on scroll (parallax effect)
- Blur for softer appearance

---

## 7. Component Architecture Improvements

### 7.1 Enhanced Component Structure
```
/components/features/lessons/
├── lesson-card/
│   ├── index.tsx                    # Main card component
│   ├── lesson-card-header.tsx       # Title, level, badges
│   ├── lesson-card-progress.tsx     # Progress visualization
│   ├── lesson-card-stats.tsx        # Character/vocab counts
│   ├── lesson-card-actions.tsx      # CTA buttons
│   └── lesson-card.styles.ts        # Tailwind variants
│
├── lesson-grid/
│   ├── index.tsx                    # Grid container
│   ├── lesson-grid-header.tsx       # Filters, search, sort
│   ├── lesson-grid-empty.tsx        # Empty state
│   └── lesson-grid-skeleton.tsx     # Loading skeleton
│
├── lesson-filters/
│   ├── index.tsx                    # Filter controls
│   ├── lesson-search.tsx            # Search input
│   └── lesson-sort.tsx              # Sort dropdown
│
└── lesson-progress-hero/
    ├── index.tsx                    # Hero section
    ├── progress-ring.tsx            # Circular progress
    └── stats-overview.tsx           # Overall stats
```

### 7.2 Reusable Design Tokens
```typescript
// lesson-card.styles.ts
export const lessonCardVariants = cva(
  "lesson-card-base",
  {
    variants: {
      status: {
        locked: "opacity-60 cursor-not-allowed blur-[0.5px]",
        unlocked: "hover:scale-[1.02] hover:shadow-xl",
        completed: "border-success shadow-success-lg",
      },
      level: {
        1: "border-l-blue-500",
        2: "border-l-purple-500",
        3: "border-l-amber-500",
        // ...
      },
    },
  }
);
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)
**Priority: High**
- [ ] Enhance card visual design (shadows, borders, spacing)
- [ ] Implement level-based color coding
- [ ] Improve typography hierarchy
- [ ] Add hover effects and micro-interactions
- [ ] Enhance locked/unlocked state visuals

**Effort**: 2-3 days
**Impact**: High - Immediately modernizes appearance

### Phase 2: Progress & Gamification (Week 2)
**Priority: High**
- [ ] Add circular progress rings to cards
- [ ] Implement mini progress bars
- [ ] Create hero section with overall progress
- [ ] Add achievement badges
- [ ] Implement unlock animations

**Effort**: 3-4 days
**Impact**: High - Increases engagement

### Phase 3: Interactivity & UX (Week 3)
**Priority: Medium**
- [ ] Implement lesson grouping by level
- [ ] Add filter and sort controls
- [ ] Create search functionality
- [ ] Add smart recommendations section
- [ ] Implement learning path visualization

**Effort**: 3-4 days
**Impact**: Medium - Improves navigation

### Phase 4: Polish & Accessibility (Week 4)
**Priority: Medium**
- [ ] Enhance keyboard navigation
- [ ] Improve screen reader support
- [ ] Add reduced motion support
- [ ] Implement high contrast mode
- [ ] Mobile gesture enhancements

**Effort**: 2-3 days
**Impact**: Medium - Critical for inclusive design

### Phase 5: Performance & Advanced Features (Week 5)
**Priority: Low**
- [ ] Implement virtual scrolling
- [ ] Add intersection observer lazy loading
- [ ] Optimize animations for performance
- [ ] Add offline support
- [ ] PWA enhancements

**Effort**: 3-4 days
**Impact**: Low - Nice to have, performance gains

---

## 9. Design System Updates

### 9.1 New Components Needed
1. **ProgressRing**: Circular progress indicator
2. **GradientBorder**: Animated gradient wrapper
3. **LevelBadge**: Enhanced badge with colors
4. **StatsIcon**: Icon + number component
5. **UnlockAnimation**: Modal/overlay for unlocking
6. **FilterBar**: Filtering and sorting controls
7. **SearchBox**: Debounced search input
8. **EmptyState**: Beautiful empty/no-results state

### 9.2 Tailwind Configuration Updates
```javascript
// Add to tailwind.config.ts
theme: {
  extend: {
    animation: {
      'gradient-shift': 'gradient-shift 15s ease infinite',
      'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'unlock': 'unlock 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    boxShadow: {
      'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      'success-lg': '0 10px 40px -10px rgba(34, 197, 94, 0.4)',
      'lift': '0 20px 50px -10px rgba(0, 0, 0, 0.15)',
    },
    backdropBlur: {
      'xs': '2px',
    },
  },
},
```

---

## 10. Testing Strategy

### 10.1 Visual Regression Testing
- Screenshot comparison with Percy or Chromatic
- Test across breakpoints: 375px, 768px, 1024px, 1440px
- Test light and dark modes
- Test locked/unlocked/completed states

### 10.2 Accessibility Testing
- Automated: axe-core, Lighthouse
- Manual: Keyboard navigation testing
- Screen reader: NVDA, JAWS, VoiceOver
- Color contrast: Check all text against backgrounds

### 10.3 Performance Testing
- Lighthouse performance scores (target: >90)
- First Contentful Paint (target: <1.5s)
- Time to Interactive (target: <3.5s)
- Animation frame rates (target: 60fps)

### 10.4 User Testing
- A/B test new design vs current (if possible)
- Conduct usability testing with 5-10 users
- Measure: time to find next lesson, comprehension of locked state
- Gather qualitative feedback on visual appeal

---

## 11. Mockup Ideas & References

### 11.1 Visual Inspiration
**Color & Depth**:
- Duolingo lesson cards (gamification, progress)
- Notion databases (clean cards, hover states)
- Linear issues (subtle gradients, modern design)
- Stripe Dashboard (glassmorphism, spacing)

**Progress Visualization**:
- Apple Fitness rings (circular progress)
- GitHub contribution graph (achievement tracking)
- Habitica task cards (gamification)

**Layout & Hierarchy**:
- Pinterest masonry (if varying card heights later)
- Netflix tiles (large, engaging previews)
- Spotify playlists (clear CTAs, hover states)

### 11.2 Animation References
- Framer Motion examples: https://www.framer.com/motion/
- Aceternity UI: Modern card hover effects
- Magic UI: Gradient animations and glassmorphism
- Tailwind Labs: Professional spacing and typography

---

## 12. Success Metrics

### 12.1 Quantitative Metrics
- **Engagement**: Click-through rate on lesson cards (+20% target)
- **Completion**: Lesson start → completion rate (+15% target)
- **Time on Page**: Average session duration (+10% target)
- **Performance**: Lighthouse score >90 (current baseline)
- **Accessibility**: Zero critical WCAG violations

### 12.2 Qualitative Metrics
- User satisfaction surveys (5-point scale, target: 4.5+)
- Net Promoter Score (NPS) improvement
- User feedback: "more modern", "easier to use", "motivating"
- Reduced support requests about navigation

---

## 13. Technical Considerations

### 13.1 Browser Support
- Modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Graceful degradation for older browsers
- Progressive enhancement approach

### 13.2 Dependencies
**New Libraries** (optional):
- `framer-motion`: Already installed ✓
- `react-intersection-observer`: For lazy loading
- `react-confetti`: For celebration effects
- `class-variance-authority`: Already installed ✓

**Tailwind Plugins**:
- `@tailwindcss/container-queries`: For responsive card internals
- `tailwindcss-animate`: Already installed ✓

### 13.3 Breaking Changes
**None Expected** - All changes are additive enhancements to existing components

---

## 14. Rollout Plan

### 14.1 Feature Flags (Optional)
```typescript
// Use feature flags for gradual rollout
const features = {
  newCardDesign: true,
  progressRings: true,
  levelGrouping: true,
  animations: true,
};
```

### 14.2 Beta Testing
- Release to internal users first (if applicable)
- Gather feedback for 1 week
- Iterate on issues
- Full public release

### 14.3 Documentation
- Update component Storybook (if used)
- Document new design tokens
- Create migration guide for future developers
- Add inline code comments for complex animations

---

## 15. Maintenance & Future Enhancements

### 15.1 Analytics Integration
- Track card interactions (clicks, hovers)
- Monitor most accessed lessons
- Identify drop-off points
- A/B test design variations

### 15.2 Future Ideas (Post-Launch)
- **Lesson Thumbnails**: Custom illustrations for each lesson
- **Animated Icons**: Lottie animations for lesson themes
- **3D Effects**: Subtle 3D tilt on hover (perspective transforms)
- **Social Features**: Share progress, compete with friends
- **Personalization**: Custom themes, card layouts
- **Voice Interface**: "Show me my next lesson"
- **AR Preview**: View characters in AR (mobile)

---

## Appendix: Code Examples

### Example 1: Enhanced Lesson Card Component
```tsx
// components/features/lessons/lesson-card/index.tsx
import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { BookOpen, Lock, Check, TrendingUp } from 'lucide-react';
import { ProgressRing } from '@/components/ui/progress-ring';

const cardVariants = cva(
  "relative rounded-xl p-6 transition-all duration-300 border-2",
  {
    variants: {
      status: {
        locked: "bg-muted/50 opacity-60 cursor-not-allowed backdrop-blur-sm",
        unlocked: "bg-card hover:shadow-lift cursor-pointer",
        completed: "bg-gradient-to-br from-success/5 to-success/10 border-success/30 shadow-success-lg",
      },
      level: {
        1: "border-l-4 border-l-blue-500",
        2: "border-l-4 border-l-purple-500",
        3: "border-l-4 border-l-amber-500",
      },
    },
  }
);

export function LessonCard({ lesson, progress, isLocked }) {
  const completionPercentage = progress?.completed
    ? 100
    : (progress?.itemsLearned / lesson.totalItems) * 100 || 0;

  return (
    <motion.article
      whileHover={!isLocked ? { scale: 1.02, y: -4 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cardVariants({
        status: isLocked ? 'locked' : progress?.completed ? 'completed' : 'unlocked',
        level: lesson.level
      })}
    >
      {/* Progress Ring - Top Right */}
      {!isLocked && (
        <div className="absolute -top-2 -right-2">
          <ProgressRing
            percentage={completionPercentage}
            size={60}
            strokeWidth={4}
            color={progress?.completed ? "success" : "primary"}
          >
            {progress?.completed ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <span className="text-xs font-bold">
                {Math.round(completionPercentage)}%
              </span>
            )}
          </ProgressRing>
        </div>
      )}

      {/* Lock Icon - Locked State */}
      {isLocked && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-4 right-4"
        >
          <Lock className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      )}

      {/* Level Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 mb-3">
        <BookOpen className="w-3 h-3" />
        <span className="text-xs font-semibold">Level {lesson.level}</span>
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-bold mb-2 line-clamp-2">
        {lesson.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {lesson.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="font-medium">{lesson.characterCount}</span>
          <span className="text-muted-foreground">characters</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="font-medium">{lesson.vocabularyCount}</span>
          <span className="text-muted-foreground">vocabulary</span>
        </div>
      </div>

      {/* Mini Progress Bar */}
      {!isLocked && completionPercentage > 0 && completionPercentage < 100 && (
        <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-primary/80"
          />
        </div>
      )}
    </motion.article>
  );
}
```

### Example 2: Progress Ring Component
```tsx
// components/ui/progress-ring.tsx
'use client';

import { motion } from 'framer-motion';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'success' | 'warning';
  children?: React.ReactNode;
}

export function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
  color = 'primary',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colorClasses[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
```

### Example 3: Level Section Header
```tsx
// components/features/lessons/lesson-grid/level-section.tsx
import { motion } from 'framer-motion';
import { ChevronDown, BookOpen } from 'lucide-react';
import { useState } from 'react';

export function LevelSection({ level, lessons, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const completedCount = lessons.filter(l => l.progress?.completed).length;
  const totalCount = lessons.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="mb-8">
      {/* Section Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between mb-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">HSK {level}</h2>
          <span className="text-sm text-muted-foreground">
            {completedCount} / {totalCount} completed
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress Bar */}
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-300 ${
              isCollapsed ? 'rotate-0' : 'rotate-180'
            }`}
          />
        </div>
      </button>

      {/* Lessons Grid */}
      <motion.div
        initial={false}
        animate={{
          height: isCollapsed ? 0 : 'auto',
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );
}
```

---

## Summary

This comprehensive plan transforms the lessons page from a functional but basic interface into a modern, engaging, and user-friendly learning experience. The phased approach allows for iterative improvements while maintaining stability and gathering user feedback along the way.

**Key Improvements**:
1. ✨ Modern visual design with depth, gradients, and animations
2. 📊 Enhanced progress visualization with rings and charts
3. 🎯 Better UX with grouping, filtering, and recommendations
4. ♿ Improved accessibility for all users
5. 📱 Mobile-first responsive design
6. ⚡ Performance optimizations
7. 🎮 Gamification elements for motivation

**Estimated Total Time**: 4-5 weeks for full implementation
**Recommended Start**: Phase 1 (Foundation) for immediate visual impact

This plan maintains the solid technical foundation already in place (Next.js, Tailwind, shadcn/ui, Framer Motion) while elevating the user experience to meet modern design standards and best practices.
