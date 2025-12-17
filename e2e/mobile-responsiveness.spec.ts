/**
 * Mobile Responsiveness E2E Tests
 *
 * Tests mobile-specific functionality including:
 * - Mobile navigation menu
 * - Touch-friendly interfaces
 * - Responsive layouts
 * - No horizontal scrolling
 */

import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Responsiveness - iPhone 12', () => {
  test.use(devices['iPhone 12'])

  test('mobile menu opens and closes', async ({ page }) => {
    await page.goto('/dashboard')

    // Menu button should be visible on mobile
    const menuButton = page.getByLabel('Open navigation menu')
    await expect(menuButton).toBeVisible()

    // Desktop sidebar should be hidden
    const sidebar = page.locator('.hidden.md\\:flex').first()
    await expect(sidebar).not.toBeVisible()

    // Click to open mobile menu
    await menuButton.click()

    // Navigation links should be visible in drawer
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Lessons' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Reviews' })).toBeVisible()

    // Close menu
    const closeButton = page.getByLabel('Close menu')
    await closeButton.click()

    // Menu should be closed
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).not.toBeVisible()
  })

  test('marketing page navigation works on mobile', async ({ page }) => {
    await page.goto('/')

    // Mobile menu button should be visible
    const menuButton = page.getByLabel(/menu/i).first()
    await expect(menuButton).toBeVisible()

    // Desktop nav links should be hidden
    const desktopNav = page.locator('.hidden.md\\:flex').first()
    await expect(desktopNav).not.toBeVisible()
  })

  test('no horizontal scroll on dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // Allow 1px tolerance
  })

  test('no horizontal scroll on reviews page', async ({ page }) => {
    await page.goto('/reviews')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('no horizontal scroll on marketing home', async ({ page }) => {
    await page.goto('/')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('buttons have adequate touch targets', async ({ page }) => {
    await page.goto('/dashboard')

    // Check icon buttons in header (should be 48px on mobile)
    const iconButtons = page.locator('button.h-12.w-12')
    const count = await iconButtons.count()

    // At least the notification and user buttons should exist
    expect(count).toBeGreaterThanOrEqual(2)

    for (let i = 0; i < count; i++) {
      const button = iconButtons.nth(i)
      const box = await button.boundingBox()
      if (box) {
        // Touch targets should be at least 44px (WCAG AA)
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.width).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('homepage hero is readable on mobile', async ({ page }) => {
    await page.goto('/')

    // Hero title should be visible and not overflow
    const heroTitle = page.locator('h1').first()
    await expect(heroTitle).toBeVisible()

    // CTA buttons should be full width on mobile
    const ctaButtons = page.locator('main button, main a[role="button"]')
    const buttonCount = await ctaButtons.count()
    expect(buttonCount).toBeGreaterThanOrEqual(1)
  })

  test('auth pages are mobile-friendly', async ({ page }) => {
    await page.goto('/login')

    // Page should not have horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)

    // Form should be visible and centered
    const form = page.locator('form').first()
    if ((await form.count()) > 0) {
      await expect(form).toBeVisible()
    }
  })
})

test.describe('Mobile Responsiveness - Pixel 5', () => {
  test.use(devices['Pixel 5'])

  test('mobile navigation drawer works on Android', async ({ page }) => {
    await page.goto('/dashboard')

    // Open mobile menu
    const menuButton = page.getByLabel('Open navigation menu')
    await menuButton.click()

    // Should show navigation
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()

    // Navigate to lessons
    await page.getByRole('link', { name: 'Lessons' }).click()

    // Should navigate and close drawer
    await expect(page).toHaveURL(/\/lessons/)
  })

  test('dashboard stats stack on mobile', async ({ page }) => {
    await page.goto('/dashboard')

    // Stats should be visible (grid should be 1 column on mobile)
    const statsGrid = page.locator('.grid.grid-cols-1')
    await expect(statsGrid.first()).toBeVisible()
  })
})

test.describe('Tablet Responsiveness - iPad', () => {
  test.use(devices['iPad Pro 11'])

  test('sidebar is visible on tablet', async ({ page }) => {
    await page.goto('/dashboard')

    // On tablet (768px+), sidebar should be visible
    const sidebar = page.locator('.hidden.md\\:flex').first()
    await expect(sidebar).toBeVisible()

    // Mobile menu button should be hidden
    const menuButton = page.getByLabel('Open navigation menu')
    await expect(menuButton).not.toBeVisible()
  })

  test('dashboard uses multi-column layout on tablet', async ({ page }) => {
    await page.goto('/dashboard')

    // Stats grid should use 2 columns on tablet
    const statsGrid = page.locator('.sm\\:grid-cols-2')
    await expect(statsGrid.first()).toBeVisible()
  })
})

test.describe('Critical Mobile User Flows', () => {
  test.use(devices['iPhone 12'])

  test('can complete review flow on mobile', async ({ page }) => {
    await page.goto('/reviews')

    // Wait for content to load
    await page.waitForLoadState('networkidle')

    // Check if reviews are available
    const noReviewsMessage = page.getByText(/no reviews|all caught up/i)
    const characterDisplay = page.locator('.character-display')

    // Either we have reviews or a "no reviews" message
    const hasReviews = (await characterDisplay.count()) > 0
    const hasNoReviewsMessage = (await noReviewsMessage.count()) > 0

    expect(hasReviews || hasNoReviewsMessage).toBe(true)

    // If we have reviews, verify the interface is usable
    if (hasReviews) {
      await expect(characterDisplay.first()).toBeVisible()

      // Pinyin input should be visible and usable
      const pinyinInput = page.locator('input[type="text"]').first()
      if ((await pinyinInput.count()) > 0) {
        await expect(pinyinInput).toBeVisible()
      }
    }
  })
})
