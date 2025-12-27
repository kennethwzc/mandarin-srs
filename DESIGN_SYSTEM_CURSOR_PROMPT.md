# Complete Design System: Apple-Inspired Minimalist UI

## 🎯 Design Philosophy

**Core Principle**: Clean, professional, and timeless design inspired by Apple's approach.

Every design decision should answer: "Does this element serve a clear purpose, or is it decorative noise?"

### What This Means
- **Minimalism**: Remove everything that's not essential
- **Clarity**: Users should never be confused
- **Consistency**: Same patterns everywhere
- **Performance**: Fast, smooth, responsive
- **Accessibility**: Inclusive by default
- **Typography-First**: Use type to create hierarchy, not color
- **White Space**: Generous breathing room is a feature

### What We Avoid
- ❌ Rainbow gradients and flashy colors
- ❌ Gamification badges and achievement systems
- ❌ Confetti, sparkles, and celebration animations
- ❌ Complex visual effects (glassmorphism, neumorphism)
- ❌ Busy patterns and textures
- ❌ Excessive animations
- ❌ Cluttered layouts

### What We Embrace
- ✅ Clean shadows with single layer depth
- ✅ Minimal, purposeful color palette
- ✅ Subtle, smooth transitions (200ms max)
- ✅ Generous white space
- ✅ Clear typography hierarchy
- ✅ Simple, functional components
- ✅ Professional and timeless aesthetic

---

## 🎨 Color System

### Core Palette

```css
/* Light Mode */
--primary: 221 83% 53%;        /* #3B82F6 - Subtle blue */
--primary-foreground: 0 0% 100%; /* White text on primary */

--success: 142 76% 36%;         /* #22C55E - Clean green */
--warning: 38 92% 50%;          /* #F59E0B - Amber */
--destructive: 0 84% 60%;       /* #EF4444 - Red */

--background: 0 0% 100%;        /* #FFFFFF - Pure white */
--surface: 0 0% 96%;            /* #F5F5F7 - Light gray surface */
--border: 0 0% 90%;             /* #E5E5E7 - Subtle border */

--text-primary: 0 0% 0%;        /* #000000 - Black */
--text-secondary: 0 0% 43%;     /* #6E6E73 - Medium gray */
--text-tertiary: 0 0% 62%;      /* #9E9EA3 - Light gray */

--muted: 210 40% 96%;           /* #F3F4F6 - Muted backgrounds */
--muted-foreground: 215 16% 47%; /* #6B7280 - Muted text */

/* Dark Mode */
--background-dark: 0 0% 11%;    /* #1C1C1E - Dark gray */
--surface-dark: 0 0% 17%;       /* #2C2C2E - Dark surface */
--border-dark: 0 0% 23%;        /* #3A3A3C - Dark border */
--text-primary-dark: 0 0% 100%; /* #FFFFFF - White */
```

### Usage Guidelines

**Primary Color**
- Use sparingly for key actions and interactive elements
- CTAs, links, active states, focus indicators
- Don't overuse - let it stand out

**Success/Warning/Destructive**
- Only for their semantic meaning
- Success: Completions, confirmations
- Warning: Cautions, alerts
- Destructive: Errors, delete actions

**Neutral Grays**
- Primary tool for creating hierarchy
- Use text-secondary for descriptions
- Use text-tertiary for metadata
- Borders should be subtle and barely visible

**No Rainbow Color Coding**
- Don't assign colors to levels, categories, etc.
- Use typography and spacing for differentiation
- Exception: Charts and data visualization only

---

## 📝 Typography System

### Font Stack

```css
/* Body Text */
font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text',
             'Segoe UI', sans-serif;

/* Display Text */
font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display',
             'Segoe UI', sans-serif;

/* Chinese Characters */
font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;

/* Monospace (code) */
font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Consolas', monospace;
```

### Type Scale

```css
/* Display - Hero sections */
.text-4xl: 2.25rem (36px) - font-weight: 700 - line-height: 1.1
.text-3xl: 1.875rem (30px) - font-weight: 700 - line-height: 1.2

/* Headings */
.text-2xl: 1.5rem (24px) - font-weight: 600 - line-height: 1.3
.text-xl: 1.25rem (20px) - font-weight: 600 - line-height: 1.4
.text-lg: 1.125rem (18px) - font-weight: 600 - line-height: 1.5

/* Body */
.text-base: 1rem (16px) - font-weight: 400 - line-height: 1.5
.text-sm: 0.875rem (14px) - font-weight: 400 - line-height: 1.6
.text-xs: 0.75rem (12px) - font-weight: 500 - line-height: 1.5
```

