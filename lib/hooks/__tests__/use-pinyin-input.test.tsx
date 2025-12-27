/**
 * Tests for usePinyinInput hook
 *
 * Tests cover:
 * - State management
 * - Tone application with replacement
 * - Cursor-aware syllable detection
 * - Space auto-conversion
 * - Normalization
 */

import { renderHook, act } from '@testing-library/react'
import { usePinyinInput } from '../use-pinyin-input'

describe('usePinyinInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty string by default', () => {
      const { result } = renderHook(() => usePinyinInput())

      expect(result.current.value).toBe('')
      expect(result.current.syllables).toEqual([])
    })

    it('should initialize with provided initial value', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni' }))

      expect(result.current.value).toBe('ni')
      expect(result.current.syllables).toEqual(['ni'])
    })
  })

  describe('setValue', () => {
    it('should update value', () => {
      const { result } = renderHook(() => usePinyinInput())

      act(() => {
        result.current.setValue('ni')
      })

      expect(result.current.value).toBe('ni')
    })

    it('should auto-correct v to ü for nv', () => {
      const { result } = renderHook(() => usePinyinInput())

      act(() => {
        result.current.setValue('nv3')
      })

      expect(result.current.value).toBe('nü3')
    })

    it('should auto-correct v to ü for lv', () => {
      const { result } = renderHook(() => usePinyinInput())

      act(() => {
        result.current.setValue('lv4')
      })

      expect(result.current.value).toBe('lü4')
    })
  })

  describe('applyTone', () => {
    it('should add tone mark to syllable without tone', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni' }))

      act(() => {
        result.current.applyTone(3)
      })

      expect(result.current.value).toBe('nǐ')
    })

    it('should replace existing tone mark', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'nǐ' }))

      act(() => {
        result.current.applyTone(2)
      })

      expect(result.current.value).toBe('ní')
    })

    it('should apply tone to last syllable by default', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni hao' }))

      act(() => {
        result.current.applyTone(3)
      })

      expect(result.current.value).toBe('ni hǎo')
    })

    it('should apply tone to specified syllable index', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni hao' }))

      act(() => {
        result.current.applyTone(3, 0) // Apply to first syllable
      })

      expect(result.current.value).toBe('nǐ hao')
    })

    it('should replace tone on multi-syllable word', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'nǐ hǎo' }))

      act(() => {
        result.current.applyTone(4, 0) // Change first syllable tone
      })

      expect(result.current.value).toBe('nì hǎo')
    })

    it('should not apply tone if value is empty', () => {
      const { result } = renderHook(() => usePinyinInput())

      act(() => {
        result.current.applyTone(3)
      })

      expect(result.current.value).toBe('')
    })

    it('should handle all tone numbers 1-5', () => {
      const toneResults = ['nī', 'ní', 'nǐ', 'nì', 'ni']

      toneResults.forEach((expected, index) => {
        const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni' }))

        act(() => {
          result.current.applyTone(index + 1)
        })

        expect(result.current.value).toBe(expected)
      })
    })
  })

  describe('handleSpace', () => {
    it('should convert tone number to mark on space', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni3' }))

      act(() => {
        result.current.handleSpace()
      })

      expect(result.current.value).toBe('nǐ ')
    })

    it('should just add space if no tone number', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni' }))

      act(() => {
        result.current.handleSpace()
      })

      expect(result.current.value).toBe('ni ')
    })

    it('should add space to empty value', () => {
      const { result } = renderHook(() => usePinyinInput())

      act(() => {
        result.current.handleSpace()
      })

      expect(result.current.value).toBe(' ')
    })
  })

  describe('getFinalValue', () => {
    it('should normalize spaces', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: '  ni   hao  ' }))

      expect(result.current.getFinalValue()).toBe('ni hao')
    })

    it('should convert remaining tone numbers', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni3 hao3' }))

      expect(result.current.getFinalValue()).toBe('nǐ hǎo')
    })

    it('should preserve existing tone marks', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'nǐ hǎo' }))

      expect(result.current.getFinalValue()).toBe('nǐ hǎo')
    })
  })

  describe('syllables', () => {
    it('should split into syllables correctly', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni hao ma' }))

      expect(result.current.syllables).toEqual(['ni', 'hao', 'ma'])
    })

    it('should handle multiple spaces', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'ni   hao' }))

      expect(result.current.syllables).toEqual(['ni', 'hao'])
    })

    it('should handle empty value', () => {
      const { result } = renderHook(() => usePinyinInput())

      expect(result.current.syllables).toEqual([])
    })
  })

  describe('reset', () => {
    it('should reset value to initial', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'initial' }))

      act(() => {
        result.current.setValue('changed')
      })

      expect(result.current.value).toBe('changed')

      act(() => {
        result.current.reset()
      })

      expect(result.current.value).toBe('initial')
    })

    it('should reset to empty if no initial value', () => {
      const { result } = renderHook(() => usePinyinInput())

      act(() => {
        result.current.setValue('test')
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.value).toBe('')
    })
  })

  describe('integration', () => {
    it('should handle complete single character flow', () => {
      const { result } = renderHook(() => usePinyinInput())

      // 1. Type input
      act(() => {
        result.current.setValue('ni')
      })
      expect(result.current.value).toBe('ni')

      // 2. Apply tone
      act(() => {
        result.current.applyTone(3)
      })
      expect(result.current.value).toBe('nǐ')

      // 3. Get final value
      expect(result.current.getFinalValue()).toBe('nǐ')
    })

    it('should handle complete multi-character flow', () => {
      const { result } = renderHook(() => usePinyinInput())

      // 1. Type first syllable with tone number
      act(() => {
        result.current.setValue('zai4')
      })

      // 2. Press space to convert and add space
      act(() => {
        result.current.handleSpace()
      })
      expect(result.current.value).toBe('zài ')

      // 3. Type second syllable
      act(() => {
        result.current.setValue('zài jian')
      })

      // 4. Apply tone to last syllable
      act(() => {
        result.current.applyTone(4)
      })
      expect(result.current.value).toBe('zài jiàn')
    })

    it('should handle tone correction flow', () => {
      const { result } = renderHook(() => usePinyinInput({ initialValue: 'hao' }))

      // Apply wrong tone
      act(() => {
        result.current.applyTone(4)
      })
      expect(result.current.value).toBe('hào')

      // Correct the tone (replacement, not addition)
      act(() => {
        result.current.applyTone(3)
      })
      expect(result.current.value).toBe('hǎo')
    })
  })
})
