/**
 * Mobile Responsiveness E2E Tests
 *
 * Tests mobile-specific functionality including:
 * - Mobile navigation menu
 * - Touch-friendly interfaces
 * - Responsive layouts
 * - No horizontal scrolling
 *
 * Note: These tests run automatically on mobile devices configured in playwright.config.ts
 * (Mobile Chrome/Pixel 5 and Mobile Safari/iPhone 12)
 */

import { test, expect } from '@playwright/test'

// Tests run on both desktop and mobile - use viewport width to detect mobile
test.describe('Mobile Navigation', () => {
  test('mobile menu appears on small screens', async ({ page, viewport }) => {
    const isMobile = viewport ? viewport.width < 768 : false

    await page.goto('/dashboard')

    if (isMobile) {
      // On mobile: hamburger menu should be visible
      const menuButton = page.getByLabel('Open navigation menu')
      await expect(menuButton).toBeVisible()

      // Desktop sidebar should be hidden
      const sidebar = page.locator('.hidden.md\\:flex').first()
      await expect(sidebar).not.toBeVisible()

      // Open mobile menu
      await menuButton.click()

      // Navigation links should be visible in drawer
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Lessons' })).toBeVisible()

      // Close menu
      const closeButton = page.getByLabel('Close menu')
      await closeButton.click()
    } else {
      // On desktop: sidebar should be visible, no hamburger menu
      const sidebar = page.locator('.hidden.md\\:flex').first()
      await expect(sidebar).toBeVisible()
    }
  })

  test('marketing page navigation works responsively', async ({ page, viewport }) => {
    const isMobile = viewport ? viewport.width < 768 : false

    await page.goto('/')

    if (isMobile) {
      // Mobile menu button should be visible
      const menuButton = page.getByLabel(/menu/i).first()
      await expect(menuButton).toBeVisible()

      // Desktop nav links should be hidden
      const desktopNav = page.locator('.hidden.md\\:flex').first()
      await expect(desktopNav).not.toBeVisible()
    }
  })
})

test.describe('Responsive Layout', () => {
  test('no horizontal scroll on dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    // Allow 1px tolerance for rounding
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('no horizontal scroll on reviews page', async ({ page }) => {
    await page.goto('/reviews')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('no horizontal scroll on lessons page', async ({ page }) => {
    await page.goto('/lessons')

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
})

test.describe('Touch Targets', () => {
  test('buttons have adequate touch targets on mobile', async ({ page, viewport }) => {
    const isMobile = viewport ? viewport.width < 768 : false

    await page.goto('/dashboard')

    // Check icon buttons in header (should be 48px on mobile)
    const iconButtons = page.locator('button.h-12.w-12')
    const count = await iconButtons.count()

    // At least the notification and user buttons should exist
    expect(count).toBeGreaterThanOrEqual(2)

    if (isMobile) {
      for (let i = 0; i < count; i++) {
        const button = iconButtons.nth(i)
        const box = await button.boundingBox()
        if (box) {
          // Touch targets should be at least 44px (WCAG AA)
          expect(box.height).toBeGreaterThanOrEqual(44)
          expect(box.width).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })
})

test.describe('Mobile Content', () => {
  test('homepage hero is readable on mobile', async ({ page }) => {
    await page.goto('/')

    // Hero title should be visible and not overflow
    const heroTitle = page.locator('h1').first()
    await expect(heroTitle).toBeVisible()

    // CTA buttons should be visible
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

    // Form should be visible
    const form = page.locator('form').first()
    if ((await form.count()) > 0) {
      await expect(form).toBeVisible()
    }
  })

  test('dashboard stats stack properly on mobile', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for stats to load
    await page.waitForLoadState('networkidle')

    // Stats grid should be visible
    const statsGrid = page.locator('.grid').first()
    await expect(statsGrid).toBeVisible()
  })
})

test.describe('Critical Mobile User Flows', () => {
  test('can access review page on mobile', async ({ page }) => {
    await page.goto('/reviews')

    // Wait for content to load
    await page.waitForLoadState('networkidle')

    // Check if reviews are available or "no reviews" message shows
    const noReviewsMessage = page.getByText(/no reviews|all caught up/i)
    const characterDisplay = page.locator('.character-display')

    // Either we have reviews or a "no reviews" message
    const hasReviews = (await characterDisplay.count()) > 0
    const hasNoReviewsMessage = (await noReviewsMessage.count()) > 0

    expect(hasReviews || hasNoReviewsMessage).toBe(true)

    // If we have reviews, verify the interface is usable
    if (hasReviews) {
      await expect(characterDisplay.first()).toBeVisible()

      // Pinyin input should be visible
      const pinyinInput = page.locator('input[type="text"]').first()
      if ((await pinyinInput.count()) > 0) {
        await expect(pinyinInput).toBeVisible()
      }
    }
  })

  test('can access lessons page on mobile', async ({ page }) => {
    await page.goto('/lessons')

    // Wait for content to load
    await page.waitForLoadState('networkidle')

    // Page title should be visible
    const heading = page.getByRole('heading', { name: /lessons/i }).first()
    await expect(heading).toBeVisible()

    // Should show either lessons or "no lessons" message
    const lessonCards = page.locator('[data-testid="lesson-card"]')
    const noLessonsMessage = page.getByText(/no lessons available/i)

    const hasLessons = (await lessonCards.count()) > 0
    const hasNoLessonsMessage = (await noLessonsMessage.count()) > 0

    expect(hasLessons || hasNoLessonsMessage).toBe(true)
  })
})
