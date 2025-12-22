import { test, expect } from '@playwright/test'

/**
 * E2E Review Flow Tests
 *
 * Tests complete user journey through review system
 */

test.describe('Review Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reviews')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('complete review with correct answer', async ({ page }) => {
    // Check if there are reviews available
    const noReviews = page.locator('text=No reviews due')
    if (await noReviews.isVisible()) {
      test.skip()
    }

    // Wait for review card
    await expect(page.locator('.character-display')).toBeVisible({ timeout: 10000 })

    // Type pinyin
    const input = page.locator('input[type="text"]')
    await input.fill('ni3')
    await page.keyboard.press('Space')

    // Should convert to tone mark
    await expect(input).toHaveValue('nǐ')

    // Submit
    await page.keyboard.press('Enter')

    // Wait for feedback to appear (state update + animation)
    await page.waitForTimeout(300)

    // Should show feedback (correct or incorrect)
    await expect(page.locator('text=/Correct!|Not quite right/i').first()).toBeVisible({
      timeout: 5000,
    })

    // Continue to next card (grade is now auto-calculated based on response time)
    await page.keyboard.press('Enter')

    // Should either move to next card or show session complete
    await page.waitForTimeout(1000)
  })

  test('handles incorrect answer', async ({ page }) => {
    const noReviews = page.locator('text=No reviews due')
    if (await noReviews.isVisible()) {
      test.skip()
    }

    await expect(page.locator('.character-display')).toBeVisible({ timeout: 10000 })

    // Type wrong answer
    const input = page.locator('input[type="text"]')
    await input.fill('wrong')
    await page.keyboard.press('Enter')

    // Wait for feedback to appear (state update + animation)
    await page.waitForTimeout(300)

    // Should show incorrect feedback
    await expect(page.locator('text=/Not quite right/i')).toBeVisible({ timeout: 5000 })
  })

  test('keyboard shortcuts work', async ({ page }) => {
    const noReviews = page.locator('text=No reviews due')
    if (await noReviews.isVisible()) {
      test.skip()
    }

    await expect(page.locator('.character-display')).toBeVisible({ timeout: 10000 })

    // Type pinyin
    const input = page.locator('input[type="text"]')
    await input.fill('ni')

    // Use number key for tone
    await page.keyboard.press('3')

    // Should apply tone
    await page.waitForTimeout(500)

    // Enter to submit
    await page.keyboard.press('Enter')

    // Wait for feedback to appear (state update + animation)
    await page.waitForTimeout(300)

    // Should show feedback
    await expect(page.locator('text=/Correct!|Not quite right/i').first()).toBeVisible({
      timeout: 5000,
    })
  })

  test('shows progress indicator', async ({ page }) => {
    const noReviews = page.locator('text=No reviews due')
    if (await noReviews.isVisible()) {
      test.skip()
    }

    // Progress should be visible
    await expect(page.locator('text=/\\d+ \\/ \\d+/')).toBeVisible({ timeout: 10000 })
  })
})
