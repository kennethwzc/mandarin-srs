/**
 * Characters Overview Page
 *
 * Displays all characters available in the system.
 * Users can browse characters filtered by HSK level.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CharacterCard } from '@/components/features/character-card'
import { getAllCharacters } from '@/lib/db/queries'
import { getAuthenticatedUser } from '@/lib/supabase/get-user'
import { AlertCircle, Info } from 'lucide-react'

export const metadata = {
  title: 'Characters',
  description: 'Browse all Chinese characters organized by HSK level',
}

export const dynamic = 'force-dynamic'

async function CharactersContent({ hskLevel }: { hskLevel?: '1' | '2' | '3' | '4' | '5' | '6' }) {
  const characters = await getAllCharacters(hskLevel)

  if (!characters || characters.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Characters Available</AlertTitle>
        <AlertDescription>
          No characters found{hskLevel ? ` for HSK ${hskLevel}` : ''}. This usually means the seed
          data hasn&apos;t been loaded yet.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {characters.map((character) => (
        <CharacterCard key={character.id} character={character} />
      ))}
    </div>
  )
}

function CharactersSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
      ))}
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ level?: string }>
}

export default async function CharactersPage({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/login?redirectTo=/characters')
  }

  const params = await searchParams
  const currentLevel = params.level as '1' | '2' | '3' | '4' | '5' | '6' | undefined

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Characters</h1>
        <p className="text-sm text-muted-foreground sm:text-base md:text-lg">
          Browse Chinese characters organized by HSK level
        </p>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>About Characters</AlertTitle>
        <AlertDescription>
          Characters are individual Chinese symbols. Each character has its own pronunciation
          (pinyin) and meaning. Characters combine to form vocabulary words.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue={currentLevel || 'all'} className="mb-6">
        <TabsList className="mb-6">
          <TabsTrigger value="all" asChild>
            <a href="/characters">All</a>
          </TabsTrigger>
          <TabsTrigger value="1" asChild>
            <a href="/characters?level=1">HSK 1</a>
          </TabsTrigger>
          <TabsTrigger value="2" asChild>
            <a href="/characters?level=2">HSK 2</a>
          </TabsTrigger>
          <TabsTrigger value="3" asChild>
            <a href="/characters?level=3">HSK 3</a>
          </TabsTrigger>
          <TabsTrigger value="4" asChild>
            <a href="/characters?level=4">HSK 4</a>
          </TabsTrigger>
          <TabsTrigger value="5" asChild>
            <a href="/characters?level=5">HSK 5</a>
          </TabsTrigger>
          <TabsTrigger value="6" asChild>
            <a href="/characters?level=6">HSK 6</a>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={currentLevel || 'all'}>
          <Suspense fallback={<CharactersSkeleton />}>
            <CharactersContent hskLevel={currentLevel} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
