'use client'

import { useState } from 'react'
import { useGetSupportMessages, useGetSupportMessage } from '@/state/domains/support'

export const useSupportMessagesPage = () => {
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { messages, total, isLoading } = useGetSupportMessages(page)
  const { message: selectedMessage, isLoading: isDetailLoading } = useGetSupportMessage(selectedId)

  const totalPages = Math.ceil(total / 20)

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

  return {
    messages, total, page, totalPages, isLoading,
    selectedMessage, isDetailLoading, isDetailOpen,
    setPage, handleRowClick, handleCloseDetail,
  }
}
