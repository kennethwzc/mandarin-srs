/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'

type LevelValue = '1' | '2' | '3' | '4' | '5' | '6'

interface CharacterData {
  simplified: string
  traditional: string
  pinyin: string
  pinyin_numeric: string
  tone_marks: number[]
  meaning: string
  hsk_level: number
  frequency_rank: number
  component_radicals: string[]
  stroke_count: number
  mnemonic_seed?: string
}

interface VocabularyData {
  word: string
  pinyin: string
  pinyin_numeric: string
  translation: string
  hsk_level: number
  part_of_speech: string
  component_characters: string[]
  example_sentence?: string
  example_translation?: string
  usage_notes?: string
}

interface RadicalData {
  character: string
  meaning: string
  stroke_count: number
  variants: string[]
  mnemonic: string
  example_characters: string[]
}

interface LessonData {
  level: number
  hsk_level: number
  title: string
  description: string
  topic: string
  characters: string[]
  vocabulary: string[]
  grammar_points: string[]
  sort_order: number
  unlock_requirement?: number
}

async function importContent() {
  console.log('🚀 Starting content import...\n')

  try {
    const charactersData: CharacterData[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data/hsk-characters.json'), 'utf-8')
    )
    const vocabularyData: VocabularyData[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data/hsk-vocabulary.json'), 'utf-8')
    )
    const radicalsData: RadicalData[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data/radicals.json'), 'utf-8')
    )
    const lessonsData: LessonData[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data/lessons.json'), 'utf-8')
    )

    console.log('📚 Data files loaded:')
    console.log(`  - ${charactersData.length} characters`)
    console.log(`  - ${vocabularyData.length} vocabulary words`)
    console.log(`  - ${radicalsData.length} radicals`)
    console.log(`  - ${lessonsData.length} lessons\n`)

    console.log('📝 Importing radicals...')
    await importRadicals(radicalsData)

    console.log('📝 Importing characters...')
    const characterMap = await importCharacters(charactersData)

    console.log('📝 Importing vocabulary...')
    const vocabularyMap = await importVocabulary(vocabularyData)

    console.log('📝 Importing lessons...')
    await importLessons(lessonsData, characterMap, vocabularyMap)

    console.log('\n✅ Content import completed successfully!')
    console.log('\nNext steps:')
    console.log('  1. Verify data in Supabase Dashboard')
    console.log('  2. Check /lessons page shows all lessons')
    console.log('  3. Start a lesson and review content')
  } catch (error) {
    console.error('\n❌ Content import failed!')
    console.error('Error:', error)
    process.exit(1)
  }
}

async function importRadicals(data: RadicalData[]) {
  let imported = 0
  let skipped = 0

  for (const radical of data) {
    try {
      const existing = await db
        .select()
        .from(schema.radicals)
        .where(eq(schema.radicals.character, radical.character))
        .limit(1)

      if (existing.length > 0) {
        skipped++
        continue
      }

      await db.insert(schema.radicals).values({
        character: radical.character,
        meaning: radical.meaning,
        stroke_count: radical.stroke_count,
        mnemonic: radical.mnemonic,
        sort_order: imported + 1,
      })

      imported++
      if (imported % 10 === 0) {
        process.stdout.write(`\r  Imported ${imported}/${data.length} radicals...`)
      }
    } catch (error) {
      console.error(`\n  Error importing radical ${radical.character}:`, error)
    }
  }

  console.log(`\n  ✓ Imported ${imported} radicals (${skipped} already existed)`)
}

