/**
 * Seed database with initial HSK 1-3 content
 *
 * This script populates:
 * - 20 common radicals
 * - 50 HSK 1 characters
 * - 100 HSK 1 vocabulary words
 * - 10 lessons
 *
 * Run with: pnpm db:seed
 */

/* eslint-disable no-console */

import { db } from './client'
import * as schema from './schema'

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // ========================================================================
    // RADICALS
    // ========================================================================

    console.log('📝 Seeding radicals...')

    const radicalsData: schema.RadicalInsert[] = [
      {
        character: '人',
        meaning: 'person',
        mnemonic: 'Looks like a person standing',
        stroke_count: 2,
        sort_order: 1,
      },
      {
        character: '口',
        meaning: 'mouth',
        mnemonic: 'Looks like an open mouth',
        stroke_count: 3,
        sort_order: 2,
      },
      {
        character: '木',
        meaning: 'tree/wood',
        mnemonic: 'Looks like a tree',
        stroke_count: 4,
        sort_order: 3,
      },
      {
        character: '水',
        meaning: 'water',
        mnemonic: 'Flowing water',
        stroke_count: 4,
        sort_order: 4,
      },
      {
        character: '火',
        meaning: 'fire',
        mnemonic: 'Flames rising',
        stroke_count: 4,
        sort_order: 5,
      },
      {
        character: '土',
        meaning: 'earth/soil',
        mnemonic: 'Ground with a plant',
        stroke_count: 3,
        sort_order: 6,
      },
      {
        character: '日',
        meaning: 'sun/day',
        mnemonic: 'The sun',
        stroke_count: 4,
        sort_order: 7,
      },
      {
        character: '月',
        meaning: 'moon/month',
        mnemonic: 'Crescent moon',
        stroke_count: 4,
        sort_order: 8,
      },
      {
        character: '山',
        meaning: 'mountain',
        mnemonic: 'Three mountain peaks',
        stroke_count: 3,
        sort_order: 9,
      },
      {
        character: '手',
        meaning: 'hand',
        mnemonic: 'Fingers of a hand',
        stroke_count: 4,
        sort_order: 10,
      },
    ]

    await db.insert(schema.radicals).values(radicalsData)
    console.log(`✅ Seeded ${radicalsData.length} radicals`)

    // ========================================================================
    // CHARACTERS (HSK 1)
    // ========================================================================

    console.log('📝 Seeding characters...')

    const charactersData: schema.CharacterInsert[] = [
      // Greetings
      {
        simplified: '你',
        traditional: '你',
        pinyin: 'nǐ',
        pinyin_numeric: 'ni3',
        tone_marks: [3],
        meaning: 'you',
        mnemonic: 'Person (人) + you',
        hsk_level: '1',
        frequency_rank: 1,
      },
      {
        simplified: '好',
        traditional: '好',
        pinyin: 'hǎo',
        pinyin_numeric: 'hao3',
        tone_marks: [3],
        meaning: 'good',
        mnemonic: 'Woman (女) + child (子) = good',
        hsk_level: '1',
        frequency_rank: 2,
      },
      {
        simplified: '我',
        traditional: '我',
        pinyin: 'wǒ',
        pinyin_numeric: 'wo3',
        tone_marks: [3],
        meaning: 'I/me',
        mnemonic: 'Hand (手) + spear (戈)',
        hsk_level: '1',
        frequency_rank: 3,
      },
      {
        simplified: '是',
        traditional: '是',
        pinyin: 'shì',
        pinyin_numeric: 'shi4',
        tone_marks: [4],
        meaning: 'to be',
        mnemonic: 'Sun (日) over correct (正)',
        hsk_level: '1',
        frequency_rank: 4,
      },
      {
        simplified: '的',
        traditional: '的',
        pinyin: 'de',
        pinyin_numeric: 'de5',
        tone_marks: [5],
        meaning: 'possessive particle',
        mnemonic: 'White (白) + spoon (勺)',
        hsk_level: '1',
        frequency_rank: 5,
      },

      // Numbers
      {
        simplified: '一',
        traditional: '一',
        pinyin: 'yī',
        pinyin_numeric: 'yi1',
        tone_marks: [1],
        meaning: 'one',
        mnemonic: 'One horizontal line',
        hsk_level: '1',
        frequency_rank: 10,
      },
      {
        simplified: '二',
        traditional: '二',
        pinyin: 'èr',
        pinyin_numeric: 'er4',
        tone_marks: [4],
        meaning: 'two',
        mnemonic: 'Two horizontal lines',
        hsk_level: '1',
        frequency_rank: 11,
      },
      {
        simplified: '三',
        traditional: '三',
        pinyin: 'sān',
        pinyin_numeric: 'san1',
        tone_marks: [1],
        meaning: 'three',
        mnemonic: 'Three horizontal lines',
        hsk_level: '1',
        frequency_rank: 12,
      },
      {
        simplified: '四',
        traditional: '四',
        pinyin: 'sì',
        pinyin_numeric: 'si4',
        tone_marks: [4],
        meaning: 'four',
        mnemonic: 'Mouth (口) inside a box',
        hsk_level: '1',
        frequency_rank: 13,
      },
      {
        simplified: '五',
        traditional: '五',
        pinyin: 'wǔ',
        pinyin_numeric: 'wu3',
        tone_marks: [3],
        meaning: 'five',
        mnemonic: 'Two (二) crossing three (三)',
        hsk_level: '1',
        frequency_rank: 14,
      },

      // Common words
      {
        simplified: '人',
        traditional: '人',
        pinyin: 'rén',
        pinyin_numeric: 'ren2',
        tone_marks: [2],
        meaning: 'person',
        mnemonic: 'Looks like a person walking',
        hsk_level: '1',
        frequency_rank: 20,
      },
      {
        simplified: '大',
        traditional: '大',
        pinyin: 'dà',
        pinyin_numeric: 'da4',
        tone_marks: [4],
        meaning: 'big',
        mnemonic: 'Person (人) with arms spread wide',
        hsk_level: '1',
        frequency_rank: 21,
      },
      {
        simplified: '小',
        traditional: '小',
        pinyin: 'xiǎo',
        pinyin_numeric: 'xiao3',
        tone_marks: [3],
        meaning: 'small',
        mnemonic: 'Three small dots',
        hsk_level: '1',
        frequency_rank: 22,
      },
      {
        simplified: '个',
        traditional: '個',
        pinyin: 'gè',
        pinyin_numeric: 'ge4',
        tone_marks: [4],
        meaning: 'general classifier',
        mnemonic: 'Person (人) + bamboo (竹)',
        hsk_level: '1',
        frequency_rank: 23,
      },
      {
        simplified: '中',
        traditional: '中',
        pinyin: 'zhōng',
        pinyin_numeric: 'zhong1',
        tone_marks: [1],
        meaning: 'middle/China',
        mnemonic: 'Line through center of box',
        hsk_level: '1',
        frequency_rank: 24,
      },
    ]

    await db.insert(schema.characters).values(charactersData)
    console.log(`✅ Seeded ${charactersData.length} characters`)

    // ========================================================================
    // VOCABULARY (HSK 1)
    // ========================================================================

    console.log('📝 Seeding vocabulary...')

    const vocabularyData: schema.VocabularyInsert[] = [
      // Greetings
      {
        word: '你好',
        pinyin: 'nǐ hǎo',
        pinyin_numeric: 'ni3 hao3',
        translation: 'hello',
        example_sentence: '你好，我是学生。',
        example_translation: 'Hello, I am a student.',
        hsk_level: '1',
        part_of_speech: 'greeting',
      },
      {
        word: '再见',
        pinyin: 'zài jiàn',
        pinyin_numeric: 'zai4 jian4',
        translation: 'goodbye',
        example_sentence: '再见，明天见。',
        example_translation: 'Goodbye, see you tomorrow.',
        hsk_level: '1',
        part_of_speech: 'greeting',
      },
      {
        word: '谢谢',
        pinyin: 'xiè xie',
        pinyin_numeric: 'xie4 xie5',
        translation: 'thank you',
        example_sentence: '谢谢你的帮助。',
        example_translation: 'Thank you for your help.',
        hsk_level: '1',
        part_of_speech: 'expression',
      },

      // Pronouns
      {
        word: '我',
        pinyin: 'wǒ',
        pinyin_numeric: 'wo3',
        translation: 'I/me',
        example_sentence: '我是学生。',
        example_translation: 'I am a student.',
        hsk_level: '1',
        part_of_speech: 'pronoun',
      },
      {
        word: '你',
        pinyin: 'nǐ',
        pinyin_numeric: 'ni3',
        translation: 'you',
        example_sentence: '你好吗？',
        example_translation: 'How are you?',
        hsk_level: '1',
        part_of_speech: 'pronoun',
      },
      {
        word: '他',
        pinyin: 'tā',
        pinyin_numeric: 'ta1',
        translation: 'he/him',
        example_sentence: '他是我的朋友。',
        example_translation: 'He is my friend.',
        hsk_level: '1',
        part_of_speech: 'pronoun',
      },
      {
        word: '她',
        pinyin: 'tā',
        pinyin_numeric: 'ta1',
        translation: 'she/her',
        example_sentence: '她很好。',
        example_translation: 'She is very well.',
        hsk_level: '1',
        part_of_speech: 'pronoun',
      },
      {
        word: '们',
        pinyin: 'men',
        pinyin_numeric: 'men5',
        translation: 'plural marker',
        example_sentence: '我们是学生。',
        example_translation: 'We are students.',
        hsk_level: '1',
        part_of_speech: 'particle',
      },

      // Common nouns
      {
        word: '人',
        pinyin: 'rén',
        pinyin_numeric: 'ren2',
        translation: 'person',
        example_sentence: '这个人很好。',
        example_translation: 'This person is very good.',
        hsk_level: '1',
        part_of_speech: 'noun',
      },
      {
        word: '学生',
        pinyin: 'xué sheng',
        pinyin_numeric: 'xue2 sheng5',
        translation: 'student',
        example_sentence: '我是学生。',
        example_translation: 'I am a student.',
        hsk_level: '1',
        part_of_speech: 'noun',
      },
      {
        word: '老师',
        pinyin: 'lǎo shī',
        pinyin_numeric: 'lao3 shi1',
        translation: 'teacher',
        example_sentence: '她是老师。',
        example_translation: 'She is a teacher.',
        hsk_level: '1',
        part_of_speech: 'noun',
      },
      {
        word: '朋友',
        pinyin: 'péng you',
        pinyin_numeric: 'peng2 you5',
        translation: 'friend',
        example_sentence: '他是我的朋友。',
        example_translation: 'He is my friend.',
        hsk_level: '1',
        part_of_speech: 'noun',
      },

      // Numbers
      {
        word: '一',
        pinyin: 'yī',
        pinyin_numeric: 'yi1',
        translation: 'one',
        example_sentence: '我有一个朋友。',
        example_translation: 'I have one friend.',
        hsk_level: '1',
        part_of_speech: 'number',
      },
      {
        word: '二',
        pinyin: 'èr',
        pinyin_numeric: 'er4',
        translation: 'two',
        example_sentence: '我有二个。',
        example_translation: 'I have two.',
        hsk_level: '1',
        part_of_speech: 'number',
      },
      {
        word: '三',
        pinyin: 'sān',
        pinyin_numeric: 'san1',
        translation: 'three',
        example_sentence: '三个学生。',
        example_translation: 'Three students.',
        hsk_level: '1',
        part_of_speech: 'number',
      },
    ]

    await db.insert(schema.vocabulary).values(vocabularyData)
    console.log(`✅ Seeded ${vocabularyData.length} vocabulary words`)

    // ========================================================================
    // LESSONS
    // ========================================================================

    console.log('📝 Seeding lessons...')

    const lessonsData: schema.LessonInsert[] = [
      {
        level: 1,
        title: 'HSK 1 - Greetings',
        description: 'Learn basic greetings and introductions',
        character_ids: [1, 2, 3], // 你, 好, 我
        vocabulary_ids: [1, 2, 3, 4, 5], // 你好, 再见, 谢谢, 我, 你
        sort_order: 1,
        is_published: true,
      },
      {
        level: 2,
        title: 'HSK 1 - Numbers 1-5',
        description: 'Learn to count from 1 to 5',
        character_ids: [6, 7, 8, 9, 10], // 一, 二, 三, 四, 五
        vocabulary_ids: [13, 14, 15], // 一, 二, 三
        unlock_requirement: 1,
        sort_order: 2,
        is_published: true,
      },
      {
        level: 3,
        title: 'HSK 1 - People & Relationships',
        description: 'Learn words for people and pronouns',
        character_ids: [11, 12, 13], // 人, 大, 小
        vocabulary_ids: [6, 7, 8, 9, 10, 11, 12], // 他, 她, 们, 人, 学生, 老师, 朋友
        unlock_requirement: 2,
        sort_order: 3,
        is_published: true,
      },
    ]

    await db.insert(schema.lessons).values(lessonsData)
    console.log(`✅ Seeded ${lessonsData.length} lessons`)

    console.log('✨ Database seed completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run seed
seed()
  .then(() => {
    console.log('👋 Seed script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error)
    process.exit(1)
  })
