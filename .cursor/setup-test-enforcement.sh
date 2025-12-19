#!/bin/bash

# Setup Test Enforcement
# This script updates your pre-commit hook to enforce tests before commits

set -e

echo "🔧 Setting up test enforcement for mandarin-srs"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found${NC}"
  echo "Please run this script from the project root directory"
  exit 1
fi

# Check if husky is installed
if [ ! -d ".husky" ]; then
  echo -e "${YELLOW}⚠️  Husky directory not found. Installing...${NC}"
  pnpm install --save-dev husky
  npx husky install
fi

# Backup existing pre-commit hook
if [ -f ".husky/pre-commit" ]; then
  echo -e "${YELLOW}📋 Backing up existing pre-commit hook...${NC}"
  cp .husky/pre-commit .husky/pre-commit.backup
  echo -e "${GREEN}✅ Backup saved to .husky/pre-commit.backup${NC}"
fi

# Create new pre-commit hook with test enforcement
echo -e "${YELLOW}🔨 Creating new pre-commit hook with test enforcement...${NC}"
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🎨 Running linters and formatters..."
pnpm lint-staged

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Linting failed. Fix the issues above before committing."
  echo ""
  exit 1
fi

echo ""
echo "🧪 Running tests on changed files..."

# Get list of changed test files or source files that have corresponding tests
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No testable files changed, skipping test run"
  exit 0
fi

# Run tests related to changed files
pnpm test -- --bail --findRelatedTests $CHANGED_FILES --passWithNoTests

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Tests failed. Commit blocked."
  echo ""
  echo "💡 Fix the failing tests before committing."
  echo "   Run: pnpm test:watch to interactively fix tests"
  echo ""
  exit 1
fi

echo ""
echo "✅ All checks passed - ready to commit!"
EOF

chmod +x .husky/pre-commit

echo -e "${GREEN}✅ Pre-commit hook updated successfully${NC}"
echo ""

# Check if jest.config.js exists and has coverage thresholds
if [ -f "jest.config.js" ]; then
  if ! grep -q "coverageThreshold" jest.config.js; then
    echo -e "${YELLOW}⚠️  Jest config found but no coverage thresholds set${NC}"
    echo -e "${YELLOW}   Consider adding coverage thresholds to jest.config.js${NC}"
    echo ""
    echo "   Example:"
    echo "   coverageThreshold: {"
    echo "     global: {"
    echo "       statements: 70,"
    echo "       branches: 70,"
    echo "       functions: 70,"
    echo "       lines: 70"
    echo "     }"
    echo "   }"
    echo ""
  else
    echo -e "${GREEN}✅ Coverage thresholds already configured${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  jest.config.js not found${NC}"
fi

# Test the setup
echo -e "${YELLOW}🧪 Testing the setup...${NC}"
echo ""

# Check if tests can run
echo "Running a quick test check..."
if pnpm test -- --listTests > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Test runner is working${NC}"
else
  echo -e "${RED}⚠️  Warning: Test runner may not be configured correctly${NC}"
  echo "   Please verify tests work: pnpm test"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the updated pre-commit hook: .husky/pre-commit"
echo "  2. Read the testing requirements: .cursor/MANDATORY_TEST_REQUIREMENTS.md"
echo "  3. Read the code standards update: .cursor/CODE_STANDARDS_UPDATE.md"
echo "  4. Try making a commit to test the new hook"
echo ""
echo "From now on:"
echo "  ✅ Tests will run before every commit"
echo "  ✅ Commits will be blocked if tests fail"
echo "  ✅ Linting and formatting still enforced"
echo ""
echo "To bypass the hook (NOT RECOMMENDED):"
echo "  git commit --no-verify -m \"your message\""
echo ""
echo -e "${YELLOW}Remember: Code without tests is incomplete code!${NC}"
