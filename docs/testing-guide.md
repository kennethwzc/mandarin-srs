# Testing Guide

## Overview

This project uses a comprehensive testing strategy to ensure production reliability:

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: React Testing Library
- **E2E Tests**: Playwright
- **Accessibility Tests**: axe-core + Playwright
- **API Tests**: Jest with mocked dependencies

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Critical Paths**: 100% coverage
- **All Features**: Integration tested
- **User Journeys**: E2E tested
- **Accessibility**: WCAG AA compliant

---

## Running Tests

### All Tests

```bash
# Run all tests (unit + E2E)
pnpm test:all
```

### Unit Tests

```bash
# Run unit tests once
pnpm test

# Watch mode (re-runs on file changes)
pnpm test:watch

# With coverage report
pnpm test:coverage

# CI mode (for GitHub Actions)
pnpm test:ci

# Run specific test file
pnpm test lib/utils/__tests__/pinyin-utils.test.ts
```

### Integration Tests

```bash
# Run integration tests only
pnpm test:integration
```

### E2E Tests

```bash
# Run E2E tests (requires app running)
pnpm test:e2e

# Run with UI mode (visual test runner)
pnpm test:e2e:ui

# Run with debugger
pnpm test:e2e:debug

# Run specific test file
npx playwright test e2e/review-flow.spec.ts

# Run specific browser
npx playwright test --project=chromium
```

### Accessibility Tests

```bash
# Run accessibility tests only
pnpm test:a11y
```

---

## Test Structure

```
mandarin-srs/
├── lib/
│   ├── utils/
│   │   └── __tests__/
│   │       ├── pinyin-utils.test.ts       # Pinyin utilities
│   │       └── srs-algorithm.test.ts      # SRS algorithm
│   └── hooks/
│       └── __tests__/
│           └── use-pinyin-input.test.tsx  # Custom hooks
├── components/
│   └── features/
│       └── __tests__/
│           ├── dashboard-stats.test.tsx   # Component tests
│           └── pinyin-input.test.tsx
├── app/
│   ├── (app)/
│   │   └── reviews/
│   │       └── __tests__/
│   │           └── review-flow.integration.test.tsx  # Integration
│   └── api/
│       └── reviews/
│           └── __tests__/
│               ├── queue.test.ts         # API tests
│               └── submit.test.ts
└── e2e/
    ├── auth.setup.ts                     # E2E auth setup
    ├── review-flow.spec.ts               # E2E user flows
    ├── lesson-flow.spec.ts
    ├── dashboard.spec.ts
    └── accessibility.spec.ts             # A11y tests
```

---

## Writing Tests

### Unit Tests (Jest)

Test pure functions and isolated logic:

```typescript
import { describe, it, expect } from '@jest/globals'
import { myFunction } from '../my-function'

describe('myFunction', () => {
  it('should handle basic case', () => {
    expect(myFunction('input')).toBe('output')
  })

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('')
    expect(myFunction(null)).toBe(null)
  })

  it('should throw on invalid input', () => {
    expect(() => myFunction(undefined)).toThrow()
  })
})
```

### Component Tests (React Testing Library)

Test React components in isolation:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '../my-component'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)

    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Integration Tests

Test feature flows with multiple components:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock API calls
global.fetch = jest.fn()

describe('Feature Flow', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    })
  })

  it('completes full flow', async () => {
    const user = userEvent.setup()
    render(<MyFeature />)

    // Interact with UI
    await user.type(screen.getByRole('textbox'), 'test')
    await user.click(screen.getByRole('button'))

    // Verify result
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })
})
```

### E2E Tests (Playwright)

Test real user journeys in actual browser:

```typescript
import { test, expect } from '@playwright/test'

test('user can complete review', async ({ page }) => {
  await page.goto('/reviews')

  await page.fill('input[type="text"]', 'ni3')
  await page.keyboard.press('Enter')

  await page.click('button:has-text("Good")')

  await expect(page.locator('.next-character')).toBeVisible()
})
```

---

## Best Practices

### General

1. **Test behavior, not implementation**
   - Test what users see and do
   - Don't test internal state

2. **Arrange-Act-Assert pattern**
   - Arrange: Set up test data
   - Act: Perform action
   - Assert: Verify result

3. **Descriptive test names**
   - Use `it('should...')` format
   - Name describes expected behavior

4. **One assertion per test (when possible)**
   - Makes failures easy to diagnose
   - Can group related assertions

5. **Mock external dependencies**
   - Database, API calls, third-party services
   - Keeps tests fast and reliable

### React Testing

1. **Query by role/label, not implementation details**

   ```typescript
   // Good
   screen.getByRole('button', { name: /submit/i })

   // Bad
   screen.getByClassName('submit-btn')
   ```

2. **Use userEvent over fireEvent**

   ```typescript
   // Good - simulates real user interaction
   await userEvent.click(button)

   // Bad - lower level
   fireEvent.click(button)
   ```

3. **Wait for async updates**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument()
   })
   ```

