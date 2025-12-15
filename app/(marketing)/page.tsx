'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-5xl space-y-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          Learn Mandarin Pinyin with
          <span className="text-primary"> Spaced Repetition</span>
        </h1>

        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Master Chinese characters by typing pinyin. See a character, type the correct
          pronunciation with tones. Learn efficiently with our science-based spaced repetition
          system.
        </p>

        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⌨️</span>
            <span>Type pinyin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span>Add tones</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <span>Track progress</span>
          </div>
        </div>
      </div>
    </main>
  )
}
