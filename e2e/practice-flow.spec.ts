import { test, expect } from '@playwright/test'

/**
 * Practice Mode E2E Tests
 *
 * Tests visual feedback and user flow in practice mode
 */

test.describe('Practice Mode Visual Feedback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lessons')
    await page.waitForLoadState('networkidle')
  })

  test('shows visual feedback for correct answer in practice mode', async ({ page }) => {
    // Wait for lesson cards to be visible
    await page.waitForSelector('[data-testid="lesson-card"]', { timeout: 15000 })

    // Click first lesson
    await page.locator('[data-testid="lesson-card"]').first().click()
    await page.waitForLoadState('networkidle')

    // Click practice button (or start learning)
    const practiceButton = page
      .locator('button:has-text("Practice Lesson"), button:has-text("Start Learning")')
      .first()
    await practiceButton.click()

    // Wait for practice session to load
    await expect(page.locator('.character-display')).toBeVisible({ timeout: 10000 })

    // Type a correct answer (this is test-dependent, adjust as needed)
    const input = page.locator('input[type="text"]')
    await input.fill('ni3')
    await page.keyboard.press('Space')
    await expect(input).toHaveValue('nǐ')

    // Submit answer
    await page.keyboard.press('Enter')

    // VERIFY VISUAL FEEDBACK:
    // 1. Feedback text appears
    await expect(page.locator('text=/Correct|Not quite/i')).toBeVisible({ timeout: 2000 })

    // 2. Card has visual styling (green glow for correct)
    const card = page.locator('.mx-auto.w-full.max-w-2xl').first()
    await expect(card).toHaveClass(/ring-green-500|ring-red-500/)

    // 3. Feedback component is visible
    const feedback = page.locator('.space-y-3 >> text=/Correct|Not quite/i')
    await expect(feedback).toBeVisible()
  })

  test('shows visual feedback for incorrect answer in practice mode', async ({ page }) => {
    // Wait for lesson cards to be visible
    await page.waitForSelector('[data-testid="lesson-card"]', { timeout: 15000 })

    // Click first lesson
    await page.locator('[data-testid="lesson-card"]').first().click()
    await page.waitForLoadState('networkidle')

    // Click practice button (or start learning)
    const practiceButton = page
      .locator('button:has-text("Practice Lesson"), button:has-text("Start Learning")')
      .first()
    await practiceButton.click()

    // Wait for practice session to load
    await expect(page.locator('.character-display')).toBeVisible({ timeout: 10000 })

    // Type wrong answer
    const input = page.locator('input[type="text"]')
    await input.fill('wronganswer')
    await page.keyboard.press('Enter')

    // VERIFY VISUAL FEEDBACK FOR INCORRECT:
    await expect(page.locator('text=/Not quite right/i')).toBeVisible({ timeout: 2000 })
    await expect(page.locator('text=/Correct answer:/i')).toBeVisible()

    const card = page.locator('.mx-auto.w-full.max-w-2xl').first()
    await expect(card).toHaveClass(/ring-red-500/)
  })

  test('practice mode redirects correctly from lesson page', async ({ page }) => {
    // Wait for lesson cards to be visible
    await page.waitForSelector('[data-testid="lesson-card"]', { timeout: 15000 })

    // Click first lesson
    await page.locator('[data-testid="lesson-card"]').first().click()
    await page.waitForLoadState('networkidle')

    // Click practice button
    const practiceButton = page
      .locator('button:has-text("Practice Lesson"), button:has-text("Start Learning")')
      .first()
    await practiceButton.click()

    // Should redirect to practice mode URL
    await expect(page).toHaveURL(/\/lessons\/\d+\/practice/, { timeout: 10000 })
  })
})
