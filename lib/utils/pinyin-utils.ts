/**
 * Pinyin utilities for validation and tone mark handling
 *
 * Pinyin consists of:
 * - Initial consonant (optional): b, p, m, f, d, t, n, l, g, k, h, j, q, x, zh, ch, sh, r, z, c, s, y, w
 * - Final vowel(s) (required): a, o, e, i, u, ü, ai, ei, ui, ao, ou, iu, ie, üe, er, an, en, in, un, ün, ang, eng, ing, ong
 * - Tone mark (1-5): ā á ǎ à a (neutral)
 */

// Tone marks for each vowel
export const TONE_MARKS = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
} as const

// Valid initials and finals in pinyin (for future validation)
// These will be used when implementing full pinyin validation
/*
const VALID_INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w']
const VALID_FINALS = ['a', 'o', 'e', 'i', 'u', 'ü', 'v', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 've', 'er', 'an', 'en', 'in', 'un', 'ün', 'vn', 'ang', 'eng', 'ing', 'ong']
*/

/**
 * Add tone mark to pinyin syllable
 *
 * Rules for tone mark placement:
 * 1. If 'a' or 'e' present, mark goes there
 * 2. If 'ou' present, mark goes on 'o'
 * 3. Otherwise, mark goes on last vowel
 *
 * @param syllable - Pinyin syllable without tone (e.g., "ni", "hao")
 * @param tone - Tone number (1-5, where 5 is neutral)
 * @returns Pinyin with tone mark (e.g., "nǐ", "hǎo")
 */
export function addToneMark(syllable: string, tone: number): string {
  if (tone < 1 || tone > 5) {
    throw new Error(`Invalid tone number: ${tone}. Must be 1-5.`)
  }

  // Neutral tone (5) - return as is
  if (tone === 5) {
    return syllable
  }

  const toneIndex = tone - 1
  const lower = syllable.toLowerCase()

  // Find which vowel gets the tone mark
  let targetVowel = ''
  let targetIndex = -1

  // Rule 1: 'a' or 'e' gets the mark
  if (lower.includes('a')) {
    targetVowel = 'a'
    targetIndex = lower.indexOf('a')
  } else if (lower.includes('e')) {
    targetVowel = 'e'
    targetIndex = lower.indexOf('e')
  }
  // Rule 2: 'ou' - mark goes on 'o'
  else if (lower.includes('ou')) {
    targetVowel = 'o'
    targetIndex = lower.indexOf('o')
  }
  // Rule 3: Mark the last vowel
  else {
    const vowels = ['i', 'o', 'u', 'ü', 'v']
    for (let i = lower.length - 1; i >= 0; i--) {
      const char = lower[i]
      if (char && vowels.includes(char)) {
        targetVowel = char === 'v' ? 'ü' : char
        targetIndex = i
        break
      }
    }
  }

  if (targetIndex === -1 || !targetVowel) {
    return syllable // No vowel found, return unchanged
  }

  // Handle 'v' as 'ü'
  const vowelForMark = targetVowel === 'v' ? 'ü' : targetVowel

  // Get the tone mark
  const toneMarkArray = TONE_MARKS[vowelForMark as keyof typeof TONE_MARKS]
  if (!toneMarkArray) {
    return syllable
  }

  const toneMark = toneMarkArray[toneIndex]
  if (!toneMark) {
    return syllable
  }

  // Replace the vowel with tone-marked version
  return syllable.substring(0, targetIndex) + toneMark + syllable.substring(targetIndex + 1)
}

/**
 * Remove tone marks from pinyin
 * @param pinyin - Pinyin with tone marks (e.g., "nǐhǎo")
 * @returns Pinyin without tone marks (e.g., "nihao")
 */
export function removeToneMarks(pinyin: string): string {
  let result = pinyin

  // Replace each tone-marked vowel with unmarked version
  Object.entries(TONE_MARKS).forEach(([baseVowel, marks]) => {
    marks.forEach((mark) => {
      result = result.replace(new RegExp(mark, 'g'), baseVowel)
    })
  })

  return result
}

/**
 * Get tone number from pinyin syllable
 * @param syllable - Pinyin syllable (e.g., "nǐ")
 * @returns Tone number (1-5, where 5 is neutral)
 */
export function getToneNumber(syllable: string): number {
  // Check each tone mark set
  for (const [_baseVowel, marks] of Object.entries(TONE_MARKS)) {
    for (let i = 0; i < marks.length; i++) {
      const mark = marks[i]
      if (mark && syllable.includes(mark)) {
        return i + 1
      }
    }
  }

  return 5 // Neutral tone (no mark found)
}

/**
 * Convert numeric tone to tone marks
 * @param pinyin - Pinyin with numbers (e.g., "ni3hao3")
 * @returns Pinyin with tone marks (e.g., "nǐhǎo")
 */
