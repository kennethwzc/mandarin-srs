import { test as setup } from '@playwright/test'

/**
 * Authentication setup for E2E tests
 *
 * This runs before tests to establish authentication state
 */

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('/login')

  // Fill in test credentials
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com')
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword123')

  // Submit login form
  await page.click('button[type="submit"]')

  // Wait for successful redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
