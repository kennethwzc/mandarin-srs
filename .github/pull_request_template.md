## 📝 Description

<!-- Provide a brief description of the changes in this PR. What problem does it solve? What feature does it add? -->

## 🎯 Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] ⚡ Performance improvement
- [ ] ♻️ Code refactoring
- [ ] 🎨 UI/UX improvement
- [ ] 🔧 Configuration change

## 🔗 Related Issues

<!-- Link to related issues using keywords: Closes #123, Fixes #456, Relates to #789 -->

Closes #

## 🧪 Testing

### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] All tests passing locally (`pnpm test`)

### Manual Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on Safari (if applicable)
- [ ] Tested on mobile viewport
- [ ] Tested with screen reader (if accessibility-related)
- [ ] Tested with different user roles (if applicable)

## ✅ Checklist

### Code Quality
- [ ] Code follows project style guidelines (ESLint + Prettier)
- [ ] Self-review completed
- [ ] Complex logic has explanatory comments
- [ ] No `console.log()` or debugging code left in
- [ ] No commented-out code blocks
- [ ] No TODO comments without issue references

### TypeScript
- [ ] TypeScript compiles with no errors (`pnpm typecheck`)
- [ ] No `any` types used (or justified in comments)
- [ ] Proper type definitions for new functions/components
- [ ] Types exported where needed

### Documentation
- [ ] README updated (if needed)
- [ ] JSDoc comments added for public functions
- [ ] Inline comments for complex logic
- [ ] CHANGELOG.md updated (if applicable)
- [ ] API documentation updated (if applicable)

### Security
- [ ] No sensitive data (API keys, passwords) in code
- [ ] Input validation added where needed
- [ ] SQL injection prevention verified (using Drizzle ORM)
- [ ] XSS prevention verified
- [ ] Authentication/authorization checks in place
- [ ] Rate limiting considered (if applicable)

### Performance
- [ ] No unnecessary re-renders
- [ ] Large lists use virtualization (if applicable)
- [ ] Images optimized with `next/image`
- [ ] Database queries optimized with indexes
- [ ] No memory leaks
- [ ] Bundle size impact assessed

### Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels added where needed
- [ ] Keyboard navigation works
- [ ] Focus management implemented
- [ ] Color contrast meets WCAG AA standards

## 📸 Screenshots

<!-- Add screenshots for UI changes. Use before/after format if modifying existing UI -->

### Before
<!-- Screenshot before changes -->

### After
<!-- Screenshot after changes -->

## 🚀 Deployment Notes

<!-- Any special considerations for deployment? Database migrations? Environment variable changes? Breaking changes? -->

**Environment Variables**:
- [ ] No new environment variables needed
- [ ] New environment variables documented in `.env.example`
- [ ] Migration guide provided (if breaking changes)

**Database**:
- [ ] No database changes
- [ ] Migration script provided
- [ ] Rollback plan documented

## 📌 Additional Context

<!-- Any other information that reviewers should know. Design decisions, trade-offs, future improvements, etc. -->

---

**Reviewer Checklist** (for code reviewer):
- [ ] Code logic is correct and follows best practices
- [ ] Tests are comprehensive and passing
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] Documentation is clear and accurate
- [ ] Code is maintainable and readable
- [ ] Breaking changes are clearly documented
