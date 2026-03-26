'use client'

import { useState, useDeferredValue } from 'react'
import { useGetProducts, useGetProduct, useVerifyProduct } from '@/state/domains/product'
import type { ProductFilters } from '@/data'

export const useProductsPage = () => {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const debouncedSearch = useDeferredValue(search)

  const filters: ProductFilters = {
    search: debouncedSearch || undefined,
    type: typeFilter,
    page,
    limit: 20,
  }

  const { products, total, isLoading } = useGetProducts(filters)
  const { product: selectedProduct, isLoading: isDetailLoading } = useGetProduct(selectedId)
  const { verifyProduct, isPending: isVerifying } = useVerifyProduct()

  const totalPages = Math.ceil(total / 20)

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1) }
  const handleRowClick = (id: string) => { setSelectedId(id); setIsDetailOpen(true) }
  const handleCloseDetail = (open: boolean) => { if (!open) { setIsDetailOpen(false); setSelectedId(null) } }
  const handleVerify = async () => {
    if (!selectedProduct) return
    await verifyProduct({ id: selectedProduct.id, isVerified: !selectedProduct.is_verified })
  }
  const handleClearFilters = () => { setSearch(''); setTypeFilter(undefined); setPage(1) }

  return {
    search, handleSearchChange,
    typeFilter, setTypeFilter,
    page, totalPages, total,
    products, isLoading,
    selectedProduct, isDetailLoading, isDetailOpen, isVerifying,
    handleRowClick, handleCloseDetail, handleVerify, handleClearFilters, setPage,
  }
}
