'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 sm:p-12 md:p-24">
      <div className="w-full max-w-5xl space-y-6 text-center sm:space-y-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          Learn Mandarin Pinyin with
          <span className="text-primary"> Spaced Repetition</span>
        </h1>

        <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
          Master Chinese characters by typing pinyin. See a character, type the correct
          pronunciation with tones. Learn efficiently with our science-based spaced repetition
          system.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 pt-6 text-sm text-muted-foreground sm:flex-row sm:gap-8 sm:pt-8">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">⌨️</span>
            <span>Type pinyin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🎯</span>
            <span>Add tones</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📈</span>
            <span>Track progress</span>
          </div>
        </div>
      </div>
    </main>
  )
}
