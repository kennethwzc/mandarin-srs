/**
 * E2E Lesson Flow Tests
 *
 * Tests lesson viewing and starting functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Lesson Flow', () => {
  test('views lesson list', async ({ page }) => {
    await page.goto('/lessons')

    // Should see lessons page
    await expect(
      page
        .locator('h1, h2')
        .filter({ hasText: /lessons/i })
        .first()
    ).toBeVisible()

    // Should see lesson cards
    const lessonCards = page.locator('[data-testid="lesson-card"]').or(page.locator('.lesson-card'))
    await expect(lessonCards.first()).toBeVisible({ timeout: 5000 })
  })

  test('views lesson detail page', async ({ page }) => {
    await page.goto('/lessons')

    // Wait for lessons to load
    await page.waitForSelector('[data-testid="lesson-card"], .lesson-card', { timeout: 5000 })

    // Click first unlocked lesson
    const firstLesson = page
      .locator('[data-testid="lesson-card"], .lesson-card')
      .filter({ hasNot: page.locator('text=/locked|complete previous/i') })
      .first()

    await firstLesson.click()

    // Should navigate to lesson detail
    await expect(page).toHaveURL(/\/lessons\/\d+/)

    // Should show lesson title
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('displays lesson characters and vocabulary', async ({ page }) => {
    // Navigate to first lesson
    await page.goto('/lessons/1')

    // Should show tabs or sections
    const charactersTab = page
      .locator('button:has-text("Characters")')
      .or(page.locator('tab:has-text("Characters")'))
    const vocabularyTab = page
      .locator('button:has-text("Vocabulary")')
      .or(page.locator('tab:has-text("Vocabulary")'))

    // Check if tabs exist
    const hasCharactersTab = await charactersTab.count()
    if (hasCharactersTab > 0) {
      await charactersTab.click()

      // Should show Chinese characters
      await page.waitForSelector('text=/[一-龥]/', { timeout: 3000 })
    }

    const hasVocabularyTab = await vocabularyTab.count()
    if (hasVocabularyTab > 0) {
      await vocabularyTab.click()

      // Should show vocabulary words
      await page.waitForSelector('text=/[一-龥]/', { timeout: 3000 })
    }
  })

  test('starts lesson and navigates to reviews', async ({ page }) => {
    await page.goto('/lessons/1')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Find and click start button
    const startButton = page
      .locator('button:has-text("Start Learning"), button:has-text("Start Lesson")')
      .first()

    const hasStartButton = await startButton.count()

    if (hasStartButton > 0) {
      await startButton.click()

      // Should redirect to reviews
      await expect(page).toHaveURL(/\/reviews/, { timeout: 10000 })

      // Should show review card
      await page.waitForSelector('input[type="text"]', { timeout: 5000 })
    }
  })

  test('locked lessons are not accessible', async ({ page }) => {
    await page.goto('/lessons')

    // Find locked lesson (if any)
    const lockedLesson = page.locator('[data-testid="lesson-card"], .lesson-card').filter({
      hasText: /locked|complete previous/i,
    })

    const lockedCount = await lockedLesson.count()

    if (lockedCount > 0) {
      // Should have visual indicator (lock icon or disabled state)
      const firstLocked = lockedLesson.first()
      await expect(firstLocked).toBeVisible()

      // Try to click
      const urlBefore = page.url()
      await firstLocked.click({ force: true })

      // Should not navigate
      await page.waitForTimeout(1000)
      expect(page.url()).toBe(urlBefore)
    }
  })

  test('shows lesson progress', async ({ page }) => {
    await page.goto('/lessons/1')

    // Look for progress indicators
    const progressBar = page.locator('[role="progressbar"]').or(page.locator('.progress'))
    const progressText = page.locator('text=/\\d+%|\\d+\\/\\d+/')

    const hasProgressBar = await progressBar.count()
    const hasProgressText = await progressText.count()

    // Should have some progress indicator
    expect(hasProgressBar + hasProgressText).toBeGreaterThan(0)
  })

  test('navigates between lessons', async ({ page }) => {
    await page.goto('/lessons')

    // Get first two lessons
    const lessons = page.locator('[data-testid="lesson-card"], .lesson-card')
    const count = await lessons.count()

    if (count >= 2) {
      // Click first lesson
      await lessons.nth(0).click()
      await page.waitForURL(/\/lessons\/\d+/)
      const url1 = page.url()

      // Go back
      await page.goBack()

      // Click second lesson
      await lessons.nth(1).click()
      await page.waitForURL(/\/lessons\/\d+/)
      const url2 = page.url()

      // URLs should be different
      expect(url1).not.toBe(url2)
    }
  })
})
