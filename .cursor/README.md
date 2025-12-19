# Cursor AI Code Standards & Testing Enforcement

This directory contains the code standards, testing requirements, and enforcement mechanisms for the mandarin-srs project.

## 📋 Quick Start

**If you're seeing this because tests are failing in CI:**

1. **Read this first**: `CODE_STANDARDS_UPDATE.md` - Explains what changed and why
2. **Set up test enforcement**: Run `.cursor/setup-test-enforcement.sh`
3. **Learn the requirements**: `MANDATORY_TEST_REQUIREMENTS.md` - Detailed test examples
4. **Understand the system**: `TESTING_ENFORCEMENT_SUMMARY.md` - Overall strategy

## 📁 Files in This Directory

### Core Documents

| File | Purpose | Read This If... |
|------|---------|----------------|
| **CODE_STANDARDS_UPDATE.md** | Updated workflow with mandatory testing | Tests are failing in CI |
| **MANDATORY_TEST_REQUIREMENTS.md** | Detailed testing requirements & examples | You need to write tests |
| **TESTING_ENFORCEMENT_SUMMARY.md** | Overview of enforcement strategy | You want to understand the system |
| **setup-test-enforcement.sh** | Automated setup script | You want to enable test enforcement |

### Original Document
- `CURSOR AI CODE STANDARDS & BEHAVIOR RULES.md` - Your comprehensive original code standards

---

## 🚀 Getting Started

### Step 1: Run the Setup Script
```bash
cd /home/user/mandarin-srs
./.cursor/setup-test-enforcement.sh
```

This will:
- Update your pre-commit hook to run tests
- Backup your existing hook
- Verify test runner works
- Give you next steps

### Step 2: Understand the New Workflow
```
Old: Write code → Commit → Push → CI fails ❌
New: Write code → Write tests → Run tests → Commit → Push → CI passes ✅
```

### Step 3: Write Tests for Your Code
See `MANDATORY_TEST_REQUIREMENTS.md` for templates and examples.

---

## 🔍 Quick Reference

### Test Commands
```bash
# Run all tests
pnpm test

# Run tests in watch mode (during development)
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run all tests (before pushing)
pnpm test:all
```

### When to Write Tests

| Code Type | Test Required? | Coverage |
|-----------|---------------|----------|
| Utility function | ✅ YES | 100% |
| React component | ✅ YES | 70%+ |
| Custom hook | ✅ YES | 100% |
| API route | ✅ YES | 90%+ |
| Bug fix | ✅ YES | Regression test |
| Documentation | ❌ NO | N/A |

### Test Types in This Project

- **Unit Tests**: Jest (`*.test.ts`, `*.test.tsx`)
- **Integration Tests**: Jest (in `integration/` or `route.test.ts`)
- **Component Tests**: Testing Library (`*.test.tsx`)
- **E2E Tests**: Playwright (`e2e/*.spec.ts`)

---

## 🛠️ Enforcement Layers

### Layer 1: Pre-Commit Hook (Local)
- Runs on every commit attempt
- Executes tests for changed files
- Blocks commit if tests fail
- Immediate feedback loop

**Location**: `.husky/pre-commit`

### Layer 2: CI Pipeline (Remote)
- Runs on every push
- Executes full test suite
- Runs E2E tests
- Blocks PR merge if tests fail

**Location**: `.github/workflows/ci.yml`, `.github/workflows/e2e-tests.yml`

### Layer 3: AI Assistant Rules
- AI must generate tests with code
- No placeholder test comments
- Tests must pass before code is considered complete

**Location**: This directory's documentation

---

## 📊 Coverage Requirements

### Minimum Thresholds
- **Overall**: 70%
- **Utilities**: 100%
- **Business Logic**: 90%
- **Components**: 70%

### Check Coverage
```bash
pnpm test:coverage
open coverage/lcov-report/index.html
```

---

## 🤖 AI Assistant Integration

### When Asking AI to Write Code

❌ **Bad Request:**
```
"Add a calculateScore function"
```

✅ **Good Request:**
```
"Add a calculateScore function WITH TESTS.
Include edge cases and error handling."
```

### What AI Should Do
1. Generate implementation code
2. Generate comprehensive tests
3. Run tests and show results
4. Fix any failing tests
5. Only then claim completion

