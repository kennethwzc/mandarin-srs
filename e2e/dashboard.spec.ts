import { test, expect } from '@playwright/test'

/**
 * Dashboard E2E Tests
 *
 * Tests dashboard functionality
 */

test.describe('Dashboard', () => {
  test('loads dashboard successfully', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Should see dashboard title (use getByRole to be more specific)
    await expect(page.getByRole('heading', { name: /dashboard/i, level: 1 })).toBeVisible()
  })

  test('displays stats cards', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Should see key stats (use getByRole heading to be specific)
    await expect(page.getByRole('heading', { name: 'Items Learned' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('heading', { name: 'Reviews Due' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('heading', { name: 'Current Streak' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('heading', { name: 'Accuracy' })).toBeVisible({ timeout: 10000 })
  })

  test('displays charts', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Wait for charts to load (they're lazy loaded)
    await page.waitForTimeout(2000)

    // Check for chart containers
    const charts = page.locator('.recharts-wrapper')
    const chartCount = await charts.count()

    // Should have at least one chart
    expect(chartCount).toBeGreaterThan(0)
  })

  test('start reviews button works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Check if reviews button exists (only if reviews are due)
    const reviewsButton = page.locator('button:has-text("Start Reviews")')
    if (await reviewsButton.isVisible()) {
      await reviewsButton.click()
      await expect(page).toHaveURL('/reviews', { timeout: 5000 })
    }
  })

  test('navigation works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Click Lessons in sidebar
    const lessonsLink = page.locator('a:has-text("Lessons")')
    await lessonsLink.click()
    await expect(page).toHaveURL('/lessons', { timeout: 5000 })

    // Navigate back to dashboard
    const dashboardLink = page.locator('a:has-text("Dashboard")')
    await dashboardLink.click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })
})
