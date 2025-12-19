# MANDATORY TEST REQUIREMENTS

> **CRITICAL**: No code is complete without tests. Period.

## CORE RULE
**Code without tests MUST NOT be committed to the repository.**

If E2E or CI tests fail, the commit is incomplete and should be fixed before pushing.

---

## UPDATED WORKFLOW: CODE + TESTS ARE ONE UNIT

### Before Writing Code
1. Clarify requirements (existing)
2. **Identify what tests are needed** ← NEW
3. Plan implementation approach
4. **Plan test cases** ← NEW

### During Code Generation
1. Write minimal implementation
2. **Write tests for that implementation** ← IMMEDIATE
3. Run tests locally
4. Iterate until tests pass
5. Repeat for next feature/function

### After Code Generation
1. Run full test suite locally
2. **Verify all new code has test coverage** ← MANDATORY
3. Fix any failing tests
4. Only THEN commit

### Before Pushing
1. Run full test suite (unit + integration + E2E)
2. **All tests must pass** ← NO EXCEPTIONS
3. Verify no test coverage dropped
4. Push only after green build

---

## DECISION TREE: DO I NEED TO WRITE TESTS?

```
Did I write or modify code?
├─ Yes → Tests are REQUIRED
└─ No → No tests needed

What type of code did I write/modify?
├─ New function/hook/component → Unit tests REQUIRED
├─ New API endpoint → Integration tests REQUIRED
├─ New user flow → E2E tests REQUIRED
├─ Bug fix → Regression test REQUIRED
├─ Refactor → Existing tests must still pass
└─ Documentation only → No tests needed

Is this code used in production?
├─ Yes → Full test coverage REQUIRED
└─ No (prototype/spike) → Tests recommended but not blocking
```

---

## MANDATORY TEST COVERAGE BY CODE TYPE

### 1. Utility Functions & Pure Logic
**Coverage Required**: 100%
**Test Types**: Unit tests
**Must Test**:
- Happy path with typical inputs
- Edge cases (empty, null, undefined, zero, negative)
- Error conditions and exceptions
- Type boundaries (for TypeScript)

**Template**:
```typescript
// src/utils/calculate-score.ts
export function calculateScore(correct: number, total: number): number {
  if (total === 0) throw new Error('Total cannot be zero');
  if (correct > total) throw new Error('Correct cannot exceed total');
  if (correct < 0 || total < 0) throw new Error('Values must be non-negative');

  return Math.round((correct / total) * 100);
}

// src/utils/calculate-score.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScore } from './calculate-score';

describe('calculateScore', () => {
  it('should calculate percentage correctly', () => {
    expect(calculateScore(8, 10)).toBe(80);
    expect(calculateScore(1, 3)).toBe(33);
  });

  it('should handle perfect score', () => {
    expect(calculateScore(10, 10)).toBe(100);
  });

  it('should handle zero correct', () => {
    expect(calculateScore(0, 10)).toBe(0);
  });

  it('should throw when total is zero', () => {
    expect(() => calculateScore(5, 0)).toThrow('Total cannot be zero');
  });

  it('should throw when correct exceeds total', () => {
    expect(() => calculateScore(11, 10)).toThrow('Correct cannot exceed total');
  });

  it('should throw on negative values', () => {
    expect(() => calculateScore(-1, 10)).toThrow('Values must be non-negative');
    expect(() => calculateScore(5, -10)).toThrow('Values must be non-negative');
  });
});
```

---

### 2. React Components
**Coverage Required**: 70% minimum (100% for critical paths)
**Test Types**: Component tests with Testing Library
**Must Test**:
- Renders without crashing
- Renders correct content based on props
- User interactions (clicks, inputs, form submissions)
- Conditional rendering logic
- Error states and loading states
- Accessibility (a11y)

