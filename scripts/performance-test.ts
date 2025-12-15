/* eslint-disable no-console */
/**
 * Performance Test Script
 *
 * Tests critical user flows and measures performance
 *
 * NOTE: This requires Playwright to be installed:
 * pnpm add -D playwright @playwright/test
 */

console.log('🚀 Performance Test Script')
console.log('='.repeat(50))
console.log('')
console.log('⚠️  This script requires Playwright to be installed.')
console.log('Run: pnpm add -D playwright @playwright/test')
console.log('')
console.log('Once installed, you can run performance tests with:')
console.log('  1. Start the dev server: pnpm dev')
console.log('  2. In another terminal: pnpm perf:test')
console.log('')
console.log('Tests to implement:')
console.log('  ✓ Dashboard load time (<2s)')
console.log('  ✓ Lessons page load time (<2s)')
console.log('  ✓ Review interaction time (<500ms)')
console.log('  ✓ API response times')
console.log('  ✓ Bundle size checks')
console.log('')
console.log('='.repeat(50))

// Placeholder for actual implementation
// Uncomment and use when Playwright is installed:

/*
import { chromium } from 'playwright'

async function runPerformanceTests() {
  console.log('🚀 Running performance tests...\n')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const results: Array<{
    test: string
    pass: boolean
    time?: number
    dcl?: number
    load?: number
  }> = []

  // Test 1: Dashboard load time
  console.log('Test 1: Dashboard load time')
  await page.goto('http://localhost:3000/dashboard')

  const dashboardMetrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
      loadComplete: perfData.loadEventEnd - perfData.fetchStart,
    }
  })

  results.push({
    test: 'Dashboard Load',
    dcl: dashboardMetrics.domContentLoaded,
    load: dashboardMetrics.loadComplete,
    pass: dashboardMetrics.loadComplete < 3000,
  })

  // Test 2: Lesson list load time
  console.log('Test 2: Lesson list load time')
  const lessonsStart = Date.now()
  await page.goto('http://localhost:3000/lessons')
  await page.waitForSelector('[data-testid="lesson-card"]', { timeout: 5000 })
  const lessonsTime = Date.now() - lessonsStart

  results.push({
    test: 'Lessons Load',
    time: lessonsTime,
    pass: lessonsTime < 2000,
  })

  // Print results
  console.log('\n' + '='.repeat(50))
  console.log('Performance Test Results')
  console.log('='.repeat(50) + '\n')

  results.forEach((result) => {
    const status = result.pass ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - ${result.test}`)
    if (result.dcl) {
      console.log(`  DCL: ${result.dcl.toFixed(0)}ms`)
      console.log(`  Load: ${result.load?.toFixed(0)}ms`)
    } else if (result.time) {
      console.log(`  Time: ${result.time.toFixed(0)}ms`)
    }
  })

  const allPassed = results.every((r) => r.pass)
  console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed'))

  await browser.close()
}

runPerformanceTests().catch(console.error)
*/
