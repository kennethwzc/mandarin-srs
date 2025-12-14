module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,jsx}': [
    'eslint --fix --ignore-pattern ".lintstagedrc.js" --ignore-pattern "jest.config.js"',
    'prettier --write',
  ],
  '*.{json,md,css}': ['prettier --write'],
}
