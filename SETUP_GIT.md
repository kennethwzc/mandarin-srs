# Git Setup Instructions

This document provides step-by-step instructions for completing the Git setup after your Next.js project is initialized.

## Prerequisites

- Node.js 20+ installed
- pnpm installed (`npm install -g pnpm`)
- Git installed and configured

## Step 1: Install Dependencies

First, ensure your `package.json` exists (it should be created when you initialize the Next.js project). Then install the Git-related dependencies:

```bash
# Install Husky, lint-staged, and commitlint
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

## Step 2: Initialize Husky

```bash
# Initialize Husky (creates .husky directory)
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Add commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit ${1}'
```

**Note**: The hook files (`.husky/pre-commit` and `.husky/commit-msg`) are already created in this repository. Husky will use them automatically.

## Step 3: Update package.json

Add the following to your `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx,mjs,cjs}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml,css,scss}": [
      "prettier --write"
    ]
  }
}
```

The `prepare` script ensures Husky is installed automatically when someone runs `pnpm install`.

## Step 4: Verify Setup

### Test Pre-commit Hook

```bash
# Make a small change
echo "// test" >> src/app/page.tsx

# Stage the file
git add src/app/page.tsx

# Try to commit (should trigger pre-commit hook)
git commit -m "test: verify pre-commit hook"
```

You should see:
- Lint-staged running
- TypeScript type checking
- Files being formatted

### Test Commit Message Validation

```bash
# This should FAIL (invalid format)
git commit --allow-empty -m "bad message"

# This should SUCCEED (valid format)
git commit --allow-empty -m "test: verify commit message validation"
```

## Step 5: Initialize Git Repository

If you haven't already initialized Git:

```bash
# Run the initialization script
./scripts/git-init.sh
```

This will:
- Initialize Git repository (if not already done)
- Set default branch to `main`
- Create initial commit with all project files

## Step 6: Connect to GitHub

Follow the instructions in `docs/GITHUB_SETUP.md` to:
1. Create GitHub repository
2. Connect local repository to GitHub
3. Configure branch protection
4. Set up GitHub Secrets for CI/CD

## Troubleshooting

### Husky Hooks Not Running

```bash
# Reinstall Husky
npx husky install

# Verify hooks are executable
ls -la .husky/
# Should show pre-commit and commit-msg as executable
```

### Commitlint Not Working

```bash
# Verify commitlint is installed
npx commitlint --version

# Test commitlint manually
echo "feat: test" | npx commitlint
```

### Lint-staged Not Running

```bash
# Verify lint-staged is installed
npx lint-staged --version

# Run lint-staged manually
npx lint-staged
```

### TypeScript Errors in Pre-commit

If TypeScript errors are blocking commits:

1. Fix the errors in your code
2. Or temporarily comment out the typecheck step in `.husky/pre-commit`:
   ```bash
   # pnpm typecheck
   ```

**Note**: It's better to fix the errors than skip the check!

## Next Steps

After Git setup is complete:

1. ✅ Create GitHub repository
2. ✅ Push initial commit
3. ✅ Configure branch protection
4. → Continue with Supabase setup
5. → Set up database schema
6. → Implement SRS algorithm

## Additional Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
