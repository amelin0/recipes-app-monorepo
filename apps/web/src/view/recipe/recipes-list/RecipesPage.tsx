'use client'

import { useRecipesPage } from './useRecipesPage'
import { RecipeDetailPanel, RecipeCreatePanel } from './components/RecipeDetailPanel'
import { ImportCsvDialog } from './components/ImportCsvDialog'
import { Input } from '@/shared/ui/components/input'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Checkbox } from '@/shared/ui/components/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/components/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/select'
import { Sheet, SheetContent } from '@/shared/ui/components/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/components/dialog'
import { Search, Plus, Upload, X, ChevronLeft, ChevronRight, Clock, Heart, Trash2 } from 'lucide-react'

export function RecipesPage() {
  const {
    search, handleSearchChange,
    tagFilter, setTagFilter,
    page, totalPages, total,
    recipes, tags, isLoading,
    isImportOpen, setIsImportOpen, isImporting, handleImport,
    selectedRecipe, isDetailLoading, isDetailOpen,
    isCreateOpen, handleCloseCreate, handleCreated,
    handleRowClick, handleCloseDetail, handleAddRecipe, handleClearFilters,
    setPage,
    selectedIds, handleToggleSelect, handleToggleSelectAll, handleClearSelection,
    isDeleteDialogOpen, setIsDeleteDialogOpen, handleDeleteSelected, isDeleting,
  } = useRecipesPage()

  const hasFilters = search || tagFilter
  const hasSelection = selectedIds.size > 0
  const allSelected = recipes.length > 0 && selectedIds.size === recipes.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">Recipes</h1>
          <p className="text-sm text-text-secondary mt-1">{total} recipe{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {hasSelection ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                <X size={14} className="mr-1" /> Cancel
              </Button>
              {/* No bulk tag actions: a dish's taxonomy is one category, one
                  cuisine and its diets, all set on the dish itself. Assigning
                  a bag of tags to many recipes at once cannot express «one
                  cuisine», which is why the endpoint does not exist. */}
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 size={16} className="mr-1.5" /> Delete ({selectedIds.size})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload size={16} className="mr-1.5" /> Import CSV
              </Button>
              <Button onClick={handleAddRecipe}>
                <Plus size={16} className="mr-1.5" /> Add Recipe
              </Button>
            </>
          )}
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
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleToggleSelectAll}
                />
              </TableHead>
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
              <TableRow><TableCell colSpan={9} className="text-center py-12 text-text-tertiary">Loading...</TableCell></TableRow>
            ) : recipes.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-12 text-text-tertiary">No recipes found</TableCell></TableRow>
            ) : (
              recipes.map((recipe) => (
                <TableRow
                  key={recipe.id}
                  className={`cursor-pointer hover:bg-bg-surface transition-colors ${selectedIds.has(recipe.id) ? 'bg-primary-subtle/30' : ''}`}
                  onClick={() => handleRowClick(recipe.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(recipe.id)}
                      onCheckedChange={() => handleToggleSelect(recipe.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {recipe.photoUrl ? (
                      <img src={recipe.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary-subtle flex items-center justify-center text-xs text-primary-on-subtle">
                        {recipe.title?.[0] ?? '?'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{recipe.title}</TableCell>
                  <TableCell>{recipe.calories} kcal</TableCell>
                  <TableCell>{recipe.proteinG}g</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Clock size={14} /> {recipe.cookTimeMinutes === null ? '—' : `${recipe.cookTimeMinutes}m`}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* The list row carries flat slugs for category and cuisine
                        only. Diets can be thirteen, and pulling them into every
                        row would mean a query per row for a column the table
                        does not have. */}
                    <div className="flex flex-wrap gap-1">
                      {[recipe.categorySlug, recipe.cuisineSlug]
                        .filter((slug): slug is string => slug !== null)
                        .map((slug) => (
                          <Badge key={slug} variant="outline" className="text-xs">
                            {slug}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Heart size={14} /> {recipe.favoritesCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-secondary text-sm">
                    {new Date(recipe.updatedAt).toLocaleDateString()}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} recipe{selectedIds.size !== 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All translations, ingredients, and tags linked to {selectedIds.size === 1 ? 'this recipe' : 'these recipes'} will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : `Delete ${selectedIds.size} recipe${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Panel */}
      <Sheet open={isDetailOpen} onOpenChange={handleCloseDetail}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <RecipeDetailPanel recipe={selectedRecipe ?? null} isLoading={isDetailLoading} />
        </SheetContent>
      </Sheet>

      {/* Create Panel */}
      <Sheet open={isCreateOpen} onOpenChange={handleCloseCreate}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <RecipeCreatePanel onCreated={handleCreated} onCancel={() => handleCloseCreate(false)} />
        </SheetContent>
      </Sheet>

      {/* Import Dialog */}
      <ImportCsvDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImport={handleImport} isImporting={isImporting} />
    </div>
  )
}
