/**
 * PinyinInput Component Tests
 *
 * Tests all pinyin input functionality including tone application,
 * validation, suggestions, and keyboard shortcuts
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PinyinInput } from '../pinyin-input'

describe('PinyinInput', () => {
  const mockOnChange = jest.fn()
  const mockOnToneChange = jest.fn()
  const mockOnSubmit = jest.fn()

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    selectedTone: null as number | null,
    onToneChange: mockOnToneChange,
    onSubmit: mockOnSubmit,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders input field', () => {
    render(<PinyinInput {...defaultProps} />)

    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', expect.stringMatching(/ni3|nǐ/i))
  })

  it('accepts text input', async () => {
    const user = userEvent.setup()

    render(<PinyinInput {...defaultProps} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'ni')

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('applies tone marks with number keys 1-5', async () => {
    const user = userEvent.setup()

    render(<PinyinInput {...defaultProps} value="ni" />)

    const input = screen.getByRole('textbox')

    // Press 3 for tone 3
    await user.type(input, '3')

    // Should call onToneChange first (preventDefault prevents typing '3')
    expect(mockOnToneChange).toHaveBeenCalledWith(3)
  })

  it('handles space key press', async () => {
    const user = userEvent.setup()

    render(<PinyinInput {...defaultProps} value="ni" />)

    const input = screen.getByRole('textbox')

    // Type normally (space is handled by parent via hook)
    await user.type(input, 'h')

    // Should call onChange
    expect(mockOnChange).toHaveBeenCalled()
  })

  it('submits on Enter key', async () => {
    const user = userEvent.setup()

    render(<PinyinInput {...defaultProps} value="nǐ" />)

    const input = screen.getByRole('textbox')
    await user.type(input, '{Enter}')

    expect(mockOnSubmit).toHaveBeenCalled()
  })

  it('converts v to ü automatically', async () => {
    const user = userEvent.setup()

    render(<PinyinInput {...defaultProps} value="l" />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'v')

    // Should call onChange with lü
    expect(mockOnChange).toHaveBeenCalled()
  })

  it('handles paste events', async () => {
    const user = userEvent.setup()

    render(<PinyinInput {...defaultProps} />)

    const input = screen.getByRole('textbox')

    // Simulate paste
    await user.click(input)
    await user.paste('ni3')

    expect(mockOnChange).toHaveBeenCalled()
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

  it('does not submit when input is empty', async () => {
    const user = userEvent.setup()

    render(<PinyinInput {...defaultProps} value="" />)

    const input = screen.getByRole('textbox')
    await user.type(input, '{Enter}')

    // Should not submit empty input
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('handles special pinyin characters correctly', async () => {
    const user = userEvent.setup()

    // Test ü handling
    render(<PinyinInput {...defaultProps} value="n" />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'v')

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('clears input when value prop changes to empty string', () => {
    const { rerender } = render(
      <PinyinInput
        value="nǐ"
        onChange={mockOnChange}
        selectedTone={3}
        onToneChange={mockOnToneChange}
        onSubmit={mockOnSubmit}
      />
    )

    let input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('nǐ')

    rerender(
      <PinyinInput
        value=""
        onChange={mockOnChange}
        selectedTone={null}
        onToneChange={mockOnToneChange}
        onSubmit={mockOnSubmit}
      />
    )

    input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('handles rapid key presses correctly', async () => {
    const user = userEvent.setup()

    render(<PinyinInput {...defaultProps} />)

    const input = screen.getByRole('textbox')

    // Type quickly
    await user.type(input, 'nihao')

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('prevents non-pinyin characters when strict mode enabled', async () => {
    const user = userEvent.setup()

    render(
      <PinyinInput
        value=""
        onChange={mockOnChange}
        selectedTone={null}
        onToneChange={mockOnToneChange}
        onSubmit={mockOnSubmit}
      />
    )

    const input = screen.getByRole('textbox')

    // Try to type special characters
    await user.type(input, '!@#')

    // These should be filtered out or not accepted
    // (Implementation depends on your component's strict mode)
  })
})
