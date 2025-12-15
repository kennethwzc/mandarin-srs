/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'

/**
 * Download HSK Data Script
 *
 * Downloads/creates HSK word lists and character data from public sources.
 * This version writes sample placeholders. Replace with real dataset downloads
 * (e.g., hskhsk.com + CC-CEDICT) before production import.
 */

interface HSKWord {
  word: string
  pinyin: string
  translation: string
}

async function downloadHSKData() {
  console.log('📥 Preparing HSK data (sample placeholders)...\n')

  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  await downloadHSKLists(dataDir)
  await generateCharacterData(dataDir)
  await generateVocabularyData(dataDir)

  console.log('\n✅ HSK data prepared (sample). Replace with full datasets for production.')
}

async function downloadHSKLists(dataDir: string) {
  const hskLevels = [1, 2, 3]

  for (const level of hskLevels) {
    console.log(`  Generating sample HSK ${level} word list...`)
    const sampleWords = generateSampleHSKWords(level)
    const filename = path.join(dataDir, `hsk-${level}-words.json`)
    fs.writeFileSync(filename, JSON.stringify(sampleWords, null, 2))
    console.log(`    ✓ Saved ${sampleWords.length} words to hsk-${level}-words.json`)
  }
}

function generateSampleHSKWords(level: number): HSKWord[] {
  const samples: Record<number, HSKWord[]> = {
    1: [
      { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
      { word: '谢谢', pinyin: 'xiè xie', translation: 'thank you' },
      { word: '再见', pinyin: 'zài jiàn', translation: 'goodbye' },
    ],
    2: [
      { word: '学习', pinyin: 'xué xí', translation: 'to study' },
      { word: '工作', pinyin: 'gōng zuò', translation: 'work' },
    ],
    3: [
      { word: '环境', pinyin: 'huán jìng', translation: 'environment' },
      { word: '经验', pinyin: 'jīng yàn', translation: 'experience' },
    ],
  }

  return samples[level] ?? []
}

async function generateCharacterData(dataDir: string) {
  console.log('  Generating sample character dataset...')
  const characters: unknown[] = []
  const filename = path.join(dataDir, 'hsk-characters.json')
  fs.writeFileSync(filename, JSON.stringify(characters, null, 2))
  console.log('    ✓ Wrote sample characters (empty placeholder)')
}

async function generateVocabularyData(dataDir: string) {
  console.log('  Generating sample vocabulary dataset...')
  const vocabulary: unknown[] = []
  const filename = path.join(dataDir, 'hsk-vocabulary.json')
  fs.writeFileSync(filename, JSON.stringify(vocabulary, null, 2))
  console.log('    ✓ Wrote sample vocabulary (empty placeholder)')
}

downloadHSKData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Download failed:', error)
    process.exit(1)
  })
