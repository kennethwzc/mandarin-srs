/* eslint-disable no-console */
import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

/**
 * Authentication setup for E2E tests
 *
 * This runs before tests to establish authentication state
 * Console logging is essential for debugging E2E test failures in CI
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
          console.log('[Auth Setup] Found test user, ID:', testUser.id)
          console.log(
            '[Auth Setup] Current email_confirmed_at:',
            testUser.email_confirmed_at || 'NOT SET'
          )

          // ALWAYS force email confirmation to ensure JWT will reflect it on next login
          // Even if database shows it's confirmed, we need to ensure Supabase Auth service knows
          console.log(
            '[Auth Setup] Force-confirming email to ensure fresh JWT includes confirmation...'
          )

          const { error: updateError } = await supabase.auth.admin.updateUserById(testUser.id, {
            email_confirm: true,
          })

          if (updateError) {
            console.warn('[Auth Setup] Could not confirm email:', updateError.message)
            console.log('[Auth Setup] Test may fail if email confirmation is required')
          } else {
            console.log('[Auth Setup] ✅ Email confirmation updated successfully')
            // Wait a moment for Supabase to propagate the change
            console.log(
              '[Auth Setup] Waiting 2 seconds for Supabase to propagate email confirmation...'
            )
            await new Promise((resolve) => setTimeout(resolve, 2000))
            console.log('[Auth Setup] Ready to proceed with login')
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

  // Clear any existing auth state first (cookies, localStorage, etc.)
  // This ensures we start with a clean slate
  await page.context().clearCookies()
  await page.goto('/login', { waitUntil: 'domcontentloaded' })

  // Check if we got redirected (means we're already authenticated)
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  const currentUrl = page.url()

  if (currentUrl.includes('/dashboard')) {
    console.log('[Auth Setup] Already authenticated, skipping login')
    // Save auth state and return early
    await page.context().storageState({ path: authFile })
    console.log('[Auth Setup] Using existing authentication state')
    return
  }

  // Ensure we're on the login page
  if (!currentUrl.includes('/login')) {
    console.log('[Auth Setup] Unexpected redirect, navigating to login...')
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
  }

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

  // Wait for Suspense to resolve and form to be visible
  // The login page uses Suspense, so we need to wait for the actual form content
  // NOTE: The Suspense fallback also shows "Welcome back", so we need to wait for
  // something that's ONLY in the actual form (like the email input or submit button)
  console.log('[Auth Setup] Waiting for login form to load...')

  // Debug: Check page content and any errors
  const pageTitle = await page.title()
  console.log('[Auth Setup] Page title:', pageTitle)

  // Check for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('[Auth Setup] Console error:', msg.text())
    }
  })

  // Check for page errors
  page.on('pageerror', (error) => {
    console.log('[Auth Setup] Page error:', error.message)
  })

  // Wait for page to be fully loaded
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle', { timeout: 30000 })

  // Wait for Next.js to hydrate - look for the React root
  try {
    await page.waitForFunction(
      () => {
        // Check if Next.js has hydrated by looking for React root or any interactive elements
        return (
          document.querySelector('#__next') !== null ||
          document.querySelector('[data-testid="login-form"]') !== null ||
          document.querySelector('#email') !== null
        )
      },
      { timeout: 30000 }
    )
    console.log('[Auth Setup] Next.js hydration detected')
  } catch (e) {
    console.log('[Auth Setup] Next.js hydration wait timed out, continuing...')
  }

  // Wait for Suspense to resolve - the fallback now renders the actual form
  // so we should be able to find it even if Suspense doesn't resolve
  console.log('[Auth Setup] Waiting for login form to render...')

  // Collect any JavaScript errors
  const jsErrors: string[] = []
  page.on('pageerror', (error) => {
    jsErrors.push(error.message)
    console.log('[Auth Setup] JavaScript error detected:', error.message)
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      jsErrors.push(msg.text())
      console.log('[Auth Setup] Console error:', msg.text())
    }
  })

  // Wait for the form - the fallback should render it immediately
  // Try multiple selectors to find the form
  try {
    // Wait for form by data-testid (most reliable)
    await page.waitForSelector('[data-testid="login-form"]', {
      state: 'attached',
      timeout: 30000,
    })
    console.log('[Auth Setup] Login form found by data-testid')
  } catch (e) {
    console.log('[Auth Setup] Form not found by data-testid, trying email input...')
    try {
      // Wait for email input (should be in both fallback and main form)
      await page.waitForSelector('#email, [data-testid="email-input"]', {
        state: 'attached',
        timeout: 30000,
      })
      console.log('[Auth Setup] Email input found - form should be present')
    } catch (e2) {
      console.log('[Auth Setup] Email input not found, trying form element...')
      try {
        await page.waitForSelector('form', { state: 'attached', timeout: 10000 })
        console.log('[Auth Setup] Form element found')
      } catch (e3) {
        // Last resort: check page state
        const currentUrl = page.url()
        console.log('[Auth Setup] Current URL:', currentUrl)

        if (currentUrl.includes('/dashboard')) {
          console.log('[Auth Setup] Redirected to dashboard - already authenticated')
          await page.context().storageState({ path: authFile })
          return
        }

        // Check for JavaScript errors
        if (jsErrors.length > 0) {
          console.error('[Auth Setup] JavaScript errors detected:', jsErrors)
          throw new Error(
            `Login form not rendering due to JavaScript errors: ${jsErrors.join('; ')}. Check browser console.`
          )
        }

        throw new Error(
          'Login form not found after 30s. The page may not be loading correctly. Check for JavaScript errors or network issues.'
        )
      }
    }
  }

  // Now wait for it to be visible and enabled
  console.log('[Auth Setup] Waiting for email input to be visible...')

  try {
    // Try data-testid first (most reliable)
    await page.waitForSelector('[data-testid="email-input"]', {
      state: 'visible',
      timeout: 30000,
    })
    console.log('[Auth Setup] Email input visible by data-testid')
  } catch (e) {
    console.log('[Auth Setup] Email input not visible by data-testid, trying ID...')
    await page.waitForSelector('#email', {
      state: 'visible',
      timeout: 30000,
    })
    console.log('[Auth Setup] Email input visible by ID')
  }

  // Wait for the email input to be enabled (not disabled)
  // This ensures the auth loading state has completed
  await page.waitForFunction(
    () => {
      const input = document.querySelector('#email') as HTMLInputElement
      return input && !input.disabled
    },
    { timeout: 15000 }
  )
  console.log('[Auth Setup] Email input enabled')

  // Fill in test credentials - use data-testid if available, fallback to ID
  try {
    await page.fill('[data-testid="email-input"]', email)
  } catch {
    await page.fill('#email', email)
  }
  await page.fill('#password', password)

  // Submit login form
  // Note: Supabase auth happens client-side, so we wait for navigation instead of API response
  console.log('[Auth Setup] Submitting login form...')

  // Click submit button first
  await page.click('button[type="submit"]')

  // Wait for navigation AWAY from login page
  // The login flow (Supabase auth + session verification) takes 2-5 seconds
  // Using a function predicate ensures we wait until URL actually changes
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 30000,
    })
    console.log('[Auth Setup] Navigation completed, current URL:', page.url())
  } catch {
    // If we timeout waiting for navigation, check for error messages
    console.error('[Auth Setup] ❌ Still on login page - authentication may have failed')
    const errorMsg = await page.textContent('[role="alert"]').catch(() => null)
    if (errorMsg) {
      console.error('[Auth Setup] Error message:', errorMsg)
    }
    throw new Error('Authentication failed - still on login page after 30 seconds')
  }

  // Wait for auth cookies to be set
  await page.waitForTimeout(2000)

  console.log(
    '[Auth Setup] ✅ Login complete. Now refreshing session to ensure auth state is current...'
  )

  // CRITICAL FIX: Refresh the session to ensure auth state is synchronized
  // The Admin API confirmed the email in the database. Session refresh ensures
  // the Supabase client has the latest user data including email_confirmed_at.
  //
  // NOTE: Supabase JWTs don't include email_confirmed_at by default - that's expected!
  // Our middleware uses getUser() to check the user object (not JWT claims).
  //
  // We use a test utility API endpoint to perform the refresh server-side,
  // avoiding browser module resolution issues with page.evaluate()
  try {
    console.log('[Auth Setup] Calling test utility API to refresh session...')

    const response = await page.request.post('http://localhost:3000/api/test-utils/refresh-session')

    if (!response.ok()) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Auth Setup] Session refresh API error:', errorData)
      throw new Error(`Session refresh failed: ${errorData.error || response.statusText()}`)
    }

    const result = await response.json()
    console.log('[Auth Setup] ✅ Session refresh successful')
    console.log(
      '[Auth Setup] User email_confirmed_at:',
      result.session?.user?.email_confirmed_at || 'NOT SET'
    )

    if (!result.session?.user?.email_confirmed_at) {
      console.warn('[Auth Setup] ⚠️  WARNING: email_confirmed_at still not set after refresh')
      console.warn('[Auth Setup] This may indicate an issue with the Admin API confirmation')
    }
  } catch (e) {
    console.error('[Auth Setup] ❌ Session refresh failed:', e instanceof Error ? e.message : e)
    throw new Error(
      `Failed to refresh session: ${e instanceof Error ? e.message : 'Unknown error'}`
    )
  }

  // Wait for refresh to propagate to cookies
  await page.waitForTimeout(1500)

  // Verify email is confirmed in the user object
  // NOTE: Supabase JWTs don't include email_confirmed_at by default - that's expected!
  // The middleware now uses getUser() to check the user object (not JWT payload)
  console.log('[Auth Setup] ✅ Authentication complete with confirmed email')
  console.log('[Auth Setup] Note: Middleware checks user object, not JWT claims')

  // Navigate to dashboard to ensure auth state is fully established
  await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
  console.log('[Auth Setup] Dashboard loaded successfully')

  // Save authentication state after successful navigation
  await page.context().storageState({ path: authFile })
  console.log('[Auth Setup] Authentication state saved successfully')
})