### Typography Hierarchy Guidelines

**Page Titles**: text-3xl, font-bold, mb-2
**Section Headers**: text-2xl, font-semibold, mb-6
**Card Titles**: text-lg, font-semibold, mb-2
**Body Text**: text-base, font-normal
**Descriptions**: text-sm, text-muted-foreground, line-height: 1.6
**Metadata**: text-xs, text-muted-foreground, font-medium

**Rules**:
- Never use more than 3 font sizes in a single component
- Use font weight and spacing to create hierarchy before adding color
- Keep line-height generous for readability (1.5-1.6 for body text)
- Limit line length to 65-75 characters for optimal readability

---

## 📐 Spacing System

### Base Unit: 4px

```css
/* Tailwind Spacing Scale */
0.5 = 2px   (0.125rem)
1 = 4px     (0.25rem)
2 = 8px     (0.5rem)
3 = 12px    (0.75rem)
4 = 16px    (1rem)
5 = 20px    (1.25rem)
6 = 24px    (1.5rem)
8 = 32px    (2rem)
10 = 40px   (2.5rem)
12 = 48px   (3rem)
16 = 64px   (4rem)
20 = 80px   (5rem)
```

### Spacing Guidelines

**Component Internal Spacing**
- Card padding: p-6 (24px) mobile, p-8 (32px) desktop
- Button padding: px-4 py-2 (small), px-6 py-3 (medium), px-8 py-4 (large)
- Input padding: px-4 py-2
- Section padding: py-8 (mobile), py-12 (desktop)

**Layout Spacing**
- Between cards in grid: gap-5 (mobile), gap-6 (tablet), gap-8 (desktop)
- Between sections: mb-12 (48px) or mb-16 (64px)
- Container padding: px-4 (mobile), px-6 (tablet), px-8 (desktop)
- Page margins: my-8 (mobile), my-12 (desktop)

**Micro Spacing**
- Icon to text: gap-2 (8px)
- Label to input: mb-2 (8px)
- Form field groups: space-y-4 (16px)
- List items: space-y-3 (12px)

**Rules**:
- Always use spacing scale values, never arbitrary values
- Prefer consistent spacing (e.g., always mb-6 for section headers)
- White space is not wasted space - be generous
- Increase spacing on larger screens

---

## 🎭 Shadows & Elevation

### Shadow Scale

```javascript
// Add to tailwind.config.ts
boxShadow: {
  'soft': '0 1px 3px rgba(0, 0, 0, 0.06)',
  'soft-md': '0 2px 8px rgba(0, 0, 0, 0.08)',
  'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
  'soft-xl': '0 8px 24px rgba(0, 0, 0, 0.15)',
}
```

### Usage Guidelines

**Cards at Rest**: shadow-soft-md
**Cards on Hover**: shadow-soft-lg
**Modals/Dialogs**: shadow-soft-xl
**Dropdowns**: shadow-soft-lg
**No Shadow**: Inline elements, nested components

**Rules**:
- Use single-layer shadows only (no multiple shadow layers)
- Keep shadows subtle - they suggest depth, not create drama
- Darker backgrounds need lighter shadows
- Never use colored shadows (except focus rings)

---

## ✨ Animations & Transitions

### Timing

```javascript
// Add to tailwind.config.ts
transitionDuration: {
  'fast': '100ms',    // Micro-interactions
  'base': '200ms',    // Standard transitions
  'slow': '300ms',    // Larger movements
}

transitionTimingFunction: {
  'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',  // Default easing
  'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Playful (use sparingly)
}
```

### Animation Guidelines

**What to Animate**
- ✅ Hover states: `hover:-translate-y-0.5` + shadow change
- ✅ Focus states: Ring appearance
- ✅ Loading states: Opacity fade-in
- ✅ Transitions: Page/component changes
- ✅ Progress indicators: Width/stroke animations

**What NOT to Animate**
- ❌ Pulsing elements (annoying)
- ❌ Rotating elements (unless loading spinner)
- ❌ Bouncing text or icons
- ❌ Confetti or particle effects
- ❌ Color cycling

