# Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) v1.0.0

## Format
<type>(<scope>): <subject>

[optional body]

[optional footer]

## Types (REQUIRED)
- **feat**: New feature for the user
- **fix**: Bug fix for the user
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, white-space)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

## Scope (OPTIONAL)
Component affected: auth, srs, review, lesson, dashboard, db, api, ui

## Subject Rules
- Use imperative, present tense: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters

## Examples

Simple feature:
feat(auth): add password reset functionality

Bug fix with body:
fix(srs): correct interval calculation for overdue items

Previously, items overdue by >30 days were penalized too heavily.
Now applies 50% reduction cap as specified in algorithm design.

Breaking change:
feat(api): change review submission endpoint

BREAKING CHANGE: POST /api/reviews now requires item_type field.
Update all API calls to include item_type: 'character' | 'radical' | 'vocabulary'

With issue reference:
fix(lesson): prevent duplicate lesson unlocks

Fixes #142

## Pre-commit Validation
Commits are validated automatically via Husky pre-commit hook.
Invalid format will be rejected.


