import { Flame } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

export interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
}

/**
 * Streak display component showing daily practice streak
 */
export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex items-center gap-2">
          <Flame className="h-8 w-8 text-orange-500" />
          <div>
            <p className="text-2xl font-bold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day streak</p>
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Longest streak</p>
          <p className="text-lg font-semibold">{longestStreak} days</p>
        </div>
      </CardContent>
    </Card>
  )
}
