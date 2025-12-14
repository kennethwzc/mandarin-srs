import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface LessonCardProps {
  id: string
  title: string
  description?: string
  characterCount: number
  completed?: boolean
}

/**
 * Lesson card component for lesson list
 */
export function LessonCard({
  id,
  title,
  description,
  characterCount,
  completed = false,
}: LessonCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{characterCount} characters</span>
          <Button asChild variant={completed ? 'outline' : 'default'}>
            <Link href={`/lessons/${id}`}>{completed ? 'Review' : 'Start'}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
