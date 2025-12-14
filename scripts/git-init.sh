#!/bin/bash

# Initial Git Setup Script
# 
# This script initializes the Git repository with proper configuration
# and creates the initial commit with all project boilerplate.
# 
# Run this after project scaffolding is complete.
# 
# Usage: ./scripts/git-init.sh

set -e  # Exit on error

echo "🚀 Initializing Git repository..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "   macOS: Install Xcode Command Line Tools: xcode-select --install"
    echo "   Linux: sudo apt-get install git (Ubuntu/Debian) or sudo yum install git (RHEL/CentOS)"
    exit 1
fi

# Initialize git if not already initialized
if [ ! -d .git ]; then
    git init
    echo "✅ Git repository initialized"
else
    echo "ℹ️  Git repository already initialized"
fi

# Set default branch to main (not master)
# This ensures we use inclusive naming from the start
git branch -M main
echo "✅ Default branch set to 'main'"

# Check git user config
# Warn if not set, but don't fail (user might want to set globally)
if ! git config user.name > /dev/null 2>&1; then
    echo "⚠️  Git user.name not set"
    echo "   Please run: git config --global user.name 'Your Name'"
    echo "   Or set locally: git config user.name 'Your Name'"
fi

if ! git config user.email > /dev/null 2>&1; then
    echo "⚠️  Git user.email not set"
    echo "   Please run: git config --global user.email 'your.email@example.com'"
    echo "   Or set locally: git config user.email 'your.email@example.com'"
fi

# Stage all files
echo "📦 Staging all files..."
git add .

# Check if there are files to commit
if git diff --cached --quiet; then
    echo "ℹ️  No files to commit (all changes already committed)"
    exit 0
fi

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "chore: initial project setup

- Next.js 14 with App Router and TypeScript
- Supabase integration for auth and database
- Drizzle ORM for type-safe database access
- Tailwind CSS and shadcn/ui for styling
- ESLint and Prettier for code quality
- Husky and lint-staged for pre-commit hooks
- GitHub Actions CI/CD workflow
- Conventional Commits specification
- Comprehensive project documentation
- Pinyin input system for Mandarin learning

Tech Stack:
- Frontend: Next.js 14, React, TypeScript
- Backend: Next.js API Routes, Supabase
- Database: PostgreSQL (via Supabase)
- ORM: Drizzle
- State: Zustand
- Styling: Tailwind CSS
- Testing: Jest, React Testing Library
- Deployment: Vercel

See README.md for setup instructions.
"

echo "✅ Initial commit created"
echo ""
echo "📝 Next steps:"
echo "   1. Create GitHub repository at: https://github.com/new"
echo "      - Name: mandarin-srs"
echo "      - DO NOT initialize with README, .gitignore, or license"
echo "   2. Copy your repository URL (SSH or HTTPS)"
echo "   3. Run: git remote add origin <your-repo-url>"
echo "   4. Run: git push -u origin main"
echo ""
echo "📚 See docs/GITHUB_SETUP.md for detailed instructions"
echo ""
echo "🔍 To verify setup:"
echo "   - Check git status: git status"
echo "   - View commit: git log --oneline -1"
echo "   - Test pre-commit hook: make a small change and try to commit"
