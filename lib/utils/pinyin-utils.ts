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
 * Validate pinyin format
 * @param pinyin - Pinyin string to validate
 * @returns True if valid pinyin
 */
export function isValidPinyin(pinyin: string): boolean {
  if (!pinyin || pinyin.trim().length === 0) {
    return false
  }

  // Remove tone marks for validation
  const normalized = removeToneMarks(pinyin.toLowerCase().trim())

  // Check if it matches valid pinyin structure
  // Simple validation - can be expanded
  const pinyinRegex = /^[a-zü]+$/

  return pinyinRegex.test(normalized)
}

/**
 * Compare two pinyin strings (ignoring tone differences)
 * @param pinyin1 - First pinyin string
 * @param pinyin2 - Second pinyin string
 * @returns True if they match (ignoring tones)
 */
export function comparePinyinIgnoreTones(pinyin1: string, pinyin2: string): boolean {
  const normalized1 = removeToneMarks(pinyin1.toLowerCase().trim())
  const normalized2 = removeToneMarks(pinyin2.toLowerCase().trim())

  return normalized1 === normalized2
}

/**
 * Compare two pinyin strings (including tone)
 * @param pinyin1 - First pinyin string
 * @param pinyin2 - Second pinyin string
 * @returns True if they match exactly
 */
export function comparePinyinExact(pinyin1: string, pinyin2: string): boolean {
  return pinyin1.toLowerCase().trim() === pinyin2.toLowerCase().trim()
}
