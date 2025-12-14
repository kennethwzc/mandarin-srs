# GitHub Repository Setup Guide

This guide walks you through setting up the GitHub repository for the Mandarin SRS project with proper branch protection, CI/CD, and collaboration features.

## Step 1: Create Repository on GitHub

1. Navigate to https://github.com/new
2. **Repository name**: `mandarin-srs`
3. **Description**: `Spaced repetition learning platform for Mandarin Chinese - Type pinyin to learn characters`
4. **Visibility**: **Private** (change to public at launch)
5. **⚠️ IMPORTANT**: **DO NOT** initialize with README, .gitignore, or license (we have these locally)
6. Click "Create repository"

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you the commands. Copy the repository URL, then run:

### Using SSH (Recommended)

```bash
# Add GitHub remote
git remote add origin git@github.com:YOUR_USERNAME/mandarin-srs.git

# Verify remote was added
git remote -v

# Push initial commit to GitHub
git push -u origin main
```

### Using HTTPS (Alternative)

If you don't have SSH keys set up:

```bash
git remote add origin https://github.com/YOUR_USERNAME/mandarin-srs.git
git push -u origin main
```

**Note**: You'll need a Personal Access Token for HTTPS authentication. Generate one at: https://github.com/settings/tokens

## Step 3: Configure Repository Settings

### A. General Settings

Navigate to: **Settings → General**

**Features**:
- ✅ **Issues** - Enable for bug tracking and feature requests
- ✅ **Discussions** (optional) - Enable for community discussions
- ✅ **Projects** - Enable for project management boards

**Pull Requests**:
- ✅ **Allow squash merging** - Recommended for clean history
- ✅ **Allow auto-merge** - Automatically merge when checks pass
- ✅ **Automatically delete head branches** - Clean up merged branches

### B. Branch Protection Rules

Navigate to: **Settings → Branches → Add rule**

**Branch name pattern**: `main`

**Protection settings**:
- ✅ **Require a pull request before merging**
  - Required approvals: **1** (can skip for solo initially, increase for team)
  - Dismiss stale pull request approvals when new commits are pushed
- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - Required checks: `lint`, `typecheck`, `test`, `build`
  - (These will appear after first CI run)
- ✅ **Require conversation resolution before merging**
- ✅ **Do not allow bypassing the above settings** (strict mode)
- ❌ **Do not allow force pushes**
- ❌ **Do not allow deletions**

**Why these rules?**
- Prevents direct commits to main (forces code review)
- Ensures all code passes CI checks before merging
- Maintains clean git history
- Protects against accidental force pushes

### C. GitHub Secrets (for CI/CD)

Navigate to: **Settings → Secrets and variables → Actions**

Click "New repository secret" for each required secret:

| Secret Name | Description | Example Value | When Needed |
|-------------|-------------|---------------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` | After Supabase setup |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` | After Supabase setup |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) | `eyJhbGc...` | After Supabase setup |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:...` | After database setup |

⚠️ **SECURITY WARNING**: 
- Never commit these secrets to git
- Never share secrets in screenshots or documentation
- Rotate secrets if accidentally exposed
- Use different secrets for development/staging/production

### D. Collaborators (for Team Projects)

Navigate to: **Settings → Collaborators and teams**

1. Click "Add people"
2. Invite collaborators by GitHub username or email
3. Choose permission level:
   - **Read** - Can view and clone
   - **Write** - Can push to non-protected branches
   - **Admin** - Full access (use sparingly)

## Step 4: Verify Setup

### Check Remote Connection

```bash
# Verify remote is configured
git remote -v

# Should show:
# origin  git@github.com:YOUR_USERNAME/mandarin-srs.git (fetch)
# origin  git@github.com:YOUR_USERNAME/mandarin-srs.git (push)
```

### Verify Branch Protection

1. Go to: `https://github.com/YOUR_USERNAME/mandarin-srs/settings/branches`
2. Should see "main" branch with protection rules enabled
3. Try to push directly to main - should be blocked (if protection is working)

### Test CI Workflow

1. Make a small change (e.g., update README)
2. Create a feature branch: `git checkout -b test/ci-workflow`
3. Commit and push: `git push origin test/ci-workflow`
4. Create a Pull Request on GitHub
5. Check the "Actions" tab - CI should run automatically
6. Verify all checks pass: lint, typecheck, test, build

## Troubleshooting

### SSH Key Not Configured

If you get "Permission denied" when using SSH:

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub
# 1. Copy your public key:
cat ~/.ssh/id_ed25519.pub

# 2. Go to: https://github.com/settings/keys
# 3. Click "New SSH key"
# 4. Paste the key and save
```

### Permission Denied (HTTPS)

If using HTTPS and getting authentication errors:

1. Generate Personal Access Token: https://github.com/settings/tokens
2. Select scopes: `repo` (full control of private repositories)
3. Copy the token
4. Use token as password when pushing: `git push origin main`
5. Or configure credential helper: `git config --global credential.helper osxkeychain`

### CI Workflow Failing

Common issues:

1. **Missing secrets**: Ensure all required secrets are added in repository settings
2. **Secret names**: Verify secret names match exactly (case-sensitive)
3. **Check Actions tab**: View detailed error logs at `https://github.com/YOUR_USERNAME/mandarin-srs/actions`
4. **Node version**: Ensure Node.js version in workflow matches local version
5. **Lock file**: Ensure `pnpm-lock.yaml` is committed

### Branch Protection Not Working

1. Verify branch name matches exactly: `main` (not `master`)
2. Ensure at least one CI check has run (required checks appear after first run)
3. Check that you're not an admin bypassing rules (if testing)

## Next Steps

After completing this setup:

1. ✅ **Git Setup** - You are here
2. → **Supabase Integration** - Set up database and auth
3. → **Database Schema** - Design and implement tables
4. → **SRS Algorithm** - Implement spaced repetition logic
5. → **Frontend Development** - Build the learning interface

## Additional Resources

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH Key Setup Guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
