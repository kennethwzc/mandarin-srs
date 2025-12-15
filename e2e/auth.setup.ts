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

  // Wait a moment for session to be established
  await page.waitForTimeout(2000)

  // Wait for redirect to dashboard with longer timeout
  // The login page has complex session verification logic that may take time
  // If login failed, we'd stay on /login page, so this check validates auth success
  await page.waitForURL('/dashboard', { timeout: 30000 })

  console.log('[Auth Setup] Successfully redirected to dashboard')

  // Wait for the dashboard heading to appear - this indicates the page rendered
  // We don't wait for networkidle because the app may have persistent connections
  // (Supabase realtime, etc.) that prevent it from ever becoming idle
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 })
  console.log('[Auth Setup] Dashboard loaded')

  // Give a short delay for cookies and storage to settle
  await page.waitForTimeout(2000)

  // Check for authentication-specific errors only
  // Note: We ignore general app errors like "Failed to load dashboard data"
  // since those don't indicate authentication failure
  const authErrorMessage = await page
    .locator('text=/invalid.*password|invalid.*email|authentication failed|login failed/i')
    .first()
    .textContent()
    .catch(() => null)
  if (authErrorMessage) {
    throw new Error(`Authentication failed: ${authErrorMessage}`)
  }

  console.log('[Auth Setup] Saving authentication state...')

  // Save authentication state
  await page.context().storageState({ path: authFile })

  console.log('[Auth Setup] Authentication state saved successfully')
})
