/**
 * Review Flow Integration Tests
 *
 * Tests complete review workflow from start to finish.
 * Now tests the ReviewSession component directly since the page is a server component.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewSession } from '@/components/features/review-session'
import type { ReviewItem } from '@/components/features/review-session'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockQueue: ReviewItem[] = [
  {
    id: '1',
    itemId: 1,
    itemType: 'character',
    character: '你',
    meaning: 'you',
    correctPinyin: 'nǐ',
  },
  {
    id: '2',
    itemId: 2,
    itemType: 'character',
    character: '好',
    meaning: 'good',
    correctPinyin: 'hǎo',
  },
]

describe('Review Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock API responses for submit
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/reviews/submit')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {},
            }),
        })
      }

      return Promise.reject(new Error('Unexpected API call'))
    })
  })

  it('loads and displays review queue from initial data', async () => {
    render(<ReviewSession initialQueue={mockQueue} />)

    // First card should be displayed immediately (no loading state)
    expect(screen.getByText('你')).toBeInTheDocument()
  })

  it('shows no reviews state when queue is empty', async () => {
    render(<ReviewSession initialQueue={[]} />)

    // Should show completion/empty state
    await waitFor(() => {
      expect(screen.getByText(/No Reviews Due/i)).toBeInTheDocument()
    })
  })

  it('completes a review with correct answer', async () => {
    const user = userEvent.setup()

    render(<ReviewSession initialQueue={mockQueue} />)

    // First card should be visible
    expect(screen.getByText('你')).toBeInTheDocument()

    // Type answer
    const input = screen.getByRole('textbox')
    await user.type(input, 'ni3')
    await user.keyboard('{Space}')

    // Submit
    await user.keyboard('{Enter}')

    // Should show feedback - use more specific text or getAllByText
    await waitFor(() => {
      const correctTexts = screen.getAllByText(/correct/i)
      expect(correctTexts.length).toBeGreaterThan(0)
    })
  })

  it('shows progress through session', async () => {
    render(<ReviewSession initialQueue={mockQueue} />)

    // Should show progress indicator - "1" appears in progress
    await waitFor(() => {
      const ones = screen.getAllByText(/1/)
      expect(ones.length).toBeGreaterThan(0)
    })
  })

  it('handles submission API errors gracefully', async () => {
    const user = userEvent.setup()

    // Mock API error for submit
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Network error'))
    )

    render(<ReviewSession initialQueue={mockQueue} />)

    // Type and submit
    const input = screen.getByRole('textbox')
    await user.type(input, 'ni3')
    await user.keyboard('{Space}')
    await user.keyboard('{Enter}')

    // Should still show feedback (optimistic UI)
    await waitFor(() => {
      const feedbackElements = screen.getAllByText(/correct|incorrect/i)
      expect(feedbackElements.length).toBeGreaterThan(0)
    })
  })

  it('advances to next card after grading', async () => {
    const user = userEvent.setup()

    render(<ReviewSession initialQueue={mockQueue} />)

    // First card
    expect(screen.getByText('你')).toBeInTheDocument()

    // Type and submit
    const input = screen.getByRole('textbox')
    await user.type(input, 'ni3')
    await user.keyboard('{Space}')
    await user.keyboard('{Enter}')

    // Wait for feedback
    await waitFor(() => {
      expect(screen.getAllByText(/correct/i).length).toBeGreaterThan(0)
    })

    // Click the "Next" button (grade is now auto-calculated based on time)
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    // Should advance to second card
    await waitFor(() => {
      expect(screen.getByText('好')).toBeInTheDocument()
    })
  })

  it('shows completion screen after all reviews', async () => {
    const user = userEvent.setup()

    // Single item queue for simpler test
    render(<ReviewSession initialQueue={[mockQueue[0]]} />)

    // Type and submit
    const input = screen.getByRole('textbox')
    await user.type(input, 'ni3')
    await user.keyboard('{Space}')
    await user.keyboard('{Enter}')

    // Wait for feedback
    await waitFor(() => {
      expect(screen.getAllByText(/correct/i).length).toBeGreaterThan(0)
    })

    // Click the "Next" button (grade is now auto-calculated based on time)
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    // Should show completion screen
    await waitFor(() => {
      expect(screen.getByText(/Session Complete!/i)).toBeInTheDocument()
    })
  })
})
