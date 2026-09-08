'use client'

import { useProductsPage } from './useProductsPage'
import { ProductCreatePanel, ProductDetailPanel } from './components/ProductDetailPanel'
import { Input } from '@/shared/ui/components/input'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Checkbox } from '@/shared/ui/components/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/components/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/select'
import { Sheet, SheetContent } from '@/shared/ui/components/sheet'
import { ImportCsvDialog } from '@/shared/ui/components/ImportCsvDialog'
import { Search, Plus, Upload, X, ChevronLeft, ChevronRight, CheckCircle, Zap } from 'lucide-react'
import type { ContentSource } from '@/data'

export function ProductsPage() {
  const {
    search, handleSearchChange,
    sourceFilter, handleSourceChange,
    verifiedFilter, handleVerifiedChange,
    quickPickOnly, handleQuickPickChange,
    showArchived, handleShowArchivedChange,
    hasFilters, handleClearFilters,
    page, setPage, totalPages, total,
    products, isLoading,
    selectedProduct, isDetailLoading, isDetailOpen, handleRowClick, handleCloseDetail,
    isCreateOpen, handleAddProduct, handleCloseCreate, handleCreated,
    isImportOpen, setIsImportOpen, isImporting, handleImport,
    handleVerify, isVerifying,
    handleArchive, isArchiving,
  } = useProductsPage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">Products</h1>
          <p className="text-sm text-text-secondary mt-1">{total} product{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload size={16} className="mr-1.5" /> Import CSV
          </Button>
          <Button onClick={handleAddProduct}>
            <Plus size={16} className="mr-1.5" /> New Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-icon-default" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={sourceFilter ?? '_all'}
          onValueChange={(v) => handleSourceChange(v === '_all' ? undefined : (v as ContentSource))}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All sources</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={verifiedFilter === undefined ? '_all' : String(verifiedFilter)}
          onValueChange={(v) => handleVerifiedChange(v === '_all' ? undefined : v === 'true')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Verified &amp; not</SelectItem>
            <SelectItem value="true">Verified</SelectItem>
            <SelectItem value="false">Not verified</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <Checkbox checked={quickPickOnly} onCheckedChange={(v) => handleQuickPickChange(v === true)} />
          Quick picks only
        </label>

        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <Checkbox checked={showArchived} onCheckedChange={(v) => handleShowArchivedChange(v === true)} />
          Show archived
        </label>

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
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead>Protein</TableHead>
              <TableHead>Carbs</TableHead>
              <TableHead>Fats</TableHead>
              <TableHead>Verified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-text-tertiary">Loading...</TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-text-tertiary">No products found</TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => handleRowClick(p.id)}
                  className={`cursor-pointer hover:bg-bg-surface transition-colors ${p.archivedAt ? 'opacity-50' : ''}`}
                >
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-1.5">
                      {p.name}
                      {p.isQuickPick && <Zap size={13} className="text-primary-default" aria-label="Quick pick" />}
                      {p.archivedAt && <span className="text-xs text-text-tertiary">(archived)</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.source === 'global' ? 'default' : 'outline'}>{p.source}</Badge>
                  </TableCell>
                  <TableCell className="text-text-tertiary text-sm">{p.groupSlug ?? '—'}</TableCell>
                  <TableCell className="text-macro-calories font-medium">{p.caloriesPer100g}</TableCell>
                  <TableCell className="text-macro-protein">{p.proteinPer100g}g</TableCell>
                  <TableCell className="text-macro-carbs">{p.carbsPer100g}g</TableCell>
                  <TableCell className="text-macro-fats">{p.fatsPer100g}g</TableCell>
                  <TableCell>{p.isVerified && <CheckCircle size={16} className="text-success-default" />}</TableCell>
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
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Detail panel */}
      <Sheet open={isDetailOpen} onOpenChange={handleCloseDetail}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <ProductDetailPanel
            product={selectedProduct}
            isLoading={isDetailLoading}
            isVerifying={isVerifying}
            isArchiving={isArchiving}
            onVerify={handleVerify}
            onArchive={handleArchive}
          />
        </SheetContent>
      </Sheet>

      {/* Create panel */}
      <Sheet open={isCreateOpen} onOpenChange={handleCloseCreate}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <ProductCreatePanel onCancel={() => handleCloseCreate(false)} onCreated={handleCreated} />
        </SheetContent>
      </Sheet>

      <ImportCsvDialog
        title="Import Products from CSV"
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImport}
        isImporting={isImporting}
      />
    </div>
  )
}