**Performance Rules**
- Only animate `transform` and `opacity` (GPU accelerated)
- Keep duration under 300ms
- Use `will-change` sparingly
- Respect `prefers-reduced-motion`

**Standard Patterns**:

```tsx
// Hover lift
className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg"

// Fade in
className="animate-in fade-in duration-300"

// Button press
className="active:scale-95 transition-transform duration-100"

// Loading skeleton
className="animate-pulse bg-muted"
```

---

## 🧩 Component Patterns

### Cards

**Standard Card**
```tsx
<div className="rounded-xl bg-card border border-border p-6 shadow-soft-md">
  {/* Content */}
</div>
```

**Interactive Card**
```tsx
<Link
  href="/path"
  className="block rounded-xl bg-card border border-border p-6 shadow-soft-md
             transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg"
>
  {/* Content */}
</Link>
```

**Rules**:
- Rounded corners: rounded-xl (12px)
- Padding: p-6 (mobile), p-8 (desktop)
- Always include border (even if subtle)
- Background should be card color (slightly different from page background)

### Buttons

**Primary Button**
```tsx
<button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg
                   font-medium transition-all duration-200
                   hover:opacity-90 active:scale-95
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click me
</button>
```

**Secondary Button**
```tsx
<button className="px-6 py-3 bg-muted text-foreground rounded-lg
                   font-medium transition-all duration-200
                   hover:bg-muted/80 active:scale-95
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click me
</button>
```

**Ghost Button**
```tsx
<button className="px-4 py-2 text-muted-foreground rounded-lg
                   font-medium transition-colors duration-200
                   hover:text-foreground hover:bg-muted/50
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click me
</button>
```

**Rules**:
- Use primary sparingly (one main action per view)
- Medium font weight, never bold
- No uppercase text (use sentence case)
- Always include focus ring
- Scale down slightly on press (active:scale-95)

### Inputs

**Standard Input**
```tsx
<input
  type="text"
  className="w-full px-4 py-2 rounded-lg border border-border bg-background
             text-foreground placeholder:text-muted-foreground
             transition-colors duration-200
             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
  placeholder="Enter text..."
/>
```

**With Label**
```tsx
<div>
  <label className="block text-sm font-medium mb-2">
    Label text
  </label>
  <input {...inputProps} />
  <p className="text-xs text-muted-foreground mt-1">
    Helper text here
  </p>
</div>
```

**Rules**:
- Always include label (visible or aria-label)
- Border should be subtle, let focus ring provide emphasis
- Placeholder text should be light (text-muted-foreground)
- Helper text below input, small and muted

### Progress Indicators

**Linear Progress Bar**
```tsx
<div className="h-0.5 w-full bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-primary transition-all duration-300"
    style={{ width: `${percent}%` }}
    role="progressbar"
    aria-valuenow={percent}
    aria-valuemin={0}
    aria-valuemax={100}
  />
</div>
```

**Rules**:
- Keep thin (0.5 = 2px for subtle, 1 = 4px for prominent)
- Single color only (primary or success)
- Smooth animations (300ms)
- Always include ARIA attributes

### Badges & Pills

**Status Badge**
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-md
                 text-xs font-medium bg-success/10 text-success">
  Completed
</span>
```

**Count Badge**
```tsx
<span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                 text-xs font-medium bg-primary text-primary-foreground">
  5
</span>
```

**Rules**:
- Use semantic colors (success, warning, destructive)
- Keep text small (text-xs)
- Medium font weight
- Rounded corners (rounded-md for pills, rounded-full for circles)

### Empty States

**Standard Empty State**
```tsx
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  <div className="w-16 h-16 mb-4 text-muted-foreground/40">
    {/* Icon here */}
  </div>
  <h3 className="text-lg font-semibold mb-2">
    No items yet
  </h3>
  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
    Get started by creating your first item.
  </p>
  <button className="btn-primary">
    Create item
  </button>
</div>
```

**Rules**:
- Center aligned
- Large, muted icon
- Clear heading
- Concise description
- Clear call to action

### Loading States

**Skeleton Loader**
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-muted rounded w-3/4" />
  <div className="h-4 bg-muted rounded w-1/2" />
  <div className="h-4 bg-muted rounded w-5/6" />
</div>
```

**Rules**:
- Match the layout of actual content
- Use muted background color
- Keep animation subtle (default pulse is good)
- Don't over-engineer - simple rectangles work

---

## 📱 Responsive Design

### Breakpoints

