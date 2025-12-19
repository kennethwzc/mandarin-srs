# Integration Guide: Adding Testing to Code Standards

This guide explains how the new testing requirements integrate with your existing "CURSOR AI CODE STANDARDS & BEHAVIOR RULES" document.

## Changes to Original Document

### Section 0: CODE GENERATION WORKFLOW

**Add to "A. Before Writing Code"** (after item 5):
```markdown
6. **Identify required tests** - Determine what tests need to be written
   - Utility function? → Unit tests (100% coverage)
   - Component? → Component tests (70%+ coverage)
   - API route? → Integration tests (90%+ coverage)
   - Bug fix? → Regression test required
```

**Add to "B. During Code Generation"** (as new item 3):
```markdown
3. **Write tests immediately** - Tests are written WITH code, not after
   - Write minimal implementation
   - Write tests for that implementation
   - Run tests locally
   - Iterate until tests pass
```

**Add to "C. After Code Generation"** (as new item 2):
```markdown
2. **Verify test coverage** - MANDATORY before completion
   - Run: pnpm test:coverage
   - Verify coverage meets minimums (70% overall, 100% for utilities)
   - Run full test suite: pnpm test
   - All tests must pass
```

**Add new section "D. Before Committing"**:
```markdown
### D. Before Committing (MANDATORY)
1. **Run full test suite locally** - pnpm test
2. **All tests must pass** - No exceptions
3. **Verify no test coverage dropped**
4. **Pre-commit hook will enforce**:
   - Linting/formatting (existing)
   - Tests on changed files (NEW)
   - Blocks commit if tests fail
5. **Before pushing**: Run pnpm test:all (includes E2E)
```

---

### Section V: TESTING STANDARDS

**Replace entire section with**:

