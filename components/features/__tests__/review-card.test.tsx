import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewCard } from '../review-card'

/**
 * ReviewCard Component Tests
 *
 * Tests the main review card component functionality
 */

describe('ReviewCard', () => {
  const mockOnSubmit = jest.fn()
  const mockOnSkip = jest.fn()

  const defaultProps = {
    character: '你',
    meaning: 'you',
    correctPinyin: 'nǐ',
    itemType: 'character' as const,
    onSubmit: mockOnSubmit,
    onSkip: mockOnSkip,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders character and meaning', () => {
    render(<ReviewCard {...defaultProps} />)

    expect(screen.getByText('你')).toBeInTheDocument()
    // "you" appears in multiple places (meaning + help text)
    const youElements = screen.getAllByText(/you/i)
    expect(youElements.length).toBeGreaterThan(0)
  })

  it('handles correct answer submission', async () => {
    const user = userEvent.setup()

    render(<ReviewCard {...defaultProps} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'ni3')
    await user.keyboard('{Enter}')

    // Should show correct feedback - "correct" appears in multiple places
    await waitFor(() => {
      const correctTexts = screen.getAllByText(/correct/i)
      expect(correctTexts.length).toBeGreaterThan(0)
    })
  })

  it('handles incorrect answer', async () => {
    const user = userEvent.setup()

    render(<ReviewCard {...defaultProps} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'hao')
    await user.keyboard('{Enter}')

    // Should show feedback - component shows the correct answer
    await waitFor(() => {
      // After submitting, the component shows feedback with the correct answer
      expect(screen.getByText(defaultProps.correctPinyin)).toBeInTheDocument()
    })
  })

  it('calls onSubmit with grade', async () => {
    const user = userEvent.setup()

    render(<ReviewCard {...defaultProps} />)

    // Type and submit answer
    const input = screen.getByRole('textbox')
    await user.type(input, 'ni3{Enter}')

    // Wait for feedback - "correct" appears in multiple places
    await waitFor(() => {
      const correctTexts = screen.getAllByText(/correct/i)
      expect(correctTexts.length).toBeGreaterThan(0)
    })

    // Click grade button
    const goodButton = screen.getByRole('button', { name: /good/i })
    await user.click(goodButton)

    // Should call onSubmit
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        userAnswer: expect.any(String),
        isCorrect: true,
        grade: expect.any(Number),
        responseTimeMs: expect.any(Number),
      })
    )
  })

  it('resets state when character changes', () => {
    const { rerender } = render(<ReviewCard {...defaultProps} />)

    // Rerender with new character
    rerender(<ReviewCard {...defaultProps} character="好" correctPinyin="hǎo" />)

    // Should show new character
    expect(screen.getByText('好')).toBeInTheDocument()
  })

  it('calls onSkip when skip button clicked', async () => {
    const user = userEvent.setup()

    render(<ReviewCard {...defaultProps} />)

    const skipButton = screen.getByRole('button', { name: /skip/i })
    await user.click(skipButton)

    expect(mockOnSkip).toHaveBeenCalled()
  })

  it('handles keyboard shortcuts', async () => {
    const user = userEvent.setup()

    render(<ReviewCard {...defaultProps} />)

    const input = screen.getByRole('textbox')

    // Type and use number key for tone
    await user.type(input, 'ni')
    await user.keyboard('3')

    // Should show correct tone
    await waitFor(() => {
      expect(input).toHaveValue('nǐ')
    })
  })
})
