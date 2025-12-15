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
  await page.waitForLoadState('networkidle')

  // Wait for login form to be ready
  await page.waitForSelector('#email', { state: 'visible' })

  // Fill in test credentials
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASSWORD || 'testpassword123'

  console.log('[Auth Setup] Using email:', email)

  await page.fill('#email', email)
  await page.fill('#password', password)

  // Submit login form and wait for navigation
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes('/auth/') && resp.request().method() === 'POST',
      { timeout: 10000 }
    ),
    page.click('button[type="submit"]'),
  ])

  console.log('[Auth Setup] Login response status:', response.status())

  // Wait a moment for session to be established
  await page.waitForTimeout(2000)

  // Check for error messages
  const errorMessage = await page
    .locator('text=/error|invalid|failed/i')
    .first()
    .textContent()
    .catch(() => null)
  if (errorMessage) {
    throw new Error(`Login failed with error: ${errorMessage}`)
  }

  // Check current URL
  const currentUrl = page.url()
  console.log('[Auth Setup] Current URL after login:', currentUrl)

  // Wait for redirect to dashboard with longer timeout
  // The login page has complex session verification logic that may take time
  await page.waitForURL('/dashboard', { timeout: 30000 })

  console.log('[Auth Setup] Successfully redirected to dashboard')

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
