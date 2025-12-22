'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Radical } from '@/lib/db/schema'

interface RadicalCardProps {
  radical: Radical
}

export function RadicalCard({ radical }: RadicalCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {radical.character}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              >
                Radical
              </Badge>
              <span className="text-xs text-muted-foreground">{radical.stroke_count} strokes</span>
            </div>
            <p className="truncate font-medium">{radical.meaning}</p>
            {radical.mnemonic && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{radical.mnemonic}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
