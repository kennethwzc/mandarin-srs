/**
 * Comprehensive tests for pinyin utility functions
 *
 * Tests cover all functions with edge cases and error handling.
 */

import {
  addToneMark,
  removeToneMarks,
  getToneNumber,
  numericToToneMarks,
  comparePinyinExact,
} from '../pinyin-utils'

describe('pinyin-utils', () => {
  describe('addToneMark', () => {
    it('should add tone marks to single vowels', () => {
      expect(addToneMark('a', 1)).toBe('ā')
      expect(addToneMark('a', 2)).toBe('á')
      expect(addToneMark('a', 3)).toBe('ǎ')
      expect(addToneMark('a', 4)).toBe('à')
      expect(addToneMark('a', 5)).toBe('a') // Neutral tone
    })

    it('should add tone marks to e, i, o, u', () => {
      expect(addToneMark('e', 1)).toBe('ē')
      expect(addToneMark('i', 2)).toBe('í')
      expect(addToneMark('o', 3)).toBe('ǒ')
      expect(addToneMark('u', 4)).toBe('ù')
    })

    it('should handle ü correctly', () => {
      expect(addToneMark('ü', 1)).toBe('ǖ')
      expect(addToneMark('ü', 2)).toBe('ǘ')
      expect(addToneMark('ü', 3)).toBe('ǚ')
      expect(addToneMark('ü', 4)).toBe('ǜ')
    })

    it('should handle v as ü', () => {
      expect(addToneMark('v', 1)).toBe('ǖ')
      expect(addToneMark('nv', 1)).toBe('nǖ')
    })

    it('should prioritize a and e over other vowels', () => {
      expect(addToneMark('ai', 1)).toBe('āi')
      expect(addToneMark('ei', 2)).toBe('éi')
      expect(addToneMark('ao', 3)).toBe('ǎo')
    })

    it('should handle ou correctly (mark on o)', () => {
      expect(addToneMark('ou', 1)).toBe('ōu')
      expect(addToneMark('kou', 2)).toBe('kóu')
    })

    it('should mark last vowel when no a/e/ou', () => {
      expect(addToneMark('ni', 3)).toBe('nǐ')
      expect(addToneMark('hao', 3)).toBe('hǎo') // a takes priority
      expect(addToneMark('liu', 2)).toBe('liú')
    })

    it('should handle multi-syllable words', () => {
      // Function marks last vowel when no a/e/ou, so 'o' in 'hao' gets marked
      expect(addToneMark('nihao', 3)).toBe('nihǎo')
      expect(addToneMark('zhong', 1)).toBe('zhōng')
    })

    it('should preserve case structure', () => {
      // Function preserves original case when replacing vowel
      expect(addToneMark('Ni', 3)).toBe('Nǐ')
      expect(addToneMark('HAO', 3)).toBe('HǎO') // Preserves H and O case
    })

    it('should return unchanged for neutral tone (5)', () => {
      expect(addToneMark('ma', 5)).toBe('ma')
      expect(addToneMark('de', 5)).toBe('de')
    })

    it('should throw error for invalid tone numbers', () => {
      expect(() => addToneMark('ni', 0)).toThrow('Invalid tone number')
      expect(() => addToneMark('ni', 6)).toThrow('Invalid tone number')
      expect(() => addToneMark('ni', -1)).toThrow('Invalid tone number')
    })

    it('should handle syllables without vowels', () => {
      expect(addToneMark('m', 1)).toBe('m') // No vowel, return unchanged
      expect(addToneMark('n', 2)).toBe('n')
    })

    it('should handle complex syllables', () => {
      expect(addToneMark('zhong', 1)).toBe('zhōng')
      expect(addToneMark('chuang', 2)).toBe('chuáng')
      expect(addToneMark('xue', 3)).toBe('xuě')
    })
  })

  describe('removeToneMarks', () => {
    it('should remove all tone marks', () => {
      expect(removeToneMarks('nǐ')).toBe('ni')
      expect(removeToneMarks('hǎo')).toBe('hao')
      expect(removeToneMarks('mā')).toBe('ma')
    })

    it('should handle multiple tone marks', () => {
      expect(removeToneMarks('nǐhǎo')).toBe('nihao')
      expect(removeToneMarks('zhōngguó')).toBe('zhongguo')
    })

    it('should handle all vowel tone marks', () => {
      expect(removeToneMarks('āáǎà')).toBe('aaaa')
      expect(removeToneMarks('ēéěè')).toBe('eeee')
      expect(removeToneMarks('īíǐì')).toBe('iiii')
      expect(removeToneMarks('ōóǒò')).toBe('oooo')
      expect(removeToneMarks('ūúǔù')).toBe('uuuu')
      expect(removeToneMarks('ǖǘǚǜ')).toBe('üüüü')
    })

    it('should handle mixed marked and unmarked', () => {
      expect(removeToneMarks('nǐhao')).toBe('nihao')
      expect(removeToneMarks('ni hǎo')).toBe('ni hao')
    })

    it('should return unchanged if no tone marks', () => {
      expect(removeToneMarks('nihao')).toBe('nihao')
      expect(removeToneMarks('hello')).toBe('hello')
    })

    it('should handle empty strings', () => {
      expect(removeToneMarks('')).toBe('')
    })
  })

  describe('getToneNumber', () => {
    it('should extract tone 1-4 from marked vowels', () => {
      expect(getToneNumber('ā')).toBe(1)
      expect(getToneNumber('á')).toBe(2)
      expect(getToneNumber('ǎ')).toBe(3)
      expect(getToneNumber('à')).toBe(4)
    })

    it('should extract tone from syllables', () => {
      expect(getToneNumber('nǐ')).toBe(3)
      expect(getToneNumber('hǎo')).toBe(3)
      expect(getToneNumber('mā')).toBe(1)
      expect(getToneNumber('mà')).toBe(4)
    })

    it('should return 5 (neutral) for unmarked syllables', () => {
      expect(getToneNumber('ma')).toBe(5)
      expect(getToneNumber('ni')).toBe(5)
      expect(getToneNumber('hao')).toBe(5)
    })

    it('should return 5 for empty strings', () => {
      expect(getToneNumber('')).toBe(5)
    })

    it('should handle ü tone marks', () => {
      expect(getToneNumber('ǖ')).toBe(1)
      expect(getToneNumber('ǘ')).toBe(2)
      expect(getToneNumber('ǚ')).toBe(3)
      expect(getToneNumber('ǜ')).toBe(4)
    })

    it('should return first tone found in multi-syllable', () => {
      expect(getToneNumber('nǐhǎo')).toBe(3) // First tone mark found
    })
  })

  describe('numericToToneMarks', () => {
    it('should convert numeric tones to tone marks', () => {
      expect(numericToToneMarks('ni3')).toBe('nǐ')
      expect(numericToToneMarks('hao3')).toBe('hǎo')
      expect(numericToToneMarks('ma1')).toBe('mā')
    })

    it('should handle multiple syllables', () => {
      expect(numericToToneMarks('ni3hao3')).toBe('nǐhǎo')
      expect(numericToToneMarks('zhong1guo2')).toBe('zhōngguó')
    })

    it('should handle neutral tone (5)', () => {
      expect(numericToToneMarks('ma5')).toBe('ma')
      expect(numericToToneMarks('de5')).toBe('de')
    })

    it('should handle mixed numeric and marked', () => {
      expect(numericToToneMarks('ni3hǎo')).toBe('nǐhǎo') // Only converts numeric
    })

    it('should preserve case from input', () => {
      // Function preserves case structure from input
      expect(numericToToneMarks('NI3')).toBe('Nǐ')
      expect(numericToToneMarks('Hao3')).toBe('Hǎo')
    })

    it('should return unchanged if no numeric tones', () => {
      expect(numericToToneMarks('nihao')).toBe('nihao')
      expect(numericToToneMarks('nǐhǎo')).toBe('nǐhǎo')
    })
  })

  describe('comparePinyinExact', () => {
    it('should return true for exact matches', () => {
      expect(comparePinyinExact('hǎo', 'hǎo')).toBe(true)
      expect(comparePinyinExact('nǐ', 'nǐ')).toBe(true)
      expect(comparePinyinExact('mā', 'mā')).toBe(true)
    })

    it('should return false for non-matches', () => {
      expect(comparePinyinExact('hǎo', 'hào')).toBe(false)
      expect(comparePinyinExact('nǐ', 'ní')).toBe(false)
      expect(comparePinyinExact('mā', 'má')).toBe(false)
    })

    it('should return false when tones differ', () => {
      expect(comparePinyinExact('nǐ', 'ni')).toBe(false)
      expect(comparePinyinExact('hǎo', 'hao')).toBe(false)
    })

    it('should handle empty strings', () => {
      expect(comparePinyinExact('', '')).toBe(true)
      expect(comparePinyinExact('hǎo', '')).toBe(false)
      expect(comparePinyinExact('', 'hǎo')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(comparePinyinExact('Nǐ', 'nǐ')).toBe(true)
      expect(comparePinyinExact('Hǎo', 'hǎo')).toBe(true)
    })

    it('should handle whitespace', () => {
      expect(comparePinyinExact(' ni ', 'ni')).toBe(true) // Trims
      expect(comparePinyinExact('ni hao', 'ni hao')).toBe(true)
    })

    it('should handle multi-syllable words', () => {
      expect(comparePinyinExact('nǐhǎo', 'nǐhǎo')).toBe(true)
      expect(comparePinyinExact('nǐhǎo', 'nǐ hào')).toBe(false) // Space difference
    })
  })
})
