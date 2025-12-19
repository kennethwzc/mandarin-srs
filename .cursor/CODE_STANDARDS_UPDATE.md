# Code Standards Update: Mandatory Testing

## 🔴 CRITICAL UPDATE - READ THIS FIRST

**Problem Identified**: Code is being committed and pushed without tests passing, causing CI/E2E failures.

**Root Cause**: Pre-commit hooks only run linting/formatting, NOT tests.

**Solution**: Updated workflow that makes tests mandatory at every step.

---

## What's Changed in Your Code Standards

### Section 0: CODE GENERATION WORKFLOW - NOW INCLUDES TESTS

**OLD Workflow:**
```
1. Write code
2. Commit
3. Push
4. CI fails ❌
```

**NEW Workflow (MANDATORY):**
```
1. Write code
2. Write tests (IMMEDIATELY)
3. Run tests locally (must pass)
4. Lint/format (existing pre-commit hook)
5. Run tests again (new pre-commit hook)
6. Commit (only if tests pass)
7. Push
8. CI passes ✅
```

### Before Writing Code (UPDATED)
1. Clarify ambiguity
2. State assumptions
3. Plan first
4. **Identify what tests are needed** ← NEW
5. Check existing code

### During Code Generation (UPDATED)
1. Implement incrementally
2. **Write tests for each implementation** ← NEW
3. **Run tests locally** ← NEW
4. Explain non-obvious decisions
5. Flag issues/trade-offs

### After Code Generation (UPDATED)
1. Summarize what was built
2. **Verify all new code has test coverage** ← NEW
3. **Run full test suite locally** ← NEW
4. List incomplete items
5. Suggest additional tests

---

## Immediate Action Required

### Step 1: Update Pre-Commit Hook (DO THIS NOW)

Your current pre-commit hook only runs linting. Update it to run tests:

```bash
# Update .husky/pre-commit
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting and formatting on staged files
echo "🎨 Running linters and formatters..."
pnpm lint-staged

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Linting failed. Fix the issues above before committing."
  exit 1
fi

# Run tests before allowing commit
echo ""
echo "🧪 Running tests before commit..."
pnpm test -- --passWithNoTests --bail --findRelatedTests

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Tests failed. Commit blocked."
  echo "💡 Fix the failing tests before committing."
  echo ""
  exit 1
fi

echo "✅ All checks passed"
EOF

chmod +x .husky/pre-commit
```

### Step 2: Verify Test Scripts

Make sure you can run tests locally:

```bash
# Run unit/integration tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests (should be run before pushing)
pnpm test:e2e
```

### Step 3: Update AI Instructions

When asking AI to write code, ALWAYS include:
- "Write tests for this code"
- "Ensure tests pass before showing me the code"
- "Include test coverage for edge cases"

---

## Testing Requirements by Code Type

### ✅ MUST Have Tests (100% Required)

| Code Type | Test Type | Minimum Coverage |
|-----------|-----------|------------------|
| **Utility functions** | Unit | 100% |
| **Custom hooks** | Hook tests | 100% |
| **API routes/Server actions** | Integration | 90% |
| **Business logic** | Unit | 90% |
| **Bug fixes** | Regression | N/A (must reproduce bug) |

### ⚠️ SHOULD Have Tests (70%+ Required)

| Code Type | Test Type | Minimum Coverage |
|-----------|-----------|------------------|
| **React components** | Component tests | 70% |
| **Database operations** | Integration | 70% |
| **Form validation** | Unit + Integration | 70% |

### 🔵 E2E Tests (Critical Paths Only)

| Flow | When Required |
|------|---------------|
| **Authentication** | Login, signup, logout |
| **Core user journeys** | Main features (review flow, lessons) |
| **Payment flows** | If applicable |
| **Data mutations** | Create, update, delete operations |

---

## Quick Reference: Test Commands

```bash
# Run all unit/integration tests
pnpm test

# Run tests in watch mode (during development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run only tests related to changed files
pnpm test -- --findRelatedTests path/to/file.ts

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode (interactive)
pnpm test:e2e:ui

# Run all tests (unit + E2E) - DO THIS BEFORE PUSHING
pnpm test:all
```

---

## Example: Correct Workflow

### ❌ WRONG (Old Way)
```
Developer: "Add a calculateScore function"

AI writes:
export function calculateScore(correct: number, total: number) {
  return (correct / total) * 100;
}

Developer commits ❌ (no tests)
CI fails ❌
```

