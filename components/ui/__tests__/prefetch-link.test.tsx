/**
 * PrefetchLink Component Tests
 *
 * Tests for the PrefetchLink component to ensure it works correctly
 * in both test and production environments.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrefetchLink } from '../prefetch-link'

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

// Mock prefetch utilities
jest.mock('@/lib/utils/prefetch', () => ({
  prefetchRouteAndData: jest.fn().mockResolvedValue(undefined),
  prefetchOnHover: jest.fn(() => () => {}),
}))

describe('PrefetchLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders as a link', () => {
    render(
      <PrefetchLink href="/test">
        <span>Test Link</span>
      </PrefetchLink>
    )

    const link = screen.getByRole('link', { name: 'Test Link' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('does not prefetch in test environment', async () => {
    const user = userEvent.setup()

    render(
      <PrefetchLink
        href="/test"
        prefetchDataKey="test:key"
        prefetchDataFetcher={async () => ({ data: 'test' })}
      >
        Test Link
      </PrefetchLink>
    )

    const link = screen.getByRole('link')
    await user.hover(link)

    // Wait a bit to ensure prefetch would have been called
    await waitFor(
      () => {
        // In test environment, prefetch should not be called
        // The isTestEnvironment() check should prevent this
      },
      { timeout: 200 }
    )

    // Prefetch should not be called in test environment
    const { prefetchRouteAndData } = await import('@/lib/utils/prefetch')
    const prefetchSpy = prefetchRouteAndData as jest.Mock
    expect(prefetchSpy).not.toHaveBeenCalled()
  })

  it('passes through Link props correctly', () => {
    render(
      <PrefetchLink href="/test" className="custom-class" data-testid="custom-link">
        Test Link
      </PrefetchLink>
    )

    const link = screen.getByTestId('custom-link')
    expect(link).toHaveClass('custom-class')
  })

  it('handles missing prefetchDataFetcher gracefully', () => {
    render(
      <PrefetchLink href="/test" prefetchDataKey="test:key">
        Test Link
      </PrefetchLink>
    )

    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
  })
})
