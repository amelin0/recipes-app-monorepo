'use client'

import { useState, useDeferredValue } from 'react'
import { useGetRecipes, useImportRecipes, useGetRecipeFull, useDeleteRecipes } from '@/state/domains/recipe'
import { useGetAllTags } from '@/state/domains/tag'
import type { RecipeFilters } from '@/data'

export const useRecipesPage = () => {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const debouncedSearch = useDeferredValue(search)

  const { tags } = useGetAllTags()

  /**
   * The chip row is flat, but the filter is not: a dish has one category, one
   * cuisine and any number of diets, so the same selected id means a different
   * query depending on which dictionary it came from. `kind` is what the flat
   * façade carries it for.
   */
  const selectedTag = tags.find((tag) => tag.id === tagFilter)

  const filters: RecipeFilters = {
    search: debouncedSearch || undefined,
    categoryId: selectedTag?.kind === 'category' ? selectedTag.id : undefined,
    cuisineId: selectedTag?.kind === 'cuisine' ? selectedTag.id : undefined,
    dietIds: selectedTag?.kind === 'diet' ? selectedTag.id : undefined,
    page,
    limit: 20,
  }

  const { recipes, total, isLoading } = useGetRecipes(filters)
  const { importRecipes, isPending: isImporting } = useImportRecipes()
  const { recipe: selectedRecipe, isLoading: isDetailLoading } = useGetRecipeFull(selectedId ?? '')
  const { deleteRecipes, isPending: isDeleting } = useDeleteRecipes()

  const totalPages = Math.ceil(total / 20)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleRowClick = (id: string) => {
    if (selectedIds.size > 0) return // don't open detail while selecting
    setSelectedId(id)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = (open: boolean) => {
    if (!open) {
      setIsDetailOpen(false)
      setSelectedId(null)
    }
  }

  const handleAddRecipe = () => setIsCreateOpen(true)
  const handleCloseCreate = (open: boolean) => { if (!open) setIsCreateOpen(false) }
  const handleCreated = () => setIsCreateOpen(false)

  const handleImport = async (file: File) => {
    const result = await importRecipes(file)
    return result
  }

  const handleClearFilters = () => {
    setSearch('')
    setTagFilter(undefined)
    setPage(1)
  }

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.size === recipes.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(recipes.map((r) => r.id)))
    }
  }

  const handleClearSelection = () => setSelectedIds(new Set())

  const handleDeleteSelected = async () => {
    await deleteRecipes(Array.from(selectedIds))
    setSelectedIds(new Set())
    setIsDeleteDialogOpen(false)
  }

  return {
    search, handleSearchChange,
    tagFilter, setTagFilter,
    page, totalPages, total,
    recipes, tags, isLoading,
    isImportOpen, setIsImportOpen, isImporting, handleImport,
    selectedRecipe, isDetailLoading, isDetailOpen,
    isCreateOpen, handleCloseCreate, handleCreated,
    handleRowClick, handleCloseDetail, handleAddRecipe, handleClearFilters,
    setPage,
    // Selection & actions
    selectedIds, handleToggleSelect, handleToggleSelectAll, handleClearSelection,
    isDeleteDialogOpen, setIsDeleteDialogOpen, handleDeleteSelected, isDeleting,
  }
}
