'use client'

import { useState, useDeferredValue } from 'react'
import {
  useArchiveProduct,
  useGetProduct,
  useGetProducts,
  useImportProducts,
  useVerifyProduct,
} from '@/state/domains/product'
import type { ContentSource, ProductFilters } from '@/data'

const PAGE_SIZE = 20

export const useProductsPage = () => {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<ContentSource | undefined>(undefined)
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(undefined)
  const [quickPickOnly, setQuickPickOnly] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(1)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const debouncedSearch = useDeferredValue(search)

  const filters: ProductFilters = {
    search: debouncedSearch || undefined,
    source: sourceFilter,
    isVerified: verifiedFilter,
    // Sent only when on: `false` would mean «everything that is not a quick
    // pick», which is not what an unticked box asks for.
    isQuickPick: quickPickOnly ? true : undefined,
    includeArchived: showArchived ? true : undefined,
    page,
    limit: PAGE_SIZE,
  }

  const { products, total, totalPages, isLoading } = useGetProducts(filters)
  const { product: selectedProduct, isLoading: isDetailLoading } = useGetProduct(selectedId)
  const { verifyProduct, isPending: isVerifying } = useVerifyProduct()
  const { archiveProduct, isPending: isArchiving } = useArchiveProduct()
  const { importProducts, isPending: isImporting } = useImportProducts()

  const resetToFirstPage = () => setPage(1)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    resetToFirstPage()
  }

  const handleSourceChange = (value: ContentSource | undefined) => {
    setSourceFilter(value)
    resetToFirstPage()
  }

  const handleVerifiedChange = (value: boolean | undefined) => {
    setVerifiedFilter(value)
    resetToFirstPage()
  }

  const handleQuickPickChange = (value: boolean) => {
    setQuickPickOnly(value)
    resetToFirstPage()
  }

  const handleShowArchivedChange = (value: boolean) => {
    setShowArchived(value)
    resetToFirstPage()
  }

  const handleRowClick = (id: string) => {
    setSelectedId(id)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = (open: boolean) => {
    if (!open) {
      setIsDetailOpen(false)
      setSelectedId(null)
    }
  }

  const handleAddProduct = () => setIsCreateOpen(true)
  const handleCloseCreate = (open: boolean) => { if (!open) setIsCreateOpen(false) }
  const handleCreated = () => setIsCreateOpen(false)

  const handleVerify = async () => {
    if (!selectedProduct) return
    await verifyProduct({ id: selectedProduct.id, isVerified: !selectedProduct.isVerified })
  }

  const handleArchive = async () => {
    if (!selectedProduct) return
    await archiveProduct({ id: selectedProduct.id, archived: selectedProduct.archivedAt === null })
    // Archiving takes the product off the default list; leaving its panel open
    // over a row that is no longer there reads as a failed action.
    if (selectedProduct.archivedAt === null && !showArchived) handleCloseDetail(false)
  }

  const handleImport = (file: File) => importProducts(file)

  const handleClearFilters = () => {
    setSearch('')
    setSourceFilter(undefined)
    setVerifiedFilter(undefined)
    setQuickPickOnly(false)
    setShowArchived(false)
    resetToFirstPage()
  }

  const hasFilters =
    search !== '' || sourceFilter !== undefined || verifiedFilter !== undefined || quickPickOnly || showArchived

  return {
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
  }
}
