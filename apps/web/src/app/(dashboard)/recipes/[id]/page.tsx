'use client'

import { use } from 'react'
import { RecipeDetailPage } from '@/view/recipe'

export default function RecipeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <RecipeDetailPage id={id} />
}
