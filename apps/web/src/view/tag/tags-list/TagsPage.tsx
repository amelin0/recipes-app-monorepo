'use client'

import { useState, useDeferredValue, useMemo } from 'react'
import { TagDetailPanel } from './components/TagDetailPanel'
import { Input } from '@/shared/ui/components/input'
import { Button } from '@/shared/ui/components/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/components/table'
import { Sheet, SheetContent } from '@/shared/ui/components/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/components/dialog'
import { Checkbox } from '@/shared/ui/components/checkbox'
import { Plus, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetAllTags, useDeleteTag } from '@/state/domains/tag'
import type { TagFull } from '@/data'

const PAGE_SIZE = 20

export function TagsPage() {
  const { tags: allTags, isLoading } = useGetAllTags()
  const { deleteTag, isPending: isDeleting } = useDeleteTag()

  const [selectedTag, setSelectedTag] = useState<TagFull | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDeferredValue(search)

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Filter + paginate
  const filtered = useMemo(() => {
    if (!debouncedSearch) return allTags
    const q = debouncedSearch.toLowerCase()
    return allTags.filter((tag) =>
      tag.tag_translations?.some((t) => t.name.toLowerCase().includes(q)),
    )
  }, [allTags, debouncedSearch])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const tags = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasSelection = selectedIds.size > 0
  const allSelected = tags.length > 0 && selectedIds.size === tags.length

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleRowClick = (tag: TagFull) => {
    if (hasSelection) return
    setSelectedTag(tag)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = (open: boolean) => {
    if (!open) { setIsDetailOpen(false); setSelectedTag(null) }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(tags.map((t) => t.id)))
  }

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      await deleteTag(id)
    }
    setSelectedIds(new Set())
    setIsDeleteDialogOpen(false)
  }

  const getTagName = (tag: TagFull, lang: string) =>
    tag.tag_translations?.find((t) => t.language === lang)?.name
    ?? tag.tag_translations?.find((t) => t.language === 'uk')?.name
    ?? tag.tag_translations?.[0]?.name
    ?? '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">Tags</h1>
          <p className="text-sm text-text-secondary mt-1">{filtered.length} tag{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {hasSelection ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                <X size={14} className="mr-1" /> Cancel
              </Button>
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 size={16} className="mr-1.5" /> Delete ({selectedIds.size})
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} className="mr-1.5" /> Add Tag
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-icon-default" />
          <Input placeholder="Search tags..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9" />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPage(1) }}>
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
                <Checkbox checked={allSelected} onCheckedChange={handleToggleSelectAll} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Languages</TableHead>
              <TableHead>Recipes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-text-tertiary">Loading...</TableCell></TableRow>
            ) : tags.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-text-tertiary">{search ? 'No tags match your search' : 'No tags yet'}</TableCell></TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow
                  key={tag.id}
                  className={`cursor-pointer hover:bg-bg-surface transition-colors ${selectedIds.has(tag.id) ? 'bg-primary-subtle/30' : ''}`}
                  onClick={() => handleRowClick(tag)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(tag.id)} onCheckedChange={() => handleToggleSelect(tag.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{getTagName(tag, 'uk')}</TableCell>
                  <TableCell className="text-text-tertiary text-sm">{tag.tag_translations?.length ?? 0}</TableCell>
                  <TableCell className="text-text-secondary">{tag.recipe_count}</TableCell>
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

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} tag{selectedIds.size !== 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>Tags will be removed from all recipes that use them.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Panel */}
      <Sheet open={isDetailOpen} onOpenChange={handleCloseDetail}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <TagDetailPanel tag={selectedTag} onClose={() => handleCloseDetail(false)} />
        </SheetContent>
      </Sheet>

      {/* Create Panel */}
      <Sheet open={isCreateOpen} onOpenChange={(open) => { if (!open) setIsCreateOpen(false) }}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <TagDetailPanel tag={null} onClose={() => setIsCreateOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
