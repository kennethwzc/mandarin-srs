/**
 * Vocabulary Overview Page
 *
 * Displays all vocabulary available in the system.
 * Users can browse vocabulary filtered by HSK level.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VocabularyCard } from '@/components/features/vocabulary-card'
import { getAllVocabulary } from '@/lib/db/queries'
import { getAuthenticatedUser } from '@/lib/supabase/get-user'
import { AlertCircle, Info } from 'lucide-react'

export const metadata = {
  title: 'Vocabulary',
  description: 'Browse all Chinese vocabulary organized by HSK level',
}

export const dynamic = 'force-dynamic'

async function VocabularyContent({ hskLevel }: { hskLevel?: '1' | '2' | '3' | '4' | '5' | '6' }) {
  const vocabulary = await getAllVocabulary(hskLevel)

  if (!vocabulary || vocabulary.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Vocabulary Available</AlertTitle>
        <AlertDescription>
          No vocabulary found{hskLevel ? ` for HSK ${hskLevel}` : ''}. This usually means the seed
          data hasn&apos;t been loaded yet.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vocabulary.map((vocab) => (
        <VocabularyCard key={vocab.id} vocabulary={vocab} />
      ))}
    </div>
  )
}

function VocabularySkeleton() {
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

export default async function VocabularyPage({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/login?redirectTo=/vocabulary')
  }

  const params = await searchParams
  const currentLevel = params.level as '1' | '2' | '3' | '4' | '5' | '6' | undefined

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Vocabulary</h1>
        <p className="text-sm text-muted-foreground sm:text-base md:text-lg">
          Browse Chinese vocabulary organized by HSK level
        </p>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>About Vocabulary</AlertTitle>
        <AlertDescription>
          Vocabulary words are composed of one or more characters. Each word has its own
          pronunciation and meaning. Learning vocabulary helps you understand and use Chinese in
          context.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue={currentLevel || 'all'} className="mb-6">
        <TabsList className="mb-6">
          <TabsTrigger value="all" asChild>
            <a href="/vocabulary">All</a>
          </TabsTrigger>
          <TabsTrigger value="1" asChild>
            <a href="/vocabulary?level=1">HSK 1</a>
          </TabsTrigger>
          <TabsTrigger value="2" asChild>
            <a href="/vocabulary?level=2">HSK 2</a>
          </TabsTrigger>
          <TabsTrigger value="3" asChild>
            <a href="/vocabulary?level=3">HSK 3</a>
          </TabsTrigger>
          <TabsTrigger value="4" asChild>
            <a href="/vocabulary?level=4">HSK 4</a>
          </TabsTrigger>
          <TabsTrigger value="5" asChild>
            <a href="/vocabulary?level=5">HSK 5</a>
          </TabsTrigger>
          <TabsTrigger value="6" asChild>
            <a href="/vocabulary?level=6">HSK 6</a>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={currentLevel || 'all'}>
          <Suspense fallback={<VocabularySkeleton />}>
            <VocabularyContent hskLevel={currentLevel} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
