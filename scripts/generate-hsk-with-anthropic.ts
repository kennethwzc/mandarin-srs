/* eslint-disable no-console */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'

import Anthropic from '@anthropic-ai/sdk'

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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Set it in your environment before running.')
  process.exit(1)
}

async function main() {
  console.log('🧠 Generating HSK content with Anthropic (Sonnet)...\n')

  await ensureDataDir()

  const characters = await generateCharacters()
  writeJson('hsk-characters.json', characters)

  const vocabulary = await generateVocabulary()
  writeJson('hsk-vocabulary.json', vocabulary)

  const radicals = await generateRadicals()
  writeJson('radicals.json', radicals)

  const lessons = await generateLessons()
  writeJson('lessons.json', lessons)

  console.log('\n✅ Generation complete.')
  console.log('Next:')
  console.log('  pnpm import:content')
  console.log('  pnpm validate:content')
}

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function writeJson(filename: string, data: unknown) {
  const target = path.join(process.cwd(), 'data', filename)
  fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`  ✓ Wrote ${filename} (${Array.isArray(data) ? data.length : 0} items)`)
}

async function generateCharacters(): Promise<CharacterData[]> {
  const perLevelTarget: Record<number, number> = { 1: 200, 2: 200, 3: 200 }
  const chunkSize = 80
  const results: CharacterData[] = []

  for (const level of [1, 2, 3]) {
    const target = perLevelTarget[level] ?? 0
    while (results.filter((c) => c.hsk_level === level).length < target) {
      const currentCount = results.filter((c) => c.hsk_level === level).length
      const remaining = target - currentCount
      const batchSize = Math.min(chunkSize, remaining)
      const batch = await generateCharacterBatch(level, batchSize)
      results.push(...batch)
      const updatedCount = results.filter((c) => c.hsk_level === level).length
      console.log(`  Characters HSK${level}: ${updatedCount}/${target}`)
    }
  }

  dedupeCharacters(results)
  return results
}

function dedupeCharacters(items: CharacterData[]) {
  const seen = new Set<string>()
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i]
    if (!item) {
      continue
    }
    const key = item.simplified
    if (seen.has(key)) {
      items.splice(i, 1)
    } else {
      seen.add(key)
    }
  }
}

async function generateCharacterBatch(level: number, count: number): Promise<CharacterData[]> {
  console.log(`  • Requesting ${count} characters for HSK${level}...`)
  const sample = `[
  {
    "simplified": "我",
    "traditional": "我",
    "pinyin": "wǒ",
    "pinyin_numeric": "wo3",
    "tone_marks": [3],
    "meaning": "I, me",
    "hsk_level": ${level},
    "frequency_rank": 1,
    "component_radicals": ["亻", "戈"],
    "stroke_count": 7,
    "mnemonic_seed": "I hold a weapon (戈) as a person (亻)"
  }
]`
  const prompt = `You are a Chinese language data generator. Produce ${count} unique HSK level ${level} characters.

CRITICAL: Return ONLY a valid JSON array. No explanations, no markdown, no code blocks.

Required format - a single JSON array:
${sample}

RULES:
1. Return a JSON array starting with [ and ending with ]
2. Each object must be separated by commas
3. No trailing commas after the last object
4. Use double quotes for all strings
5. No newlines inside string values
6. No code blocks or markdown formatting
7. No text before or after the JSON array

Return the JSON array now:`

  const raw = await callAnthropic(prompt)
  console.log(`📄 Received response (${raw.length} chars)`)
  const parsed = parseNdjsonArray<CharacterData>(raw)

  if (!Array.isArray(parsed)) {
    throw new Error('Parser did not return an array')
  }
  if (parsed.length === 0) {
    throw new Error('API returned empty array')
  }

  const validated = parsed.filter((char, index) => {
    const required: Array<keyof CharacterData> = ['simplified', 'pinyin', 'meaning', 'hsk_level']
    const missing = required.filter((field) => !(char as unknown as Record<string, unknown>)[field])
    if (missing.length > 0) {
      console.warn(`⚠️ Item ${index + 1} missing required fields: ${missing.join(', ')}`)
      return false
    }
    return true
  })

  if (validated.length === 0) {
    throw new Error('No valid character data after validation')
  }
  if (validated.length < parsed.length) {
    console.warn(`⚠️ Filtered out ${parsed.length - validated.length} invalid items`)
  }

  console.log(`✅ Batch complete: ${validated.length} valid characters`)
  return validated
}

