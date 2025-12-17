import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

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

  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASSWORD || 'testpassword123'

  console.log('[Auth Setup] Using email:', email)

  // ✅ Ensure test user email is confirmed using Admin API (if available)
  // This step is optional - if admin API is not configured, we assume the user is already confirmed
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    supabaseUrl &&
    serviceRoleKey &&
    serviceRoleKey !== 'placeholder-key' &&
    serviceRoleKey.length > 20
  ) {
    console.log('[Auth Setup] Admin API available, checking email confirmation status...')
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // Get user by email
      const {
        data: { users },
        error: listError,
      } = await supabase.auth.admin.listUsers()

      if (listError) {
        console.warn('[Auth Setup] Could not access admin API:', listError.message)
        console.log('[Auth Setup] Continuing without email confirmation check')
      } else {
        const testUser = users.find((u) => u.email === email)

        if (testUser) {
          console.log('[Auth Setup] Found test user')

          // Check if email is already confirmed
          if (!testUser.email_confirmed_at) {
            console.log('[Auth Setup] Email not confirmed, confirming now...')

            // Update user to mark email as confirmed
            const { error: updateError } = await supabase.auth.admin.updateUserById(testUser.id, {
              email_confirm: true,
            })

            if (updateError) {
              console.warn('[Auth Setup] Could not confirm email:', updateError.message)
              console.log('[Auth Setup] Test may fail if email confirmation is required')
            } else {
              console.log('[Auth Setup] ✅ Email confirmed successfully')
            }
          } else {
            console.log('[Auth Setup] ✅ Email already confirmed')
          }
        } else {
          console.log('[Auth Setup] Test user not found in database')
          console.log('[Auth Setup] User will be created on first signup or may already exist')
        }
      }
    } catch (e) {
      console.warn('[Auth Setup] Admin API error:', e instanceof Error ? e.message : String(e))
      console.log('[Auth Setup] Continuing without email confirmation - test may fail if required')
    }
  } else {
    console.log('[Auth Setup] ⚠️  Admin API not configured, skipping email confirmation check')
    console.log('[Auth Setup] Assuming test user email is already confirmed')
    console.log(
      '[Auth Setup] If tests fail, set SUPABASE_SERVICE_ROLE_KEY in GitHub Secrets or .env.local'
    )
  }

  // Navigate to login
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Dismiss cookie banner if it appears (blocks login button)
  try {
    // Look for the cookie banner by its text content
    const cookieBanner = page.getByText('Cookie Preferences')
    const isVisible = await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)
    if (isVisible) {
      console.log('[Auth Setup] Cookie banner detected, dismissing...')
      // Click "Accept All" button
      await page.getByRole('button', { name: 'Accept All' }).click({ timeout: 5000 })
      console.log('[Auth Setup] Clicked Accept All button')
      // Wait for banner to disappear
      await page.waitForTimeout(1000)
      console.log('[Auth Setup] Cookie banner dismissed')
    } else {
      console.log('[Auth Setup] No cookie banner found')
    }
  } catch (e) {
    // Cookie banner might not appear, continue
    console.log('[Auth Setup] No cookie banner to dismiss or error:', e)
  }

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
  await page.fill('#email', email)
  await page.fill('#password', password)

  // Submit login form
  // Note: Supabase auth happens client-side, so we wait for navigation instead of API response
  console.log('[Auth Setup] Submitting login form...')

  await Promise.all([
    // Wait for navigation to complete (either to dashboard or error state)
    page.waitForURL('**', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ])

  console.log('[Auth Setup] Navigation completed, current URL:', page.url())

  // Wait for auth cookies to be set
  await page.waitForTimeout(2000)

  // Check if we successfully authenticated by trying to access dashboard
  // If login failed, we'd still be on /login or see an error
  const currentUrl = page.url()

  // If we're still on login page after clicking submit, auth failed
  if (currentUrl.includes('/login')) {
    console.error('[Auth Setup] ❌ Still on login page - authentication may have failed')
    // Try to check for error messages
    const errorMsg = await page.textContent('[role="alert"]').catch(() => null)
    if (errorMsg) {
      console.error('[Auth Setup] Error message:', errorMsg)
    }
    throw new Error('Authentication failed - still on login page')
  }

  // If we're redirected to /confirm-email, the email isn't confirmed
  // This means the Admin API wasn't able to confirm it (or wasn't available)
  if (currentUrl.includes('/confirm-email')) {
    console.error('[Auth Setup] ❌ Redirected to /confirm-email - email not confirmed')
    console.error('[Auth Setup] This means:')
    console.error('[Auth Setup]   1. SUPABASE_SERVICE_ROLE_KEY is not set or invalid')
    console.error('[Auth Setup]   2. Test user email was not confirmed by Admin API')
    console.error('[Auth Setup]   3. Middleware is blocking access to protected routes')
    console.error('[Auth Setup]')
    console.error('[Auth Setup] To fix this:')
    console.error('[Auth Setup]   - Add SUPABASE_SERVICE_ROLE_KEY to GitHub Secrets (for CI)')
    console.error('[Auth Setup]   - Add SUPABASE_SERVICE_ROLE_KEY to .env.local (for local tests)')
    console.error('[Auth Setup]   - OR manually confirm the test user email in Supabase dashboard')
    throw new Error(
      'Test user email not confirmed - cannot access protected routes. See logs for details.'
    )
  }

  console.log('[Auth Setup] ✅ Login successful')

  // Navigate to dashboard to ensure auth state is fully established
  await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
  console.log('[Auth Setup] Dashboard loaded successfully')

  // Save authentication state after successful navigation
  await page.context().storageState({ path: authFile })
  console.log('[Auth Setup] Authentication state saved successfully')
})
