# Testing Guide

## Overview

This project uses a comprehensive testing strategy to ensure production reliability:

- **Unit Tests**: Jest + React Testing Library (80%+ coverage)
- **Integration Tests**: Testing Library (feature flows)
- **E2E Tests**: Playwright (critical user journeys)
- **Accessibility Tests**: axe-core (WCAG 2.1 AA compliance)
- **API Tests**: Jest (route validation)

## Quick Start

```bash
# Run all tests
pnpm test:all

# Unit tests (watch mode)
pnpm test:watch

# Unit tests (single run)
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui

# E2E debug mode
pnpm test:e2e:debug

# Accessibility tests
pnpm test:a11y

# Coverage report
pnpm test:coverage
```

## Test Structure

```
/
├── lib/utils/__tests__/        # Utility function tests
│   ├── pinyin-utils.test.ts
│   └── srs-algorithm.test.ts
├── lib/hooks/__tests__/        # Custom hook tests
│   └── use-pinyin-input.test.tsx
├── components/features/__tests__/  # Component tests
│   ├── dashboard-stats.test.tsx
│   ├── pinyin-input.test.tsx
│   ├── review-card.test.tsx
│   └── lesson-card.test.tsx
├── app/(app)/reviews/__tests__/   # Integration tests
│   └── review-flow.integration.test.tsx
├── app/api/**/__tests__/       # API route tests
│   ├── reviews/__tests__/submit.test.ts
│   └── lessons/__tests__/start.test.ts
└── e2e/                        # E2E tests (Playwright)
    ├── review-flow.spec.ts
    ├── lesson-flow.spec.ts
    ├── dashboard.spec.ts
    └── accessibility.spec.ts
```

## Coverage Requirements

### Minimum Coverage

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Critical Path Coverage

- SRS algorithm: 100%
- Pinyin utilities: 100%
- Review submission: 100%
- Authentication: 100%

## Writing Tests

### Unit Tests (Jest + React Testing Library)

**Test utilities:**

```typescript
import { addToneMark } from '../pinyin-utils'

describe('addToneMark', () => {
  it('adds tone marks correctly', () => {
    expect(addToneMark('ni', 3)).toBe('nǐ')
  })

  it('handles edge cases', () => {
    expect(() => addToneMark('', 3)).toThrow()
  })
})
```

**Test components:**

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '../my-component'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

### Integration Tests

Test complete feature flows:

```typescript
describe('Review Flow', () => {
  it('completes full review session', async () => {
    // Mock API calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockData }),
    })

    render(<ReviewsPage />)

    // Test complete flow
    await userEvent.type(input, 'ni3')
    await userEvent.keyboard('{Enter}')
    // ... assertions
  })
})
```

### E2E Tests (Playwright)

Test critical user journeys:

```typescript
test('user can complete review session', async ({ page }) => {
  await page.goto('/reviews')

  // Type answer
  await page.fill('input[type="text"]', 'ni3')
  await page.keyboard.press('Enter')

  // Verify feedback
  await expect(page.locator('text=Correct')).toBeVisible()

  // Grade
  await page.keyboard.press('3')

  // Verify next card
  await expect(page.locator('.character-display')).toBeVisible()
})
```

### API Tests

Test API routes in isolation:

```typescript
import { POST } from '../route'
import { NextRequest } from 'next/server'

describe('POST /api/reviews/submit', () => {
  it('validates input', async () => {
    const req = new NextRequest('http://localhost/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

### Accessibility Tests

Test WCAG compliance:

```typescript
test('dashboard is accessible', async ({ page }) => {
  await page.goto('/dashboard')

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()

  expect(results.violations).toEqual([])
})
```

## Best Practices

### DO ✅

- **Test behavior, not implementation**
- **Use data-testid for stable selectors**
- **Mock external dependencies**
- **Test error states**
- **Test loading states**
- **Test accessibility**
- **Keep tests fast (<2 minutes total)**
- **Write clear test descriptions**
- **Test edge cases**

### DON'T ❌

- **Don't test implementation details**
- **Don't test third-party libraries**
- **Don't skip error handling tests**
- **Don't hardcode test data in tests**
- **Don't use brittle selectors**
- **Don't write flaky tests**
- **Don't skip accessibility tests**

## Common Testing Patterns

### Testing Async Components

```typescript
it('loads data', async () => {
  render(<AsyncComponent />)

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

### Testing Form Submission

```typescript
it('submits form', async () => {
  const user = userEvent.setup()
  const onSubmit = jest.fn()

  render(<Form onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(onSubmit).toHaveBeenCalled()
})
```

### Testing Error States

```typescript
it('shows error message', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))

  render(<Component />)

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})
```

## Running Tests Locally

### Before Committing

```bash
# Run all checks
pnpm test:ci
pnpm typecheck
pnpm lint

# Or use the pre-commit hook (automatic)
git commit -m "feat: add feature"
```

### During Development

```bash
# Watch mode for fast feedback
pnpm test:watch

# Run specific test file
pnpm test path/to/test.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="pinyin"
```

### Debugging Tests

**Jest:**

```bash
# Run with node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code: Add breakpoint and run "Jest: Debug"
```

**Playwright:**

```bash
# UI mode
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e:debug

# Run specific test
npx playwright test e2e/review-flow.spec.ts
```

## CI/CD Integration

### GitHub Actions Workflows

**Automatic Runs:**

- ✅ On push to `main` or `develop`
- ✅ On pull requests
- ✅ Before deployment

**What Gets Tested:**

1. **Lint**: ESLint + Prettier
2. **Typecheck**: TypeScript compilation
3. **Unit Tests**: Jest with coverage
4. **Build**: Next.js production build
5. **E2E**: Playwright tests
6. **Accessibility**: axe-core scans

### Viewing Results

**Coverage Report:**

```bash
pnpm test:coverage
open coverage/lcov-report/index.html
```

**Playwright Report:**

```bash
pnpm test:e2e
npx playwright show-report
```

## Troubleshooting

### Common Issues

**Issue: Tests timeout**

```bash
# Increase timeout in test
test('slow test', async () => {
  // ...
}, 10000) // 10 seconds
```

**Issue: Tests are flaky**

```bash
# Use waitFor for async updates
await waitFor(() => {
  expect(element).toBeInTheDocument()
})

# Use data-testid for stable selectors
<div data-testid="my-element">
```

**Issue: Mock not working**

```bash
# Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

**Issue: Playwright browser not found**

```bash
# Install browsers
npx playwright install --with-deps
```

## Test Coverage Goals

Current coverage:

```
Statements   : 80%+
Branches     : 80%+
Functions    : 80%+
Lines        : 80%+
```

**Critical paths: 100% coverage**

- Authentication flows
- Review submission
- SRS algorithm
- Pinyin validation

## Adding New Tests

### When Adding New Features

1. **Write tests first (TDD)** or **alongside code**
2. **Test happy path** + **error cases**
3. **Include accessibility tests**
4. **Add E2E test if critical path**
5. **Update this documentation**

### Test Checklist

When adding a new feature:

- [ ] Unit tests for utilities/helpers
- [ ] Component tests for UI
- [ ] Integration tests for flows
- [ ] E2E test if user-facing
- [ ] Accessibility test
- [ ] API test if adding routes
- [ ] Update coverage thresholds if needed

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Performance Testing

See `/docs/performance-checklist.md` for performance testing guidelines.

---

**Remember:** Every test you write is a bug users won't encounter.
Invest in testing now, save debugging time later! 🚀