**Template**:
```typescript
// src/components/ScoreDisplay.tsx
interface ScoreDisplayProps {
  score: number;
  total: number;
  onReset?: () => void;
}

export function ScoreDisplay({ score, total, onReset }: ScoreDisplayProps) {
  const percentage = (score / total) * 100;
  const isPassing = percentage >= 70;

  return (
    <div role="region" aria-label="Score summary">
      <h2>Your Score</h2>
      <p data-testid="score-text">
        {score} out of {total} ({percentage.toFixed(0)}%)
      </p>
      <p
        data-testid="pass-status"
        className={isPassing ? 'text-green-600' : 'text-red-600'}
      >
        {isPassing ? 'Passed' : 'Failed'}
      </p>
      {onReset && (
        <button onClick={onReset} data-testid="reset-button">
          Reset Quiz
        </button>
      )}
    </div>
  );
}

// src/components/ScoreDisplay.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScoreDisplay } from './ScoreDisplay';

describe('ScoreDisplay', () => {
  it('should render score correctly', () => {
    render(<ScoreDisplay score={8} total={10} />);

    expect(screen.getByTestId('score-text')).toHaveTextContent('8 out of 10 (80%)');
  });

  it('should show "Passed" when score is 70% or above', () => {
    render(<ScoreDisplay score={7} total={10} />);

    expect(screen.getByTestId('pass-status')).toHaveTextContent('Passed');
    expect(screen.getByTestId('pass-status')).toHaveClass('text-green-600');
  });

  it('should show "Failed" when score is below 70%', () => {
    render(<ScoreDisplay score={6} total={10} />);

    expect(screen.getByTestId('pass-status')).toHaveTextContent('Failed');
    expect(screen.getByTestId('pass-status')).toHaveClass('text-red-600');
  });

  it('should render reset button when onReset is provided', () => {
    const handleReset = vi.fn();
    render(<ScoreDisplay score={8} total={10} onReset={handleReset} />);

    expect(screen.getByTestId('reset-button')).toBeInTheDocument();
  });

  it('should not render reset button when onReset is not provided', () => {
    render(<ScoreDisplay score={8} total={10} />);

    expect(screen.queryByTestId('reset-button')).not.toBeInTheDocument();
  });

  it('should call onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    const handleReset = vi.fn();
    render(<ScoreDisplay score={8} total={10} onReset={handleReset} />);

    await user.click(screen.getByTestId('reset-button'));

    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('should have accessible region label', () => {
    render(<ScoreDisplay score={8} total={10} />);

    expect(screen.getByRole('region', { name: 'Score summary' })).toBeInTheDocument();
  });
});
```

---

### 3. Custom Hooks
**Coverage Required**: 100%
**Test Types**: Hook tests with Testing Library
**Must Test**:
- Initial state
- State updates
- Side effects
- Cleanup
- Error handling

**Template**:
```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// src/hooks/useLocalStorage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('should use initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('should use stored value when it exists', () => {
    window.localStorage.setItem('test-key', JSON.stringify('stored'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('stored');
  });

  it('should update stored value when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should handle functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should handle JSON parse errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.localStorage.setItem('test-key', 'invalid-json{');

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle localStorage setItem errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(consoleSpy).toHaveBeenCalled();

    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
```

---

### 4. API Routes / Server Actions (Next.js)
**Coverage Required**: 90%
**Test Types**: Integration tests
**Must Test**:
- Successful requests
- Authentication/authorization
- Input validation
- Error responses
- Edge cases

**Template**:
```typescript
// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

const reviewSchema = z.object({
  cardId: z.string().uuid(),
  rating: z.enum(['again', 'hard', 'good', 'easy']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = reviewSchema.parse(body);

    const review = await db.review.create({
      data: {
        userId: session.user.id,
        cardId: validated.cardId,
        rating: validated.rating,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Review creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// src/app/api/reviews/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

vi.mock('next-auth');
vi.mock('@/lib/db');

describe('POST /api/reviews', () => {
  const mockSession = {
    user: { id: 'user-123', email: 'test@example.com' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create review successfully', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(db.review.create).mockResolvedValue({
      id: 'review-123',
      userId: 'user-123',
      cardId: 'card-456',
      rating: 'good',
      createdAt: new Date(),
    });

    const request = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-456',
        rating: 'good',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.cardId).toBe('card-456');
    expect(db.review.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        cardId: 'card-456',
        rating: 'good',
      },
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-456', rating: 'good' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid input', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'invalid-uuid',
        rating: 'invalid-rating',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });

  it('should handle database errors', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(db.review.create).mockRejectedValue(new Error('DB Error'));

    const request = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-456', rating: 'good' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
```

