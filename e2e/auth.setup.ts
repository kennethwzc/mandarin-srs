/**
 * Authentication Setup for E2E Tests
 *
 * Sets up authenticated state for tests that require login
 */

import { test as setup } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.auth/user.json')

setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('/login')

  // Fill in credentials
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com')
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword123')

  // Click login
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