```javascript
// Tailwind default breakpoints (use these)
sm: '640px'   // Small tablets
md: '768px'   // Tablets
lg: '1024px'  // Laptops
xl: '1280px'  // Desktops
2xl: '1536px' // Large desktops
```

### Mobile-First Approach

**Always design for mobile first, then enhance for larger screens.**

```tsx
// ❌ Wrong - desktop first
<div className="grid-cols-3 md:grid-cols-1">

// ✅ Correct - mobile first
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Responsive Patterns

**Typography Scaling**
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Page Title
</h1>
```

**Spacing Scaling**
```tsx
<div className="px-4 md:px-6 lg:px-8">
  <div className="py-8 md:py-12 lg:py-16">
```

**Grid Layouts**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
                gap-4 md:gap-6 lg:gap-8">
```

**Visibility**
```tsx
{/* Mobile menu */}
<nav className="md:hidden">...</nav>

{/* Desktop menu */}
<nav className="hidden md:block">...</nav>
```

### Touch Targets

**Minimum Size**: 44x44px (Apple HIG standard)

```tsx
// ❌ Too small
<button className="p-1">...</button>

// ✅ Proper size
<button className="p-2 min-w-[44px] min-h-[44px]">...</button>
```

---

## ♿ Accessibility Requirements

### Focus Management

**Always Visible Focus Rings**
```tsx
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

**Focus Order**
- Ensure logical tab order (top to bottom, left to right)
- Skip links for main content
- Trap focus in modals

### ARIA Labels

**Interactive Elements**
```tsx
<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>
```

**Status Updates**
```tsx
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

**Form Fields**
```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-required="true" />
```

### Keyboard Navigation

**All interactive elements must be keyboard accessible:**
- Buttons: Space and Enter
- Links: Enter
- Custom controls: Appropriate keys + ARIA
- Escape closes modals
- Tab moves through elements

### Color Contrast

**WCAG AAA Standards (preferred)**
- Normal text: 7:1 ratio
- Large text (18px+): 4.5:1 ratio
- UI components: 3:1 ratio

**Test all text against backgrounds**
```tsx
// ✅ Good contrast
<p className="text-foreground">...</p>
<p className="text-muted-foreground">...</p>

// ⚠️ Check contrast
<p className="text-muted-foreground/60">...</p>
```

### Reduced Motion

**Always include in globals.css:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Screen Reader Support

**Semantic HTML**
```tsx
// ✅ Use semantic elements
<article>
  <header>
    <h2>Title</h2>
  </header>
  <main>Content</main>
  <footer>Meta</footer>
</article>

// ❌ Don't use divs for everything
<div>
  <div>Title</div>
  <div>Content</div>