---

### 5. Database Operations / Services
**Coverage Required**: 90%
**Test Types**: Integration tests with test database
**Must Test**:
- CRUD operations
- Query filters
- Transactions
- Error handling
- Data validation

---

### 6. E2E User Flows
**Coverage Required**: Critical paths must be covered
**Test Types**: E2E with Playwright/Cypress
**Must Test**:
- Authentication flows (login, signup, logout)
- Core user journeys (create → read → update → delete)
- Payment flows
- Error scenarios users might encounter

**Template**:
```typescript
// e2e/review-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Review Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should complete a full review session', async ({ page }) => {
    // Navigate to reviews
    await page.click('text=Start Review');
    await expect(page).toHaveURL('/reviews');

    // Answer first card
    await expect(page.locator('[data-testid="flashcard"]')).toBeVisible();
    await page.click('[data-testid="show-answer"]');
    await page.click('[data-testid="rating-good"]');

    // Verify progress updated
    await expect(page.locator('[data-testid="cards-remaining"]')).toContainText('9');

    // Complete all cards
    for (let i = 0; i < 9; i++) {
      await page.click('[data-testid="show-answer"]');
      await page.click('[data-testid="rating-good"]');
    }

    // Verify completion
    await expect(page.locator('[data-testid="session-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toContainText('10/10');
  });

  test('should handle "Again" rating correctly', async ({ page }) => {
    await page.click('text=Start Review');

    await page.click('[data-testid="show-answer"]');
    const cardText = await page.locator('[data-testid="flashcard"]').textContent();

    await page.click('[data-testid="rating-again"]');

    // Card should appear again later in the session
    let foundAgain = false;
    for (let i = 0; i < 10; i++) {
      const currentCard = await page.locator('[data-testid="flashcard"]').textContent();
      if (currentCard === cardText) {
        foundAgain = true;
        break;
      }
      await page.click('[data-testid="show-answer"]');
      await page.click('[data-testid="rating-good"]');
    }

    expect(foundAgain).toBe(true);
  });
});
```

---

## ENFORCEMENT MECHANISMS

### 1. Pre-Commit Checks (Recommended)
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running tests before commit..."
npm test -- --run --coverage

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Commit aborted."
  echo "Fix the failing tests before committing."
  exit 1
fi

echo "✅ All tests passed"
```

### 2. CI Pipeline (MANDATORY)
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --run --coverage
      - run: npm run test:e2e

      - name: Check coverage thresholds
        run: |
          npm run test:coverage-check

  block-if-tests-fail:
    needs: test
    runs-on: ubuntu-latest
    if: failure()
    steps:
      - name: Fail the build
        run: exit 1
```

### 3. Coverage Thresholds (package.json)
```json
{
  "vitest": {
    "coverage": {
      "thresholds": {
        "global": {
          "statements": 70,
          "branches": 70,
          "functions": 70,
          "lines": 70
        }
      }
    }
  }
}
```

---

## AI ASSISTANT RULES FOR TEST GENERATION

When you (Cursor AI) generate code, you MUST:

1. **Always generate tests in the same response as the code**
2. **Never say "you should write tests for this"** - YOU write them
3. **Run tests locally before claiming completion**
4. **If tests fail, fix them immediately**
5. **No placeholder test comments** - write real, complete tests

### Example of CORRECT Behavior:
```
User: "Create a function to validate email addresses"