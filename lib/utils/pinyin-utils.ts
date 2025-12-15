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

// Valid pinyin syllables (complete list for validation)
const VALID_SYLLABLES = new Set([
  // All valid Mandarin pinyin syllables
  'a',
  'ai',
  'an',
  'ang',
  'ao',
  'ba',
  'bai',
  'ban',
  'bang',
  'bao',
  'bei',
  'ben',
  'beng',
  'bi',
  'bian',
  'biao',
  'bie',
  'bin',
  'bing',
  'bo',
  'bu',
  'ca',
  'cai',
  'can',
  'cang',
  'cao',
  'ce',
  'cen',
  'ceng',
  'cha',
  'chai',
  'chan',
  'chang',
  'chao',
  'che',
  'chen',
  'cheng',
  'chi',
  'chong',
  'chou',
  'chu',
  'chua',
  'chuai',
  'chuan',
  'chuang',
  'chui',
  'chun',
  'chuo',
  'ci',
  'cong',
  'cou',
  'cu',
  'cuan',
  'cui',
  'cun',
  'cuo',
  'da',
  'dai',
  'dan',
  'dang',
  'dao',
  'de',
  'dei',
  'den',
  'deng',
  'di',
  'dia',
  'dian',
  'diao',
  'die',
  'ding',
  'diu',
  'dong',
  'dou',
  'du',
  'duan',
  'dui',
  'dun',
  'duo',
  'e',
  'ei',
  'en',
  'eng',
  'er',
  'fa',
  'fan',
  'fang',
  'fei',
  'fen',
  'feng',
  'fo',
  'fou',
  'fu',
  'ga',
  'gai',
  'gan',
  'gang',
  'gao',
  'ge',
  'gei',
  'gen',
  'geng',
  'gong',
  'gou',
  'gu',
  'gua',
  'guai',
  'guan',
  'guang',
  'gui',
  'gun',
  'guo',
  'ha',
  'hai',
  'han',
  'hang',
  'hao',
  'he',
  'hei',
  'hen',
  'heng',
  'hong',
  'hou',
  'hu',
  'hua',
  'huai',
  'huan',
  'huang',
  'hui',
  'hun',
  'huo',
  'ji',
  'jia',
  'jian',
  'jiang',
  'jiao',
  'jie',
  'jin',
  'jing',
  'jiong',
  'jiu',
  'ju',
  'juan',
  'jue',
  'jun',
  'ka',
  'kai',
  'kan',
  'kang',
  'kao',
  'ke',
  'kei',
  'ken',
  'keng',
  'kong',
  'kou',
  'ku',
  'kua',
  'kuai',
  'kuan',
  'kuang',
  'kui',
  'kun',
  'kuo',
  'la',
  'lai',
  'lan',
  'lang',
  'lao',
  'le',
  'lei',
  'leng',
  'li',
  'lia',
  'lian',
  'liang',
  'liao',
  'lie',
  'lin',
  'ling',
  'liu',
  'lo',
  'long',
  'lou',
  'lu',
  'lü',
  'luan',
  'lüan',
  'lüe',
  'lue',
  'lun',
  'luo',
  'ma',
  'mai',
  'man',
  'mang',
  'mao',
  'me',
  'mei',
  'men',
  'meng',
  'mi',
  'mian',
  'miao',
  'mie',
  'min',
  'ming',
  'miu',
  'mo',
  'mou',
  'mu',
  'na',
  'nai',
  'nan',
  'nang',
  'nao',
  'ne',
  'nei',
  'nen',
  'neng',
  'ni',
  'nian',
  'niang',
  'niao',
  'nie',
  'nin',
  'ning',
  'niu',
  'nong',
  'nou',
  'nu',
  'nü',
  'nuan',
  'nüe',
  'nue',
  'nun',
  'nuo',
  'o',
  'ou',
  'pa',
  'pai',
  'pan',
  'pang',
  'pao',
  'pei',
  'pen',
  'peng',
  'pi',
  'pian',
  'piao',
  'pie',
  'pin',
  'ping',
  'po',
  'pou',
  'pu',
  'qi',
  'qia',
  'qian',
  'qiang',
  'qiao',
  'qie',
  'qin',
  'qing',
  'qiong',
  'qiu',
  'qu',
  'quan',
  'que',
  'qun',
  'ran',
  'rang',
  'rao',
  're',
  'ren',
  'reng',
  'ri',
  'rong',
  'rou',
  'ru',
  'rua',
  'ruan',
  'rui',
  'run',
  'ruo',
  'sa',
  'sai',
  'san',
  'sang',
  'sao',
  'se',
  'sei',
  'sen',
  'seng',
  'sha',
  'shai',
  'shan',
  'shang',
  'shao',
  'she',
  'shei',
  'shen',
  'sheng',
  'shi',
  'shou',
  'shu',
  'shua',
  'shuai',
  'shuan',
  'shuang',
  'shui',
  'shun',
  'shuo',
  'si',
  'song',
  'sou',
  'su',
  'suan',
  'sui',
  'sun',
  'suo',
  'ta',
  'tai',
  'tan',
  'tang',
  'tao',
  'te',
  'teng',
  'ti',
  'tian',
  'tiao',
  'tie',
  'ting',
  'tong',
  'tou',
  'tu',
  'tuan',
  'tui',
  'tun',
  'tuo',
  'wa',
  'wai',
  'wan',
  'wang',
  'wei',
  'wen',
  'weng',
  'wo',
  'wu',
  'xi',
  'xia',
  'xian',
  'xiang',
  'xiao',
  'xie',
  'xin',
  'xing',
  'xiong',
  'xiu',
  'xu',
  'xuan',
  'xue',
  'xun',
  'ya',
  'yan',
  'yang',
  'yao',
  'ye',
  'yi',
  'yin',
  'ying',
  'yo',
  'yong',
  'you',
  'yu',
  'yuan',
  'yue',
  'yun',
  'za',
  'zai',
  'zan',
  'zang',
  'zao',
  'ze',
  'zei',
  'zen',
  'zeng',
  'zha',
  'zhai',
  'zhan',
  'zhang',
  'zhao',
  'zhe',
  'zhei',
  'zhen',
  'zheng',
  'zhi',
  'zhong',
  'zhou',
  'zhu',
  'zhua',
  'zhuai',
  'zhuan',
  'zhuang',
  'zhui',
  'zhun',
  'zhuo',
  'zi',
  'zong',
  'zou',
  'zu',
  'zuan',
  'zui',
  'zun',
  'zuo',
])