### What AI Should NOT Do
- ❌ Say "you should write tests for this"
- ❌ Use `// TODO: add tests` comments
- ❌ Skip tests because "it's simple"
- ❌ Claim code is complete without tests

---

## 🔧 Configuration Files

### Test Configuration
- **Jest**: `jest.config.js` - Unit/integration test runner
- **Playwright**: `playwright.config.ts` - E2E test runner
- **Testing Library**: Configured in Jest setup

### Git Hooks
- **Pre-commit**: `.husky/pre-commit` - Runs linting + tests
- **Commit-msg**: `.husky/commit-msg` - Validates commit message format

### Linting
- **Lint-staged**: `.lintstagedrc.js` - Formats staged files
- **ESLint**: `.eslintrc.js` - Linting rules
- **Prettier**: `.prettierrc` - Code formatting

---

## 📖 Detailed Documentation

### For Writing Tests
**Start here**: `MANDATORY_TEST_REQUIREMENTS.md`

This document includes:
- Decision tree: When do I need tests?
- Templates for every test type
- Complete working examples
- Coverage requirements by code type

### For Understanding Workflow
**Start here**: `CODE_STANDARDS_UPDATE.md`

This document covers:
- What changed in your workflow
- How to update your pre-commit hook
- Quick reference for test commands
- Troubleshooting CI failures

### For System Overview
**Start here**: `TESTING_ENFORCEMENT_SUMMARY.md`

This document explains:
- Why tests are now mandatory
- Three-layer enforcement strategy
- Test-driven development flow
- Success metrics to track

---

## 🆘 Troubleshooting

### Pre-Commit Hook Failing

**Problem**: Tests fail when trying to commit

**Solution**:
1. Look at which test failed in the output
2. Run `pnpm test:watch` to interactively fix it
3. Fix the failing test
4. Try committing again

### CI Tests Failing

**Problem**: Tests pass locally but fail in CI

**Possible causes**:
- Missing environment variables in CI
- Tests depend on local state/database
- Async timing issues
- Missing test data

**Solution**:
1. Check CI logs for specific failure
2. Reproduce locally with same environment
3. Fix the test to be environment-independent
4. Push again

### Too Slow to Commit

**Problem**: Running all tests is too slow

**Current behavior**: Pre-commit only runs tests for changed files

**If still too slow**:
- Optimize your tests (use mocks, reduce setup)
- Consider splitting large test files
- Use `test.skip()` temporarily for unrelated tests
- As last resort: `git commit --no-verify` (but add tests before pushing!)

---

## 📈 Success Metrics

Track these over time to measure improvement:
- ✅ Test coverage % (target: 80%+)
- ✅ CI failure rate (target: <5%)
- ✅ Time to fix CI failures (target: <10 minutes)
- ✅ Production bugs (target: trending down)

---

## 🎯 Goals

1. **Prevent broken code from reaching CI** - Catch issues locally
2. **Maintain high code quality** - Tests as documentation
3. **Build confidence in changes** - Refactor safely
4. **Speed up development** - Less debugging, more building

---

## 📚 Additional Resources

### Testing Guides
- Jest: https://jestjs.io/docs/getting-started
- Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Playwright: https://playwright.dev/docs/intro

### Best Practices
- Test-Driven Development (TDD)
- Testing Trophy (Integration > Unit > E2E)
- Write tests that mirror user behavior
- Keep tests simple and focused

---

## 🔄 Keeping This Updated

When code standards change:
1. Update the relevant document in `.cursor/`
2. Update this README if structure changes
3. Announce changes to the team
4. Update AI prompts if needed

---

## ❓ Questions?

- **How do I write a specific type of test?** → See `MANDATORY_TEST_REQUIREMENTS.md`
- **Why are my commits being blocked?** → See "Troubleshooting" above
- **Can I skip tests for a quick fix?** → No. Fix the tests, it's faster than debugging production
- **What if I'm just prototyping?** → Use WIP branch + `--no-verify`, but add tests before merging

---

## 📝 Summary

🔴 **Tests are mandatory**
🔴 **Pre-commit hook enforces this**
🔴 **AI must generate tests with code**
🔴 **No code is complete without tests**

**Next step**: Run `.cursor/setup-test-enforcement.sh` to get started!