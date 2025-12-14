# Git Branching Strategy

## Overview

This project uses a simplified Git Flow suitable for solo development with future team expansion. The strategy balances simplicity for individual work with structure for team collaboration.

## Branch Types

### 1. Main Branch: `main`

- **Purpose**: Production-ready code
- **Protected**: Yes (requires PR + passing CI)
- **Deployed to**: Production (auto-deploy via Vercel)
- **Never commit directly**: Always use PR
- **Status**: Always deployable

**Rules**:

- ✅ All commits must come from Pull Requests
- ✅ All CI checks must pass before merging
- ✅ At least one approval required (can be self for solo dev)
- ✅ No force pushes allowed
- ✅ No deletions allowed

### 2. Feature Branches: `feature/*`

- **Purpose**: New features or enhancements
- **Created from**: `main`
- **Merged into**: `main` (via PR)
- **Naming**: `feature/short-description`
- **Lifespan**: Temporary (delete after merge)

**Examples**:

- `feature/pinyin-input`
- `feature/tone-selector`
- `feature/lesson-unlocking`
- `feature/dashboard-stats`

**Workflow**:

1. Create from latest `main`
2. Develop feature with frequent commits
3. Push to GitHub
4. Create Pull Request
5. Address review feedback
6. Merge via GitHub UI (squash recommended)
7. Delete branch after merge

### 3. Bug Fix Branches: `fix/*`

- **Purpose**: Bug fixes
- **Created from**: `main`
- **Merged into**: `main` (via PR)
- **Naming**: `fix/short-description` or `fix/issue-number`
- **Lifespan**: Temporary (delete after merge)

**Examples**:

- `fix/srs-calculation-bug`
- `fix/issue-142`
- `fix/auth-redirect-loop`
- `fix/mobile-layout-overflow`

**Workflow**:

1. Create from `main`
2. Fix the bug
3. Add/update tests
4. Create PR with issue reference
5. Merge after review
6. Delete branch

### 4. Hotfix Branches: `hotfix/*`

- **Purpose**: Critical production bugs requiring immediate fix
- **Created from**: `main`
- **Merged into**: `main` (expedited PR process)
- **Naming**: `hotfix/critical-issue`
- **Lifespan**: Very short (merge ASAP)

**Examples**:

- `hotfix/payment-gateway-down`
- `hotfix/data-leak`
- `hotfix/security-vulnerability`

**Workflow**:

1. Create from `main` immediately
2. Fix the critical issue
3. Test thoroughly
4. Create PR with "HOTFIX" label
5. Get immediate review
6. Merge and deploy immediately
7. Delete branch

### 5. Refactor Branches: `refactor/*`

- **Purpose**: Code improvements without changing functionality
- **Created from**: `main`
- **Merged into**: `main` (via PR)
- **Naming**: `refactor/component-or-area`

**Examples**:

- `refactor/srs-algorithm-cleanup`
- `refactor/database-queries`
- `refactor/auth-middleware`
- `refactor/component-structure`

**Workflow**:

1. Create from `main`
2. Refactor code
3. Ensure all tests still pass
4. Create PR explaining benefits
5. Merge after review

### 6. Documentation Branches: `docs/*`

- **Purpose**: Documentation-only changes
- **Created from**: `main`
- **Merged into**: `main` (via PR)
- **Naming**: `docs/what-is-updated`

**Examples**:

- `docs/api-documentation`
- `docs/setup-guide`
- `docs/contributing-guide`
- `docs/architecture-decision`

**Workflow**:

1. Create from `main`
2. Update documentation
3. Create PR (can skip CI for docs-only)
4. Merge after review

## Workflow

### Creating a Feature Branch

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-new-feature

# 3. Work on feature (commit frequently)
git add .
git commit -m "feat(scope): description"

# 4. Push to GitHub
git push origin feature/my-new-feature

# 5. Create Pull Request on GitHub
# Navigate to: https://github.com/YOUR_USERNAME/mandarin-srs/pulls
# Click "New Pull Request"
# Select: base: main <- compare: feature/my-new-feature
# Fill out PR template
# Request review (if team project)

# 6. After PR approval and CI passes, merge via GitHub UI

# 7. Delete branch locally and remotely
git checkout main
git pull origin main
git branch -d feature/my-new-feature
git push origin --delete feature/my-new-feature
```

### Hotfix Workflow (Emergency)

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix the bug
git add .
git commit -m "fix: critical bug description"

# 3. Push and create PR
git push origin hotfix/critical-bug

# 4. Get immediate review and merge
# 5. Deploy to production immediately
```

### Keeping Feature Branch Updated

If `main` has updates while you're working on a feature branch:

**Option 1: Rebase (Recommended for cleaner history)**

```bash
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# If conflicts occur:
# Fix conflicts in your editor
git add <fixed-file>
git rebase --continue

# Push updated branch (force push needed after rebase)
git push origin feature/my-feature --force-with-lease
```

**Option 2: Merge (Preserves history)**

```bash
git checkout feature/my-feature
git fetch origin
git merge origin/main

# Push updated branch
git push origin feature/my-feature
```

**When to use each**:

- **Rebase**: Small feature branches, cleaner history preferred
- **Merge**: Large features, want to preserve all commit context

## Commit Guidelines

### Frequency

