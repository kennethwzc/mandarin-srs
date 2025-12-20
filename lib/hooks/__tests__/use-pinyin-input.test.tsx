/**
 * Tests for usePinyinInput hook
 *
 * Tests cover:
 * - State management
 * - Tone selection
 * - Validation
 * - Reset functionality
 */

import { renderHook, act } from '@testing-library/react'
import { usePinyinInput } from '../use-pinyin-input'

// Mock pinyin utils but use actual implementations for most functions
jest.mock('@/lib/utils/pinyin-utils', () => {
  const actual = jest.requireActual('@/lib/utils/pinyin-utils')
  return {
    ...actual,
    // Keep actual implementations
    addToneMark: actual.addToneMark,
    comparePinyinExact: actual.comparePinyinExact,
  }
})

describe('usePinyinInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty string by default', () => {
      const { result } = renderHook(() => usePinyinInput())

      expect(result.current.value).toBe('')
      expect(result.current.selectedTone).toBe(null)
    })

    it('should initialize with provided initial value', () => {
      const { result } = renderHook(() => usePinyinInput('ni'))

      expect(result.current.value).toBe('ni')
      expect(result.current.selectedTone).toBe(null)
    })
  })

  describe('handleChange', () => {
    it('should update value', () => {
      const { result } = renderHook(() => usePinyinInput())

      act(() => {
        result.current.handleChange('ni')
      })

      expect(result.current.value).toBe('ni')
    })

    it('should clear selected tone when value changes', () => {
      const { result } = renderHook(() => usePinyinInput('ni'))

      // First select a tone
      act(() => {
        result.current.handleToneSelect(3)
      })

      expect(result.current.selectedTone).toBe(3)

      // Then change value
      act(() => {
        result.current.handleChange('hao')
      })

      expect(result.current.value).toBe('hao')
      expect(result.current.selectedTone).toBe(null)
    })
  })

  describe('handleToneSelect', () => {
    it('should add tone mark to last syllable', () => {
      const { result } = renderHook(() => usePinyinInput('ni'))

      act(() => {
        result.current.handleToneSelect(3)
      })

      // Value should be updated with tone mark
      expect(result.current.value).toBe('nǐ')
      expect(result.current.selectedTone).toBe(3)
    })

    it('should handle multi-syllable words', () => {
      const { result } = renderHook(() => usePinyinInput('ni hao'))

      act(() => {
        result.current.handleToneSelect(3)
      })

      // Should add tone to last syllable 'hao'
      expect(result.current.value).toBe('ni hǎo')
      expect(result.current.selectedTone).toBe(3)
    })

    it('should not add tone if value is empty', () => {
      const { result } = renderHook(() => usePinyinInput())

      act(() => {
        result.current.handleToneSelect(3)
      })

      expect(result.current.value).toBe('')
      expect(result.current.selectedTone).toBe(null)
    })

    it('should handle all tone numbers 1-5', () => {
      const { result } = renderHook(() => usePinyinInput())

      // Test each tone - verify tone selection works for all values
      const tones = [1, 2, 3, 4, 5]

      tones.forEach((tone) => {
        act(() => {
          result.current.handleChange('ni')
        })
        // After handleChange, selectedTone should be null
        expect(result.current.selectedTone).toBe(null)

        act(() => {
          result.current.handleToneSelect(tone)
        })
        // After handleToneSelect, selectedTone should be set
        expect(result.current.selectedTone).toBe(tone)

        if (tone === 5) {
          // Neutral tone returns unchanged
          expect(result.current.value).toBe('ni')
        } else {
          // Other tones add tone marks
          expect(result.current.value).not.toBe('ni')
          expect(result.current.value.length).toBeGreaterThanOrEqual(2)
        }
      })
    })
  })

  describe('reset', () => {
    it('should reset value and selected tone', () => {
      const { result } = renderHook(() => usePinyinInput('nǐ'))

      // Set a tone
      act(() => {
        result.current.handleToneSelect(3)
      })

      expect(result.current.value).toBe('nǐ')
      expect(result.current.selectedTone).toBe(3)

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.value).toBe('')
      expect(result.current.selectedTone).toBe(null)
    })
  })

  describe('integration', () => {
    it('should handle complete input flow', () => {
      const { result } = renderHook(() => usePinyinInput())

      // 1. Type input
      act(() => {
        result.current.handleChange('ni')
      })
      expect(result.current.value).toBe('ni')

      // 2. Select tone
      act(() => {
        result.current.handleToneSelect(3)
      })
      expect(result.current.selectedTone).toBe(3)

      // 3. Reset
      act(() => {
        result.current.reset()
      })
      expect(result.current.value).toBe('')
      expect(result.current.selectedTone).toBe(null)
    })

    it('should handle multiple tone selections', () => {
      const { result } = renderHook(() => usePinyinInput('ni'))

      // Select tone 3
      act(() => {
        result.current.handleToneSelect(3)
      })
      expect(result.current.selectedTone).toBe(3)

      // Change to tone 1
      act(() => {
        result.current.handleChange('ni')
        result.current.handleToneSelect(1)
      })
      expect(result.current.selectedTone).toBe(1)
    })
  })
})