export function numericToToneMarks(pinyin: string): string {
  // Match syllables with tone numbers (e.g., "ni3", "hao3")
  return pinyin.replace(/([a-zü]+)([1-5])/gi, (_match, syllable: string, tone: string) => {
    return addToneMark(syllable, parseInt(tone, 10))
  })
}

/**
 * Compare two pinyin strings (including tone)
 * @param pinyin1 - First pinyin string
 * @param pinyin2 - Second pinyin string
 * @returns True if they match exactly
 */
export function comparePinyinExact(pinyin1: string, pinyin2: string): boolean {
  return normalizeSpaces(pinyin1.toLowerCase()) === normalizeSpaces(pinyin2.toLowerCase())
}

/**
 * Split pinyin string into syllables
 * Handles space-separated input
 *
 * @example
 * splitSyllables("ni hao") → ["ni", "hao"]
 * splitSyllables("nǐ hǎo") → ["nǐ", "hǎo"]
 * splitSyllables("  ni   hao  ") → ["ni", "hao"]
 */
export function splitSyllables(pinyin: string): string[] {
  return pinyin
    .trim()
    .split(/\s+/)
    .filter((s) => s.length > 0)
}

/**
 * Check if a syllable has a tone mark (tones 1-4)
 *
 * @example
 * hasToneMark("nǐ") → true
 * hasToneMark("ni") → false
 * hasToneMark("ni3") → false (number doesn't count)
 */
export function hasToneMark(syllable: string): boolean {
  const toneNumber = getToneNumber(syllable)
  return toneNumber >= 1 && toneNumber <= 4
}

/**
 * Replace tone on a syllable (removes existing tone, adds new one)
 *
 * @example
 * replaceTone("nǐ", 2) → "ní"
 * replaceTone("ni", 3) → "nǐ"
 * replaceTone("hǎo", 4) → "hào"
 */
export function replaceTone(syllable: string, newTone: number): string {
  const withoutTone = removeToneMarks(syllable)
  return addToneMark(withoutTone, newTone)
}

/**
 * Check if a syllable ends with a tone number (like "ni3")
 *
 * @example
 * hasToneNumber("ni3") → true
 * hasToneNumber("nǐ") → false
 * hasToneNumber("ni") → false
 */
export function hasToneNumber(syllable: string): boolean {
  return /[1-5]$/.test(syllable)
}

/**
 * Extract tone number from end of syllable
 *
 * @example
 * extractToneNumber("ni3") → { syllable: "ni", tone: 3 }
 * extractToneNumber("hao4") → { syllable: "hao", tone: 4 }
 * extractToneNumber("ni") → { syllable: "ni", tone: null }
 */
export function extractToneNumber(syllable: string): {
  syllable: string
  tone: number | null
} {
  const match = syllable.match(/^([a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+)([1-5])$/i)

  if (match && match[1] && match[2]) {
    return {
      syllable: match[1],
      tone: parseInt(match[2], 10),
    }
  }

  return { syllable, tone: null }
}

/**
 * Normalize spaces in pinyin input
 * - Trim leading/trailing spaces
 * - Replace multiple spaces with single space
 *
 * @example
 * normalizeSpaces("  ni   hao  ") → "ni hao"
 * normalizeSpaces("ni    hao    ma") → "ni hao ma"
 */
export function normalizeSpaces(pinyin: string): string {
  return pinyin.trim().replace(/\s+/g, ' ')
}

/**
 * Validate if a string is a valid pinyin syllable
 *
 * @example
 * isValidSyllable("ni") → true
 * isValidSyllable("nǐ") → true
 * isValidSyllable("xyz") → false
 */
export function isValidSyllable(syllable: string): boolean {
  // Remove tone marks and numbers for validation
  const normalized = removeToneMarks(syllable)
    .replace(/[1-5]$/, '')
    .toLowerCase()

  // Must contain at least one vowel (including ü)
  const hasVowel = /[aeiouü]/.test(normalized)

  // Must be reasonable length (1-6 chars typical for pinyin)
  const reasonableLength = normalized.length >= 1 && normalized.length <= 6

  // Must only contain valid pinyin characters
  const validChars = /^[a-zü]+$/i.test(normalized)

  return hasVowel && reasonableLength && validChars
}

/**
 * Convert all tone numbers in a pinyin string to tone marks
 *
 * @example
 * convertToneNumbers("ni3 hao3") → "nǐ hǎo"
 * convertToneNumbers("zai4jian4") → "zàijiàn"
 */
export function convertToneNumbers(pinyin: string): string {
  return pinyin.replace(
    /([a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+)([1-5])/gi,
    (_, syllable: string, tone: string) => {
      // First remove any existing tone marks to prevent double-marking
      const baseSyllable = removeToneMarks(syllable)
      return addToneMark(baseSyllable, parseInt(tone, 10))
    }
  )
}
