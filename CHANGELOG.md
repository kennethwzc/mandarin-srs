# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project setup with Next.js 14 and TypeScript
- Supabase authentication and database integration
- Drizzle ORM for type-safe database access
- Git workflow with conventional commits and Husky hooks
- CI/CD pipeline with GitHub Actions
- Pinyin input system with tone selection
- Comprehensive project documentation

### Changed

### Deprecated

### Removed

### Fixed

### Security

---

## [0.1.0] - YYYY-MM-DD

### Added

- Project foundation and initial setup
- Git version control with branch protection
- Pre-commit hooks for code quality
- GitHub Actions CI/CD workflow
- Commit message conventions
- Pull request and issue templates
- Branching strategy documentation

---

## How to Maintain This Changelog

### When Making Changes

1. **Add items under the appropriate `[Unreleased]` section**:
   - **Added**: New features
   - **Changed**: Changes in existing functionality
   - **Deprecated**: Soon-to-be removed features
   - **Removed**: Removed features
   - **Fixed**: Bug fixes
   - **Security**: Security fixes

2. **Use present tense**: "Add feature" not "Added feature"

3. **Link to issues/PRs when applicable**: `(#123)`

4. **Group related changes**: Keep similar changes together

5. **Be specific**: "Add pinyin input component" not "Add stuff"

### Example Entry

```markdown
### Added

- Pinyin input component with tone selection (#45)
- User dashboard with learning statistics (#67)
- Dark mode support (#89)
```

### When Releasing a Version

1. **Create a new version section** under `[Unreleased]`
2. **Move Unreleased items** to the new version
3. **Add the release date** in `YYYY-MM-DD` format
4. **Clear the Unreleased section** (keep the structure)
5. **Update version links** at the bottom
6. **Commit with message**: `chore: release v1.2.3`
7. **Tag the release**: `git tag v1.2.3`

### Example Release Process

```bash
# 1. Update CHANGELOG.md (move Unreleased to new version)
# 2. Update package.json version
# 3. Commit and tag

git add CHANGELOG.md package.json
git commit -m "chore: release v1.2.3"
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin main --tags
```

### Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes that require users to modify their code
  - Example: API endpoint changes, database schema changes
- **MINOR** (0.1.0): New features, backwards compatible
  - Example: New API endpoints, new UI components
- **PATCH** (0.0.1): Bug fixes, backwards compatible
  - Example: Fixing a calculation bug, fixing a typo

### Version Links

Update these links when creating new releases:

```markdown
[Unreleased]: https://github.com/YOUR_USERNAME/mandarin-srs/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/YOUR_USERNAME/mandarin-srs/releases/tag/v0.1.0
```

### Best Practices

1. **Update on every PR**: Add changelog entry when making changes
2. **Review before release**: Ensure all changes are documented
3. **Be descriptive**: Explain what changed and why (briefly)
4. **Link issues**: Reference issue numbers for context
5. **Group logically**: Keep related changes together
6. **User-focused**: Write from user perspective when possible

### Changelog Entry Examples

**Good**:

```markdown
### Added

- Pinyin input component with tone selector (#45)
- User can now filter lessons by difficulty level (#67)
```

**Bad**:

```markdown
### Added

- Stuff
- Things
- More stuff (#45, #67, #89)
```

### Automated Changelog Generation

For future automation, consider tools like:

- [standard-version](https://github.com/conventional-changelog/standard-version)
- [semantic-release](https://github.com/semantic-release/semantic-release)
- [release-please](https://github.com/googleapis/release-please)

These tools can automatically generate changelog entries from commit messages.

---

## Links

[Unreleased]: https://github.com/YOUR_USERNAME/mandarin-srs/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/YOUR_USERNAME/mandarin-srs/releases/tag/v0.1.0