```markdown
## V. TESTING STANDARDS

> **CRITICAL**: All code must have tests. No exceptions.

### A. Test Coverage Requirements (MANDATORY)

| Code Type | Test Type | Minimum Coverage |
|-----------|-----------|------------------|
| Utility functions | Unit | 100% (MANDATORY) |
| Custom hooks | Hook tests | 100% (MANDATORY) |
| API routes/Server actions | Integration | 90% |
| Business logic | Unit | 90% |
| React components | Component | 70% |
| Bug fixes | Regression | Required (reproduces bug) |
| E2E flows | E2E | Critical user paths only |

**Enforcement**:
- Pre-commit hook blocks commits with failing tests
- CI pipeline blocks merges with failing tests
- Coverage thresholds enforced in jest.config.js

### B. Test Organization

**File Naming**:
- Component tests: `ComponentName.test.tsx`
- Hook tests: `useHookName.test.ts`
- Utility tests: `utility-name.test.ts`
- Integration tests: `route.test.ts` or `integration/*.test.ts`
- E2E tests: `e2e/feature-name.spec.ts`

**File Location**:
- Unit/component tests: Next to source file
- Integration tests: Next to route or in `integration/`
- E2E tests: In `e2e/` directory

### C. Test Development Flow

**Rule**: Tests are written WITH code, never after.

1. Write minimal implementation
2. Write tests immediately
3. Run tests: `pnpm test:watch`
4. Fix failures
5. Repeat for next feature

### D. Testing Best Practices

**DO**:
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names (should/when/given)
- ✅ Follow Arrange-Act-Assert pattern
- ✅ Mock external dependencies
- ✅ Test edge cases and error conditions
- ✅ Keep tests simple and focused
- ✅ Use Testing Library queries that mirror user behavior

**DON'T**:
- ❌ Skip tests because "it's simple"
- ❌ Write tests after implementation
- ❌ Test library internals
- ❌ Use placeholder comments like "// TODO: add tests"
- ❌ Commit code without tests
- ❌ Ignore failing tests

### E. Test Commands

```bash
# Run all tests
pnpm test

# Run in watch mode (during development)
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run all tests (before pushing)
pnpm test:all
```

### F. AI Assistant Test Requirements

When generating code, AI MUST:
1. Generate tests in the same response as implementation
2. Run tests and show passing results
3. Fix any failing tests before claiming completion
4. NEVER use placeholder test comments
5. NEVER say "you should write tests" - AI writes them

For detailed test examples and templates, see:
- `.cursor/MANDATORY_TEST_REQUIREMENTS.md`
- `.cursor/CODE_STANDARDS_UPDATE.md`
```

---

### Section XI: CODE REVIEW CHECKLIST

**Add these items** (before submitting code):

```markdown
- [ ] **All new code has tests**
- [ ] **Tests pass locally (pnpm test)**
- [ ] **Test coverage meets minimums** (check with pnpm test:coverage)
- [ ] **E2E tests updated if UI changed**
- [ ] **Regression test added for bug fixes**
- [ ] **No test files skipped or disabled**
- [ ] **Pre-commit hook passed**
```

---

### Section VII: GIT COMMIT STANDARDS

**Add new subsection "C. Pre-Commit Checks"**:

```markdown
### C. Pre-Commit Checks (Automated)

Before each commit, the pre-commit hook automatically:
1. Runs lint-staged (formatting/linting)
2. Runs tests on changed files
3. Blocks commit if either fails

**What this means for you**:
- Fix linting issues before committing
- Fix test failures before committing
- Commit early and often (tests give confidence)

**If hook blocks your commit**:
1. Read the error message
2. Fix the issue (linting or tests)
3. Try committing again

**Emergency bypass** (NOT RECOMMENDED):
```bash
git commit --no-verify -m "WIP: describe why"
```
Must add tests before merging to main!
```

---

### Section III: BEST PRACTICES - CODE QUALITY

**Add new subsection "H. Test-First Development"**:

```markdown
### H. Test-First Development

**Philosophy**: Tests are not optional. They are part of the code.

**Benefits**:
- Catch bugs before they reach production
- Refactor with confidence
- Document expected behavior
- Faster debugging (tests pinpoint issues)
- Better design (testable code is better code)

**When to write tests**:
- **ALWAYS** - Tests are written WITH code, not after
- Before implementation (TDD) or immediately after
- Before commit (enforced by pre-commit hook)

**Exception handling in tests**:
- Test happy path (expected behavior)
- Test sad path (error conditions)
- Test edge cases (boundaries, empty, null, undefined)

**Example: Test-First Flow**
```typescript
// 1. Write test first (Red)
test('calculateScore returns percentage', () => {
  expect(calculateScore(8, 10)).toBe(80);
});

// 2. Write minimal implementation (Green)
function calculateScore(correct: number, total: number) {
  return Math.round((correct / total) * 100);
}

// 3. Refactor if needed
```
```

---

### ENFORCEMENT PRIORITY

**Update CRITICAL section to include**:

```markdown
**CRITICAL (Must have):**
- Error handling
- Input validation
- Security practices
- Git commit standards
- SRP, DRY, and Clean Code compliance
- Loose coupling / high cohesion
- Pre-coding workflow (clarify → plan → implement)
- Output completeness (no placeholders)
- **Tests for all code** ← NEW
- **Pre-commit tests passing** ← NEW
- **Test coverage thresholds met** ← NEW
```

---

## Summary of Integration

### Key Additions
1. **Section 0**: Testing checkpoints in workflow
2. **Section V**: Complete rewrite with mandatory requirements
3. **Section XI**: Test-related checklist items
4. **Section VII**: Pre-commit hook documentation
5. **Section III**: Test-first development philosophy
6. **Enforcement**: Tests elevated to CRITICAL priority

### Philosophy Shift
- **Old**: Tests are "should have" or "nice to have"
- **New**: Tests are MANDATORY part of code completion

### Practical Changes
- Pre-commit hook now runs tests
- AI must generate tests with code
- Coverage thresholds enforced
- CI blocks merges without tests

---

## Implementation Steps

1. **Read** all new documents in `.cursor/`:
   - CODE_STANDARDS_UPDATE.md
   - MANDATORY_TEST_REQUIREMENTS.md
   - TESTING_ENFORCEMENT_SUMMARY.md

2. **Run** setup script:
   ```bash
   ./.cursor/setup-test-enforcement.sh
   ```

3. **Update** your AI prompts to always include "with tests"

4. **Integrate** these changes into your team's workflow

5. **Enforce** through code reviews and CI

---

## Quick Reference Card

Print this and put it near your monitor:

```
╔══════════════════════════════════════════════════╗
║         TESTING IS MANDATORY                     ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Before Writing Code:                            ║
║    ☐ What tests do I need?                      ║
║                                                  ║
║  While Writing Code:                             ║
║    ☐ Write test immediately                     ║
║    ☐ Run: pnpm test:watch                       ║
║                                                  ║
║  Before Committing:                              ║
║    ☐ Run: pnpm test                             ║
║    ☐ All tests pass?                            ║
║    ☐ Coverage met?                              ║
║                                                  ║
║  Before Pushing:                                 ║
║    ☐ Run: pnpm test:all                         ║
║    ☐ E2E tests pass?                            ║
║                                                  ║
║  Code without tests is incomplete code.          ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Next Steps

1. ✅ Review this integration guide
2. ✅ Run setup script
3. ✅ Update original code standards document (optional)
4. ✅ Share with team
5. ✅ Start writing tests with all new code

The new documents in `.cursor/` supplement your existing standards.
You can keep them separate or integrate them - your choice!