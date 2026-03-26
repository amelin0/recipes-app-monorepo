'use client'

import { useProductsPage } from './useProductsPage'
import { ProductDetailPanel } from './components/ProductDetailPanel'
import { Input } from '@/shared/ui/components/input'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/components/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/select'
import { Sheet, SheetContent } from '@/shared/ui/components/sheet'
import { Search, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

export function ProductsPage() {
  const {
    search, handleSearchChange,
    typeFilter, setTypeFilter,
    page, totalPages, total,
    products, isLoading,
    selectedProduct, isDetailLoading, isDetailOpen, isVerifying,
    handleRowClick, handleCloseDetail, handleVerify, handleClearFilters, setPage,
  } = useProductsPage()

  const hasFilters = search || typeFilter

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">Products</h1>
        <p className="text-sm text-text-secondary mt-1">{total} product{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-icon-default" />
          <Input placeholder="Search products..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9" />
        </div>

        <Select value={typeFilter ?? ''} onValueChange={(v) => setTypeFilter(!v || v === '_all' ? undefined : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All types</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
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
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead>Protein</TableHead>
              <TableHead>Carbs</TableHead>
              <TableHead>Fats</TableHead>
              <TableHead>Verified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-text-tertiary">Loading...</TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-text-tertiary">No products found</TableCell></TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id} onClick={() => handleRowClick(p.id)} className="cursor-pointer hover:bg-bg-surface transition-colors">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant={p.type === 'global' ? 'default' : 'outline'}>{p.type}</Badge>
                  </TableCell>
                  <TableCell className="text-macro-calories font-medium">{p.calories_per_100g}</TableCell>
                  <TableCell className="text-macro-protein">{p.proteins_per_100g}g</TableCell>
                  <TableCell className="text-macro-carbs">{p.carbs_per_100g}g</TableCell>
                  <TableCell className="text-macro-fats">{p.fats_per_100g}g</TableCell>
                  <TableCell>
                    {p.is_verified && <CheckCircle size={16} className="text-success-default" />}
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

      {/* Detail Panel */}
      <Sheet open={isDetailOpen} onOpenChange={handleCloseDetail}>
        <SheetContent className="w-[560px] sm:max-w-xl overflow-y-auto p-8">
          <ProductDetailPanel product={selectedProduct} isLoading={isDetailLoading} isVerifying={isVerifying} onVerify={handleVerify} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
