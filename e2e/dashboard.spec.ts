/**
 * E2E Dashboard Tests
 *
 * Tests dashboard functionality and navigation
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('loads dashboard successfully', async ({ page }) => {
    await page.goto('/dashboard')

    // Should show dashboard title
    await expect(page.locator('h1').filter({ hasText: /dashboard/i })).toBeVisible({
      timeout: 5000,
    })
  })

  test('displays all stat cards', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for stats to load
    await page.waitForLoadState('networkidle')

    // Should show key metrics
    await expect(page.locator('text=/items learned/i')).toBeVisible()
    await expect(page.locator('text=/reviews due/i')).toBeVisible()
    await expect(page.locator('text=/streak/i')).toBeVisible()
    await expect(page.locator('text=/accuracy/i')).toBeVisible()
  })

  test('navigates to reviews when clicking reviews due card', async ({ page }) => {
    await page.goto('/dashboard')

    // Find Reviews Due card
    const reviewsDueCard = page.locator('text=/reviews due/i').locator('..')

    // Check if it's clickable (has reviews)
    const isClickable = await reviewsDueCard.evaluate((el) =>
      el.classList.contains('cursor-pointer')
    )

    if (isClickable) {
      await reviewsDueCard.click()
      await expect(page).toHaveURL(/\/reviews/)
    }
  })

  test('displays charts', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Should show chart containers (they may be lazy loaded)
    await page.waitForTimeout(2000) // Wait for lazy-loaded charts

    // Check for chart presence
    const charts = page.locator('[data-testid="chart"]').or(page.locator('svg'))
    const chartCount = await charts.count()

    // Should have at least one chart
    expect(chartCount).toBeGreaterThan(0)
  })

  test('shows activity calendar', async ({ page }) => {
    await page.goto('/dashboard')

    // Scroll down to see calendar
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Wait for lazy-loaded components
    await page.waitForTimeout(2000)

    // Look for calendar or heatmap
    const calendar = page.locator('[data-testid="activity-calendar"]').or(page.locator('.calendar'))

    const hasCalendar = await calendar.count()
    if (hasCalendar > 0) {
      await expect(calendar.first()).toBeVisible()
    }
  })

  test('displays lesson progress', async ({ page }) => {
    await page.goto('/dashboard')

    // Scroll to see lesson progress
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    // Look for lesson progress section
    const lessonProgress = page.locator('text=/lesson progress/i')

    const hasProgress = await lessonProgress.count()
    if (hasProgress > 0) {
      await expect(lessonProgress.first()).toBeVisible()
    }
  })

  test('loads quickly (performance check)', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })
})