async function generateVocabulary(): Promise<VocabularyData[]> {
  const perLevelTarget: Record<number, number> = { 1: 400, 2: 400, 3: 400 }
  const chunkSize = 80
  const results: VocabularyData[] = []

  for (const level of [1, 2, 3]) {
    const target = perLevelTarget[level] ?? 0
    while (results.filter((v) => v.hsk_level === level).length < target) {
      const currentCount = results.filter((v) => v.hsk_level === level).length
      const remaining = target - currentCount
      const batchSize = Math.min(chunkSize, remaining)
      const batch = await generateVocabularyBatch(level, batchSize)
      results.push(...batch)
      const updatedCount = results.filter((v) => v.hsk_level === level).length
      console.log(`  Vocab HSK${level}: ${updatedCount}/${target}`)
    }
  }

  dedupeVocabulary(results)
  return results
}

function dedupeVocabulary(items: VocabularyData[]) {
  const seen = new Set<string>()
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i]
    if (!item) {
      continue
    }
    const key = item.word
    if (seen.has(key)) {
      items.splice(i, 1)
    } else {
      seen.add(key)
    }
  }
}

async function generateVocabularyBatch(level: number, count: number): Promise<VocabularyData[]> {
  console.log(`  • Requesting ${count} vocabulary for HSK${level}...`)
  const sample = `[
  {
    "word": "你好",
    "pinyin": "nǐ hǎo",
    "pinyin_numeric": "ni3 hao3",
    "translation": "hello",
    "hsk_level": ${level},
    "part_of_speech": "greeting",
    "component_characters": ["你","好"],
    "example_sentence": "你好，很高兴认识你。",
    "example_translation": "Hello, nice to meet you.",
    "usage_notes": "common greeting"
  }
]`
  const prompt = `Generate ${count} unique HSK level ${level} vocabulary entries.

CRITICAL: Return ONLY a valid JSON array. No explanations, no markdown, no code blocks.

Required format - a single JSON array:
${sample}

RULES:
1. Return a JSON array starting with [ and ending with ]
2. Each object separated by commas, no trailing comma
3. Double quotes for all strings
4. No newlines inside string values
5. No text before or after the JSON array

Return the JSON array now:`

  const raw = await callAnthropic(prompt)
  console.log(`📄 Received response (${raw.length} chars)`)
  const parsed = parseNdjsonArray<VocabularyData>(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('Parser did not return an array')
  }
  if (parsed.length === 0) {
    throw new Error('API returned empty array')
  }
  console.log(`  • Parsed ${parsed.length} vocabulary for HSK${level}`)
  return parsed
}

async function generateRadicals(): Promise<RadicalData[]> {
  console.log('  • Requesting radicals...')
  const sample = `[
  {
    "character": "人",
    "meaning": "person, human",
    "stroke_count": 2,
    "variants": ["亻"],
    "mnemonic": "Looks like a person standing",
    "example_characters": ["你","他","们"]
  }
]`
  const prompt = `Generate 50 common Chinese radicals.

CRITICAL: Return ONLY a valid JSON array. No explanations, no markdown, no code blocks.

Required format - a single JSON array:
${sample}

Rules: follow the keys exactly, double quotes for all strings, no trailing commas, no extra text before/after.

Return the JSON array now:`

  const raw = await callAnthropic(prompt)
  console.log(`📄 Received response (${raw.length} chars)`)
  const parsed = parseNdjsonArray<RadicalData>(raw)
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Failed to parse radicals array')
  }
  console.log(`  • Parsed ${parsed.length} radicals`)
  return parsed
}

