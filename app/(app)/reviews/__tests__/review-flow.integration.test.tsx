/**
 * Review Flow Integration Tests
 *
 * Tests complete review workflow from start to finish
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewSession } from '@/components/features/review-session'

// Mock API responses
global.fetch = jest.fn()

describe('Review Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock fetch for review queue
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/reviews/queue')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                queue: [
                  {
                    id: '1',
                    item_id: 1,
                    item_type: 'character',
                    character: '你',
                    meaning: 'you',
                    pinyin: 'nǐ',
                  },
                  {
                    id: '2',
                    item_id: 2,
                    item_type: 'character',
                    character: '好',
                    meaning: 'good',
                    pinyin: 'hǎo',
                  },
                ],
              },
            }),
        })
      }

      if (typeof url === 'string' && url.includes('/api/reviews/submit')) {
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

  it('loads review queue on mount', async () => {
    render(<ReviewSession />)

    // Wait for first card to load
    await waitFor(
      () => {
        expect(screen.getByText('你')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/reviews\/queue/),
      expect.any(Object)
    )
  })

  it('completes review with correct answer flow', async () => {
    const user = userEvent.setup()

    render(<ReviewSession />)

    // Wait for first card to load
    await waitFor(() => {
      expect(screen.getByText('你')).toBeInTheDocument()
    })

    // Type answer
    const input = screen.getByRole('textbox')
    await user.type(input, 'ni3')

    // Submit answer (implementation varies - adjust as needed)
    const submitButton = screen.getByRole('button', { name: /submit|check/i })
    await user.click(submitButton)

    // Wait for feedback
    await waitFor(() => {
      // Check for correct feedback (adjust based on your component)
      // Use getAllByText to handle multiple matches
      const feedback = screen.queryAllByText(/correct/i)[0] || screen.queryByTestId('feedback')
      expect(feedback).toBeInTheDocument()
    })
  })

  it('handles incorrect answer', async () => {
    const user = userEvent.setup()

    render(<ReviewSession />)

    await waitFor(() => {
      expect(screen.getByText('你')).toBeInTheDocument()
    })

    // Type wrong answer
    const input = screen.getByRole('textbox')
    await user.type(input, 'hao')

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit|check/i })
    await user.click(submitButton)

    // Should show feedback (implementation varies)
    await waitFor(() => {
      const feedbackElement =
        screen.queryByText(/try again/i) ||
        screen.queryByText(/incorrect/i) ||
        screen.queryByTestId('feedback')
      expect(feedbackElement).toBeInTheDocument()
    })
  })

  it('shows progress during session', async () => {
    render(<ReviewSession />)

    await waitFor(() => {
      expect(screen.getByText('你')).toBeInTheDocument()
    })

    // Should show progress indicator
    // (adjust based on your actual progress display)
    const progressText = screen.queryByText(/\d+\s*\/\s*\d+/) || screen.queryByRole('progressbar')
    expect(progressText).toBeInTheDocument()
  })

  it('advances to next card after grading', async () => {
    const user = userEvent.setup()

    render(<ReviewSession />)

    // Wait for first card
    await waitFor(() => {
      expect(screen.getByText('你')).toBeInTheDocument()
    })

    // Complete first review
    const input = screen.getByRole('textbox')
    await user.type(input, 'ni3')

    const submitButton = screen.getByRole('button', { name: /submit|check/i })
    await user.click(submitButton)

    // Wait for grade buttons
    await waitFor(() => {
      const gradeButtons = screen.queryAllByRole('button', { name: /again|hard|good|easy/i })
      expect(gradeButtons.length).toBeGreaterThan(0)
    })

    // Click a grade button
    const goodButton = screen.getByRole('button', { name: /good/i })
    await user.click(goodButton)

    // Should advance to next card
    await waitFor(() => {
      expect(screen.getByText('好')).toBeInTheDocument()
    })
  })

  it('shows completion screen when queue is empty', async () => {
    // Mock empty queue
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/reviews/queue')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { queue: [] },
            }),
        })
      }
      return Promise.reject(new Error('Unexpected API call'))
    })

    render(<ReviewSession />)

    // Should show empty state or completion message
    await waitFor(() => {
      const emptyMessage =
        screen.queryByText(/no reviews/i) ||
        screen.queryByText(/session complete/i) ||
        screen.queryByText(/all done/i)
      expect(emptyMessage).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    ;(global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.reject(new Error('Network error'))
    })

    // Suppress console.error for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<ReviewSession />)

    // Should show error message or empty state
    await waitFor(
      () => {
        const errorMessage =
          screen.queryByText(/error/i) ||
          screen.queryByText(/failed/i) ||
          screen.queryByText(/no reviews/i)
        expect(errorMessage).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    consoleErrorSpy.mockRestore()
  })

  it('submits review with correct data structure', async () => {
    const user = userEvent.setup()

    render(<ReviewSession />)

    await waitFor(() => {
      expect(screen.getByText('你')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    await user.type(input, 'ni3')

    const submitButton = screen.getByRole('button', { name: /submit|check/i })
    await user.click(submitButton)

    // Wait for grade buttons and click Good
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /good/i })).toBeInTheDocument()
    })

    const goodButton = screen.getByRole('button', { name: /good/i })
    await user.click(goodButton)

    // Verify API was called with correct structure
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reviews/submit'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      )
    })
  })
})
