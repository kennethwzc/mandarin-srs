'use client'

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Character {
  id: number
  simplified: string
  pinyin: string
  meaning: string
  mnemonic: string | null
}

interface Vocabulary {
  id: number
  word: string
  pinyin: string
  translation: string
  exampleSentence: string | null
}

interface LessonContentPreviewProps {
  characters: Character[]
  vocabulary: Vocabulary[]
}

/**
 * Lesson Content Preview
 *
 * Displays the characters and vocabulary that will be learned in this lesson.
 * Users can review the content before starting the lesson.
 */
export function LessonContentPreview({ characters, vocabulary }: LessonContentPreviewProps) {
  const [activeTab, setActiveTab] = useState<'characters' | 'vocabulary'>('characters')

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="characters">Characters ({characters.length})</TabsTrigger>
        <TabsTrigger value="vocabulary">Vocabulary ({vocabulary.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="characters" className="mt-4 space-y-4">
        {characters.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No characters in this lesson</p>
        ) : (
          <div className="grid gap-3">
            {characters.map((char) => (
              <Card key={char.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="chinese-text flex-shrink-0 text-5xl">{char.simplified}</div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-mono text-lg text-primary">{char.pinyin}</span>
                          <Badge variant="outline" className="text-xs">
                            Character
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{char.meaning}</p>
                      </div>
                      {char.mnemonic && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                          <div className="mb-1 font-medium">💡 Memory Aid:</div>
                          <p className="text-muted-foreground">{char.mnemonic}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="vocabulary" className="mt-4 space-y-4">
        {vocabulary.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No vocabulary in this lesson</p>
        ) : (
          <div className="grid gap-3">
            {vocabulary.map((vocab) => (
              <Card key={vocab.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="chinese-text flex-shrink-0 text-4xl">{vocab.word}</div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-mono text-lg text-primary">{vocab.pinyin}</span>
                          <Badge variant="outline" className="text-xs">
                            Vocabulary
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{vocab.translation}</p>
                      </div>
                      {vocab.exampleSentence && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                          <div className="chinese-text mb-1 font-medium">Example</div>
                          <div className="chinese-text text-muted-foreground">
                            {vocab.exampleSentence}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
