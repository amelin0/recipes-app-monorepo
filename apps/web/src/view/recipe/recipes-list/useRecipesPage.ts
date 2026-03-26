'use client'

import { useState, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import { useGetRecipes, useGetTags, useImportRecipes } from '@/state/domains/recipe'
import type { RecipeFilters } from '@/data'

export const useRecipesPage = () => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const debouncedSearch = useDeferredValue(search)

  const filters: RecipeFilters = {
    search: debouncedSearch || undefined,
    tags: tagFilter,
    page,
    limit: 20,
  }

  const { recipes, total, isLoading } = useGetRecipes(filters)
  const { tags } = useGetTags()
  const { importRecipes, isPending: isImporting } = useImportRecipes()

  const totalPages = Math.ceil(total / 20)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleRowClick = (id: string) => router.push(`/recipes/${id}`)
  const handleAddRecipe = () => router.push('/recipes/new')

  const handleImport = async (file: File) => {
    const result = await importRecipes(file)
    return result
  }

  const handleClearFilters = () => {
    setSearch('')
    setTagFilter(undefined)
    setPage(1)
  }

  return {
    search, handleSearchChange,
    tagFilter, setTagFilter,
    page, totalPages, total,
    recipes, tags, isLoading,
    isImportOpen, setIsImportOpen, isImporting, handleImport,
    handleRowClick, handleAddRecipe, handleClearFilters,
    setPage,
  }
}
