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
import { Search, Plus, Upload, X, ChevronLeft, ChevronRight, Clock, Heart, Trash2, Tag } from 'lucide-react'
import { useState } from 'react'

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
    allTags, isAssignDialogOpen, setIsAssignDialogOpen, isRemoveDialogOpen, setIsRemoveDialogOpen,
    assignTags, removeTags, isAssigning, isRemoving,
  } = useRecipesPage()

  // Tag selection state for assign/remove dialogs
  const [checkedTagIds, setCheckedTagIds] = useState<Set<string>>(new Set())

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
              <Button variant="outline" onClick={() => { setCheckedTagIds(new Set()); setIsAssignDialogOpen(true) }}>
                <Tag size={16} className="mr-1.5" /> Assign Tags
              </Button>
              <Button variant="outline" onClick={() => { setCheckedTagIds(new Set()); setIsRemoveDialogOpen(true) }}>
                <Tag size={16} className="mr-1.5" /> Remove Tags
              </Button>
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

      {/* Assign Tags Dialog */}
      <TagPickerDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        title={`Assign Tags to ${selectedIds.size} recipe${selectedIds.size !== 1 ? 's' : ''}`}
        description="Select tags to add to the selected recipes."
        tags={allTags}
        checkedIds={checkedTagIds}
        setCheckedIds={setCheckedTagIds}
        actionLabel="Assign"
        isPending={isAssigning}
        onSubmit={async () => {
          await assignTags({ recipe_ids: Array.from(selectedIds), tag_ids: Array.from(checkedTagIds) })
          setIsAssignDialogOpen(false)
          handleClearSelection()
        }}
      />

      {/* Remove Tags Dialog */}
      <TagPickerDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
        title={`Remove Tags from ${selectedIds.size} recipe${selectedIds.size !== 1 ? 's' : ''}`}
        description="Select tags to remove from the selected recipes."
        tags={allTags}
        checkedIds={checkedTagIds}
        setCheckedIds={setCheckedTagIds}
        actionLabel="Remove"
        variant="destructive"
        isPending={isRemoving}
        onSubmit={async () => {
          await removeTags({ recipe_ids: Array.from(selectedIds), tag_ids: Array.from(checkedTagIds) })
          setIsRemoveDialogOpen(false)
          handleClearSelection()
        }}
      />

      {/* Import Dialog */}
      <ImportCsvDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImport={handleImport} isImporting={isImporting} />
    </div>
  )
}

function TagPickerDialog({ open, onOpenChange, title, description, tags, checkedIds, setCheckedIds, actionLabel, variant, isPending, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  tags: { id: string; tag_translations?: { language: string; name: string }[] }[]
  checkedIds: Set<string>
  setCheckedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  actionLabel: string
  variant?: 'destructive'
  isPending: boolean
  onSubmit: () => void
}) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? tags.filter((t) => {
        const q = search.toLowerCase()
        return t.tag_translations?.some((tr) => tr.name.toLowerCase().includes(q))
      })
    : tags

  const toggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setSearch(''); onOpenChange(v) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-icon-default" />
          <Input placeholder="Search tags..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-text-tertiary text-sm text-center py-4">{tags.length === 0 ? 'No tags available.' : 'No tags match your search.'}</p>
          ) : (
            filtered.map((t) => {
              const name = t.tag_translations?.find((tr) => tr.language === 'uk')?.name ?? t.tag_translations?.[0]?.name ?? '—'
              return (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-surface cursor-pointer">
                  <Checkbox checked={checkedIds.has(t.id)} onCheckedChange={() => toggle(t.id)} />
                  <span className="text-sm text-text-primary">{name}</span>
                </label>
              )
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button variant={variant ?? 'default'} disabled={checkedIds.size === 0 || isPending} onClick={onSubmit}>
            {isPending ? `${actionLabel}ing...` : `${actionLabel} ${checkedIds.size} tag${checkedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
