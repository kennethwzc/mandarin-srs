#!/usr/bin/env bash

# CI Verification Script
# Runs all checks that CI runs to catch issues before commit
# Usage: ./scripts/verify-ci.sh [--full]
#   --full: Include build check (slower, ~30s)

set -e  # Exit on error

# Find pnpm command
if command -v pnpm >/dev/null 2>&1; then
  PNPM_CMD="pnpm"
else
  PNPM_CMD="npx pnpm"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if --full flag is provided
FULL_MODE=false
if [[ "$1" == "--full" ]]; then
  FULL_MODE=true
fi

echo -e "${BLUE}🔍 Running CI verification checks...${NC}\n"

# Function to print check header
check_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}▶ $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print success
check_success() {
  echo -e "${GREEN}✓ $1 passed${NC}\n"
}

# Function to print error and exit
check_error() {
  echo -e "${RED}✗ $1 failed${NC}\n"
  echo -e "${RED}Please fix the errors above before committing.${NC}"
  exit 1
}

# 1. Lint check (all files)
check_header "1/4 Running ESLint (all files)"
if $PNPM_CMD lint; then
  check_success "ESLint"
else
  check_error "ESLint"
fi

# 2. Format check (all files)
check_header "2/4 Checking Prettier formatting (all files)"
if $PNPM_CMD format:check; then
  check_success "Prettier"
else
  check_error "Prettier"
fi

# 3. TypeScript typecheck
check_header "3/4 Running TypeScript typecheck"
if $PNPM_CMD typecheck; then
  check_success "TypeScript"
else
  check_error "TypeScript"
fi

# 4. Tests with coverage
check_header "4/4 Running tests with coverage"
if $PNPM_CMD test:ci; then
  check_success "Tests"
else
  check_error "Tests"
fi

# 5. Build (only in full mode)
if [ "$FULL_MODE" = true ]; then
  check_header "5/5 Building application (production)"
  if SKIP_ENV_VALIDATION=1 $PNPM_CMD build; then
    check_success "Build"
  else
    check_error "Build"
  fi
else
  echo -e "${YELLOW}⏭  Skipping build check (use --full to include)${NC}\n"
fi

# All checks passed
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All CI checks passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
exit 0