</div>
```

**Hidden Content**
```tsx
// Visually hidden but screen-reader accessible
<span className="sr-only">Description for screen readers</span>
```

---

## 🎨 Page-Specific Patterns

### Dashboard Page

**Layout**
```tsx
<div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
  {/* Page header */}
  <div className="mb-8">
    <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
    <p className="text-muted-foreground">
      Welcome back! Here's your learning progress.
    </p>
  </div>

  {/* Stats grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
    <StatCard />
    <StatCard />
    <StatCard />
    <StatCard />
  </div>

  {/* Main content */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
    <div className="lg:col-span-2">
      <MainContent />
    </div>
    <div>
      <Sidebar />
    </div>
  </div>
</div>
```

**Stat Card Pattern**
```tsx
<div className="rounded-xl bg-card border border-border p-6 shadow-soft-md">
  <div className="flex items-center justify-between mb-2">
    <p className="text-sm text-muted-foreground">Total Reviews</p>
    <TrendingUp className="w-4 h-4 text-muted-foreground" />
  </div>
  <p className="text-3xl font-bold mb-1">1,234</p>
  <p className="text-xs text-success">+12% from last week</p>
</div>
```

### Settings Page

**Layout**
```tsx
<div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-4xl">
  {/* Page header */}
  <div className="mb-8">
    <h1 className="text-3xl font-bold mb-2">Settings</h1>
    <p className="text-muted-foreground">
      Manage your account and preferences
    </p>
  </div>

  {/* Settings sections */}
  <div className="space-y-8">
    <SettingsSection title="Profile">
      <SettingItem />
      <SettingItem />
    </SettingsSection>

    <SettingsSection title="Preferences">
      <SettingItem />
      <SettingItem />
    </SettingsSection>
  </div>
</div>
```

**Setting Item Pattern**
```tsx
<div className="flex items-center justify-between py-4 border-b border-border last:border-0">
  <div>
    <p className="font-medium">Setting name</p>
    <p className="text-sm text-muted-foreground">Description of setting</p>
  </div>
  <Switch />
</div>
```

### List/Grid Pages (Lessons, Reviews)

**Header with Actions**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
  <div>
    <h1 className="text-3xl font-bold mb-2">Lessons</h1>
    <p className="text-muted-foreground">
      Learn new characters and vocabulary
    </p>
  </div>
  <button className="btn-primary">
    Start Lesson
  </button>
</div>
```

**Filter Bar**
```tsx
<div className="flex flex-col sm:flex-row gap-4 mb-6">
  <div className="flex-1">
    <input
      type="search"
      placeholder="Search..."
      className="w-full px-4 py-2 rounded-lg border border-border bg-background
                 focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
  <div className="flex gap-2">
    <FilterButton active>All</FilterButton>
    <FilterButton>In Progress</FilterButton>
    <FilterButton>Completed</FilterButton>
  </div>
</div>
```

### Auth Pages (Login, Signup)

**Centered Layout**
```tsx
<div className="min-h-screen flex items-center justify-center px-4 py-12">
  <div className="w-full max-w-md">
    {/* Logo */}
    <div className="text-center mb-8">
      <Logo className="w-12 h-12 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
      <p className="text-muted-foreground">Sign in to your account</p>
    </div>

    {/* Form */}
    <div className="rounded-xl bg-card border border-border p-8 shadow-soft-lg">
      <form className="space-y-4">
        {/* Form fields */}
      </form>
    </div>

    {/* Footer link */}
    <p className="text-center text-sm text-muted-foreground mt-4">
      Don't have an account?{' '}
      <Link href="/signup" className="text-primary hover:underline">
        Sign up
      </Link>
    </p>
  </div>
</div>
```

---

## 📊 Data Visualization

### Charts

**Principles**
- Use muted colors (text-muted-foreground for grid lines)
- Simple, clean legends
- No 3D effects or gradients
- Generous padding and spacing
- Accessible tooltips

**Color Palette for Charts**
```tsx
const chartColors = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--chart-1))',
  warning: 'hsl(var(--chart-4))',
  info: 'hsl(var(--chart-3))',
}
```

### Tables

**Clean Table Pattern**
```tsx
<div className="rounded-xl border border-border overflow-hidden">
  <table className="w-full">
    <thead className="bg-muted/50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="bg-card divide-y divide-border">
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="px-6 py-4 text-sm">Content</td>
        <td className="px-6 py-4 text-sm">Content</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🚀 Performance Guidelines

### Image Optimization

```tsx
import Image from 'next/image'

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  className="rounded-lg"
  loading="lazy"
/>
```

### Component Optimization

```tsx
import { memo } from 'react'

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Component logic
})
```

### Code Splitting

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
})
```

### CSS Performance

```css
/* ✅ GPU accelerated */
transform: translateY(-2px);
opacity: 0.5;

/* ❌ Causes reflow */
margin-top: 10px;
width: 50%;
```

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Looks clean in light mode
- [ ] Looks clean in dark mode
- [ ] Shadows are subtle
- [ ] Typography is clear and hierarchical
- [ ] Spacing feels generous
- [ ] No color overload

### Responsive Testing
- [ ] Mobile (375px): Single column, proper touch targets
- [ ] Tablet (768px): Proper spacing, readable
- [ ] Desktop (1024px+): Generous layout, not stretched
- [ ] No horizontal scrolling
- [ ] Text is readable at all sizes

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader friendly
- [ ] Color contrast meets WCAG AA minimum
- [ ] Reduced motion respected
- [ ] All images have alt text

### Performance Testing
- [ ] Lighthouse Performance: 90+
- [ ] Lighthouse Accessibility: 100
- [ ] First Contentful Paint: <1.5s
- [ ] Time to Interactive: <3.0s
- [ ] No layout shifts (CLS < 0.1)

---

## 📝 Code Review Checklist

Before submitting any UI code, verify:

**Design**
- [ ] Follows minimalist principles (no unnecessary decoration)
- [ ] Uses color sparingly and purposefully
- [ ] Typography creates clear hierarchy
- [ ] Generous white space throughout
- [ ] Shadows are subtle (soft/soft-md/soft-lg only)