### E2E Testing

1. **Test critical user paths first**
   - Login → Dashboard
   - Start Lesson → Complete Review
   - Authentication flows

2. **Use data-testid sparingly**
   - Prefer semantic queries
   - Use for complex selectors only

3. **Handle flaky tests**
   - Use proper waits
   - Don't use fixed timeouts unless necessary
   - Retry on CI

---

## Coverage Requirements

### Minimum Thresholds

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Critical Paths (100% Required)

- Pinyin validation logic
- SRS algorithm calculations
- Review submission flow
- Authentication logic
- Database operations

---

## CI/CD Integration

Tests run automatically on:

- ✅ Push to `main` or `develop` branches
- ✅ Pull requests
- ✅ Manual workflow trigger

### GitHub Actions Workflows

1. **ci.yml**: Runs on every push/PR
   - Linting
   - Type checking
   - Unit tests
   - Build verification

2. **e2e-tests.yml**: Runs E2E and accessibility tests
   - Playwright tests
   - Accessibility scans
   - Cross-browser testing

### Required Secrets

Set these in GitHub repository settings:

```
SUPABASE_URL
SUPABASE_ANON_KEY
APP_URL
TEST_USER_EMAIL (optional)
TEST_USER_PASSWORD (optional)
CODECOV_TOKEN (optional, for coverage tracking)
```

---

## Debugging Tests

### Jest Tests

```bash
# Run with verbose output
pnpm test --verbose

# Run single test
pnpm test -t "test name"

# Debug in VS Code
# Set breakpoint, press F5
```

### Playwright Tests

```bash
# Run with headed browser
npx playwright test --headed

# Run with UI mode (recommended)
pnpm test:e2e:ui

# Debug specific test
npx playwright test e2e/review-flow.spec.ts --debug

# See trace viewer
npx playwright show-report
```

### Common Issues

**Issue**: Tests timeout

- **Solution**: Increase timeout, check for missing waits

**Issue**: Cannot find element

- **Solution**: Check selector, add proper wait conditions

**Issue**: Flaky tests

- **Solution**: Remove fixed timeouts, use waitFor()

**Issue**: Mock not working

- **Solution**: Check mock path, clear mocks between tests

---

## Performance Testing

### Load Time Tests

Included in E2E tests:

```typescript
test('loads quickly', async ({ page }) => {
  const start = Date.now()
  await page.goto('/dashboard')
  const loadTime = Date.now() - start

  expect(loadTime).toBeLessThan(3000)
})
```

### Bundle Size

```bash
# Analyze bundle
pnpm analyze

# Check build output
pnpm build
```

---

## Accessibility Testing

### Running a11y Tests

```bash
# Run all accessibility tests
pnpm test:a11y

# Or run via Playwright
npx playwright test e2e/accessibility.spec.ts
```

### Manual Testing Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Form labels present
- [ ] Alt text on images
- [ ] ARIA landmarks used

---

## Continuous Improvement

### After Adding New Features

1. Write unit tests first (TDD recommended)
2. Add integration tests for feature flows
3. Add E2E tests for critical paths
4. Run coverage check: `pnpm test:coverage`
5. Ensure coverage stays above 80%

### Reviewing Coverage

```bash
# Generate coverage report
pnpm test:coverage

# Open in browser
open coverage/lcov-report/index.html
```

### Maintaining Test Quality

- Keep tests fast (<2 min for unit, <5 min for E2E)
- Remove flaky tests or fix properly
- Update tests when functionality changes
- Don't skip failing tests
- Review test logs in CI failures

---

## Test Data

### Test Users

- Email: `test@example.com`
- Password: `testpassword123`

### Test Content

Tests use either:

- Mocked data (unit/integration tests)
- Seeded database (E2E tests)

For E2E tests, ensure test database has:

- At least 10 lessons
- At least 50 characters
- At least one test user with profile

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Getting Help

If tests are failing:

1. Read the error message carefully
2. Check test logs in CI
3. Run tests locally to reproduce
4. Use debugger or console.log
5. Check recent code changes
6. Review coverage report for gaps

Tests are your safety net. Invest time in making them reliable, and they'll save you hours of debugging in production.