- Commit early and often
- Each commit should be a logical unit of work
- Aim for 5-10 commits per day of active development
- Never commit broken code (tests should pass)

### Message Format

Follow Conventional Commits (see `.github/COMMIT_CONVENTION.md`):

```
type(scope): subject

body

footer
```

### Atomic Commits

Each commit should:

- Be self-contained and functional
- Pass all tests
- Be easily revertable
- Have a clear purpose
- Not break the build

### Examples of Good vs Bad Commits

**❌ Bad**:

```bash
git commit -m "fixed stuff"
git commit -m "more changes"
git commit -m "wip"  # Work in progress commits pollute history
git commit -m "asdf"  # Meaningless messages
```

**✅ Good**:

```bash
git commit -m "feat(auth): add email validation to signup form"
git commit -m "test(auth): add unit tests for email validator"
git commit -m "refactor(auth): extract validation logic to utils"
git commit -m "fix(srs): correct interval calculation for overdue items

Previously, items overdue by >30 days were penalized too heavily.
Now applies 50% reduction cap as specified in algorithm design."
```

## Code Review Process

### For Author (Creating PR)

1. ✅ Self-review code before requesting review
2. ✅ Ensure all CI checks pass
3. ✅ Write clear PR description using template
4. ✅ Link related issues
5. ✅ Add screenshots for UI changes
6. ✅ Respond to feedback constructively
7. ✅ Keep PR focused (one feature/fix per PR)

### For Reviewer

1. 🔍 Check code logic and correctness
2. 🔍 Verify tests cover new functionality
3. 🔍 Check for security vulnerabilities
4. 🔍 Assess performance impact
5. 🔍 Verify documentation is updated
6. 🔍 Check for code style consistency
7. 💬 Provide constructive feedback
8. ✅ Approve when satisfied

## Merge Strategies

### Squash and Merge (Recommended)

- **Use for**: Feature branches with many small commits
- **Result**: Clean, linear history on main
- **GitHub setting**: "Squash and merge"
- **When**: Most feature branches

### Regular Merge

- **Use for**: Important historical context needed
- **Result**: Preserves all commits with merge commit
- **GitHub setting**: "Create a merge commit"
- **When**: Large features with significant commit history

### Rebase and Merge

- **Use for**: Small, clean feature branches
- **Result**: Linear history without merge commit
- **GitHub setting**: "Rebase and merge"
- **When**: Single-commit PRs or very clean branches

**Default for this project**: Squash and merge

## Conflict Resolution

### During Rebase

```bash
# If you get merge conflicts during rebase
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# Fix conflicts in your editor
# For each conflicted file:
git add <fixed-file>

# Continue rebase
git rebase --continue

# If you want to abort
git rebase --abort

# Push updated branch
git push origin feature/my-feature --force-with-lease
```

### During Merge

```bash
# If you get merge conflicts during merge
git checkout feature/my-feature
git fetch origin
git merge origin/main

# Fix conflicts in your editor
git add <fixed-file>

# Complete merge
git commit

# Push updated branch
git push origin feature/my-feature
```

## Protected Branch Rules (main)

✅ **Require pull request before merging**

- Required approvals: 1 (can skip for solo initially)
- Dismiss stale approvals when new commits pushed

✅ **Require status checks to pass**

- `lint` - ESLint and Prettier checks
- `typecheck` - TypeScript compilation
- `test` - Test suite execution
- `build` - Production build verification

✅ **Require branches to be up to date before merging**

✅ **Require conversation resolution before merging**

❌ **Do not allow force push**

❌ **Do not allow deletions**

## Tips

### Git Aliases for Efficiency

Add to `~/.gitconfig`:

```ini
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = log --oneline --graph --decorate --all
  amend = commit --amend --no-edit
  undo = reset --soft HEAD~1
  lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
```

### Check Before Committing

```bash
# See what will be committed
git diff --cached

# See current status
git status

# See commit history
git log --oneline -10

# See what changed in a file
git diff <filename>
```

### Branch Hygiene

```bash
# List all local branches
git branch

# List merged branches (safe to delete)
git branch --merged

# Delete merged branches (except main)
git branch --merged | grep -v "main" | xargs git branch -d

# Prune deleted remote branches
git fetch --prune

# List all remote branches
git branch -r
```

### Stashing Work

```bash
# Save current work without committing
git stash

# List stashes
git stash list

# Apply most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{0}

# Drop a stash
git stash drop stash@{0}
```

## Common Scenarios

### Accidentally Committed to Main

```bash
# Create a branch from current main
git branch fix/my-changes
git reset --hard origin/main
git checkout fix/my-changes
# Now create PR from fix/my-changes
```

### Need to Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
# Changes are staged, ready to recommit
```

### Need to Undo Last Commit (Discard Changes)

```bash
git reset --hard HEAD~1
# ⚠️ WARNING: This permanently deletes changes
```

### Find When a Bug Was Introduced

```bash
# Use git bisect to find the commit that introduced a bug
git bisect start
git bisect bad  # Current commit is bad
git bisect good <commit-hash>  # This commit was good
# Git will checkout commits for you to test
git bisect good  # If this commit is good
git bisect bad   # If this commit is bad
# Repeat until git finds the bad commit
git bisect reset  # Return to original branch
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