**Code Quality**
- [ ] Uses Tailwind classes (no inline styles unless dynamic)
- [ ] Follows spacing scale (no arbitrary values)
- [ ] Semantic HTML elements used
- [ ] Component is properly typed (TypeScript)
- [ ] No console.log statements left

**Accessibility**
- [ ] Focus indicators on all interactive elements
- [ ] ARIA labels where needed
- [ ] Semantic HTML (header, main, nav, etc.)
- [ ] Color contrast verified
- [ ] Keyboard accessible

**Performance**
- [ ] Only animates transform/opacity
- [ ] Uses React.memo if expensive
- [ ] Images use Next.js Image component
- [ ] No unnecessary re-renders

**Responsive**
- [ ] Mobile-first approach
- [ ] Tested on mobile, tablet, desktop
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scroll

---

## 🎯 Common Mistakes to Avoid

### ❌ Visual Mistakes

**Using too many colors**
```tsx
// ❌ Bad - rainbow badges
<Badge className="bg-blue-500">Level 1</Badge>
<Badge className="bg-purple-500">Level 2</Badge>
<Badge className="bg-pink-500">Level 3</Badge>

// ✅ Good - consistent, minimal
<Badge variant="outline">Level 1</Badge>
<Badge variant="outline">Level 2</Badge>
<Badge variant="outline">Level 3</Badge>
```

**Overusing animations**
```tsx
// ❌ Bad - distracting pulse
<div className="animate-pulse">Important!</div>

// ✅ Good - subtle static design
<div className="font-medium text-foreground">Important!</div>
```

**Heavy shadows**
```tsx
// ❌ Bad - dramatic shadow
<div className="shadow-2xl">...</div>

// ✅ Good - subtle shadow
<div className="shadow-soft-md">...</div>
```

### ❌ Layout Mistakes

**Cramped spacing**
```tsx
// ❌ Bad - too tight
<div className="p-2 space-y-1">...</div>

// ✅ Good - generous breathing room
<div className="p-6 space-y-4">...</div>
```

**Too many font sizes**
```tsx
// ❌ Bad - chaotic hierarchy
<h1 className="text-5xl">Title</h1>
<h2 className="text-2xl">Subtitle</h2>
<p className="text-xs">Description</p>

// ✅ Good - clear, simple hierarchy
<h1 className="text-3xl font-bold">Title</h1>
<p className="text-muted-foreground">Description</p>
```

### ❌ Accessibility Mistakes

**Missing focus indicators**
```tsx
// ❌ Bad - no focus ring
<button className="outline-none">Click</button>

// ✅ Good - visible focus
<button className="focus:outline-none focus:ring-2 focus:ring-primary">
  Click
</button>
```

**Poor contrast**
```tsx
// ❌ Bad - low contrast
<p className="text-gray-400">Important text</p>

// ✅ Good - readable contrast
<p className="text-foreground">Important text</p>
<p className="text-muted-foreground">Secondary text</p>
```

### ❌ Performance Mistakes

**Animating expensive properties**
```tsx
// ❌ Bad - causes reflow
<div className="hover:w-full hover:h-full">...</div>

// ✅ Good - GPU accelerated
<div className="hover:scale-105">...</div>
```

**Not using Next.js Image**
```tsx
// ❌ Bad - unoptimized
<img src="/image.jpg" alt="..." />

// ✅ Good - optimized
<Image src="/image.jpg" alt="..." width={800} height={600} />
```

---

## 🛠️ Implementation Guide

### Step 1: Update Global Styles

**File**: `app/globals.css`

Add to the bottom:
```css
/* Apple-inspired design system utilities */
@layer utilities {
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Focus visible */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
  }
}
```

### Step 2: Update Tailwind Config

**File**: `tailwind.config.ts`

Add to `theme.extend`:
```typescript
boxShadow: {
  'soft': '0 1px 3px rgba(0, 0, 0, 0.06)',
  'soft-md': '0 2px 8px rgba(0, 0, 0, 0.08)',
  'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
  'soft-xl': '0 8px 24px rgba(0, 0, 0, 0.15)',
},
transitionDuration: {
  'fast': '100ms',
  'base': '200ms',
  'slow': '300ms',
},
```

### Step 3: Update Component Library

