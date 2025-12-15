/* eslint-disable no-console */
import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { eq, isNull } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function generateMnemonics() {
  console.log('🧠 Generating mnemonics with Claude AI...\n')

  const characters = await db
    .select()
    .from(schema.characters)
    .where(isNull(schema.characters.mnemonic))
    .limit(100)

  console.log(`Found ${characters.length} characters without mnemonics\n`)

  let generated = 0

  for (const character of characters) {
    try {
      console.log(`Generating mnemonic for ${character.simplified} (${character.pinyin})...`)

      const mnemonic = await generateMnemonic({
        character: character.simplified,
        pinyin: character.pinyin,
        meaning: character.meaning,
      })

      await db
        .update(schema.characters)
        .set({ mnemonic })
        .where(eq(schema.characters.id, character.id))

      generated++
      console.log(`  ✓ ${mnemonic}\n`)

      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`  ✗ Error generating for ${character.simplified}:`, error)
    }
  }

  console.log(`\n✅ Generated ${generated} mnemonics!`)
}

async function generateMnemonic(params: { character: string; pinyin: string; meaning: string }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY')
  }

  const prompt = `Generate a vivid, memorable mnemonic for this Chinese character:

Character: ${params.character}
Pinyin: ${params.pinyin}
Meaning: ${params.meaning}

Make it 1-2 sentences, connect the visual form to the meaning, and keep it fun.`

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 120,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = message.content?.[0]
  if (content && content.type === 'text' && content.text) {
    return content.text.trim()
  }

  throw new Error('No mnemonic generated')
}

if (require.main === module) {
  generateMnemonics()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error)
      process.exit(1)
    })
}
