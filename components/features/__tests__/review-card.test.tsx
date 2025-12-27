import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewCard } from '../review-card'

/**
 * ReviewCard Component Tests
 *
 * Tests the main review card component functionality.
 * Key principle: KISS - Keep It Simple, Stupid
 *
 * Behavior:
 * - User types pinyin with numbers (ni3) or marks (nǐ)
 * - User optionally clicks tone buttons
 * - On submit, numbers are converted to marks
 * - Both formats are accepted
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

  describe('Rendering', () => {
    it('renders character and meaning', () => {
      render(<ReviewCard {...defaultProps} />)

      expect(screen.getByText('你')).toBeInTheDocument()
      // "you" appears in multiple places (meaning + help text)
      const youElements = screen.getAllByText(/you/i)
      expect(youElements.length).toBeGreaterThan(0)
    })

    it('shows input field', () => {
      render(<ReviewCard {...defaultProps} />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('shows tone selector buttons', () => {
      render(<ReviewCard {...defaultProps} />)

      expect(screen.getByRole('button', { name: /tone 1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tone 2/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tone 3/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tone 4/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tone 5/i })).toBeInTheDocument()
    })
  })

  describe('Answer Submission - Number Format', () => {
    it('handles correct answer with tone numbers', async () => {
      const user = userEvent.setup()

      render(<ReviewCard {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ni3')
      await user.keyboard('{Enter}')

      // Should show correct feedback
      await waitFor(() => {
        const correctTexts = screen.getAllByText(/correct/i)
        expect(correctTexts.length).toBeGreaterThan(0)
      })
    })

    it('converts tone numbers to marks on submit', async () => {
      const user = userEvent.setup()

      render(<ReviewCard {...defaultProps} />)

      const input = screen.getByRole('textbox')
      // Type with numbers
      await user.type(input, 'ni3{Enter}')

      // Wait for feedback
      await waitFor(() => {
        const correctTexts = screen.getAllByText(/correct/i)
        expect(correctTexts.length).toBeGreaterThan(0)
      })

      // Click Next
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Should submit with converted pinyin
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          userAnswer: 'nǐ', // Converted from ni3
          isCorrect: true,
        })
      )
    })
  })

  describe('Answer Submission - Tone Mark Format', () => {
    it('handles correct answer with tone marks', async () => {
      const user = userEvent.setup()

      render(<ReviewCard {...defaultProps} />)

      const input = screen.getByRole('textbox')
      // Type with marks (pasted or from tone button)
      await user.click(input)
      await user.paste('nǐ')
      await user.keyboard('{Enter}')

      // Should show correct feedback
      await waitFor(() => {
        const correctTexts = screen.getAllByText(/correct/i)
        expect(correctTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Tone Button Usage', () => {
    it('applies tone when button is clicked', async () => {
      const user = userEvent.setup()

      render(<ReviewCard {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ni')

      // Click tone 3 button
      const toneButton = screen.getByRole('button', { name: /tone 3/i })
      await user.click(toneButton)

      // Input should now have tone mark
      expect(input).toHaveValue('nǐ')
    })

    it('replaces existing tone when new button clicked', async () => {
      const user = userEvent.setup()

      render(<ReviewCard {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ni')

      // Click tone 3 button
      const tone3Button = screen.getByRole('button', { name: /tone 3/i })
      await user.click(tone3Button)
      expect(input).toHaveValue('nǐ')

      // Click tone 2 button (should replace)
      const tone2Button = screen.getByRole('button', { name: /tone 2/i })
      await user.click(tone2Button)
      expect(input).toHaveValue('ní')
    })
  })

  describe('Incorrect Answer', () => {
    it('shows feedback for incorrect answer', async () => {
      const user = userEvent.setup()

      render(<ReviewCard {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'hao')
      await user.keyboard('{Enter}')

      // Should show the correct answer
      await waitFor(() => {
        expect(screen.getByText(defaultProps.correctPinyin)).toBeInTheDocument()
      })
    })
  })

  describe('Grade Calculation', () => {
    it('calls onSubmit with auto-calculated grade', async () => {
      const user = userEvent.setup()

      render(<ReviewCard {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ni3{Enter}')

      // Wait for Next button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      })

      // Click Next
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Should call onSubmit with auto-calculated grade
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          userAnswer: expect.any(String),
          isCorrect: true,
          grade: expect.any(Number),
          responseTimeMs: expect.any(Number),
        })
      )

      // Verify grade is valid (0-3)
      const callArgs = mockOnSubmit.mock.calls[0][0]
      expect(callArgs.grade).toBeGreaterThanOrEqual(0)
      expect(callArgs.grade).toBeLessThanOrEqual(3)
    })
  })

  describe('State Reset', () => {
    it('resets state when character changes', () => {
      const { rerender } = render(<ReviewCard {...defaultProps} />)

      rerender(<ReviewCard {...defaultProps} character="好" correctPinyin="hǎo" />)

      expect(screen.getByText('好')).toBeInTheDocument()
    })
  })

  describe('Skip Functionality', () => {
    it('calls onSkip when skip button clicked', async () => {
      const user = userEvent.setup()

      render(<ReviewCard {...defaultProps} />)

      const skipButton = screen.getByRole('button', { name: /skip/i })
      await user.click(skipButton)

      expect(mockOnSkip).toHaveBeenCalled()
    })
  })

  describe('Multi-Syllable Words', () => {
    it('handles multi-syllable words with spaces', async () => {
      const user = userEvent.setup()

      render(<ReviewCard {...defaultProps} correctPinyin="nǐ hǎo" />)

      const input = screen.getByRole('textbox')
      // Type with numbers and space
      await user.type(input, 'ni3 hao3{Enter}')

      // Wait for feedback
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      })

      // Click Next
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Should submit with converted pinyin
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          userAnswer: 'nǐ hǎo', // Converted from ni3 hao3
        })
      )
    })
  })
})
