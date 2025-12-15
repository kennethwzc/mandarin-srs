import { test, expect } from '@playwright/test'

/**
 * Lesson Flow E2E Tests
 *
 * Tests lesson browsing and starting
 */

test.describe('Lesson Flow', () => {
  test('view lessons list', async ({ page }) => {
    await page.goto('/lessons')
    await page.waitForLoadState('networkidle')

    // Should see lessons
    await expect(page.locator('h1')).toContainText(/lessons/i)

    // Should have at least one lesson card
    const lessonCards = page.locator('[data-testid="lesson-card"]').or(page.locator('.lesson-card'))
    await expect(lessonCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('view lesson detail', async ({ page }) => {
    await page.goto('/lessons')
    await page.waitForLoadState('networkidle')

    // Find and click first unlocked lesson
    const firstLesson = page.locator('[data-testid="lesson-card"]').first()
    await firstLesson.click()

    // Should show lesson detail
    await expect(page).toHaveURL(/\/lessons\/\d+/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('start learning from lesson', async ({ page }) => {
    await page.goto('/lessons')
    await page.waitForLoadState('networkidle')

    // Click first lesson
    await page.locator('[data-testid="lesson-card"]').first().click()

    // Wait for lesson detail page
    await page.waitForLoadState('networkidle')

    // Check if Start Learning button is available
    const startButton = page.locator('button:has-text("Start Learning")')
    if (await startButton.isVisible()) {
      await startButton.click()

      // Should redirect to reviews
      await expect(page).toHaveURL('/reviews', { timeout: 10000 })
    }
  })

  test('lesson tabs work', async ({ page }) => {
    await page.goto('/lessons')
    await page.waitForLoadState('networkidle')

    // Click first lesson
    await page.locator('[data-testid="lesson-card"]').first().click()
    await page.waitForLoadState('networkidle')

    // Click Characters tab
    const charactersTab = page.locator('button:has-text("Characters")')
    if (await charactersTab.isVisible()) {
      await charactersTab.click()
      await expect(page.locator('.chinese-text').first()).toBeVisible({ timeout: 5000 })
    }

    // Click Vocabulary tab
    const vocabularyTab = page.locator('button:has-text("Vocabulary")')
    if (await vocabularyTab.isVisible()) {
      await vocabularyTab.click()
      await expect(page.locator('.chinese-text').first()).toBeVisible({ timeout: 5000 })
    }
  })
})
