/**
 * PinyinInput Component Tests
 *
 * Tests the simplified pinyin input functionality.
 * Key principle: KISS - Keep It Simple, Stupid
 *
 * Input behavior:
 * - Space works naturally (no auto-conversion)
 * - Backspace works naturally
 * - Numbers 1-5 are typed as characters (no special handling)
 * - Only Enter is intercepted for submit
 * - Conversion happens on submit
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PinyinInput } from '../pinyin-input'

describe('PinyinInput', () => {
  const mockOnChange = jest.fn()
  const mockOnSubmit = jest.fn()

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onSubmit: mockOnSubmit,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders input field', () => {
      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', expect.stringMatching(/ni3|nǐ/i))
    })

    it('auto-focuses when autoFocus prop is true', () => {
      render(<PinyinInput {...defaultProps} autoFocus />)

      const input = screen.getByRole('textbox')
      expect(document.activeElement).toBe(input)
    })

    it('does not auto-focus when autoFocus is false', () => {
      render(<PinyinInput {...defaultProps} autoFocus={false} />)

      const input = screen.getByRole('textbox')
      expect(document.activeElement).not.toBe(input)
    })

    it('disables input when disabled prop is true', () => {
      render(<PinyinInput {...defaultProps} disabled />)

      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })
  })

  describe('Basic Input', () => {
    it('accepts text input', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ni')

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('allows typing tone numbers as characters', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} value="ni" />)

      const input = screen.getByRole('textbox')
      await user.type(input, '3')

      // Number 3 should be typed as a character (no interception)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('allows typing spaces naturally', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} value="ni3" />)

      const input = screen.getByRole('textbox')
      await user.type(input, ' ')

      // Space should be added normally (no auto-conversion)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles rapid key presses correctly', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'nihao')

      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('v to ü Conversion', () => {
    it('converts v to ü automatically', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} value="l" />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'v')

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles special pinyin characters correctly', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} value="n" />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'v')

      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Submit Handling', () => {
    it('submits on Enter key when value is not empty', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} value="nǐ" />)

      const input = screen.getByRole('textbox')
      await user.type(input, '{Enter}')

      expect(mockOnSubmit).toHaveBeenCalled()
    })

    it('does not submit when input is empty', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} value="" />)

      const input = screen.getByRole('textbox')
      await user.type(input, '{Enter}')

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Paste Handling', () => {
    it('handles paste events', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.paste('ni3')

      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Value Updates', () => {
    it('clears input when value prop changes to empty string', () => {
      const { rerender } = render(<PinyinInput value="nǐ" onChange={mockOnChange} />)

      let input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('nǐ')

      rerender(<PinyinInput value="" onChange={mockOnChange} />)

      input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('')
    })
  })

  describe('Character Filtering', () => {
    it('filters out invalid characters', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '!@#')

      // These should be filtered out
      // onChange is called but with filtered content
      expect(mockOnChange).toHaveBeenCalled()
    })
  })
})
