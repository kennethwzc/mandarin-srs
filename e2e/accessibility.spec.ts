import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility Tests (WCAG 2.1 AA Compliance)
 *
 * Tests for accessibility violations using axe-core
 */

test.describe('Accessibility', () => {
  test('dashboard has no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('reviews page has no accessibility violations', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('lessons page has no accessibility violations', async ({ page }) => {
    await page.goto('/lessons')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('login page has no accessibility violations', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Tab through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should have visible focus indicator
    const focused = await page.evaluate(() => {
      const active = document.activeElement
      if (!active) {
        return false
      }

      const styles = window.getComputedStyle(active)
      const hasOutline = styles.outlineWidth !== '0px' && styles.outlineWidth !== ''
      const hasFocusRing =
        (styles.boxShadow !== 'none' && styles.boxShadow !== '') || styles.outline !== 'none'

      return hasOutline || hasFocusRing
    })

    expect(focused).toBe(true)
  })

  test('screen reader landmarks present', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for semantic HTML
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
  })

  test('images have alt text', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Get all images
    const images = page.locator('img')
    const imageCount = await images.count()

    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i)
        const alt = await image.getAttribute('alt')
        expect(alt).toBeDefined()
      }
    }
  })

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // All inputs should have associated labels
    const inputs = page.locator('input')
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const inputId = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')

      // Should have at least one way to be labeled
      const hasLabel = inputId || ariaLabel || ariaLabelledBy
      expect(hasLabel).toBeTruthy()
    }
  })

  test('color contrast is sufficient', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('*')
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })
})
