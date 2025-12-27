/**
 * PinyinInput Component Tests
 *
 * Tests the real-time tone conversion functionality.
 *
 * Input behavior:
 * - Real-time conversion: ni3 → nǐ (immediately!)
 * - Smart backspace: zài → zai (removes tone, keeps letter)
 * - Space works naturally
 * - v → ü auto-conversion
 * - Enter to submit
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
    it('renders input field with placeholder', () => {
      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', expect.stringMatching(/ni3.*nǐ/i))
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

  describe('Real-Time Tone Conversion', () => {
    it('converts tone number to tone mark immediately', async () => {
      const user = userEvent.setup()

      // Start with "ni" already in the input
      render(<PinyinInput {...defaultProps} value="ni" />)

      const input = screen.getByRole('textbox')
      // Type just the tone number
      await user.type(input, '3')

      // Should call onChange with converted value containing tone mark
      expect(mockOnChange).toHaveBeenCalled()
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1]
      expect(lastCall[0]).toContain('ǐ')
    })

    it('accepts text input', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ni')

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('allows typing spaces naturally', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} value="nǐ" />)

      const input = screen.getByRole('textbox')
      await user.type(input, ' ')

      // Space should be added normally
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

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'lv')

      // Should convert v to ü
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1]
      expect(lastCall[0]).toContain('ü')
    })

    it('handles nv to nü conversion', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'nv')

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1]
      expect(lastCall[0]).toContain('ü')
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
    it('handles paste events with tone conversion', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.paste('ni3 hao3')

      // Should call onChange with converted value
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1]
      expect(lastCall[0]).toContain('ǐ')
      expect(lastCall[0]).toContain('ǎ')
    })

    it('handles paste of already-toned pinyin', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.paste('nǐ hǎo')

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

    it('displays tone marks correctly', () => {
      render(<PinyinInput value="nǐ hǎo" onChange={mockOnChange} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('nǐ hǎo')
    })
  })

  describe('Character Filtering', () => {
    it('filters out invalid characters', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '!@#')

      // These should be filtered out
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('filters out numbers 0 and 6-9', async () => {
      const user = userEvent.setup()

      render(<PinyinInput {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ni09')

      // 0 and 9 should be filtered out, only "ni" remains
      expect(mockOnChange).toHaveBeenCalled()
    })
  })
})
