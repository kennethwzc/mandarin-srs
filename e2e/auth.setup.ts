import { test as setup } from '@playwright/test'

/**
 * Authentication setup for E2E tests
 *
 * This runs before tests to establish authentication state
 */

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Set timeout to 45 seconds for auth setup
  // This accounts for login, session verification, and dashboard loading
  setup.setTimeout(45000)

  // Navigate to login
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Wait for login form to be ready - both visible AND enabled
  // The inputs might be initially disabled while auth state initializes
  await page.waitForSelector('#email', { state: 'visible' })

  // Wait for the email input to be enabled (not disabled)
  // This ensures the auth loading state has completed
  await page.waitForFunction(
    () => {
      const emailInput = document.querySelector('#email') as HTMLInputElement
      return emailInput && !emailInput.disabled
    },
    { timeout: 10000 }
  )

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

  // Check if login was successful (2xx response)
  if (!response.ok()) {
    throw new Error(`Login failed with status: ${response.status()}`)
  }

  // Wait a short moment for cookies to be set
  await page.waitForTimeout(1000)

  console.log('[Auth Setup] Saving authentication state immediately after login...')

  // Save authentication state RIGHT AFTER LOGIN, before any navigation
  // The auth cookies are set in the response, we don't need to wait for redirect
  // This avoids the browser context being in an unstable state during page navigation
  await page.context().storageState({ path: authFile })

  console.log('[Auth Setup] Authentication state saved successfully')

  // Now verify the auth worked by checking we can navigate to dashboard
  // We do this AFTER saving storage state to avoid blocking on page load
  await page.goto('/dashboard', { waitUntil: 'commit', timeout: 10000 })
  console.log('[Auth Setup] Verified dashboard is accessible')
})
