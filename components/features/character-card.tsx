'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Character } from '@/lib/db/schema'

interface CharacterCardProps {
  character: Character
}

export function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
            <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {character.simplified}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              >
                HSK {character.hsk_level}
              </Badge>
              <span className="font-mono text-sm text-muted-foreground">{character.pinyin}</span>
            </div>
            <p className="truncate font-medium">{character.meaning}</p>
            {character.mnemonic && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {character.mnemonic}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
