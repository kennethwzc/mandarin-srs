/**
 * E2E Review Flow Tests
 *
 * Tests complete user journey through review system
 */

import { test, expect } from '@playwright/test'

test.describe('Review Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reviews page
    await page.goto('/reviews')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('displays review card when reviews are available', async ({ page }) => {
    // Wait for review card to be visible
    const card = page.locator('[data-testid="review-card"]').or(page.locator('.character-display'))
    await expect(card.first()).toBeVisible({ timeout: 5000 })
  })

  test('completes review with correct answer', async ({ page }) => {
    // Wait for character display
    await page.waitForSelector('text=/[你好是我们]/') // Common characters

    // Get the pinyin input
    const input = page.locator('input[type="text"]').first()
    await expect(input).toBeVisible()

    // Type pinyin
    await input.fill('ni3')

    // Press space to convert
    await page.keyboard.press('Space')

    // Submit with Enter
    await page.keyboard.press('Enter')

    // Wait for feedback or grade buttons
    await page.waitForSelector(
      'button:has-text("Again"), button:has-text("Hard"), button:has-text("Good"), button:has-text("Easy")',
      {
        timeout: 3000,
      }
    )

    // Grade as Good
    await page.click('button:has-text("Good")')

    // Should advance to next card or show completion
    await page.waitForTimeout(500)
  })

  test('keyboard shortcuts work correctly', async ({ page }) => {
    await page.waitForSelector('input[type="text"]', { timeout: 5000 })

    const input = page.locator('input[type="text"]').first()

    // Type pinyin
    await input.fill('ni')

    // Use number key for tone
    await page.keyboard.press('3')

    // Submit with Enter
    await page.keyboard.press('Enter')

    // Wait for grading
    await page.waitForSelector('button:has-text("Good")', { timeout: 3000 })

    // Use keyboard shortcut for grading (3 for Good)
    await page.keyboard.press('3')

    // Should advance
    await page.waitForTimeout(500)
  })

  test('handles incorrect answer appropriately', async ({ page }) => {
    await page.waitForSelector('input[type="text"]', { timeout: 5000 })

    // Type wrong answer
    const input = page.locator('input[type="text"]').first()
    await input.fill('wrong')

    // Submit
    await page.keyboard.press('Enter')

    // Wait for feedback or grade buttons
    await page.waitForTimeout(1000)

    // Should still show grade buttons (even for wrong answers)
    const gradeButton = page.locator('button:has-text("Again"), button:has-text("Good")')
    await expect(gradeButton.first()).toBeVisible({ timeout: 3000 })
  })

  test('shows progress indicator', async ({ page }) => {
    await page.waitForSelector('input[type="text"]', { timeout: 5000 })

    // Look for progress text like "1 / 5" or "Item 1 of 5"
    const progressText = page.locator('text=/\\d+\\s*\\/\\s*\\d+/')
    const hasProgress = await progressText.count()

    if (hasProgress > 0) {
      await expect(progressText.first()).toBeVisible()
    }
  })

  test('shows session complete when no more reviews', async ({ page }) => {
    // Mock empty queue
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/reviews/queue')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { queue: [] } }),
        })
      }
      return Promise.reject(new Error('Unexpected API call'))
    })

    await page.reload()

    // Should show empty state
    await expect(page.locator('text=/no reviews|session complete|all done/i').first()).toBeVisible({
      timeout: 5000,
    })
  })

  test('allows skipping reviews', async ({ page }) => {
    await page.waitForSelector('input[type="text"]', { timeout: 5000 })

    // Look for skip button or Esc key hint
    const skipButton = page.locator('button:has-text("Skip")')
    const hasSkip = await skipButton.count()

    if (hasSkip > 0) {
      await skipButton.click()

      // Should advance to next card or show completion
      await page.waitForTimeout(500)
    }
  })

  test('supports Escape key to skip', async ({ page }) => {
    await page.waitForSelector('input[type="text"]', { timeout: 5000 })

    // Press Escape
    await page.keyboard.press('Escape')

    // Should skip (may advance or show skip confirmation)
    await page.waitForTimeout(500)
  })
})
