/**
 * E2E Accessibility Tests
 *
 * Tests WCAG AA compliance using axe-core
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('dashboard has no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('reviews page has no accessibility violations', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('lessons page has no accessibility violations', async ({ page }) => {
    await page.goto('/lessons')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('login page has no accessibility violations', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('keyboard navigation works throughout app', async ({ page }) => {
    await page.goto('/dashboard')

    // Tab through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that focused element is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()

    // Should have focus indicator
    const hasFocusOutline = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement
      const styles = window.getComputedStyle(active)
      return (
        styles.outlineWidth !== '0px' ||
        styles.outlineStyle !== 'none' ||
        styles.boxShadow !== 'none'
      )
    })

    expect(hasFocusOutline).toBe(true)
  })

  test('all interactive elements have accessible names', async ({ page }) => {
    await page.goto('/dashboard')

    // Get all buttons
    const buttons = await page.locator('button').all()

    for (const button of buttons) {
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')

      // Each button should have text or aria-label
      expect(text || ariaLabel).toBeTruthy()
    }
  })

  test('images have alt text', async ({ page }) => {
    await page.goto('/')

    const images = await page.locator('img').all()

    for (const img of images) {
      const alt = await img.getAttribute('alt')
      // Alt should exist (can be empty for decorative images)
      expect(alt).not.toBeNull()
    }
  })

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/login')

    const inputs = await page
      .locator('input[type="text"], input[type="email"], input[type="password"]')
      .all()

    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')

      // Should have label or aria-label
      expect(id || ariaLabel || ariaLabelledBy).toBeTruthy()
    }
  })

  test('color contrast is sufficient', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Run axe with color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze()

    const colorContrastViolations = accessibilityScanResults.violations.filter((violation) =>
      violation.id.includes('color-contrast')
    )

    expect(colorContrastViolations).toEqual([])
  })

  test('supports screen reader navigation', async ({ page }) => {
    await page.goto('/dashboard')

    // Check for ARIA landmarks
    const landmarks = await page
      .locator('[role="main"], [role="navigation"], [role="banner"]')
      .all()

    expect(landmarks.length).toBeGreaterThan(0)
  })

  test('heading hierarchy is correct', async ({ page }) => {
    await page.goto('/dashboard')

    // Check heading levels
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)

    // Should not skip heading levels
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