/**
 * Enhanced validation - checks if input is valid pinyin (with or without tones)
 * @param input - Pinyin string to validate
 * @returns True if valid pinyin
 */
export function isValidPinyin(input: string): boolean {
  if (!input) {
    return false
  }

  // Remove tone marks for validation
  const normalized = removeToneMarks(input)

  // Remove tone numbers (1-5)
  const withoutNumbers = normalized.replace(/[1-5]/g, '').toLowerCase().trim()

  // Check if syllable is in valid set
  return VALID_SYLLABLES.has(withoutNumbers)
}

/**
 * Normalize pinyin to standard format
 * Handles all input variants: ni3 → nǐ, NI3 → nǐ, nv3 → nǚ, ni → ni (no tone)
 * @param input - Pinyin string in any format
 * @returns Normalized pinyin
 */
export function normalizePinyin(input: string): string {
  let normalized = input.toLowerCase().trim()

  // Convert v to ü
  normalized = normalized.replace(/nv([1-5]?)/g, 'nü$1').replace(/lv([1-5]?)/g, 'lü$1')

  // Convert u: to ü
  normalized = normalized.replace(/u:/g, 'ü')

  // Convert numeric tones to tone marks
  if (/[1-5]$/.test(normalized)) {
    const tone = parseInt(normalized.slice(-1), 10)
    const syllable = normalized.slice(0, -1)

    try {
      return addToneMark(syllable, tone)
    } catch (error) {
      return normalized
    }
  }

  return normalized
}

/**
 * Get pinyin suggestions for invalid input using Levenshtein distance
 * @param input - Invalid pinyin input
 * @returns Array of suggested corrections
 */
export function getPinyinSuggestions(input: string): string[] {
  if (!input) {
    return []
  }

  const normalized = removeToneMarks(input.toLowerCase())
  const suggestions: Array<{ syllable: string; distance: number }> = []

  // Calculate edit distance for all valid syllables
  for (const syllable of VALID_SYLLABLES) {
    const distance = levenshteinDistance(normalized, syllable)

    // Only suggest if distance is small
    if (distance <= 2) {
      suggestions.push({ syllable, distance })
    }
  }

  // Sort by distance (closest first)
  suggestions.sort((a, b) => a.distance - b.distance)

  // Return top suggestions
  return suggestions.slice(0, 5).map((s) => s.syllable)
}

/**
 * Levenshtein distance (edit distance) algorithm
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  const row0 = matrix[0]
  if (row0) {
    for (let j = 0; j <= a.length; j++) {
      row0[j] = j
    }
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const currentRow = matrix[i]
      const prevRow = matrix[i - 1]

      if (currentRow && prevRow) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          currentRow[j] = prevRow[j - 1] ?? 0
        } else {
          const sub = (prevRow[j - 1] ?? 0) + 1 // substitution
          const ins = (currentRow[j - 1] ?? 0) + 1 // insertion
          const del = (prevRow[j] ?? 0) + 1 // deletion
          currentRow[j] = Math.min(sub, ins, del)
        }
      }
    }
  }

  const lastRow = matrix[b.length]
  return lastRow?.[a.length] ?? 0
}

/**
 * Compare pinyin allowing for common variations
 * Considers these equivalent: ni3 = nǐ = ni (with tone 3 added via button)
 * @param userInput - User's input
 * @param correctAnswer - Correct answer
 * @returns True if they match
 */
export function comparePinyinFlexible(userInput: string, correctAnswer: string): boolean {
  const normalized1 = normalizePinyin(userInput)
  const normalized2 = normalizePinyin(correctAnswer)

  return normalized1 === normalized2
}

/**
 * Compare two pinyin strings (ignoring tone differences)
 * @param input1 - First pinyin string
 * @param input2 - Second pinyin string
 * @returns True if they match (ignoring tones)
 */
export function comparePinyinIgnoreTones(input1: string, input2: string): boolean {
  const stripped1 = removeToneMarks(input1).replace(/[1-5]/g, '').toLowerCase().trim()
  const stripped2 = removeToneMarks(input2).replace(/[1-5]/g, '').toLowerCase().trim()

  return stripped1 === stripped2
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
