# Testing Enforcement Summary

## Problem
- Commits and pushes cause E2E and CI tests to fail
- Code is being written without accompanying tests
- Testing is treated as optional, not mandatory

## Solution: 3-Layer Enforcement Strategy

### Layer 1: AI Assistant Rules (Immediate)
**File**: `.cursor/MANDATORY_TEST_REQUIREMENTS.md`

**Key Changes**:
- Tests are now REQUIRED, not optional
- AI must generate tests in the same response as code
- No code is complete without tests
- Decision trees for when tests are needed (spoiler: always)

**AI Behavior**:
- ✅ Generate code + tests together
- ✅ Run tests before claiming completion
- ❌ Never say "you should write tests" - the AI writes them
- ❌ No placeholder test comments

### Layer 2: Git Hooks (Local Enforcement)
**Prevents commits with failing tests**

```bash
# Install husky
npm install --save-dev husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npm test -- --run"
```

**What it does**:
- Runs all tests before every commit
- Blocks commit if any test fails
- Forces developer to fix tests immediately

### Layer 3: CI Pipeline (Remote Enforcement)
**Prevents merging code with failing tests**

**What it does**:
- Runs full test suite on every push
- Runs E2E tests
- Checks coverage thresholds
- Blocks PR merge if tests fail

---

## Implementation Checklist

### ✅ Immediate (Already Done)
- [x] Created MANDATORY_TEST_REQUIREMENTS.md
- [x] Created TESTING_ENFORCEMENT_SUMMARY.md

### 🔧 Recommended Setup (Do Next)
- [ ] Install git hooks (see below)
- [ ] Update CI pipeline to block on test failures
- [ ] Add coverage thresholds to vitest config
- [ ] Review existing untested code and add tests

### 📋 Ongoing Process
- [ ] Every new feature = tests required
- [ ] Every bug fix = regression test required
- [ ] Code review checklist: "Are tests included?"

---

## Quick Setup Commands

### 1. Install Pre-Commit Hooks
```bash
# Install husky
npm install --save-dev husky

# Initialize husky
npx husky install

# Auto-enable git hooks on npm install
npm pkg set scripts.prepare="husky install"

# Create pre-commit hook that runs tests
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🧪 Running tests before commit..."
npm test -- --run

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Tests failed. Commit blocked."
  echo "💡 Fix the failing tests before committing."
  echo ""
  exit 1
fi

echo "✅ All tests passed"
EOF

chmod +x .husky/pre-commit
```

### 2. Add Coverage Thresholds
```bash
# Add to vitest.config.ts or package.json
cat >> vitest.config.ts << 'EOF'

// Add to test config:
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    thresholds: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
}
EOF
```

### 3. Update CI to Block on Failures
Ensure your `.github/workflows/*.yml` includes:
```yaml
- name: Run Tests
  run: npm test -- --run --coverage

- name: Run E2E Tests
  run: npm run test:e2e

- name: Check Coverage
  run: npm run test:coverage-check || exit 1
```

---

## Test-Driven Development Flow

### Old (Broken) Flow:
```
1. Write code
2. Commit code
3. Push code
4. CI fails ❌
5. "Oops, forgot tests"
6. Write tests
7. Push again
```

### New (Enforced) Flow:
```
1. Write code
2. Write tests (IMMEDIATELY)
3. Run tests locally
4. Fix any failures
5. Commit (pre-commit hook runs tests)
   ├─ Pass ✅ → Commit succeeds
   └─ Fail ❌ → Commit blocked, go back to step 4
6. Push
7. CI runs (should pass because local tests passed)
```

---

## What Tests to Write (Quick Reference)

| Code Type | Test Type | Coverage | Example |
|-----------|-----------|----------|---------|
| Utility function | Unit | 100% | `calculateScore.test.ts` |
| React component | Component | 70%+ | `ScoreDisplay.test.tsx` |
| Custom hook | Hook test | 100% | `useLocalStorage.test.ts` |
| API route | Integration | 90%+ | `route.test.ts` |
| User flow | E2E | Critical paths | `review-flow.spec.ts` |
| Bug fix | Regression | N/A | Reproduce bug, then fix |

---

## Common Excuses & Responses

| Excuse | Response |
|--------|----------|
| "I'll write tests later" | No. Tests are written WITH the code, not after. |
| "This is just a small change" | Small changes can break things. Tests required. |
| "The tests are flaky" | Fix the flaky tests. Don't skip them. |
| "Tests slow me down" | Fixing production bugs slows you down more. |
| "I don't know how to test this" | Ask for help. Use the templates in MANDATORY_TEST_REQUIREMENTS.md |
| "CI tests are failing but my code works locally" | Then the tests are catching environment issues. Fix them. |

---

## Success Metrics

Track these over time:
- **Test coverage %** (should trend upward toward 80%+)
- **CI failure rate** (should trend downward toward <5%)
- **Time to fix CI failures** (should trend downward)
- **Production bugs** (should trend downward)

---

## Emergency Override (Use Sparingly)

If you ABSOLUTELY must commit without tests (prototype, spike, etc.):

```bash
# Skip pre-commit hook (NOT RECOMMENDED)
git commit --no-verify -m "WIP: prototyping feature X"

# But you MUST:
# 1. Mark the commit as WIP
# 2. Add tests before merging to main
# 3. Document why tests were skipped
```

**Warning**: CI will still fail. This only bypasses local hooks.

---

## Questions?

- **"What test framework should I use?"** → Check package.json. Likely Vitest + Testing Library + Playwright.
- **"How do I run tests?"** → `npm test` (unit), `npm run test:e2e` (E2E)
- **"What's the minimum coverage?"** → 70% overall, 100% for utilities
- **"Do I need E2E tests for every feature?"** → Only for user-facing flows. See decision tree.

---

## Next Steps

1. **Read** `MANDATORY_TEST_REQUIREMENTS.md` in full
2. **Install** git hooks using commands above
3. **Update** your AI prompts to include "write tests"
4. **Review** existing untested code and prioritize adding tests
5. **Commit** to never pushing untested code again

---

**Remember**: Code without tests is incomplete code. Period.