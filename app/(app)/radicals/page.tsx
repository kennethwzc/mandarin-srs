/**
 * Radicals Overview Page
 *
 * Displays all radicals available in the system.
 * Users can browse and explore the building blocks of Chinese characters.
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RadicalCard } from '@/components/features/radical-card'
import { getAllRadicals } from '@/lib/db/queries'
import { getAuthenticatedUser } from '@/lib/supabase/get-user'
import { AlertCircle, Info } from 'lucide-react'

export const metadata = {
  title: 'Radicals',
  description: 'Browse all Chinese radicals - the building blocks of characters',
}

export const dynamic = 'force-dynamic'

async function RadicalsContent() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/login?redirectTo=/radicals')
  }

  const radicals = await getAllRadicals()

  if (!radicals || radicals.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Radicals Available</AlertTitle>
        <AlertDescription>
          No radicals found in the database. This usually means the seed data hasn&apos;t been
          loaded yet.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {radicals.map((radical) => (
        <RadicalCard key={radical.id} radical={radical} />
      ))}
    </div>
  )
}

function RadicalsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
      ))}
    </div>
  )
}

export default async function RadicalsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/login?redirectTo=/radicals')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Radicals</h1>
        <p className="text-sm text-muted-foreground sm:text-base md:text-lg">
          Explore the building blocks of Chinese characters
        </p>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>About Radicals</AlertTitle>
        <AlertDescription>
          Radicals are the basic components that make up Chinese characters. Learning radicals helps
          you understand character composition and remember new characters more easily.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<RadicalsSkeleton />}>
        <RadicalsContent />
      </Suspense>
    </div>
  )
}
