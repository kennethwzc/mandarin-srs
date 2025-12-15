/* eslint-disable no-console */
import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'

async function validateContent() {
  console.log('🔍 Validating content...\n')

  const issues: string[] = []

  console.log('Checking characters...')
  const characters = await db.select().from(schema.characters)
  console.log(`  Total characters: ${characters.length}`)

  const missingPinyin = characters.filter((c) => !c.pinyin)
  if (missingPinyin.length > 0) {
    issues.push(`${missingPinyin.length} characters missing pinyin`)
  }

  const missingMeaning = characters.filter((c) => !c.meaning)
  if (missingMeaning.length > 0) {
    issues.push(`${missingMeaning.length} characters missing meaning`)
  }

  const missingMnemonics = characters.filter((c) => !c.mnemonic)
  console.log(`  Characters without mnemonics: ${missingMnemonics.length}`)

  const uniqueChars = new Set(characters.map((c) => c.simplified))
  if (uniqueChars.size !== characters.length) {
    issues.push(
      `Duplicate characters detected! (${characters.length - uniqueChars.size} duplicates)`
    )
  }

  console.log('\nChecking vocabulary...')
  const vocabulary = await db.select().from(schema.vocabulary)
  console.log(`  Total vocabulary: ${vocabulary.length}`)

  const missingTranslation = vocabulary.filter((v) => !v.translation)
  if (missingTranslation.length > 0) {
    issues.push(`${missingTranslation.length} vocabulary missing translation`)
  }

  const missingExamples = vocabulary.filter((v) => !v.example_sentence)
  console.log(`  Vocabulary without examples: ${missingExamples.length}`)

  console.log('\nChecking lessons...')
  const lessons = await db.select().from(schema.lessons)
  console.log(`  Total lessons: ${lessons.length}`)

  const emptyLessons = lessons.filter(
    (lesson) =>
      (!lesson.character_ids || lesson.character_ids.length === 0) &&
      (!lesson.vocabulary_ids || lesson.vocabulary_ids.length === 0)
  )
  if (emptyLessons.length > 0) {
    issues.push(`${emptyLessons.length} lessons have no content`)
  }

  for (const lesson of lessons) {
    if (lesson.unlock_requirement) {
      const prerequisite = lessons.find((l) => l.id === lesson.unlock_requirement)
      if (!prerequisite) {
        issues.push(`Lesson ${lesson.id} has invalid unlock_requirement`)
      }
    }
  }

  console.log('\n' + '='.repeat(50))

  if (issues.length === 0) {
    console.log('✅ No critical issues found!')
  } else {
    console.log('⚠️  Issues detected:')
    issues.forEach((issue) => console.log(`  - ${issue}`))
  }

  console.log('\nContent summary:')
  console.log(`  Characters: ${characters.length}`)
  console.log(`  Vocabulary: ${vocabulary.length}`)
  console.log(`  Lessons: ${lessons.length}`)
  console.log(`  Total items: ${characters.length + vocabulary.length}`)

  console.log('\nHSK Distribution:')
  for (let level = 1; level <= 3; level++) {
    const charCount = characters.filter((c) => c.hsk_level === level.toString()).length
    const vocabCount = vocabulary.filter((v) => v.hsk_level === level.toString()).length
    console.log(`  HSK ${level}: ${charCount} characters, ${vocabCount} vocabulary`)
  }
}

validateContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Validation error:', error)
    process.exit(1)
  })
