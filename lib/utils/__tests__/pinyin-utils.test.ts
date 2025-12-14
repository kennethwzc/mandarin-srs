/**
 * Tests for pinyin utility functions
 *
 * These are placeholder tests to ensure CI passes.
 * More comprehensive tests will be added as the pinyin
 * validation logic is developed.
 */

import { comparePinyinExact } from '../pinyin-utils'

describe('pinyin-utils', () => {
  describe('comparePinyinExact', () => {
    it('should return true for exact matches', () => {
      expect(comparePinyinExact('hǎo', 'hǎo')).toBe(true)
      expect(comparePinyinExact('nǐ', 'nǐ')).toBe(true)
    })

    it('should return false for non-matches', () => {
      expect(comparePinyinExact('hǎo', 'hào')).toBe(false)
      expect(comparePinyinExact('nǐ', 'ní')).toBe(false)
    })

    it('should handle empty strings', () => {
      expect(comparePinyinExact('', '')).toBe(true)
      expect(comparePinyinExact('hǎo', '')).toBe(false)
      expect(comparePinyinExact('', 'hǎo')).toBe(false)
    })
  })
})
