'use client'

import { useState, useDeferredValue } from 'react'
import {
  useAddTicketNote,
  useGetTicket,
  useGetTickets,
  useNewTicketCount,
  useSetTicketStatus,
} from '@/state/domains/support'
import type { TicketFilters, TicketStatus, TicketType } from '@/data'

const PAGE_SIZE = 20

export const useSupportMessagesPage = (initialStatus?: TicketStatus) => {
  const [search, setSearch] = useState('')
  // Arrives from the dashboard's «N new tickets» card, already filtered.
  const [status, setStatus] = useState<TicketStatus | undefined>(initialStatus)
  const [type, setType] = useState<TicketType | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const debouncedSearch = useDeferredValue(search)

  const filters: TicketFilters = {
    search: debouncedSearch || undefined,
    status,
    type,
    page,
    limit: PAGE_SIZE,
  }

  const { tickets, total, totalPages, isLoading } = useGetTickets(filters)
  const { ticket: selectedTicket, isLoading: isDetailLoading } = useGetTicket(selectedId)
  const { setStatus: moveTicket, isPending: isMoving } = useSetTicketStatus()
  const { addNote, isPending: isAddingNote } = useAddTicketNote()
  const { newCount } = useNewTicketCount()

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: TicketStatus | undefined) => {
    setStatus(value)
    setPage(1)
  }

  const handleTypeChange = (value: TicketType | undefined) => {
    setType(value)
    setPage(1)
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

  const handleMove = async (next: TicketStatus) => {
    if (!selectedTicket) return
    await moveTicket({ id: selectedTicket.id, status: next })
  }

  const handleAddNote = async (body: string) => {
    if (!selectedTicket) return
    await addNote({ id: selectedTicket.id, body })
  }

  const handleShowNew = () => {
    setSearch('')
    setType(undefined)
    setStatus('new')
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus(undefined)
    setType(undefined)
    setPage(1)
  }

  const hasFilters = search !== '' || status !== undefined || type !== undefined

  return {
    search, handleSearchChange,
    status, handleStatusChange,
    type, handleTypeChange,
    hasFilters, handleClearFilters,
    newCount, handleShowNew,
    page, setPage, totalPages, total,
    tickets, isLoading,
    selectedTicket, isDetailLoading, isDetailOpen, handleRowClick, handleCloseDetail,
    handleMove, isMoving,
    handleAddNote, isAddingNote,
  }
}
