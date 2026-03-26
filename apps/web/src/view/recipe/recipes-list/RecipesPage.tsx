'use client'

import { useRecipesPage } from './useRecipesPage'
import { ImportCsvDialog } from './components/ImportCsvDialog'
import { Input } from '@/shared/ui/components/input'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/components/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/select'
import { Search, Plus, Upload, X, ChevronLeft, ChevronRight, Clock, Heart } from 'lucide-react'

export function RecipesPage() {
  const {
    search, handleSearchChange,
    tagFilter, setTagFilter,
    page, totalPages, total,
    recipes, tags, isLoading,
    isImportOpen, setIsImportOpen, isImporting, handleImport,
    handleRowClick, handleAddRecipe, handleClearFilters,
    setPage,
  } = useRecipesPage()

  const hasFilters = search || tagFilter

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">Recipes</h1>
          <p className="text-sm text-text-secondary mt-1">{total} recipe{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload size={16} className="mr-1.5" /> Import CSV
          </Button>
          <Button onClick={handleAddRecipe}>
            <Plus size={16} className="mr-1.5" /> Add Recipe
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-icon-default" />
          <Input placeholder="Search recipes..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9" />
        </div>

        <Select value={tagFilter ?? ''} onValueChange={(v) => setTagFilter(!v || v === '_all' ? undefined : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X size={14} className="mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border-default overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-bg-surface">
              <TableHead className="w-12">Photo</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead>Protein</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Favorites</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-text-tertiary">Loading...</TableCell></TableRow>
            ) : recipes.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-text-tertiary">No recipes found</TableCell></TableRow>
            ) : (
              recipes.map((recipe) => (
                <TableRow key={recipe.id} onClick={() => handleRowClick(recipe.id)} className="cursor-pointer hover:bg-bg-surface transition-colors">
                  <TableCell>
                    {recipe.photo_url ? (
                      <img src={recipe.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary-subtle flex items-center justify-center text-xs text-primary-on-subtle">
                        {recipe.title?.[0] ?? '?'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{recipe.title}</TableCell>
                  <TableCell>{recipe.calories} kcal</TableCell>
                  <TableCell>{recipe.proteins_g}g</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Clock size={14} /> {recipe.cooking_time_minutes}m
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 3).map((t) => (
                        <Badge key={t.id} variant="outline" className="text-xs">{t.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Heart size={14} /> {recipe.favorites_count ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-secondary text-sm">
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <ImportCsvDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImport={handleImport} isImporting={isImporting} />
    </div>
  )
}