### ✅ CORRECT (New Way)
```
Developer: "Add a calculateScore function WITH TESTS"

AI writes:
// src/utils/calculate-score.ts
export function calculateScore(correct: number, total: number) {
  if (total === 0) throw new Error('Total cannot be zero');
  return Math.round((correct / total) * 100);
}

// src/utils/calculate-score.test.ts
import { calculateScore } from './calculate-score';

describe('calculateScore', () => {
  it('should calculate percentage correctly', () => {
    expect(calculateScore(8, 10)).toBe(80);
  });

  it('should throw when total is zero', () => {
    expect(() => calculateScore(5, 0)).toThrow();
  });
});

AI runs: pnpm test ✅ (passes)
Developer commits ✅ (pre-commit runs tests, passes)
CI passes ✅
```

---

## Coverage Requirements

### Project-Wide Targets
- **Overall coverage**: 70% minimum
- **Critical paths**: 90%+ minimum
- **Utilities/helpers**: 100% required

### Check Coverage
```bash
# Generate coverage report
pnpm test:coverage

# Open coverage report in browser
open coverage/lcov-report/index.html
```

### Coverage Enforcement (TODO)
Add to `jest.config.js`:
```javascript
module.exports = {
  // ... existing config
  coverageThresholds: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};
```

---

## When Can You Skip Tests?

### ✅ OK to Skip
- Documentation changes (README, markdown files)
- Configuration files (no logic)
- Type definitions only
- One-off scripts/migrations (but document why)

### ❌ NEVER Skip
- New features
- Bug fixes
- Refactoring
- API endpoints
- Business logic
- User-facing components

---

## Dealing with Failing CI

### If CI Tests Fail After Your Push:

1. **Check the logs**: What test failed?
2. **Reproduce locally**: Run the same test locally
3. **Fix the test**: Update code or test
4. **Verify**: Run full test suite locally
5. **Commit fix**: Tests should pass in pre-commit
6. **Push**: CI should now pass

### Common CI Failure Causes:
- Environment variables not set in CI
- Tests dependent on local state/database
- Timing issues (async tests)
- Missing test data/fixtures
- Flaky tests (write better tests!)

---

## Test Organization

```
/src
  /components
    Button.tsx
    Button.test.tsx          ← Component tests
  /hooks
    useAuth.ts
    useAuth.test.ts          ← Hook tests
  /utils
    calculate-score.ts
    calculate-score.test.ts  ← Unit tests
  /app
    /api
      /reviews
        route.ts
        route.test.ts        ← Integration tests

/e2e
  auth.spec.ts               ← E2E tests
  review-flow.spec.ts        ← E2E tests
```

---

## AI Assistant Rules (CRITICAL)

When AI generates code, it MUST:

1. ✅ Generate tests in the same response
2. ✅ Run tests and show results
3. ✅ Fix any failing tests before finishing
4. ❌ NEVER say "you should write tests for this"
5. ❌ NEVER use placeholder comments like "// TODO: add tests"
6. ❌ NEVER claim code is complete without tests

---

## Enforcement Checklist

Before every commit, verify:
- [ ] All new functions have tests
- [ ] All modified functions have updated tests
- [ ] Tests pass locally (`pnpm test`)
- [ ] No test coverage dropped
- [ ] E2E tests pass if UI changed (`pnpm test:e2e`)
- [ ] No console.log or debug code left
- [ ] Pre-commit hook passed

Before every push, verify:
- [ ] Full test suite passes (`pnpm test:all`)
- [ ] Coverage meets thresholds
- [ ] All changes are committed
- [ ] Branch is up to date with main/develop

---

## Resources

- Full testing requirements: `.cursor/MANDATORY_TEST_REQUIREMENTS.md`
- Testing enforcement guide: `.cursor/TESTING_ENFORCEMENT_SUMMARY.md`
- Test examples: See templates in `MANDATORY_TEST_REQUIREMENTS.md`

---

## Questions?

**Q: How do I run just the tests for files I changed?**
A: `pnpm test -- --findRelatedTests path/to/your/file.ts`

**Q: My tests are slow, can I skip them?**
A: No. Optimize the tests instead (use mocks, reduce setup).

**Q: What if I'm just prototyping?**
A: Use a WIP branch and `git commit --no-verify`, but add tests before merging.

**Q: What test framework do we use?**
A: Jest for unit/integration, Playwright for E2E, Testing Library for React.

**Q: How do I test async code?**
A: Use `async/await` in tests. See Jest docs for async testing.

---

## Summary

🔴 **Code without tests is incomplete code**
🔴 **Tests must pass before committing**
🔴 **Pre-commit hook now enforces this**
🔴 **AI must generate tests with code**
🔴 **No exceptions**

Update your pre-commit hook NOW using Step 1 above.