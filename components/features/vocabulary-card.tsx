'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Vocabulary } from '@/lib/db/schema'

interface VocabularyCardProps {
  vocabulary: Vocabulary
}

export function VocabularyCard({ vocabulary }: VocabularyCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-16 min-w-16 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 px-2 dark:bg-green-950">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {vocabulary.word}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              >
                HSK {vocabulary.hsk_level}
              </Badge>
              {vocabulary.part_of_speech && (
                <Badge variant="secondary" className="text-xs">
                  {vocabulary.part_of_speech}
                </Badge>
              )}
              <span className="font-mono text-sm text-muted-foreground">{vocabulary.pinyin}</span>
            </div>
            <p className="truncate font-medium">{vocabulary.translation}</p>
            {vocabulary.example_sentence && (
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {vocabulary.example_sentence}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
