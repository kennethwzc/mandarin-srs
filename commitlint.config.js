/**
 * Commitlint Configuration
 *
 * Validates commit messages according to Conventional Commits specification.
 * This ensures consistent commit history for better collaboration and debugging.
 *
 * Rules enforce:
 * - Required type (feat, fix, docs, etc.)
 * - Imperative mood (present tense)
 * - No uppercase in subject
 * - No period at end
 * - Maximum 72 character header length
 *
 * @see https://commitlint.js.org/
 * @see https://www.conventionalcommits.org/
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce allowed commit types
    'type-enum': [
      2, // Error level
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting
        'refactor', // Code refactoring
        'perf', // Performance improvement
        'test', // Tests
        'build', // Build system
        'ci', // CI/CD
        'chore', // Maintenance
      ],
    ],
    // Prevent uppercase in subject (except for breaking changes)
    'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
    // Subject cannot be empty
    'subject-empty': [2, 'never'],
    // No period at end of subject
    'subject-full-stop': [2, 'never', '.'],
    // Maximum 72 characters for header (Git best practice)
    'header-max-length': [2, 'always', 72],
  },
}