async function importCharacters(data: CharacterData[]): Promise<Map<string, number>> {
  const characterMap = new Map<string, number>()
  let imported = 0
  let skipped = 0

  for (const char of data) {
    try {
      const existing = await db
        .select()
        .from(schema.characters)
        .where(eq(schema.characters.simplified, char.simplified))
        .limit(1)

      const existingRow = existing[0]
      if (existingRow) {
        characterMap.set(char.simplified, existingRow.id)
        skipped++
        continue
      }

      const mnemonic = char.mnemonic_seed ? `Memory aid: ${char.mnemonic_seed}` : null

      const result = await db
        .insert(schema.characters)
        .values({
          simplified: char.simplified,
          traditional: char.traditional,
          pinyin: char.pinyin,
          pinyin_numeric: char.pinyin_numeric,
          tone_marks: char.tone_marks,
          meaning: char.meaning,
          hsk_level: `${char.hsk_level}` as LevelValue,
          frequency_rank: char.frequency_rank,
          mnemonic,
        })
        .returning()

      const insertedId = result[0]?.id
      if (insertedId) {
        characterMap.set(char.simplified, insertedId)
      }
      imported++

      if (imported % 50 === 0) {
        process.stdout.write(`\r  Imported ${imported}/${data.length} characters...`)
      }
    } catch (error) {
      console.error(`\n  Error importing character ${char.simplified}:`, error)
    }
  }

  console.log(`\n  ✓ Imported ${imported} characters (${skipped} already existed)`)
  return characterMap
}

async function importVocabulary(data: VocabularyData[]): Promise<Map<string, number>> {
  const vocabularyMap = new Map<string, number>()
  let imported = 0
  let skipped = 0

  for (const vocab of data) {
    try {
      const existing = await db
        .select()
        .from(schema.vocabulary)
        .where(eq(schema.vocabulary.word, vocab.word))
        .limit(1)

      const existingRow = existing[0]
      if (existingRow) {
        vocabularyMap.set(vocab.word, existingRow.id)
        skipped++
        continue
      }

      const result = await db
        .insert(schema.vocabulary)
        .values({
          word: vocab.word,
          pinyin: vocab.pinyin,
          pinyin_numeric: vocab.pinyin_numeric,
          translation: vocab.translation,
          hsk_level: `${vocab.hsk_level}` as LevelValue,
          part_of_speech: vocab.part_of_speech,
          example_sentence: vocab.example_sentence,
          example_translation: vocab.example_translation,
        })
        .returning()

      const insertedId = result[0]?.id
      if (insertedId) {
        vocabularyMap.set(vocab.word, insertedId)
      }
      imported++

      if (imported % 50 === 0) {
        process.stdout.write(`\r  Imported ${imported}/${data.length} vocabulary...`)
      }
    } catch (error) {
      console.error(`\n  Error importing vocabulary ${vocab.word}:`, error)
    }
  }

  console.log(`\n  ✓ Imported ${imported} vocabulary (${skipped} already existed)`)
  return vocabularyMap
}

async function importLessons(
  data: LessonData[],
  characterMap: Map<string, number>,
  vocabularyMap: Map<string, number>
) {
  let imported = 0
  let skipped = 0

  for (const lesson of data) {
    try {
      const existing = await db
        .select()
        .from(schema.lessons)
        .where(eq(schema.lessons.title, lesson.title))
        .limit(1)

      if (existing.length > 0) {
        skipped++
        continue
      }

      const characterIds: number[] = []
      for (const char of lesson.characters) {
        const id = characterMap.get(char)
        if (id) {
          characterIds.push(id)
        }
      }

      const vocabularyIds: number[] = []
      for (const word of lesson.vocabulary) {
        const id = vocabularyMap.get(word)
        if (id) {
          vocabularyIds.push(id)
        }
      }

      await db.insert(schema.lessons).values({
        level: lesson.level,
        title: lesson.title,
        description: lesson.description,
        character_ids: characterIds,
        vocabulary_ids: vocabularyIds,
        unlock_requirement: lesson.unlock_requirement,
        sort_order: lesson.sort_order,
        is_published: true,
      })

      imported++
      console.log(`  ✓ Lesson ${lesson.level}: ${lesson.title}`)
    } catch (error) {
      console.error(`\n  Error importing lesson ${lesson.title}:`, error)
    }
  }

  console.log(`\n  ✓ Imported ${imported} lessons (${skipped} already existed)`)
}

importContent()
  .then(() => {
    console.log('\n👋 Import complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error)
    process.exit(1)
  })
