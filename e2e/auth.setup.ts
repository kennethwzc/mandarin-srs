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

  // Check initial login status
  const currentUrl = page.url()

  // If we're still on login page after clicking submit, auth failed
  if (currentUrl.includes('/login')) {
    console.error('[Auth Setup] ❌ Still on login page - authentication may have failed')
    const errorMsg = await page.textContent('[role="alert"]').catch(() => null)
    if (errorMsg) {
      console.error('[Auth Setup] Error message:', errorMsg)
    }
    throw new Error('Authentication failed - still on login page')
  }

  console.log('[Auth Setup] ✅ Login complete. Now forcing session refresh to update JWT claims...')

  // CRITICAL FIX: Force refresh the session to get new JWT with email_confirmed_at claim
  // The Admin API confirmed the email in the database, but the initial login JWT
  // doesn't reflect this change due to Supabase JWT claim caching.
  // Refreshing the session forces Supabase to generate a new JWT with updated claims.
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

  // Debug: Verify the refreshed JWT now contains email_confirmed_at
  console.log('[Auth Setup] 🔍 Inspecting JWT payload after refresh...')
  try {
    const cookies = await page.context().cookies()
    const authCookie = cookies.find((c) => c.name.includes('auth-token'))
    if (authCookie && authCookie.value) {
      const parts = authCookie.value.split('.')
      if (parts.length >= 2 && parts[1]) {
        // Decode base64url (JWT uses base64url encoding, not standard base64)
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const decoded = Buffer.from(base64, 'base64').toString('utf-8')
        const payload = JSON.parse(decoded)
        console.log('[Auth Setup] 📋 JWT payload after refresh:')
        console.log('[Auth Setup]    - email:', payload.email)
        console.log(
          '[Auth Setup]    - email_confirmed_at:',
          payload.email_confirmed_at || '❌ NOT SET'
        )
        console.log('[Auth Setup]    - user_id:', payload.sub)
        console.log(
          '[Auth Setup]    - iat (issued at):',
          new Date(payload.iat * 1000).toISOString()
        )

        if (!payload.email_confirmed_at) {
          console.error(
            '[Auth Setup] ⚠️  CRITICAL: JWT STILL missing email_confirmed_at after refresh!'
          )
          console.error(
            '[Auth Setup] This indicates a deeper issue with Supabase Auth configuration.'
          )
          throw new Error('JWT missing email_confirmed_at even after session refresh')
        } else {
          console.log(
            '[Auth Setup] ✅ JWT now contains email_confirmed_at - middleware will allow access'
          )
        }
      }
    } else {
      console.warn('[Auth Setup] ⚠️  No auth cookie found after refresh!')
      throw new Error('No auth cookie found after session refresh')
    }
  } catch (e) {
    console.error('[Auth Setup] ❌ Failed to parse JWT:', e instanceof Error ? e.message : e)
    throw e
  }

  console.log('[Auth Setup] ✅ Authentication complete with confirmed email JWT')

  // Navigate to dashboard to ensure auth state is fully established
  await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
  console.log('[Auth Setup] Dashboard loaded successfully')

  // Save authentication state after successful navigation
  await page.context().storageState({ path: authFile })
  console.log('[Auth Setup] Authentication state saved successfully')
})