Go through each component in `components/ui/` and apply:
1. Clean shadows (soft-md for cards, soft-lg for dialogs)
2. Subtle transitions (200ms)
3. Proper focus rings
4. Minimal color usage
5. Generous spacing

### Step 4: Update Feature Components

Go through each component in `components/features/` and apply:
1. Typography hierarchy
2. Spacing scale
3. Color system
4. Animation guidelines
5. Accessibility requirements

### Step 5: Update Pages

Go through each page in `app/` and apply:
1. Consistent layouts
2. Proper page headers
3. Generous spacing
4. Responsive patterns

---

## 📚 Quick Reference

### Class Name Patterns

```tsx
// Cards
"rounded-xl bg-card border border-border p-6 shadow-soft-md"

// Interactive cards
"hover:-translate-y-0.5 hover:shadow-soft-lg transition-all duration-200"

// Primary button
"px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium
 hover:opacity-90 active:scale-95 focus-ring"

// Input
"w-full px-4 py-2 rounded-lg border border-border bg-background
 focus:outline-none focus:ring-2 focus:ring-primary"

// Page title
"text-3xl font-bold mb-2"

// Section header
"text-2xl font-semibold mb-6"

// Description
"text-sm text-muted-foreground"

// Metadata
"text-xs text-muted-foreground font-medium"
```

---

## 🎨 Example: Complete Component

Here's a complete example applying all principles:

```tsx
'use client'

import { cva } from 'class-variance-authority'
import { Check, Lock } from 'lucide-react'
import Link from 'next/link'
import { memo } from 'react'

// Clean, minimal variants
const cardVariants = cva(
  "block rounded-xl bg-card border border-border transition-all duration-200",
  {
    variants: {
      status: {
        locked: "opacity-50 cursor-not-allowed p-6",
        unlocked: "hover:-translate-y-0.5 hover:shadow-soft-lg shadow-soft-md p-6",
        completed: "border-l-2 border-l-success shadow-soft-md p-6",
      },
    },
  }
)

interface ItemCardProps {
  item: {
    id: string
    title: string
    description: string
    level: number
    stats: { count: number; label: string }[]
    totalItems: number
  }
  progress?: {
    completed: boolean
    itemsLearned: number
  }
  isLocked: boolean
}

export const ItemCard = memo(function ItemCard({
  item,
  progress,
  isLocked,
}: ItemCardProps) {
  const Wrapper = isLocked ? 'div' : Link
  const wrapperProps = isLocked ? {} : { href: `/items/${item.id}` }

  const status = isLocked ? 'locked' : progress?.completed ? 'completed' : 'unlocked'
  const completionPercent = progress?.itemsLearned
    ? Math.round((progress.itemsLearned / item.totalItems) * 100)
    : 0

  return (
    <Wrapper
      {...wrapperProps}
      className={cardVariants({ status })}
      aria-label={`${item.title}. Level ${item.level}. ${
        progress?.completed ? 'Completed' : isLocked ? 'Locked' : 'Available'
      }. ${item.stats.map(s => `${s.count} ${s.label}`).join(', ')}.`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium text-muted-foreground">
          Level {item.level}
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
        {item.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {item.description}
      </p>

      {/* Stats */}
      <div className="text-xs text-muted-foreground mb-4">
        {item.stats.map((stat, i) => (
          <span key={i}>
            {stat.count} {stat.label}
            {i < item.stats.length - 1 && ' · '}
          </span>
        ))}
      </div>

      {/* Progress bar - only for in-progress */}
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
  )
})
```

---

## 🎯 Success Criteria

Your implementation is successful when:

1. ✅ **Visual**: Clean, professional, minimal aesthetic
2. ✅ **Consistent**: Same patterns across all pages
3. ✅ **Accessible**: Lighthouse accessibility score: 100
4. ✅ **Performant**: Lighthouse performance: 90+
5. ✅ **Responsive**: Works beautifully on all screen sizes
6. ✅ **Maintainable**: Code is clean and follows patterns
7. ✅ **User Feedback**: "clean", "professional", "easy to use"

---

## 💡 Final Notes

**Remember**: The goal is to create a timeless, professional interface that users trust. Every design decision should serve the user's needs, not ego or trends.

**When in doubt**: Remove rather than add. Simplify rather than complicate. Use white space rather than visual elements.

**This design system should last years, not months.**

Apply these principles consistently across every component, every page, and every interaction. The result will be a cohesive, professional application that users love to use.
