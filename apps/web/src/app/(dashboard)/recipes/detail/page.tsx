'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { RecipeDetailPage } from '@/view/recipe'

/**
 * `/recipes/detail?id=…` rather than `/recipes/[id]`.
 *
 * The panel is built with `output: 'export'` and served by nginx as static
 * files, and a dynamic segment cannot be exported without knowing every id at
 * build time — which is impossible for a catalogue that changes daily. A query
 * parameter is the same information in a form a static file can carry.
 */
function RecipeDetailRoute() {
  const id = useSearchParams().get('id')

  if (!id) {
    return <div className="py-12 text-center text-text-tertiary">No recipe selected</div>
  }

  return <RecipeDetailPage id={id} />
}

export default function Page() {
  // `useSearchParams` suspends during prerender; without this the export step
  // fails with «missing suspense boundary».
  return (
    <Suspense fallback={<div className="py-12 text-center text-text-tertiary">Loading...</div>}>
      <RecipeDetailRoute />
    </Suspense>
  )
}