async function generateLessons(): Promise<LessonData[]> {
  console.log('  • Requesting lessons...')
  const sample = `[
  {
    "level": 1,
    "hsk_level": 1,
    "title": "HSK 1 - Greetings & Introductions",
    "description": "Basic greetings and self-introductions",
    "topic": "greetings",
    "characters": ["你","好","叫","是"],
    "vocabulary": ["你好","谢谢","再见"],
    "grammar_points": ["A 是 B", "你 叫 什么"],
    "sort_order": 1
  }
]`
  const prompt = `Generate 30 lessons covering HSK 1-3.

CRITICAL: Return ONLY a valid JSON array. No explanations, no markdown, no code blocks.

Required format - a single JSON array:
${sample}

Rules:
- Topics coherent (greetings, numbers, family, time, food, travel, school, work, health, hobbies, etc.).
- hsk_level roughly increases with difficulty.
- Characters/vocabulary should be plausible HSK items and overlap with generated sets.
- No text before or after the JSON array.

Return the JSON array now:`

  const raw = await callAnthropic(prompt)
  console.log(`📄 Received response (${raw.length} chars)`)
  const parsed = parseNdjsonArray<LessonData>(raw)
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Failed to parse lessons array')
  }
  console.log(`  • Parsed ${parsed.length} lessons`)
  return parsed
}

async function callAnthropic(prompt: string): Promise<string> {
  const completion = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = completion.content?.[0]
  if (content && content.type === 'text' && content.text) {
    return content.text
  }
  throw new Error('Anthropic response missing text content')
}

function parseNdjsonArray<T>(text: string): T[] {
  console.log(`\n🔍 Parsing response...`)
  console.log(`Raw text length: ${text.length} characters`)
  console.log(`First 300 chars:`, text.substring(0, 300))

  // Extract from markdown block if present
  let cleanText = text
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonBlockMatch) {
    console.log('📦 Extracted JSON from markdown code block')
    cleanText = jsonBlockMatch[1] ?? text
  }

  // Try JSON array first (with simple cleanup)
  const arrayCandidate = cleanText.trim().replace(/,\s*]/g, ']')
  if (arrayCandidate.startsWith('[') && arrayCandidate.includes(']')) {
    try {
      const parsed = JSON.parse(arrayCandidate)
      if (Array.isArray(parsed)) {
        console.log(`✅ Parsed ${parsed.length} items from JSON array`)
        return parsed as T[]
      }
    } catch (error) {
      console.log(
        '⚠️ Array parse failed, falling back to object extraction...',
        (error as Error).message
      )
    }
  }

  // Extract all object blocks even if pretty-printed or concatenated
  const objectMatches = cleanText.match(/{[\s\S]*?}/g) ?? []
  const results: T[] = []
  const errors: string[] = []

  for (let idx = 0; idx < objectMatches.length; idx += 1) {
    let objStr = objectMatches[idx] ?? ''
    // Remove trailing commas
    objStr = objStr.replace(/},\s*$/, '}')
    // Sanitize
    objStr = sanitizeJsonObjectText(objStr)
    try {
      const parsed = JSON.parse(objStr) as T
      results.push(parsed)
    } catch (error) {
      errors.push(`Object ${idx + 1}: ${(error as Error).message}`)
      console.warn(`⚠️ Failed to parse object ${idx + 1}:`, objStr.substring(0, 200))
    }
  }

  console.log(`\n📊 Parsing Summary:`)
  console.log(`   ✅ Successfully parsed: ${results.length} items`)
  console.log(`   ❌ Parse errors: ${errors.length}`)

  if (errors.length > 0 && errors.length < 10) {
    console.log(`\n⚠️ Parse Errors:`)
    errors.forEach((err) => console.log(`   - ${err}`))
  }

  if (results.length === 0) {
    console.error('\n❌ PARSING FAILED - No items parsed')
    console.error('First 1000 chars of raw text:')
    console.error(text.substring(0, 1000))
    fs.writeFileSync('./debug-failed-parsing.txt', text)
    console.error('💾 Saved full text to: ./debug-failed-parsing.txt')
    throw new Error('No items parsed from response')
  }

  return results
}

function sanitizeJsonObjectText(raw: string): string {
  let text = raw.trim()
  text = text.replace(/```[a-zA-Z0-9-]*\s*/g, '').replace(/```/g, '')
  text = text.replace(/,\s*([\]}])/g, '$1')
  text = text.replace(/[\u0000-\u001F]+/g, '')
  text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  return text
}

main().catch((error) => {
  console.error('Generation failed:', error)
  process.exit(1)
})
